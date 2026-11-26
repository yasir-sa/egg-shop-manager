import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { STORES, db, newId } from './db'
import { TRAY, round2 } from './format'
import { buildDemo } from './seed'

// All shop data and every action (bill, credit, orders, stock, trays…) live here.
// Pages only call these actions, so the storage underneath (IndexedDB now, Firebase later) can change.

const Ctx = createContext(null)
const SESSION_KEY = 'eggshop-session'

export const DEFAULT_SETTINGS = {
  shopTa: 'டெமோ முட்டை நிலையம்',
  shopEn: 'Demo Egg Centre',
  ownerTa: 'ஆர். குமார்',
  ownerEn: 'R. Kumar',
  phone: '90000 00000',
  tagTa: 'மொத்தம் & சில்லறை வியாபாரம்',
  tagEn: 'Wholesale & Retail',
  addressTa: 'எண் 1, மெயின் ரோடு, சென்னை – 600 001',
  addressEn: 'No. 1, Main Road, Chennai – 600 001',
  upiId: '',
  upiQr: null,
  ownerPin: '1234',
  lang: 'ta',
  theme: 'light',
  billNo: 1,
  orderNo: 1,
  custNo: 1,
  staffNo: 1,
  seeded: false,
}

const pin4 = () => String(Math.floor(1000 + Math.random() * 9000))
const pad = (n, w = 3) => String(n).padStart(w, '0')

export function ShopProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [data, setData] = useState(() => Object.fromEntries(STORES.filter((s) => s !== 'settings').map((s) => [s, []])))
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { return null }
  })
  const [toasts, setToasts] = useState([])
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const dataRef = useRef(data)
  dataRef.current = data

  const lang = settings.lang
  // tr('தமிழ்', 'English') — every label in the app goes through this.
  const tr = useCallback((ta, en) => (lang === 'ta' ? ta : en), [lang])

  const toast = useCallback((text, kind = 'ok') => {
    const id = newId()
    setToasts((l) => [...l, { id, text, kind }])
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), 2600)
  }, [])

  // ---------- low-level save helpers ----------
  const put = useCallback(async (store, doc) => {
    await db.put(store, doc)
    setData((d) => ({ ...d, [store]: d[store].some((x) => x.id === doc.id) ? d[store].map((x) => (x.id === doc.id ? doc : x)) : [...d[store], doc] }))
    return doc
  }, [])
  const putMany = useCallback(async (store, docs) => {
    if (!docs.length) return
    await db.putMany(store, docs)
    setData((d) => {
      const map = new Map(d[store].map((x) => [x.id, x]))
      docs.forEach((x) => map.set(x.id, x))
      return { ...d, [store]: [...map.values()] }
    })
  }, [])
  const remove = useCallback(async (store, id) => {
    await db.remove(store, id)
    setData((d) => ({ ...d, [store]: d[store].filter((x) => x.id !== id) }))
  }, [])
  const saveSettings = useCallback(async (patch) => {
    const next = { ...settingsRef.current, ...patch }
    settingsRef.current = next
    setSettings(next)
    await Promise.all(Object.entries(patch).map(([key, value]) => db.put('settings', { key, value })))
    return next
  }, [])
  // Next running number (bill no., customer code…), saved immediately.
  const nextNo = useCallback(async (key) => {
    const n = settingsRef.current[key] || 1
    await saveSettings({ [key]: n + 1 })
    return n
  }, [saveSettings])

  // ---------- who is using the app ----------
  const me = useMemo(() => {
    if (!session) return null
    if (session.role === 'owner') return { role: 'owner', id: 'owner', name: lang === 'ta' ? settings.ownerTa : settings.ownerEn }
    const list = session.role === 'staff' ? data.staff : data.customers
    const p = list.find((x) => x.id === session.id && x.active !== false)
    return p ? { role: session.role, id: p.id, name: p.name } : null
  }, [session, data.staff, data.customers, settings.ownerTa, settings.ownerEn, lang])

  const log = useCallback(async (ta, en, kind = 'info', ref = null) => {
    const by = meRef.current ?? { role: 'system', id: 'system', name: 'System' }
    await put('activity', { id: newId(), date: Date.now(), by, kind, ta, en, ref })
  }, [put])
  const meRef = useRef(me)
  meRef.current = me

  // ---------- load ----------
  const loadAll = useCallback(async () => {
    const entries = await Promise.all(STORES.map(async (s) => [s, await db.all(s)]))
    const s = { ...DEFAULT_SETTINGS }
    const rest = {}
    entries.forEach(([name, rows]) => {
      if (name === 'settings') rows.forEach(({ key, value }) => { s[key] = value })
      else rest[name] = name === 'products' ? rows.sort((a, b) => (a.sort ?? 99) - (b.sort ?? 99)) : rows
    })
    setSettings(s)
    settingsRef.current = s
    setData(rest)
    return { s, rest }
  }, [])

  const seedDemo = useCallback(async () => {
    const demo = buildDemo()
    for (const [store, rows] of Object.entries(demo.data)) {
      await db.clear(store)
      await db.putMany(store, rows)
    }
    await saveSettings({ ...demo.settings, seeded: true })
    await loadAll()
  }, [saveSettings, loadAll])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { s } = await loadAll()
      if (cancelled) return
      if (!s.seeded) await seedDemo()
      setReady(true)
    })()
    return () => { cancelled = true }
  }, [loadAll, seedDemo])

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
    document.documentElement.lang = settings.lang
    document.documentElement.classList.toggle('lang-ta', settings.lang === 'ta')
  }, [settings.theme, settings.lang])

  // ---------- login ----------
  const login = useCallback((role, code, pin) => {
    if (role === 'owner') {
      if (pin !== settingsRef.current.ownerPin) return false
      setSession({ role: 'owner' })
      localStorage.setItem(SESSION_KEY, JSON.stringify({ role: 'owner' }))
      return true
    }
    const list = role === 'staff' ? dataRef.current.staff : dataRef.current.customers
    const p = list.find((x) => x.code.toUpperCase() === String(code).trim().toUpperCase() && x.pin === String(pin) && x.active !== false)
    if (!p) return false
    const sess = { role, id: p.id }
    setSession(sess)
    localStorage.setItem(SESSION_KEY, JSON.stringify(sess))
    return true
  }, [])
  const logout = useCallback(() => {
    setSession(null)
    localStorage.removeItem(SESSION_KEY)
  }, [])
  const checkPin = useCallback((pin) => pin === settingsRef.current.ownerPin, [])

  // ---------- prices ----------
  // Price of ONE egg for a customer (wholesale or retail rate, minus any special discount).
  const rateFor = useCallback((product, customer) => {
    if (!product) return 0
    const base = customer?.type === 'wholesale' ? product.wholesaleRate : product.retailRate
    return round2(Math.max(0, base - (customer?.rateOff || 0)))
  }, [])

  // ---------- stock (FIFO lots) ----------
  const stockOf = useCallback((productId) => dataRef.current.lots
    .filter((l) => l.productId === productId).reduce((n, l) => n + l.remaining, 0), [])

  // Takes eggs from the oldest lots first; returns the lots touched and the cost.
  function allocate(productId, eggs, lotsNow) {
    const lots = lotsNow.filter((l) => l.productId === productId && l.remaining > 0).sort((a, b) => a.date - b.date)
    let left = eggs
    let cost = 0
    const used = []
    const changed = []
    for (const lot of lots) {
      if (left <= 0) break
      const take = Math.min(left, lot.remaining)
      used.push({ lotId: lot.id, eggs: take })
      cost += take * lot.costPerEgg
      changed.push({ ...lot, remaining: lot.remaining - take })
      left -= take
    }
    if (left > 0) {
      // Selling more than recorded stock: estimate the cost from the latest purchase.
      const last = lotsNow.filter((l) => l.productId === productId).sort((a, b) => b.date - a.date)[0]
      cost += left * (last?.costPerEgg ?? 0)
    }
    return { used, changed, cost: round2(cost), short: left }
  }

  // ---------- customers / staff / suppliers / products ----------
  const saveCustomer = useCallback(async (c) => {
    const isNew = !c.id
    const doc = isNew
      ? { balance: 0, trays: 0, active: true, createdAt: Date.now(), pin: pin4(), ...c, id: newId(), code: `C${pad(await nextNo('custNo'))}` }
      : c
    await put('customers', doc)
    await log(isNew ? `புதிய customer: ${doc.name} (${doc.code})` : `Customer மாற்றம்: ${doc.name}`,
      isNew ? `New customer: ${doc.name} (${doc.code})` : `Customer edited: ${doc.name}`, 'customer', doc.id)
    return doc
  }, [put, log, nextNo])

  const saveStaff = useCallback(async (s) => {
    const isNew = !s.id
    const doc = isNew ? { active: true, pin: pin4(), ...s, id: newId(), code: `S${pad(await nextNo('staffNo'), 2)}` } : s
    await put('staff', doc)
    await log(isNew ? `புதிய staff: ${doc.name} (${doc.code})` : `Staff மாற்றம்: ${doc.name}`, isNew ? `New staff: ${doc.name}` : `Staff edited: ${doc.name}`, 'staff', doc.id)
    return doc
  }, [put, log, nextNo])

  const saveSupplier = useCallback(async (s) => {
    const doc = s.id ? s : { ...s, id: newId(), createdAt: Date.now() }
    await put('suppliers', doc)
    return doc
  }, [put])

  const saveProduct = useCallback(async (p) => {
    const doc = p.id ? p : { active: true, ...p, id: newId() }
    await put('products', doc)
    await log(`விலை / வகை மாற்றம்: ${doc.ta}`, `Rate / type updated: ${doc.en}`, 'price', doc.id)
    return doc
  }, [put, log])

  // ---------- bills ----------
  // items: [{ productId, eggs, rate }]. payMode: cash | upi | credit | part (paid now + rest credit)
  const createBill = useCallback(async ({ customerId = null, walkName = '', items, discount = 0, payMode = 'cash', paidNow, traysGiven = 0, orderId = null }) => {
    const d = dataRef.current
    const customer = d.customers.find((c) => c.id === customerId) || null
    let lotsNow = [...d.lots]
    const lines = items.filter((it) => it.eggs > 0).map((it) => {
      const p = d.products.find((x) => x.id === it.productId)
      const amount = round2(it.eggs * it.rate)
      const a = allocate(it.productId, it.eggs, lotsNow)
      a.changed.forEach((lot) => { lotsNow = lotsNow.map((l) => (l.id === lot.id ? lot : l)) })
      return { productId: it.productId, ta: p?.ta, en: p?.en, eggs: it.eggs, rate: it.rate, amount, cost: a.cost, lots: a.used, short: a.short }
    })
    const gross = round2(lines.reduce((n, l) => n + l.amount, 0))
    const total = round2(Math.max(0, gross - discount))
    const paid = payMode === 'credit' ? 0 : payMode === 'part' ? Math.min(total, round2(paidNow || 0)) : total
    const credit = round2(total - paid)
    const bill = {
      id: newId(), no: await nextNo('billNo'), date: Date.now(), customerId, walkName, ctype: customer?.type ?? 'retail',
      lines, gross, discount: round2(discount), total, payMode, paid, credit, traysGiven, orderId, by: meRef.current,
    }
    await put('bills', bill)
    await putMany('lots', lotsNow.filter((l) => d.lots.find((o) => o.id === l.id)?.remaining !== l.remaining))
    if (customer && (credit || traysGiven)) {
      await put('customers', { ...customer, balance: round2(customer.balance + credit), trays: customer.trays + traysGiven })
    }
    if (customer && traysGiven) await put('trays', { id: newId(), customerId, change: traysGiven, date: Date.now(), by: meRef.current, billId: bill.id })
    const who = customer?.name || walkName || 'Walk-in'
    await log(`பில் #${bill.no} • ${who} • ₹${total}${credit ? ` (கடன் ₹${credit})` : ''}`, `Bill #${bill.no} • ${who} • ₹${total}${credit ? ` (credit ₹${credit})` : ''}`, 'bill', bill.id)
    return bill
  }, [put, putMany, log, nextNo])

  const deleteBill = useCallback(async (bill) => {
    const d = dataRef.current
    const lotsBack = []
    bill.lines.forEach((ln) => ln.lots?.forEach(({ lotId, eggs }) => {
      const lot = lotsBack.find((l) => l.id === lotId) ?? d.lots.find((l) => l.id === lotId)
      if (lot) {
        const upd = { ...lot, remaining: lot.remaining + eggs }
        const i = lotsBack.findIndex((l) => l.id === lotId)
        if (i >= 0) lotsBack[i] = upd; else lotsBack.push(upd)
      }
    }))
    await putMany('lots', lotsBack)
    const c = d.customers.find((x) => x.id === bill.customerId)
    if (c) await put('customers', { ...c, balance: round2(c.balance - bill.credit), trays: Math.max(0, c.trays - (bill.traysGiven || 0)) })
    await remove('bills', bill.id)
    if (bill.orderId) {
      const o = d.orders.find((x) => x.id === bill.orderId)
      if (o) await put('orders', { ...o, status: 'accepted', billId: null })
    }
    await log(`பில் #${bill.no} நீக்கப்பட்டது (₹${bill.total})`, `Bill #${bill.no} deleted (₹${bill.total})`, 'delete', bill.id)
  }, [put, putMany, remove, log])

  // ---------- payments (credit collection) ----------
  const addPayment = useCallback(async ({ customerId, amount, mode = 'cash', note = '' }) => {
    const c = dataRef.current.customers.find((x) => x.id === customerId)
    if (!c || !(amount > 0)) return null
    const pay = { id: newId(), customerId, amount: round2(amount), mode, note, date: Date.now(), by: meRef.current }
    await put('payments', pay)
    await put('customers', { ...c, balance: round2(c.balance - amount) })
    await log(`பணம் வசூல்: ${c.name} • ₹${pay.amount} (${mode === 'upi' ? 'UPI' : 'ரொக்கம்'})`, `Payment: ${c.name} • ₹${pay.amount} (${mode})`, 'payment', pay.id)
    return pay
  }, [put, log])

  const deletePayment = useCallback(async (pay) => {
    const c = dataRef.current.customers.find((x) => x.id === pay.customerId)
    if (c) await put('customers', { ...c, balance: round2(c.balance + pay.amount) })
    await remove('payments', pay.id)
    await log(`பணப் பதிவு நீக்கம்: ₹${pay.amount}`, `Payment removed: ₹${pay.amount}`, 'delete', pay.id)
  }, [put, remove, log])

  // ---------- orders ----------
  const placeOrder = useCallback(async ({ customerId, items, wantDate, mode = 'delivery', note = '' }) => {
    const c = dataRef.current.customers.find((x) => x.id === customerId)
    const order = { id: newId(), no: await nextNo('orderNo'), customerId, items: items.filter((i) => i.eggs > 0), wantDate, mode, note, status: 'pending', staffId: null, billId: null, createdAt: Date.now(), by: meRef.current }
    await put('orders', order)
    const eggs = order.items.reduce((n, i) => n + i.eggs, 0)
    await log(`புதிய ஆர்டர் #${order.no} • ${c?.name} • ${eggs} முட்டை`, `New order #${order.no} • ${c?.name} • ${eggs} eggs`, 'order', order.id)
    return order
  }, [put, log, nextNo])

  const setOrderStatus = useCallback(async (order, status, extra = {}) => {
    const o = { ...order, status, ...extra, updatedAt: Date.now() }
    await put('orders', o)
    const word = { accepted: ['ஏற்கப்பட்டது', 'accepted'], rejected: ['மறுக்கப்பட்டது', 'rejected'], out: ['டெலிவரிக்கு புறப்பட்டது', 'out for delivery'], delivered: ['டெலிவரி முடிந்தது', 'delivered'], pending: ['காத்திருப்பு', 'pending'] }[status]
    await log(`ஆர்டர் #${o.no} ${word[0]}`, `Order #${o.no} ${word[1]}`, 'order', o.id)
    return o
  }, [put, log])

  // ---------- stock: purchases, broken eggs, suppliers ----------
  const addLot = useCallback(async ({ productId, supplierId, eggs, costPerEgg, paid = 0, date = Date.now(), note = '' }) => {
    const lot = { id: newId(), productId, supplierId, eggs, remaining: eggs, costPerEgg: Math.round(costPerEgg * 10000) / 10000, paid: round2(paid), date, note, by: meRef.current }
    await put('lots', lot)
    const p = dataRef.current.products.find((x) => x.id === productId)
    await log(`கொள்முதல்: ${p?.ta} • ${eggs} முட்டை • ₹${round2(eggs * costPerEgg)}`, `Purchase: ${p?.en} • ${eggs} eggs • ₹${round2(eggs * costPerEgg)}`, 'stock', lot.id)
    return lot
  }, [put, log])

  const deleteLot = useCallback(async (lot) => {
    await remove('lots', lot.id)
    await log(`கொள்முதல் நீக்கம்: ${lot.eggs} முட்டை`, `Purchase deleted: ${lot.eggs} eggs`, 'delete', lot.id)
  }, [remove, log])

  // Broken / spoiled eggs — taken from the oldest lots, valued at their cost.
  const addWaste = useCallback(async ({ productId, eggs, reason = 'broken' }) => {
    const d = dataRef.current
    const a = allocate(productId, eggs, d.lots)
    await putMany('lots', a.changed)
    const w = { id: newId(), productId, eggs, loss: a.cost, lots: a.used, reason, date: Date.now(), by: meRef.current }
    await put('wastes', w)
    const p = d.products.find((x) => x.id === productId)
    await log(`உடைந்த முட்டை: ${p?.ta} • ${eggs} • நஷ்டம் ₹${w.loss}`, `Broken eggs: ${p?.en} • ${eggs} • loss ₹${w.loss}`, 'waste', w.id)
    return w
  }, [put, putMany, log])

  const deleteWaste = useCallback(async (w) => {
    const d = dataRef.current
    const back = (w.lots || []).map(({ lotId, eggs }) => {
      const lot = d.lots.find((l) => l.id === lotId)
      return lot ? { ...lot, remaining: lot.remaining + eggs } : null
    }).filter(Boolean)
    await putMany('lots', back)
    await remove('wastes', w.id)
  }, [putMany, remove])

  const paySupplier = useCallback(async ({ supplierId, amount, note = '' }) => {
    const s = dataRef.current.suppliers.find((x) => x.id === supplierId)
    const pay = { id: newId(), supplierId, amount: round2(amount), note, date: Date.now(), by: meRef.current }
    await put('supplierPays', pay)
    await log(`Supplier-க்கு பணம்: ${s?.name} • ₹${pay.amount}`, `Paid supplier: ${s?.name} • ₹${pay.amount}`, 'supplier', pay.id)
    return pay
  }, [put, log])

  const supplierDue = useCallback((supplierId) => {
    const d = dataRef.current
    const bought = d.lots.filter((l) => l.supplierId === supplierId).reduce((n, l) => n + l.eggs * l.costPerEgg - (l.paid || 0), 0)
    const paid = d.supplierPays.filter((p) => p.supplierId === supplierId).reduce((n, p) => n + p.amount, 0)
    return round2(bought - paid)
  }, [])

  // ---------- trays ----------
  const moveTrays = useCallback(async ({ customerId, change, note = '' }) => {
    const c = dataRef.current.customers.find((x) => x.id === customerId)
    if (!c || !change) return
    await put('customers', { ...c, trays: Math.max(0, c.trays + change) })
    await put('trays', { id: newId(), customerId, change, note, date: Date.now(), by: meRef.current })
    await log(change > 0 ? `தட்டு கொடுத்தது: ${c.name} • ${change}` : `தட்டு திரும்ப வந்தது: ${c.name} • ${-change}`,
      change > 0 ? `Trays given: ${c.name} • ${change}` : `Trays returned: ${c.name} • ${-change}`, 'tray', c.id)
  }, [put, log])

  // ---------- expenses ----------
  const addExpense = useCallback(async ({ type, amount, note = '', date = Date.now() }) => {
    const e = { id: newId(), type, amount: round2(amount), note, date, by: meRef.current }
    await put('expenses', e)
    await log(`செலவு: ${type} • ₹${e.amount}`, `Expense: ${type} • ₹${e.amount}`, 'expense', e.id)
    return e
  }, [put, log])

  // ---------- backup ----------
  const exportBackup = useCallback(() => {
    const blob = new Blob([JSON.stringify({ app: 'egg-shop-manager', version: 1, date: Date.now(), settings: settingsRef.current, data: dataRef.current })], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `eggshop-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }, [])
  const importBackup = useCallback(async (file) => {
    const json = JSON.parse(await file.text())
    if (json.app !== 'egg-shop-manager') throw new Error('bad file')
    for (const [store, rows] of Object.entries(json.data)) { await db.clear(store); await db.putMany(store, rows) }
    await saveSettings({ ...json.settings, lang: settingsRef.current.lang, theme: settingsRef.current.theme })
    await loadAll()
  }, [saveSettings, loadAll])

  const value = useMemo(() => ({
    ready, data, settings, lang, tr, toast, toasts, me, session,
    login, logout, checkPin, saveSettings,
    rateFor, stockOf, saveCustomer, saveStaff, saveSupplier, saveProduct,
    createBill, deleteBill, addPayment, deletePayment, placeOrder, setOrderStatus,
    addLot, deleteLot, addWaste, deleteWaste, paySupplier, supplierDue, moveTrays, addExpense,
    remove, put, exportBackup, importBackup, seedDemo, TRAY,
  }), [ready, data, settings, lang, tr, toast, toasts, me, session, login, logout, checkPin, saveSettings, rateFor, stockOf,
    saveCustomer, saveStaff, saveSupplier, saveProduct, createBill, deleteBill, addPayment, deletePayment, placeOrder,
    setOrderStatus, addLot, deleteLot, addWaste, deleteWaste, paySupplier, supplierDue, moveTrays, addExpense, remove, put,
    exportBackup, importBackup, seedDemo])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useShop = () => useContext(Ctx)
export { TRAY }

