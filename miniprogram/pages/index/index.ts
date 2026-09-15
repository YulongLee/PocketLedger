import { api } from '../../services/api'
import { periodRange, previousRange, normalizeEntries, totals, change, categoryRows, timeline, money } from '../../utils/statistics'
const iconMap: Record<string, string> = { 餐饮: 'food-v2', 购物: 'shopping-v2', 交通: 'transport-v2', 住房: 'home-v2', 日用: 'budget-v2', 娱乐: 'other-v2', 其他: 'other-v2' }
const colorMap: Record<string, string> = { 餐饮: '#fff0df', 购物: '#ffedf1', 交通: '#eaf4ff', 住房: '#e6faef', 日用: '#fff5df', 娱乐: '#f2eaff', 其他: '#f2eaff' }
Page({
  data: { userName: '李', currentMonth: '', loading: true, error: '', summary: { expense: '0.00', income: '0.00', balance: '0.00', expenseChange: '暂无变化', incomeChange: '暂无变化', balanceRate: '—' }, budget: { total: '3000.00', percent: 0, used: '0.00' }, trend: [] as any[], categories: [] as any[], recentTransactions: [] as any[], empty: false },
  onShow() { this.load(); this.loadProfile() },
  async loadProfile() { try { const profile: any = await api.profile(); const name = String(profile.nickname || profile.name || '李'); this.setData({ userName: name.slice(0, 8) }) } catch (_e) {} },
  async load() {
    const now = new Date(), month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, range = periodRange('month', now.getFullYear(), now.getMonth() + 1, { start: '', end: '' }), previous = previousRange('month', range)
    this.setData({ loading: true, error: '', currentMonth: `${now.getFullYear()}年${now.getMonth() + 1}月` })
    try {
      const [currentRes, previousRes, budgetRes]: any[] = await Promise.all([api.transactions({ month }), api.transactions({ month: previous.start.slice(0, 7) }), api.budgets({ month })])
      const current = normalizeEntries(currentRes.items || []), previousRows = normalizeEntries(previousRes.items || []), sum = totals(current), prev = totals(previousRows)
      const cats = categoryRows(current, 'expense').slice(0, 5).map(c => ({ ...c, asset: iconMap[c.name] || 'other-v2', bg: colorMap[c.name] || '#f2eaff' }))
      const points = timeline(current, range, 'month')
      const recent = [...current].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map(r => ({ id: r.id, title: r.title, amount: money(r.cents), type: r.type, time: r.date, account: '账本账户', icon: r.type === 'income' ? '¥' : '', bg: r.type === 'income' ? '#e6faef' : '#fff0df' }))
      const budgetTotal = (budgetRes.items || []).filter((x: any) => !x.category_id).reduce((n: number, x: any) => n + Number(x.amount || 0), 0) || 3000
      const used = sum.expense / 100, percent = Math.max(0, Math.min(100, Math.round(used / budgetTotal * 100)))
      this.setData({ loading: false, error: '', empty: !current.length, summary: { expense: money(sum.expense), income: money(sum.income), balance: money(sum.balance), expenseChange: change(sum.expense, prev.expense), incomeChange: change(sum.income, prev.income), balanceRate: sum.income ? `${Math.round(sum.balance / sum.income * 100)}%` : '—' }, budget: { total: budgetTotal.toFixed(2), percent, used: used.toFixed(2) }, categories: cats, recentTransactions: recent, trend: points.map((p, i) => ({ date: p.label, height: sum.expense ? Math.max(8, Math.round(p.expense / sum.expense * 120)) : 8, selected: i === points.length - 1 })) })
    } catch (_e) { this.setData({ loading: false, error: '账单暂时未能加载，请重试。', empty: true, recentTransactions: [], categories: [], trend: [] }) }
  },
  retry() { this.load() },
  add() { wx.navigateTo({ url: '/pages/add/add' }) },
  chooseBudget() { wx.navigateTo({ url: '/pages/budget/budget' }) },
  viewAll() { wx.navigateTo({ url: '/pages/logs/logs' }) },
  goStats() { wx.switchTab({ url: '/pages/stats/stats' }) },
  goMe() { wx.switchTab({ url: '/pages/me/me' }) },
  openAI() { wx.switchTab({ url: '/pages/ai/ai' }) },
  openPhoto() { wx.showToast({ title: '图片记账即将上线', icon: 'none' }) },
  openVoice() { wx.showToast({ title: '语音记账即将上线', icon: 'none' }) },
  openTx() { wx.navigateTo({ url: '/pages/logs/logs' }) },
  search() { wx.navigateTo({ url: '/pages/logs/logs' }) },
  notify() { wx.showToast({ title: '暂无新的提醒', icon: 'none' }) },
  selectPeriod() { wx.showToast({ title: '首页默认展示本月', icon: 'none' }) }
})
