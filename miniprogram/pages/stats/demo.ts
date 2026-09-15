// Design preview only. Never persisted or sent to the API.
import { Entry, dateKey } from '../../utils/statistics'
export function demoEntries(year: number, month: number): Entry[] {
  const rows: Entry[] = []
  const categories = ['餐饮', '购物', '交通', '住房', '娱乐', '其他']
  const cents = [75600, 42600, 28400, 24000, 18900, 47350]
  for (let offset = -5; offset <= 0; offset++) {
    const first = new Date(year, month - 1 + offset, 1)
    const factor = 1 + offset * .07
    categories.forEach((category, ci) => {
      const total = Math.round(cents[ci] * factor), portions = category === '住房' ? 1 : 6
      const weights = Array.from({ length: portions }, (_, i) => 1 + ((i * 3 + ci) % 5))
      const weightTotal = weights.reduce((a, b) => a + b, 0)
      let assigned = 0
      weights.forEach((weight, i) => {
        const amount = i === portions - 1 ? total - assigned : Math.round(total * weight / weightTotal); assigned += amount
        const date = dateKey(new Date(first.getFullYear(), first.getMonth(), 1 + ((i * 4 + ci * 3) % 27)))
        rows.push({ id: `demo-${offset}-${ci}-${i}`, cents: amount, type: 'expense', category, title: category === '餐饮' ? ['午餐', '晚餐', '咖啡', '水果', '早餐', '聚餐'][i] : category, date, note: '示例记录', })
      })
    })
    ;[['工资', 600000], ['理财', 50000], ['红包', 20000], ['其他', 10000]].forEach(([category, amount], i) => rows.push({ id: `demo-income-${offset}-${i}`, cents: Math.round(Number(amount) * (1 + offset * .04)), type: 'income', category: String(category), title: String(category), date: dateKey(new Date(first.getFullYear(), first.getMonth(), 1 + i * 4)), note: '示例记录' }))
  }
  return rows
}
