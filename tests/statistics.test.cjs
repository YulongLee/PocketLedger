const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const s = require(path.join(process.env.STATS_TEST_BUILD, 'statistics.js'));
test('month/year/custom ranges and leap-year boundaries', () => {
  assert.deepEqual(s.periodRange('month',2024,2,{}), {start:'2024-02-01',end:'2024-02-29'});
  assert.deepEqual(s.previousRange('month',{start:'2026-01-01',end:'2026-01-31'}),{start:'2025-12-01',end:'2025-12-31'});
  assert.deepEqual(s.periodRange('year',2026,9,{}),{start:'2026-01-01',end:'2026-12-31'});
  assert.deepEqual(s.previousRange('custom',{start:'2026-03-01',end:'2026-03-03'}),{start:'2026-02-26',end:'2026-02-28'});
});
test('decimal totals, transfers excluded, invalid values discarded', () => {
  const rows=s.normalizeEntries([
    {id:'a',amount:'0.10',type:'expense',category_id:'餐饮',occurred_at:'2026-09-15T12:00:00'},
    {id:'b',amount:'0.20',type:'expense',category_id:'餐饮',occurred_at:'2026-09-15T12:00:00'},
    {amount:'10',type:'income',date:'2026-09-15'}, {amount:'500',type:'transfer',date:'2026-09-15'},
    {amount:'NaN',type:'expense',date:'2026-09-15'}, {amount:'-1',date:'2026-09-15'}, {amount:'1',date:'2026-02-30'},
  ]);
  assert.equal(rows.length,4);
  assert.deepEqual(s.totals(rows),{expense:30,income:1000,balance:970});
  const category=s.categoryRows(rows,'expense')[0];
  assert.equal(category.name,'餐饮');assert.equal(category.percent,100);assert.equal(category.amount,'0.30');
});
test('selection isolates periods and fills missing days with zero', () => {
  const rows=s.normalizeEntries([{amount:28,type:'expense',date:'2026-09-01'},{amount:99,type:'income',date:'2026-08-31'}]);
  const range={start:'2026-09-01',end:'2026-09-03'};
  const selected=s.within(rows,range); assert.equal(selected.length,1);
  const points=s.timeline(selected,range,'custom'); assert.equal(points.length,3);assert.equal(points[0].expense,2800);assert.equal(points[1].expense,0);
  assert.equal(s.change(100,0),'上期无记录');assert.equal(s.change(0,0),'暂无变化');
});
test('timezone offsets and negative balance are handled explicitly', () => {
  const rows=s.normalizeEntries([{amount:1,type:'expense',occurred_at:'2026-08-31T16:30:00Z'}]);
  assert.equal(rows[0].date, s.dateKey(new Date('2026-08-31T16:30:00Z')));
  const comparisons=s.comparisonMonths(rows,'2026-09-30'); assert.equal(comparisons.length,6);
  const month=comparisons.find(p=>p.key===rows[0].date.slice(0,7));assert.equal(month.balance,-100);assert.equal(month.rate,'—');
});
