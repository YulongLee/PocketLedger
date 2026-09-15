import { api } from '../../services/api'
import { periodRange, previousRange, normalizeEntries, totals, change, categoryRows, timeline, money } from '../../utils/statistics'
const iconMap: Record<string, string> = { 餐饮: 'food-v2', 购物: 'shopping-v2', 交通: 'transport-v2', 住房: 'home-v2', 日用: 'budget-v2', 娱乐: 'other-v2', 其他: 'other-v2' }
const colorMap: Record<string, string> = { 餐饮: '#fff0df', 购物: '#ffedf1', 交通: '#eaf4ff', 住房: '#e6faef', 日用: '#fff5df', 娱乐: '#f2eaff', 其他: '#f2eaff' }
Page({
  data: { userName: '李', currentMonth: '', loading: true, error: '', summary: { expense: '0.00', income: '0.00', balance: '0.00', expenseChange: '暂无变化', incomeChange: '暂无变化', balanceRate: '—' }, budget: { total: '3000.00', percent: 0, used: '0.00' }, trend: [] as any[], categories: [] as any[], recentTransactions: [] as any[], empty: false },
  onShow() { this.load(); this.loadProfile() },
  async loadProfile() { try { const profile: any = await api.profile(); const name = String(profile.nickname || profile.name || '李'); this.setData({ userName: name.slice(0, 8) }) } catch (_e) {} },
  async load() {
    const now = new Date(), month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    this.setData({ loading: true, error: '', currentMonth: `${now.getFullYear()}年${now.getMonth() + 1}月` })
    try {
      const home: any = await api.home({ month })
      const summary = home.summary || {}, budget = home.budget || {}, maxTrend = Math.max(1, ...(home.trend || []).map((p: any) => Number(p.expense || 0)))
      const cats = (home.categories || []).map((c: any) => ({ ...c, asset: iconMap[c.name] || 'other-v2', bg: colorMap[c.name] || '#f2eaff', amount: Number(c.amount || 0).toFixed(2) }))
      const recent = (home.recent || []).map((r: any) => ({ ...r, amount: Number(r.amount || 0).toFixed(2), time: String(r.occurred_at || '').slice(0, 16).replace('T', ' '), account: '账本账户', icon: r.type === 'income' ? '¥' : '', bg: r.type === 'income' ? '#e6faef' : '#fff0df' }))
      this.setData({ loading: false, error: '', empty: !(home.recent || []).length, summary: { expense: Number(summary.expense || 0).toFixed(2), income: Number(summary.income || 0).toFixed(2), balance: Number(summary.balance || 0).toFixed(2), expenseChange: summary.expense_change || '暂无变化', incomeChange: summary.income_change || '暂无变化', balanceRate: Number(summary.income || 0) ? `${Math.round(Number(summary.balance || 0) / Number(summary.income) * 100)}%` : '—' }, budget: { total: Number(budget.total || 0).toFixed(2), percent: Number(budget.percent || 0), used: Number(budget.used || 0).toFixed(2) }, categories: cats, recentTransactions: recent, trend: (home.trend || []).map((p: any, i: number) => ({ date: p.date, height: Number(p.expense || 0) ? Math.max(8, Math.round(Number(p.expense) / maxTrend * 120)) : 8, selected: i === home.trend.length - 1 })) })
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
