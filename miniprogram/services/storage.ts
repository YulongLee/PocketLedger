import { Transaction, Account, validateAmount, makeIdempotencyKey } from './models'
const KEY='records'
const ACCOUNTS_KEY='accounts'
export function listTransactions():Transaction[]{ return wx.getStorageSync(KEY)||[] }
export function saveTransaction(input:Omit<Transaction,'id'|'version'>):Transaction { const tx:Transaction={...input,amount:validateAmount(input.amount),id:makeId(),version:1}; const list=listTransactions(); if(list.some(x=>x.idempotencyKey===tx.idempotencyKey)) return list.find(x=>x.idempotencyKey===tx.idempotencyKey)!; list.unshift(tx); wx.setStorageSync(KEY,list); return tx }
export function deleteTransaction(id:string){wx.setStorageSync(KEY,listTransactions().filter(x=>x.id!==id))}
export function listAccounts():Account[]{
  const current=(wx.getStorageSync(ACCOUNTS_KEY)||[]) as Account[]
  if(current.length) return current
  const defaults:Account[]=[
    {id:'account-wechat',ledgerId:'default',type:'wechat',name:'微信零钱',openingBalance:'0.00',balance:'0.00',isDefault:true,isArchived:false},
    {id:'account-alipay',ledgerId:'default',type:'alipay',name:'支付宝',openingBalance:'0.00',balance:'0.00',isDefault:false,isArchived:false},
    {id:'account-bank',ledgerId:'default',type:'bank',name:'银行卡',openingBalance:'0.00',balance:'0.00',isDefault:false,isArchived:false},
    {id:'account-cash',ledgerId:'default',type:'cash',name:'现金',openingBalance:'0.00',balance:'0.00',isDefault:false,isArchived:false}
  ]
  wx.setStorageSync(ACCOUNTS_KEY,defaults)
  return defaults
}
export function saveAccount(input:Pick<Account,'name'|'type'|'openingBalance'> & Partial<Pick<Account,'ledgerId'>>):Account{
  const openingText=String(input.openingBalance??'0').trim()
  if(!/^\d+(\.\d{1,2})?$/.test(openingText)||Number(openingText)<0) throw new Error('账户余额必须是大于或等于0且最多两位小数')
  const opening=Number(openingText).toFixed(2)
  const account:Account={id:`account-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,ledgerId:input.ledgerId||'default',type:input.type||'custom',name:input.name.trim(),openingBalance:opening,balance:opening,isDefault:false,isArchived:false}
  const list=listAccounts(); list.push(account); wx.setStorageSync(ACCOUNTS_KEY,list); return account
}
export function updateAccount(account:Account){ const list=listAccounts().map(a=>a.id===account.id?account:a); wx.setStorageSync(ACCOUNTS_KEY,list); return account }
export function accountBalances():Record<string,number>{
  const balances:Record<string,number>={}; listAccounts().forEach(a=>balances[a.id]=Number(a.openingBalance)||0)
  listTransactions().forEach((tx:any)=>{
    const amount=Number(tx.amount)||0
    if(tx.type==='income' && tx.accountId) balances[tx.accountId]=(balances[tx.accountId]||0)+amount
    else if(tx.type==='expense' && tx.accountId) balances[tx.accountId]=(balances[tx.accountId]||0)-amount
    else if(tx.type==='transfer') { if(tx.accountId) balances[tx.accountId]=(balances[tx.accountId]||0)-amount; if(tx.toAccountId) balances[tx.toAccountId]=(balances[tx.toAccountId]||0)+amount }
  })
  return balances
}
export function saveTransfer(input:{amount:string|number;fromAccountId:string;toAccountId:string;note?:string;occurredAt?:string}):Transaction{
  if(input.fromAccountId===input.toAccountId) throw new Error('转出和转入账户不能相同')
  return saveTransaction({ledgerId:'default',type:'transfer',amount:validateAmount(input.amount),accountId:input.fromAccountId,toAccountId:input.toAccountId,title:'账户转账',note:input.note||'',occurredAt:input.occurredAt||new Date().toISOString(),source:'manual',idempotencyKey:makeIdempotencyKey()})
}
function makeId(){return `${Date.now()}-${Math.random().toString(36).slice(2)}`}
