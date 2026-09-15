import { demoEntries } from './demo'
import { api } from '../../services/api'
import { Entry, Range, dateKey, localDate, money, periodRange, previousRange, normalizeEntries, totals, within, change, categoryRows, timeline, comparisonMonths } from '../../utils/statistics'
const now = new Date()
const today = dateKey(now)
Page({
  data: {
    preview: false, navTop: 24, navHeight: 44, view: 'overview', loading: true, error: '', kind: 'month', year: now.getFullYear(), month: now.getMonth() + 1,
    periodLabel: '', periodNote: '', range: { start: '', end: '' } as Range, customStart: `${today.slice(0, 7)}-01`, customEnd: today,
    draftStart: `${today.slice(0, 7)}-01`, draftEnd: today, sheet: '', draftKind: 'month', draftYear: now.getFullYear(), draftMonth: now.getMonth() + 1, months: Array.from({ length: 12 }, (_, i) => i + 1),
    records: [] as Entry[], expense: '0.00', income: '0.00', balance: '0.00', expenseChange: '', incomeChange: '', balanceChange: '', rate: '—', rateWidth: 0,
    count: 0, expenses: [] as ReturnType<typeof categoryRows>, incomes: [] as ReturnType<typeof categoryRows>, categories: [] as ReturnType<typeof categoryRows>,
    points: [] as ReturnType<typeof timeline>, comparisons: [] as ReturnType<typeof comparisonMonths>, comparisonList: [] as ReturnType<typeof comparisonMonths>, chartType: 'bar', categoryMetric: 'amount', selectedPoint: '',
    insights: [] as string[], detailName: '', detailAmount: '', detailPercent: 0, detailRows: [] as { id: string; title: string; date: string; note: string; amount: string }[],
    totalLabel: '本月', analysisLabel: '支出分析', activeAmount: '0.00', activeChange: '', hasActiveData: false,
  },
  onLoad() {
    const info = wx.getSystemInfoSync(), menu = wx.getMenuButtonBoundingClientRect()
    const navTop = info.statusBarHeight || 24
    this.setData({ navTop, navHeight: menu.height ? (menu.top - navTop) * 2 + menu.height : 44 })
  },
  onShow() { if (this.data.preview) this.refresh(); else this.load() },
  onReady() { this.drawCharts() },
  onResize() { this.drawCharts() },
  onHide() { if (this.data.sheet) { this.setData({ sheet: '' }); wx.showTabBar({ animation: false }) } },
  async load() {
    this.setData({ loading: true, error: '', preview: false, records: [] }, () => this.refresh())
    try {
      const response = await api.transactions()
      this.setData({ records: normalizeEntries(response.items || []), loading: false }, () => this.refresh())
    } catch (_error) {
      this.setData({ loading: false, error: '账单暂时未能加载，请重试。' })
    }
  },
  showPreview() { this.setData({ preview: true, loading: false, error: '', kind: 'month', year: now.getFullYear(), month: now.getMonth() + 1, records: demoEntries(now.getFullYear(), now.getMonth() + 1) }, () => this.refresh()) },
  refresh() {
    const { kind, year, month, customStart, customEnd, records } = this.data
    const range = periodRange(kind, year, month, { start: customStart, end: customEnd })
    const rows = within(records, range), sum = totals(rows), previous = totals(within(records, previousRange(kind, range)))
    const expenses = categoryRows(rows, 'expense'), incomes = categoryRows(rows, 'income')
    const type = this.data.view === 'income' ? 'income' : 'expense'
    const rate = sum.income ? Math.round(sum.balance / sum.income * 100) : null
    const insights = [] as string[]
    if (!rows.length) insights.push('这一周期还没有账单，记下第一笔收支后，就能看到消费分析。')
    else {
      if (expenses.length) insights.push(`${expenses[0].name}是支出最多的分类，共 ¥${expenses[0].amount}，占总支出的 ${expenses[0].percent}%。`)
      insights.push(sum.balance >= 0 ? `本期结余 ¥${money(sum.balance)}${rate === null ? '。' : `，结余率 ${rate}%。`}` : `本期支出超过收入 ¥${money(-sum.balance)}，可以留意较大的消费项目。`)
      insights.push(previous.expense ? `与上一周期相比，支出${sum.expense >= previous.expense ? '增加' : '减少'} ¥${money(Math.abs(sum.expense - previous.expense))}。` : '积累更多账单后，可以比较不同周期的消费变化。')
    }
    this.setData({ range, count: rows.length, expenses, incomes, categories: type === 'income' ? incomes : expenses,
      expense: money(sum.expense), income: money(sum.income), balance: money(sum.balance), expenseChange: change(sum.expense, previous.expense), incomeChange: change(sum.income, previous.income), balanceChange: change(sum.balance, previous.balance),
      rate: rate === null ? '—' : `${rate}%`, rateWidth: rate === null ? 0 : Math.max(0, Math.min(100, rate)), insights,
      periodLabel: kind === 'year' ? `${year}年` : kind === 'custom' ? `${customStart} 至 ${customEnd}` : `${year}年${month}月`,
      periodNote: range.start <= today && range.end >= today ? '本期尚未结束 · 与上一完整周期对比' : `${range.start} — ${range.end}`,
      totalLabel: kind === 'month' ? '本月' : kind === 'year' ? '本年' : '本期',
      points: timeline(rows, range, kind), comparisons: comparisonMonths(records, range.end), comparisonList: comparisonMonths(records, range.end).reverse(), selectedPoint: '',
      activeAmount: money(type === 'income' ? sum.income : sum.expense), activeChange: change(type === 'income' ? sum.income : sum.expense, type === 'income' ? previous.income : previous.expense), hasActiveData: type === 'income' ? sum.income > 0 : sum.expense > 0,
    }, () => this.drawCharts())
  },
  openAnalysis(e: any) {
    const view = e.currentTarget.dataset.view
    this.setData({ view, chartType: view === 'expense' ? 'line' : 'bar', analysisLabel: view === 'income' ? '收入分析' : view === 'balance' ? '结余分析' : '支出分析' }, () => this.refresh())
    wx.pageScrollTo({ scrollTop: 0, duration: 0 })
  },
  back() { this.setData({ view: 'overview' }, () => this.refresh()) },
  chooseKind(e: any) {
    const kind = e.currentTarget.dataset.kind
    if (kind === 'custom') { this.openTime(); this.setData({ draftKind: 'custom' }); return }
    this.setData({ kind }, () => this.refresh())
  },
  openTime() { wx.hideTabBar({ animation: false }); this.setData({ sheet: 'time', draftKind: this.data.kind, draftYear: this.data.year, draftMonth: this.data.month, draftStart: this.data.customStart, draftEnd: this.data.customEnd }) },
  closeSheet() { wx.showTabBar({ animation: false }); this.setData({ sheet: '' }, () => this.drawCharts()) },
  stop() {},
  draftKindChange(e: any) { this.setData({ draftKind: e.currentTarget.dataset.kind }) },
  changeYear(e: any) { this.setData({ draftYear: Math.max(1970, Math.min(2100, this.data.draftYear + Number(e.currentTarget.dataset.step))) }) },
  selectMonth(e: any) { this.setData({ draftMonth: Number(e.currentTarget.dataset.month) }) },
  changeDate(e: any) { this.setData({ [e.currentTarget.dataset.field]: e.detail.value }) },
  applyTime() {
    if (this.data.draftKind === 'custom' && (this.data.draftStart > this.data.draftEnd || localDate(this.data.draftEnd).getTime() - localDate(this.data.draftStart).getTime() > 366 * 5 * 86400000)) {
      wx.showToast({ title: '请选择有效日期，跨度不超过5年', icon: 'none' }); return
    }
    wx.showTabBar({ animation: false })
    this.setData({ sheet: '', kind: this.data.draftKind, year: this.data.draftYear, month: this.data.draftMonth, customStart: this.data.draftStart, customEnd: this.data.draftEnd }, () => this.refresh())
  },
  toggleMetric(e: any) { this.setData({ categoryMetric: e.currentTarget.dataset.metric }, () => this.drawCharts()) },
  toggleChart(e: any) { this.setData({ chartType: e.currentTarget.dataset.type }, () => this.drawCharts()) },
  openCategory(e: any) {
    const type = this.data.view === 'income' ? 'income' : 'expense'
    const name = e.currentTarget.dataset.name
    const categories = type === 'income' ? this.data.incomes : this.data.expenses
    const category = categories.find(c => c.name === name)
    if (!category) return
    const rows = within(this.data.records, this.data.range).filter(r => r.type === type && r.category === name).sort((a, b) => b.date.localeCompare(a.date))
    wx.hideTabBar({ animation: false })
    this.setData({ sheet: 'category', detailName: name, detailAmount: category.amount, detailPercent: category.percent, detailRows: rows.map(r => ({ id: r.id, title: r.title, date: r.date, note: r.note, amount: money(r.cents) })) })
  },
  tapChart(e: any) {
    const x = e.detail.x
    wx.createSelectorQuery().select('#trendCanvas').boundingClientRect((rect: any) => {
      if (!rect || !this.data.points.length) return
      const i = Math.max(0, Math.min(this.data.points.length - 1, Math.floor((x - 32) / Math.max(1, rect.width - 42) * this.data.points.length)))
      const point = this.data.points[i]
      this.setData({ selectedPoint: `${point.label} · 支出 ¥${money(point.expense)} · 收入 ¥${money(point.income)}` })
    }).exec()
  },
  drawCharts() {
    wx.nextTick(() => {
      if (this.data.loading || this.data.error || this.data.sheet) return
      if (this.data.view !== 'balance') this.drawDonut()
      this.drawTrend(this.data.view === 'balance' ? 'compareCanvas' : 'trendCanvas')
    })
  },
  drawDonut() {
    const canvasId = this.data.view === 'overview' ? 'overviewDonut' : 'analysisDonut'
    wx.createSelectorQuery().select(`#${canvasId}`).boundingClientRect((rect: any) => {
      if (!rect) return
      const ctx = wx.createCanvasContext(canvasId, this), w = rect.width, h = rect.height, radius = Math.min(w, h) * .38
      const items = this.data.view === 'income' ? this.data.incomes : this.data.expenses
      const total = items.reduce((s, c) => s + c.cents, 0)
      ctx.clearRect(0, 0, w, h); ctx.setLineWidth(radius * .36)
      let angle = -Math.PI / 2
      if (!total) { ctx.beginPath(); ctx.setStrokeStyle('#edf3f0'); ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2); ctx.stroke() }
      items.forEach(c => { if (!c.cents) return; const next = angle + c.cents / total * Math.PI * 2; ctx.beginPath(); ctx.setStrokeStyle(c.color); ctx.arc(w / 2, h / 2, radius, angle, next); ctx.stroke(); angle = next })
      ctx.draw()
    }).exec()
  },
  drawTrend(id: string) {
    wx.createSelectorQuery().select(`#${id}`).boundingClientRect((rect: any) => {
      if (!rect) return
      const ctx = wx.createCanvasContext(id, this), width = rect.width, height = rect.height
      const isBalance = this.data.view === 'balance'
      const points: any[] = (isBalance ? this.data.comparisons : this.data.points).map(p => ({ ...p }))
      let series = isBalance ? [{ key: 'expense', color: '#ff7181' }, { key: 'income', color: '#20c888' }, { key: 'balance', color: '#9b92f6' }] : this.data.view === 'overview' ? [{ key: 'expense', color: '#19c58a' }, { key: 'income', color: '#c7cedc' }] : [{ key: this.data.view === 'income' ? 'income' : 'expense', color: '#19c58a' }]
      if (this.data.view === 'expense') {
        const rows = within(this.data.records, this.data.range)
        series = this.data.expenses.map((c, i) => ({ key: `category${i}`, color: c.color }))
        points.forEach(p => { this.data.expenses.forEach((c, i) => {
          const sum = rows.filter(r => r.type === 'expense' && r.category === c.name && r.date.startsWith(p.key)).reduce((n, r) => n + r.cents, 0)
          p[`category${i}`] = this.data.categoryMetric === 'percent' ? (p.expense ? Math.round(sum / p.expense * 10000) : 0) : sum
        }) })
      }
      const percentage = this.data.view === 'expense' && this.data.categoryMetric === 'percent'
      const values = points.reduce((all: number[], p) => all.concat(series.map(s => Number((p as any)[s.key]))), [])
      const max = percentage ? 10000 : Math.max(100, ...values), min = Math.min(0, ...values), plotHeight = height - 38, plotWidth = width - 44
      const y = (n: number) => 10 + (max - n) / (max - min) * plotHeight
      ctx.clearRect(0, 0, width, height); ctx.setFontSize(9); ctx.setTextAlign('right')
      for (let i = 0; i <= 2; i++) { const n = max - (max - min) * i / 2; ctx.setStrokeStyle('#eef2f5'); ctx.beginPath(); ctx.moveTo(34, y(n)); ctx.lineTo(width - 6, y(n)); ctx.stroke(); ctx.setFillStyle('#8d9aaf'); ctx.fillText(percentage ? `${Math.round(n / 100)}%` : Math.abs(n / 100) >= 1000 ? `${Math.round(n / 10000) / 10}k` : `${Math.round(n / 100)}`, 29, y(n) + 3) }
      const slot = plotWidth / Math.max(points.length, 1)
      series.forEach((s, si) => {
        ctx.setStrokeStyle(s.color); ctx.setFillStyle(s.color); ctx.setLineWidth(2)
        if (this.data.chartType === 'line' && !isBalance) ctx.beginPath()
        points.forEach((p, i) => { const value = Number((p as any)[s.key]); const x = 34 + (i + .5) * slot
          if (this.data.chartType === 'line' && !isBalance) { if (i === 0) ctx.moveTo(x, y(value)); else ctx.lineTo(x, y(value)) }
          else { const barWidth = Math.max(1, Math.min(12, slot * .72 / series.length)); if (value !== 0) ctx.fillRect(x + (si - series.length / 2) * barWidth, Math.min(y(value), y(0)), barWidth - .5, Math.max(1, Math.abs(y(0) - y(value)))) }
        })
        if (this.data.chartType === 'line' && !isBalance) ctx.stroke()
      })
      ctx.setTextAlign('center'); ctx.setFillStyle('#8d9aaf')
      const step = Math.max(1, Math.ceil(points.length / 6))
      points.forEach((p, i) => { if (i % step === 0 || i === points.length - 1 && points.length % step > 1) ctx.fillText(p.label, 34 + (i + .5) * slot, height - 5) })
      ctx.draw()
    }).exec()
  },
})
