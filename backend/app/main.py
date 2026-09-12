from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import uuid4
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, String, DateTime, Numeric, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session
from .ai import parse_text

DB_URL = os.getenv('DATABASE_URL', 'sqlite:///./pocketledger.db')
engine = create_engine(DB_URL, connect_args={'check_same_thread': False} if DB_URL.startswith('sqlite') else {})
class Base(DeclarativeBase): pass
class TransactionRow(Base):
    __tablename__='transactions'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    ledger_id: Mapped[str] = mapped_column(String(64), default='default', index=True)
    type: Mapped[str] = mapped_column(String(16)); amount: Mapped[Decimal] = mapped_column(Numeric(18,2))
    category_id: Mapped[str|None] = mapped_column(String(64), nullable=True); account_id: Mapped[str|None] = mapped_column(String(64), nullable=True)
    to_account_id: Mapped[str|None] = mapped_column(String(64), nullable=True); title: Mapped[str] = mapped_column(String(200), default=''); note: Mapped[str] = mapped_column(String(500), default='')
    occurred_at: Mapped[datetime] = mapped_column(DateTime); source: Mapped[str] = mapped_column(String(16), default='manual'); idempotency_key: Mapped[str] = mapped_column(String(128), unique=True); version: Mapped[int] = mapped_column(default=1)
class BudgetRow(Base):
    __tablename__='budgets'
    id: Mapped[str] = mapped_column(String(64), primary_key=True); ledger_id: Mapped[str] = mapped_column(String(64), default='default'); month: Mapped[str] = mapped_column(String(7)); category_id: Mapped[str|None] = mapped_column(String(64), nullable=True); amount: Mapped[Decimal] = mapped_column(Numeric(18,2))
Base.metadata.create_all(engine)
app = FastAPI(title='小帐同学 PocketLedger API', version='0.2.0')
class TransactionIn(BaseModel):
    ledger_id: str='default'; type: Literal['expense','income','transfer']; amount: Decimal=Field(gt=0); category_id:str|None=None; account_id:str|None=None; to_account_id:str|None=None; title:str=''; note:str=''; occurred_at:datetime; source:Literal['manual','ai','image','import','recurring']='manual'; idempotency_key:str
class AIParseIn(BaseModel): text:str=Field(min_length=1,max_length=2000)
class AIConfirmIn(BaseModel): transactions:list[TransactionIn]
class BudgetIn(BaseModel): ledger_id:str='default'; month:str; category_id:str|None=None; amount:Decimal=Field(gt=0)
def tx_dict(r): return {'id':r.id,'ledger_id':r.ledger_id,'type':r.type,'amount':str(r.amount),'category_id':r.category_id,'account_id':r.account_id,'to_account_id':r.to_account_id,'title':r.title,'note':r.note,'occurred_at':r.occurred_at.isoformat(),'source':r.source,'idempotency_key':r.idempotency_key,'version':r.version}
@app.get('/api/v1/health')
def health(): return {'status':'ok','service':'pocketledger','storage':'database'}
@app.post('/api/v1/ai/parse-transaction')
async def ai_parse_transaction(body:AIParseIn):
    drafts,provider=await parse_text(body.text); return {'transactions':drafts,'provider':provider,'requires_confirmation':True}
@app.post('/api/v1/ai/confirm')
def ai_confirm(body:AIConfirmIn): return {'items':[create_transaction(tx) for tx in body.transactions]}
@app.get('/api/v1/transactions')
def list_transactions(ledger_id='default',month:str|None=None,type:str|None=None):
    with Session(engine) as s:
        rows=list(s.scalars(select(TransactionRow).where(TransactionRow.ledger_id==ledger_id).order_by(TransactionRow.occurred_at.desc())))
    rows=[r for r in rows if (not month or r.occurred_at.isoformat().startswith(month)) and (not type or r.type==type)]
    return {'items':[tx_dict(r) for r in rows],'next_cursor':None}
def create_transaction(body:TransactionIn):
    with Session(engine) as s:
        existing=s.scalar(select(TransactionRow).where(TransactionRow.idempotency_key==body.idempotency_key))
        if existing:return tx_dict(existing)
        r=TransactionRow(id=str(uuid4()),**body.model_dump()); s.add(r); s.commit(); s.refresh(r); return tx_dict(r)
@app.post('/api/v1/transactions',status_code=201)
def create_tx(body:TransactionIn): return create_transaction(body)
@app.patch('/api/v1/transactions/{tx_id}')
def update_transaction(tx_id:str,body:TransactionIn):
    with Session(engine) as s:
        r=s.get(TransactionRow,tx_id)
        if not r: raise HTTPException(404,'transaction not found')
        for k,v in body.model_dump().items(): setattr(r,k,v)
        r.version+=1; s.commit(); s.refresh(r); return tx_dict(r)
@app.delete('/api/v1/transactions/{tx_id}')
def delete_transaction(tx_id:str):
    with Session(engine) as s:
        r=s.get(TransactionRow,tx_id)
        if not r: raise HTTPException(404,'transaction not found')
        s.delete(r); s.commit(); return {'ok':True}
@app.get('/api/v1/statistics')
def statistics(ledger_id='default',month:str|None=None):
    items=list_transactions(ledger_id,month)['items']; expense=sum(Decimal(x['amount']) for x in items if x['type']=='expense'); income=sum(Decimal(x['amount']) for x in items if x['type']=='income'); return {'expense':str(expense),'income':str(income),'balance':str(income-expense),'count':len(items)}
@app.get('/api/v1/budgets')
def list_budgets(ledger_id='default',month:str|None=None):
    with Session(engine) as s: rows=list(s.scalars(select(BudgetRow).where(BudgetRow.ledger_id==ledger_id)))
    return {'items':[{'id':r.id,'ledger_id':r.ledger_id,'month':r.month,'category_id':r.category_id,'amount':str(r.amount)} for r in rows if not month or r.month==month]}
@app.post('/api/v1/budgets',status_code=201)
def create_budget(body:BudgetIn):
    with Session(engine) as s:
        r=BudgetRow(id=str(uuid4()),**body.model_dump()); s.add(r); s.commit(); s.refresh(r); return {'id':r.id,**body.model_dump(mode='json')}
