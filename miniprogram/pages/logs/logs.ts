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
  return { id: String(raw.id || `${date}-${index}`), amount, type, category, icon: raw.icon || categoryIcons[category] || '•••', date, time, note: raw.note || '', account: raw.account || '零钱', displayAmount: amount.toFixed(2) }
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
    edit: { amount: '', type: 'expense', category: '餐饮', note: '', date: '', time: '' },
    categories: Object.keys(categoryIcons).map(name => ({ name, icon: categoryIcons[name] })),
  },
  onShow() { this.load() },
  load() { const records = allTransactions(); this.setData({ records }, () => this.applyFilter()) },
  applyFilter() { const q = String(this.data.query || '').trim().toLowerCase(); const filter = this.data.filter; const filtered = this.data.records.filter((r: Tx) => (filter === 'all' || r.type === filter) && (!q || `${r.category} ${r.note} ${r.amount} ${r.date}`.toLowerCase().includes(q))); this.setData({ filtered }) },
  onSearch(e: any) { this.setData({ query: e.detail.value }, () => this.applyFilter()) },
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
    const records = (wx.getStorageSync('records') || []).map((raw: any, i: number) => String(raw.id || `${String(raw.date || '').slice(0, 10)}-${i}`) === tx.id ? { ...raw, amount, type: edit.type, category: edit.category, icon: categoryIcons[edit.category] || tx.icon, note: edit.note, date: edit.date, time: edit.time } : raw)
    wx.setStorageSync('records', records)
    const updated = normalize({ ...tx, ...edit, amount }, 0)
    this.setData({ selected: updated, mode: 'detail' }, () => this.load()); wx.showToast({ title: '已保存' })
  },
  removeSelected() {
    const tx = this.data.selected as Tx; if (!tx) return
    wx.showModal({ title: '删除这笔账单？', content: '删除后无法恢复', confirmColor: '#39bd88', success: (res) => { if (!res.confirm) return; const records = (wx.getStorageSync('records') || []).filter((raw: any, i: number) => String(raw.id || `${String(raw.date || '').slice(0, 10)}-${i}`) !== tx.id); wx.setStorageSync('records', records); this.setData({ selected: null, mode: 'list' }, () => this.load()); wx.showToast({ title: '已删除' }) } })
  },
  backToList() { this.setData({ mode: 'list', selected: null }) },
  add() { wx.navigateTo({ url: '/pages/add/add' }) },
})