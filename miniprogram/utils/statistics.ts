export type Entry = { id: string; cents: number; type: string; category: string; title: string; date: string; note: string }
export type Range = { start: string; end: string }
export const palette = ['#22c88c', '#559dff', '#ff7181', '#ffbb63', '#81dbc0', '#c4a4f5', '#96a7bd']
export const dateKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const localDate = (key: string): Date => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)))
export const money = (cents: number): string => (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export function periodRange(kind: string, year: number, month: number, custom: Range): Range {
  if (kind === 'custom') return custom
  return { start: dateKey(new Date(year, kind === 'year' ? 0 : month - 1, 1)), end: dateKey(new Date(year, kind === 'year' ? 12 : month, 0)) }
}
export function previousRange(kind: string, range: Range): Range {
  const s = localDate(range.start), e = localDate(range.end)
  if (kind === 'month') return periodRange('month', s.getMonth() === 0 ? s.getFullYear() - 1 : s.getFullYear(), s.getMonth() === 0 ? 12 : s.getMonth(), range)
  if (kind === 'year') return periodRange('year', s.getFullYear() - 1, 1, range)
  const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1
  return { start: dateKey(new Date(s.getFullYear(), s.getMonth(), s.getDate() - days)), end: dateKey(new Date(s.getFullYear(), s.getMonth(), s.getDate() - 1)) }
}
export function normalizeEntries(raw: any[]): Entry[] {
  return raw.map((r: any) => {
    const stamp = String(r.occurred_at || r.occurredAt || r.date || '')
    // Offset timestamps are converted to the device's calendar date; plain dates stay intact.
    const date = /(?:Z|[+-]\d{2}:\d{2})$/.test(stamp) ? dateKey(new Date(stamp)) : stamp.slice(0, 10)
    return { id: String(r.id || ''), cents: Math.round(Number(r.amount) * 100), type: String(r.type), category: String(r.category_name || r.category || r.category_id || '其他'), title: String(r.title || r.category_name || r.category || r.category_id || '其他'), date, note: String(r.note || '') }
  }).filter(r => Number.isSafeInteger(r.cents) && r.cents >= 0 && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && dateKey(localDate(r.date)) === r.date)
}
export function totals(rows: Entry[]) {
  const expense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + r.cents, 0)
  const income = rows.filter(r => r.type === 'income').reduce((s, r) => s + r.cents, 0)
  return { expense, income, balance: income - expense }
}
export const within = (rows: Entry[], range: Range) => rows.filter(r => r.date >= range.start && r.date <= range.end)
export function change(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? '暂无变化' : '上期无记录'
  const percent = Math.round((current - previous) / Math.abs(previous) * 100)
  return percent === 0 ? '与上期持平' : `${percent > 0 ? '↑' : '↓'} ${Math.abs(percent)}% 较上期`
}
export function categoryRows(rows: Entry[], type: string) {
  const sums: Record<string, number> = {}
  rows.filter(r => r.type === type).forEach(r => { sums[r.category] = (sums[r.category] || 0) + r.cents })
  const total = Object.values(sums).reduce((a, b) => a + b, 0)
  return Object.keys(sums).sort((a, b) => sums[b] - sums[a]).map((name, index) => ({ name, cents: sums[name], amount: money(sums[name]), percent: total ? Math.round(sums[name] / total * 1000) / 10 : 0, color: palette[index % palette.length] }))
}
export function timeline(rows: Entry[], range: Range, kind: string) {
  const start = localDate(range.start), end = localDate(range.end)
  const monthly = kind === 'year' || (end.getTime() - start.getTime()) / 86400000 > 62
  const points: { key: string; label: string; expense: number; income: number; balance: number }[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), monthly ? 1 : start.getDate())
  while (cursor <= end) {
    const key = dateKey(cursor).slice(0, monthly ? 7 : 10)
    const sum = totals(rows.filter(r => r.date.startsWith(key)))
    points.push({ key, label: monthly ? `${cursor.getMonth() + 1}月` : `${cursor.getMonth() + 1}.${cursor.getDate()}`, ...sum })
    if (monthly) cursor.setMonth(cursor.getMonth() + 1); else cursor.setDate(cursor.getDate() + 1)
  }
  return points
}
export function comparisonMonths(rows: Entry[], endKey: string) {
  const end = localDate(endKey)
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(end.getFullYear(), end.getMonth() - 5 + i, 1)
    const key = dateKey(d).slice(0, 7), sum = totals(rows.filter(r => r.date.startsWith(key)))
    return { key, label: `${d.getMonth() + 1}月`, fullLabel: `${d.getFullYear()}年${d.getMonth() + 1}月`, ...sum, amount: money(sum.balance), rate: sum.income ? `${Math.round(sum.balance / sum.income * 100)}%` : '—' }
  })
}
