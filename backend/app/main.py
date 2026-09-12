from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import uuid4
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from .ai import parse_text

app = FastAPI(title='小帐同学 PocketLedger API', version='0.1.0')
transactions: list[dict] = []
budgets: list[dict] = []

class TransactionIn(BaseModel):
    ledger_id: str = 'default'
    type: Literal['expense','income','transfer']
    amount: Decimal = Field(gt=0)
    category_id: str | None = None
    account_id: str | None = None
    to_account_id: str | None = None
    title: str = ''
    note: str = ''
    occurred_at: datetime
    source: Literal['manual','ai','image','import','recurring'] = 'manual'
    idempotency_key: str

class AIParseIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)

class AIConfirmIn(BaseModel):
    transactions: list[TransactionIn]

class BudgetIn(BaseModel):
    ledger_id: str = 'default'
    month: str
    category_id: str | None = None
    amount: Decimal = Field(gt=0)

@app.get('/api/v1/health')
def health(): return {'status':'ok','service':'pocketledger'}


@app.post('/api/v1/ai/parse-transaction')
async def ai_parse_transaction(body: AIParseIn):
    drafts, provider = await parse_text(body.text)
    return {'transactions': drafts, 'provider': provider, 'requires_confirmation': True}

@app.post('/api/v1/ai/confirm')
async def ai_confirm(body: AIConfirmIn):
    saved=[]
    for tx in body.transactions:
        saved.append(create_transaction(tx))
    return {'items': saved}

@app.get('/api/v1/transactions')
def list_transactions(ledger_id='default', month: str | None=None, type: str | None=None):
    rows=[x for x in transactions if x['ledger_id']==ledger_id and (not month or x['occurred_at'].startswith(month)) and (not type or x['type']==type)]
    return {'items':rows,'next_cursor':None}

@app.post('/api/v1/transactions', status_code=201)
def create_transaction(body: TransactionIn):
    for row in transactions:
        if row['idempotency_key']==body.idempotency_key: return row
    row=body.model_dump(); row['id']=str(uuid4()); row['amount']=str(body.amount); row['occurred_at']=body.occurred_at.isoformat(); row['version']=1
    transactions.append(row); return row

@app.patch('/api/v1/transactions/{tx_id}')
def update_transaction(tx_id: str, body: TransactionIn):
    for i,row in enumerate(transactions):
        if row['id']==tx_id:
            new=body.model_dump(); new.update(id=tx_id,amount=str(body.amount),occurred_at=body.occurred_at.isoformat(),version=row['version']+1); transactions[i]=new; return new
    raise HTTPException(404,'transaction not found')

@app.delete('/api/v1/transactions/{tx_id}')
def delete_transaction(tx_id: str):
    for i,row in enumerate(transactions):
        if row['id']==tx_id: transactions.pop(i); return {'ok':True}
    raise HTTPException(404,'transaction not found')

@app.get('/api/v1/statistics')
def statistics(ledger_id='default', month: str | None=None):
    rows=[x for x in transactions if x['ledger_id']==ledger_id and (not month or x['occurred_at'].startswith(month))]
    expense=sum(Decimal(x['amount']) for x in rows if x['type']=='expense'); income=sum(Decimal(x['amount']) for x in rows if x['type']=='income')
    return {'expense':str(expense),'income':str(income),'balance':str(income-expense),'count':len(rows)}

@app.get('/api/v1/budgets')
def list_budgets(ledger_id='default', month: str | None=None): return {'items':[x for x in budgets if x['ledger_id']==ledger_id and (not month or x['month']==month)]}
@app.post('/api/v1/budgets', status_code=201)
def create_budget(body: BudgetIn):
    row=body.model_dump(); row['id']=str(uuid4()); row['amount']=str(body.amount); budgets.append(row); return row
