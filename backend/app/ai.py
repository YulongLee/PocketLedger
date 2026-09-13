import json, os, re
from datetime import date, timedelta
from decimal import Decimal
from typing import Any
try:
    import httpx
except ImportError:
    httpx = None

SYSTEM_PROMPT = '''你是小帐同学的记账解析器。只输出JSON对象 {"transactions":[...]}，每笔包含 type(expense/income/transfer)、amount(正数字字符串)、category_hint、title、note、occurred_at(YYYY-MM-DD)、confidence(0到1)。不要输出Markdown。金额和日期不确定时降低confidence，不要编造精确时间。'''

def _local_parse(text: str) -> list[dict[str, Any]]:
    amounts = [Decimal(x) for x in re.findall(r'(?:¥|￥)?(\d+(?:\.\d{1,2})?)', text)]
    category = '餐饮' if any(x in text for x in ('饭','餐','火锅','咖啡','外卖')) else '交通' if any(x in text for x in ('打车','地铁','公交')) else '工资' if '工资' in text else '其他'
    kind = 'income' if any(x in text for x in ('工资','奖金','收入')) else 'expense'
    return [{'type':kind,'amount':str(a),'category_hint':category,'title':category,'note':text,'occurred_at':date.today().isoformat(),'confidence':0.72} for a in amounts]

async def parse_text(text: str) -> tuple[list[dict[str, Any]], str]:
    key = os.getenv('DASHSCOPE_API_KEY') or os.getenv('OFFERSTEADY_DASHSCOPE_API_KEY')
    base = os.getenv('DASHSCOPE_BASE_URL','https://dashscope.aliyuncs.com/compatible-mode/v1').rstrip('/')
    model = os.getenv('DASHSCOPE_MODEL','qwen3.6-flash')
    if not key or httpx is None:
        return _local_parse(text), 'local'
    payload={'model':model,'messages':[{'role':'system','content':SYSTEM_PROMPT},{'role':'user','content':text}], 'temperature':0, 'response_format':{'type':'json_object'}}
    async with httpx.AsyncClient(timeout=20) as client:
        response=await client.post(f'{base}/chat/completions',headers={'Authorization':f'Bearer {key}','Content-Type':'application/json'},json=payload)
        response.raise_for_status(); content=response.json()['choices'][0]['message']['content']; data=json.loads(content)
    rows=[]
    forced_date = date.today() if '今天' in text else date.today()-timedelta(days=1) if '昨天' in text else None
    for item in data.get('transactions',[]):
        try:
            amount=Decimal(str(item.get('amount','')))
            if amount <= 0 or amount > Decimal('100000000'): continue
            occurred=str(item.get('occurred_at') or '')
            if forced_date: occurred=forced_date.isoformat()
            elif not re.fullmatch(r'\d{4}-\d{2}-\d{2}', occurred): occurred=date.today().isoformat()
            item={**item,'amount':str(amount.quantize(Decimal('0.01'))),'occurred_at':occurred,'confidence':max(0,min(1,float(item.get('confidence',0.5))))}
            rows.append(item)
        except (ValueError, TypeError, ArithmeticError):
            continue
    return rows, 'dashscope'
