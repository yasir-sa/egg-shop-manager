import { addDays, inRange, round2, startOfDay } from './format'

const sum = (list, f) => round2(list.reduce((n, x) => n + (f(x) || 0), 0))

// Everything the dashboard and reports need for one period.
//   profit from selling = sales − cost of those eggs
//   money in hand (net) = profit from selling − broken eggs − expenses
export function summarize(data, range, kind) {
  const bills = data.bills.filter((b) => inRange(b.date, range))
  const lines = bills.flatMap((b) => b.lines)
  const sales = sum(bills, (b) => b.total)
  const cost = sum(lines, (l) => l.cost)
  const discount = sum(bills, (b) => b.discount)
  const gross = round2(sales - cost)
  const wastes = data.wastes.filter((w) => inRange(w.date, range))
  const wasteLoss = sum(wastes, (w) => w.loss)
  const brokenEggs = wastes.reduce((n, w) => n + w.eggs, 0)
  const expenses = data.expenses.filter((e) => inRange(e.date, range))
  const expenseTotal = sum(expenses, (e) => e.amount)
  const net = round2(gross - wasteLoss - expenseTotal)
  const payments = data.payments.filter((p) => inRange(p.date, range))
  const collected = sum(payments, (p) => p.amount)
  const cashIn = round2(sum(bills.filter((b) => b.payMode !== 'upi'), (b) => b.paid) + sum(payments.filter((p) => p.mode !== 'upi'), (p) => p.amount))
  const upiIn = round2(sum(bills.filter((b) => b.payMode === 'upi'), (b) => b.paid) + sum(payments.filter((p) => p.mode === 'upi'), (p) => p.amount))
  const creditGiven = sum(bills, (b) => b.credit)
  const eggsSold = lines.reduce((n, l) => n + l.eggs, 0)

  const byProduct = data.products.map((p) => {
    const ls = lines.filter((l) => l.productId === p.id)
    return { product: p, eggs: ls.reduce((n, l) => n + l.eggs, 0), amount: sum(ls, (l) => l.amount), profit: round2(sum(ls, (l) => l.amount) - sum(ls, (l) => l.cost)) }
  }).filter((r) => r.eggs > 0).sort((a, b) => b.amount - a.amount)

  const custMap = new Map()
  bills.filter((b) => b.customerId).forEach((b) => custMap.set(b.customerId, round2((custMap.get(b.customerId) || 0) + b.total)))
  const topCustomers = [...custMap.entries()].map(([id, amount]) => ({ customer: data.customers.find((c) => c.id === id), amount }))
    .filter((r) => r.customer).sort((a, b) => b.amount - a.amount).slice(0, 6)

  // Chart buckets: hours (today), days (week/month), months (year).
  const buckets = []
  if (kind === 'today') {
    for (let h = 6; h <= 22; h++) {
      const s = new Date(range.start.getTime() + h * 3600000)
      buckets.push({ key: `h${h}`, label: `${h}`, start: s.getTime(), end: s.getTime() + 3600000 })
    }
  } else if (kind === 'all') {
    // One bar per month, from the first bill until now (last 36 months at most).
    const first = data.bills.reduce((m, b) => Math.min(m, b.date), Date.now())
    const now = new Date()
    let d = new Date(new Date(first).getFullYear(), new Date(first).getMonth(), 1)
    const limit = new Date(now.getFullYear(), now.getMonth() - 35, 1)
    if (d < limit) d = limit
    for (; d <= now; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      buckets.push({ key: `a${d.getFullYear()}-${d.getMonth()}`, month: d.getMonth(), year: d.getFullYear(), start: d.getTime(), end: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() })
    }
  } else if (kind === 'year') {
    for (let m = 0; m < 12; m++) {
      const s = new Date(range.start.getFullYear(), m, 1)
      buckets.push({ key: `m${m}`, month: m, start: s.getTime(), end: new Date(s.getFullYear(), m + 1, 1).getTime() })
    }
  } else {
    for (let d = startOfDay(range.start); d < range.end; d = addDays(d, 1)) buckets.push({ key: d.toISOString(), day: d, start: d.getTime(), end: addDays(d, 1).getTime() })
  }
  const chart = buckets.map((b) => {
    const bb = bills.filter((x) => x.date >= b.start && x.date < b.end)
    const s = sum(bb, (x) => x.total)
    const c = sum(bb.flatMap((x) => x.lines), (l) => l.cost)
    const w = sum(wastes.filter((x) => x.date >= b.start && x.date < b.end), (x) => x.loss)
    const e = sum(expenses.filter((x) => x.date >= b.start && x.date < b.end), (x) => x.amount)
    return { ...b, sales: s, profit: round2(s - c - w - e) }
  })

  return {
    bills, sales, cost, discount, gross, wasteLoss, brokenEggs, expenseTotal, expenses, net, collected, cashIn, upiIn,
    creditGiven, eggsSold, byProduct, topCustomers, chart, wastes, payments,
  }
}

export const totalCredit = (customers) => round2(customers.filter((c) => c.active !== false).reduce((n, c) => n + Math.max(0, c.balance), 0))
export const totalTraysOut = (customers) => customers.reduce((n, c) => n + (c.trays || 0), 0)

