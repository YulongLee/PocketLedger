import { api } from '../../services/api'
type Tx = {
  id: string
  amount: number
  type: 'expense' | 'income' | 'transfer'
  category: string
  icon: string
  date: string
  time: string
  note: string
  account?: string
  displayAmount: string
  asset: string
}
const categoryIcons: Record<string, string> = {
  餐饮: '🍜', 交通: '🚗', 购物: '🛍️', 日用: '🧴', 娱乐: '🎮', 住房: '🏠', 医疗: '💊', 教育: '📚', 数码: '💻', 运动: '⚽', 宠物: '🐾',
  工资: '💰', 奖金: '🎁', 兼职: '💼', 投资: '📈', 红包: '🧧', 退款: '↩️', 其他: '•••'
}
function normalize(raw: any, index: number): Tx {
  const amount = Number(raw.amount || 0)
  const type = raw.type === 'income' || raw.type === 'transfer' ? raw.type : 'expense'
  const date = String(raw.date || raw.occurredAt || new Date().toISOString().slice(0, 10)).slice(0, 10)
  const time = String(raw.time || (raw.occurredAt ? String(raw.occurredAt).slice(11, 16) : '12:30'))
  const category = raw.category || raw.title || (type === 'income' ? '其他收入' : '其他')
  const assetMap:Record<string,string>={餐饮:'food-v2',购物:'shopping-v2',交通:'transport-v2',住房:'home-v2',其他:'other-v2'}
  return { id: String(raw.id || `${date}-${index}`), amount, type, category, icon: raw.icon || categoryIcons[category] || '•••', asset: assetMap[category] || 'other-v2', date, time, note: raw.note || '', account: raw.account || '零钱', displayAmount: amount.toFixed(2) }
}
function allTransactions(): Tx[] {
  const records = wx.getStorageSync('records') || []
  return (records as any[]).map(normalize).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
}
Page({
  data: {
    mode: 'list' as 'list' | 'detail' | 'edit', records: [] as Tx[], filtered: [] as Tx[], query: '', filter: 'all',
    filters: [{ key: 'all', label: '全部' }, { key: 'expense', label: '支出' }, { key: 'income', label: '收入' }, { key: 'transfer', label: '转账' }],
    selected: null as Tx | null,
    monthLabel: '2026年9月', selectedDate: '2026-09-15', selectedDateLabel: '9月15日', dayExpense: '0.00', dayIncome: '0.00', weekLabels: ['一','二','三','四','五','六','日'], calendar: [] as any[],
    edit: { amount: '', type: 'expense', category: '餐饮', note: '', date: '', time: '' },
    categories: Object.keys(categoryIcons).map(name => ({ name, icon: categoryIcons[name] })),
  },
  onShow() { this.buildCalendar(); this.load() },
  buildCalendar() { const days=[] as any[]; for(let i=1;i<=30;i++){const weekday=(i+1)%7; days.push({key:`d${i}`,day:i,selected:i===15,dot:[1,2,8,10,15,17,23,25,29,30].includes(i),weekday})} const leading=1; for(let i=0;i<leading;i++) days.unshift({key:`empty${i}`,day:'',selected:false,dot:false}); this.setData({calendar:days}) },
  async load() { try { const res:any = await api.transactions(); const records=(res.items||[]).map(normalize).sort((a:Tx,b:Tx)=>`${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)); this.setData({ records }, () => { this.applyFilter(); this.updateDaySummary(records) }) } catch(e) { const records = allTransactions(); this.setData({ records }, () => { this.applyFilter(); this.updateDaySummary(records) }) } },
  updateDaySummary(records:Tx[]) { const day=records.filter(r=>r.date===this.data.selectedDate); const expense=day.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0); const income=day.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0); this.setData({dayExpense:expense.toFixed(2),dayIncome:income.toFixed(2)}) },
  selectDay(e:any) { const day=Number(e.currentTarget.dataset.day); if(!day) return; const date=`2026-09-${String(day).padStart(2,'0')}`; const calendar=this.data.calendar.map((item:any)=>({...item,selected:item.day===day})); this.setData({selectedDate:date,selectedDateLabel:`9月${day}日`,calendar},()=>{this.applyFilter();this.updateDaySummary(this.data.records)}) },
  applyFilter() { const q = String(this.data.query || '').trim().toLowerCase(); const filter = this.data.filter; const filtered = this.data.records.filter((r: Tx) => r.date===this.data.selectedDate && (filter === 'all' || r.type === filter) && (!q || `${r.category} ${r.note} ${r.amount} ${r.date}`.toLowerCase().includes(q))); this.setData({ filtered }) },
  onSearch(e: any) { this.setData({ query: e.detail.value }, () => this.applyFilter()) },
  focusSearch() { wx.showToast({ title: '可在下方搜索账单', icon: 'none' }) },
  chooseFilter(e: any) { this.setData({ filter: e.currentTarget.dataset.key }, () => this.applyFilter()) },
  openDetail(e: any) { const tx = this.data.records.find((r: Tx) => r.id === e.currentTarget.dataset.id); if (tx) this.setData({ selected: tx, mode: 'detail' }) },
  startEdit() { const tx = this.data.selected as Tx; if (!tx) return; this.setData({ mode: 'edit', edit: { amount: tx.displayAmount, type: tx.type, category: tx.category, note: tx.note, date: tx.date, time: tx.time } }) },
  cancelEdit() { this.setData({ mode: this.data.selected ? 'detail' : 'list' }) },
  editInput(e: any) { this.setData({ [`edit.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  editType(e: any) { this.setData({ 'edit.type': e.currentTarget.dataset.type }) },
  editCategory(e: any) { this.setData({ 'edit.category': e.currentTarget.dataset.name }) },
  editDate(e: any) { this.setData({ 'edit.date': e.detail.value }) },
  saveEdit() {
    const tx = this.data.selected as Tx; const edit = this.data.edit; const amount = Number(edit.amount)
    if (!tx || !amount || amount < 0) { wx.showToast({ title: '请输入有效金额', icon: 'none' }); return }
    api.updateTransaction(tx.id, {type: edit.type, amount, category_id: edit.category, title: edit.category, note: edit.note, occurred_at: `${edit.date}T${edit.time || '12:30'}:00`, source: 'manual', idempotency_key: `edit-${tx.id}`}).then(()=>{ const updated = normalize({ ...tx, ...edit, amount }, 0); this.setData({ selected: updated, mode: 'detail' }, () => this.load()); wx.showToast({ title: '已保存' }) }).catch(()=>wx.showToast({title:'保存失败，请重试',icon:'none'}))
  },
  removeSelected() {
    const tx = this.data.selected as Tx; if (!tx) return
    wx.showModal({ title: '删除这笔账单？', content: '删除后无法恢复', confirmColor: '#39bd88', success: (res) => { if (!res.confirm) return; const records = (wx.getStorageSync('records') || []).filter((raw: any, i: number) => String(raw.id || `${String(raw.date || '').slice(0, 10)}-${i}`) !== tx.id); wx.setStorageSync('records', records); this.setData({ selected: null, mode: 'list' }, () => this.load()); wx.showToast({ title: '已删除' }) } })
  },
  backToList() { this.setData({ mode: 'list', selected: null }) },
  add() { wx.navigateTo({ url: '/pages/add/add' }) },
})
