export type TransactionType = 'expense' | 'income' | 'transfer'
export type DecimalAmount = string
export interface Transaction { id:string; ledgerId:string; type:TransactionType; amount:DecimalAmount; categoryId?:string; accountId?:string; toAccountId?:string; title:string; note?:string; occurredAt:string; source:'manual'|'ai'|'image'|'import'|'recurring'; idempotencyKey:string; version:number }
export interface Category { id:string; ledgerId:string; type:'expense'|'income'; name:string; icon:string; color:string; isHidden?:boolean }
export interface Account { id:string; ledgerId:string; type:string; name:string; openingBalance:DecimalAmount; balance:DecimalAmount; isDefault:boolean; isArchived:boolean }
export interface Budget { id:string; ledgerId:string; month:string; categoryId?:string; amount:DecimalAmount; alert80Sent:boolean; alert100Sent:boolean }
export function validateAmount(value:string|number):string { const text=String(value).trim(); if(!/^\d+(\.\d{1,2})?$/.test(text)||Number(text)<=0) throw new Error('金额必须大于0且最多保留两位小数'); return text }
export function makeIdempotencyKey(){return `${Date.now()}-${Math.random().toString(36).slice(2)}`}
