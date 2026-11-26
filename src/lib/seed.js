// Demo data so the owner can see a "lived-in" shop on the first visit.
// Demo logins: Owner PIN 1234 · Customer C001–C012 PIN 1111 · Staff S01/S02 PIN 2222
import { newId } from './db'

const DAY = 86400000
const round2 = (n) => Math.round(n * 100) / 100

export function buildDemo() {
  const now = Date.now()
  const at = (daysAgo, hour = 9, min = 0) => {
    const d = new Date(now - daysAgo * DAY)
    d.setHours(hour, min, 0, 0)
    return d.getTime()
  }

  const products = [
    { id: newId(), ta: 'வெள்ளை முட்டை', en: 'White egg', tone: 'white', retailRate: 6, wholesaleRate: 5.4, active: true },
    { id: newId(), ta: 'நாட்டு முட்டை', en: 'Country egg', tone: 'country', retailRate: 12, wholesaleRate: 11, active: true },
    { id: newId(), ta: 'பிரவுன் முட்டை', en: 'Brown egg', tone: 'brown', retailRate: 8, wholesaleRate: 7.2, active: true },
    { id: newId(), ta: 'வாத்து முட்டை', en: 'Duck egg', tone: 'duck', retailRate: 14, wholesaleRate: 12.5, active: true },
  ]
  products.forEach((p, i) => { p.sort = i })
  const [white, country, brown, duck] = products

  const suppliers = [
    { id: newId(), name: 'நாமக்கல் பண்ணை (Namakkal Farm)', phone: '9443012345', area: 'Namakkal', createdAt: at(30) },
    { id: newId(), name: 'ராஜா ஏஜென்சி (Raja Agency)', phone: '9840098400', area: 'Guindy', createdAt: at(30) },
  ]

  const people = [
    ['ஸ்ரீ கணேஷ் ஹோட்டல்', 'wholesale', 'Velachery'], ['அன்னை பேக்கரி', 'wholesale', 'Kamarajapuram'],
    ['முருகன் டீ ஸ்டால்', 'wholesale', 'Vijayanagar'], ['சரவணா மெஸ்', 'wholesale', 'Taramani'],
    ['லட்சுமி', 'retail', 'Kamarajapuram'], ['ரவி குமார்', 'retail', 'Velachery'], ['செல்வி', 'retail', 'Baby Nagar'],
    ['அப்துல் ரஹீம்', 'retail', 'Velachery'], ['பிரியா', 'retail', 'Dhandeeswaram'], ['கார்த்திக்', 'retail', 'Velachery'],
    ['ராஜேஸ்வரி', 'retail', 'Kamarajapuram'], ['மணி சூப்பர் மார்க்கெட்', 'wholesale', 'Velachery Main Rd'],
  ]
  const customers = people.map(([name, type, area], i) => ({
    id: newId(), code: `C${String(i + 1).padStart(3, '0')}`, name, type, area, pin: '1111',
    phone: `98${String(40000000 + i * 1371).slice(0, 8)}`, rateOff: type === 'wholesale' && i === 0 ? 0.2 : 0,
    balance: 0, trays: 0, active: true, createdAt: at(25),
  }))

  const staff = [
    { id: newId(), code: 'S01', name: 'முருகன் (Delivery)', phone: '9500011111', pin: '2222', active: true },
    { id: newId(), code: 'S02', name: 'கார்த்திகேயன்', phone: '9500022222', pin: '2222', active: true },
  ]

  // Purchases (lots) over the last 2 weeks.
  const lots = [
    { p: white, s: 0, d: 13, eggs: 3000, cost: 4.7, paid: 14100 }, { p: white, s: 0, d: 6, eggs: 3000, cost: 4.85, paid: 10000 },
    { p: white, s: 1, d: 1, eggs: 1800, cost: 4.9, paid: 0 }, { p: country, s: 1, d: 8, eggs: 600, cost: 9.5, paid: 5700 },
    { p: country, s: 1, d: 2, eggs: 300, cost: 9.8, paid: 0 }, { p: brown, s: 0, d: 7, eggs: 1500, cost: 6.4, paid: 9600 },
    { p: duck, s: 1, d: 5, eggs: 450, cost: 11, paid: 4950 },
  ].map(({ p, s, d, eggs, cost, paid }) => ({
    id: newId(), productId: p.id, supplierId: suppliers[s].id, eggs, remaining: eggs, costPerEgg: cost, paid, date: at(d, 7), note: '',
  }))

  const takeFifo = (productId, eggs) => {
    let left = eggs
    let cost = 0
    const used = []
    lots.filter((l) => l.productId === productId && l.remaining > 0).sort((a, b) => a.date - b.date).forEach((l) => {
      if (left <= 0) return
      const t = Math.min(left, l.remaining)
      l.remaining -= t
      left -= t
      cost += t * l.costPerEgg
      used.push({ lotId: l.id, eggs: t })
    })
    return { used, cost: round2(cost) }
  }

  // Two weeks of bills.
  const bills = []
  const trays = []
  let billNo = 1
  const ownerBy = { role: 'owner', id: 'owner', name: 'ஆர். குமார்' }
  const staffBy = { role: 'staff', id: staff[0].id, name: staff[0].name }
  for (let d = 13; d >= 0; d--) {
    const count = d === 0 ? 4 : 5 + (d % 3)
    for (let k = 0; k < count; k++) {
      const c = k % 4 === 3 ? null : customers[(d * 3 + k) % customers.length]
      const wholesale = c?.type === 'wholesale'
      const product = k % 5 === 1 ? country : k % 7 === 2 ? brown : k % 9 === 4 ? duck : white
      const eggs = wholesale ? 30 * (2 + ((d + k) % 4)) : [6, 10, 12, 30][(d + k) % 4]
      const rate = round2(Math.max(0, (wholesale ? product.wholesaleRate : product.retailRate) - (c?.rateOff || 0)))
      const amount = round2(eggs * rate)
      const f = takeFifo(product.id, eggs)
      const credit = wholesale && (d + k) % 2 === 0 ? amount : 0
      const traysGiven = wholesale ? eggs / 30 : 0
      const bill = {
        id: newId(), no: billNo++, date: at(d, 7 + k * 2, (k * 13) % 60), customerId: c?.id ?? null, walkName: c ? '' : 'Walk-in',
        ctype: c?.type ?? 'retail', lines: [{ productId: product.id, ta: product.ta, en: product.en, eggs, rate, amount, cost: f.cost, lots: f.used, short: 0 }],
        gross: amount, discount: 0, total: amount, payMode: credit ? 'credit' : k % 2 ? 'upi' : 'cash', paid: amount - credit, credit,
        traysGiven, orderId: null, by: k % 3 === 0 ? staffBy : ownerBy,
      }
      bills.push(bill)
      if (c) {
        c.balance = round2(c.balance + credit)
        c.trays += traysGiven
        if (traysGiven) trays.push({ id: newId(), customerId: c.id, change: traysGiven, date: bill.date, by: bill.by, billId: bill.id })
      }
    }
  }

  // Some credit paid back, some trays returned.
  const payments = []
  customers.filter((c) => c.balance > 0).forEach((c, i) => {
    const amount = round2(Math.min(c.balance, Math.round((c.balance * (i % 2 ? 0.6 : 0.4)) / 10) * 10))
    if (amount > 0) {
      payments.push({ id: newId(), customerId: c.id, amount, mode: i % 2 ? 'upi' : 'cash', note: '', date: at(1 + (i % 4), 18), by: ownerBy })
      c.balance = round2(c.balance - amount)
    }
    if (c.trays > 2) {
      const back = Math.floor(c.trays / 2)
      trays.push({ id: newId(), customerId: c.id, change: -back, date: at(2, 17), by: staffBy })
      c.trays -= back
    }
  })

  // Broken eggs.
  const wastes = [[white, 18, 9], [white, 12, 3], [country, 4, 2]].map(([p, eggs, d]) => {
    const f = takeFifo(p.id, eggs)
    return { id: newId(), productId: p.id, eggs, loss: f.cost, lots: f.used, reason: 'broken', date: at(d, 12), by: staffBy }
  })

  // Customer orders waiting for the owner.
  const orders = [
    { c: customers[0], items: [{ productId: white.id, eggs: 150 }], mode: 'delivery', status: 'pending', note: 'காலை 7 மணிக்குள்' },
    { c: customers[1], items: [{ productId: white.id, eggs: 90 }, { productId: brown.id, eggs: 30 }], mode: 'delivery', status: 'accepted', staff: staff[0].id },
    { c: customers[4], items: [{ productId: country.id, eggs: 12 }], mode: 'pickup', status: 'pending', note: '' },
  ].map(({ c, items, mode, status, note = '', staff: staffId = null }, i) => ({
    id: newId(), no: i + 1, customerId: c.id, items, wantDate: at(-1, 7), mode, note, status, staffId, billId: null,
    createdAt: at(0, 8 + i), by: { role: 'customer', id: c.id, name: c.name },
  }))

  const supplierPays = [{ id: newId(), supplierId: suppliers[1].id, amount: 3000, note: 'பகுதி பணம்', date: at(3, 16), by: ownerBy }]

  const expenses = [
    ['rent', 12000, 'மாத வாடகை', 10], ['electricity', 1450, 'EB பில்', 9], ['transport', 800, 'நாமக்கல் லோடு', 6],
    ['salary', 1500, 'முருகன் – வார சம்பளம்', 2], ['trays', 600, 'புதிய தட்டுகள்', 9], ['transport', 500, 'லோடு', 1],
  ].map(([type, amount, note, d]) => ({ id: newId(), type, amount, note, date: at(d, 15), by: ownerBy }))

  const activity = [
    ...bills.slice(-6).map((b) => ({ id: newId(), date: b.date, by: b.by, kind: 'bill', ta: `பில் #${b.no} • ₹${b.total}`, en: `Bill #${b.no} • ₹${b.total}`, ref: b.id })),
    ...orders.map((o) => ({ id: newId(), date: o.createdAt, by: o.by, kind: 'order', ta: `புதிய ஆர்டர் #${o.no}`, en: `New order #${o.no}`, ref: o.id })),
  ]

  return {
    settings: { billNo, orderNo: orders.length + 1, custNo: customers.length + 1, staffNo: staff.length + 1 },
    data: { products, suppliers, customers, staff, lots, bills, payments, wastes, orders, supplierPays, expenses, trays, activity },
  }
}
