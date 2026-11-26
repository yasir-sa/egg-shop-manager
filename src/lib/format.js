// Money, egg/tray counts and dates — in the shopkeeper's words.

export const TRAY = 30 // eggs in one tray

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

const inr0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const inr2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const money = (n) => {
  const v = round2(n || 0)
  const s = Number.isInteger(v) ? inr0.format(Math.abs(v)) : inr2.format(Math.abs(v))
  return `${v < 0 ? '−' : ''}₹${s}`
}

// 95 eggs → "3 tray + 5"  (தமிழ்: "3 தட்டு + 5 முட்டை")
export function eggsText(eggs, lang) {
  const n = Math.round(eggs || 0)
  const trays = Math.floor(n / TRAY)
  const rest = n % TRAY
  if (lang === 'ta') {
    if (!trays) return `${rest} முட்டை`
    return rest ? `${trays} தட்டு + ${rest} முட்டை` : `${trays} தட்டு`
  }
  if (!trays) return `${rest} egg${rest === 1 ? '' : 's'}`
  return rest ? `${trays} tray + ${rest}` : `${trays} tray${trays === 1 ? '' : 's'}`
}

export const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const sameDay = (a, b) => startOfDay(new Date(a)).getTime() === startOfDay(new Date(b)).getTime()
export const daysAgo = (ts) => Math.max(0, Math.round((startOfDay().getTime() - startOfDay(new Date(ts)).getTime()) / 86400000))

const loc = (lang) => (lang === 'ta' ? 'ta-IN' : 'en-IN')
export const fmtDate = (ts, lang) => new Date(ts).toLocaleDateString(loc(lang), { day: 'numeric', month: 'short', year: 'numeric' })
export const fmtShort = (ts, lang) => new Date(ts).toLocaleDateString(loc(lang), { day: 'numeric', month: 'short' })
export const fmtTime = (ts, lang) => new Date(ts).toLocaleTimeString(loc(lang), { hour: 'numeric', minute: '2-digit' })
export const toInputDate = (ts = Date.now()) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const fromInputDate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  const now = new Date()
  return new Date(y, m - 1, d, now.getHours(), now.getMinutes()).getTime()
}

// WhatsApp link with a ready message (works with Indian 10-digit numbers).
export function waLink(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '')
  const full = digits.length === 10 ? `91${digits}` : digits
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`
}

// Period ranges for reports.
export function periodRange(kind, ref = new Date()) {
  const today = startOfDay(ref)
  if (kind === 'today') return { start: today, end: addDays(today, 1) }
  if (kind === 'week') return { start: addDays(today, -6), end: addDays(today, 1) }
  if (kind === 'all') return { start: new Date(2000, 0, 1), end: addDays(today, 1) } // since the shop started
  if (kind === 'month') return { start: new Date(ref.getFullYear(), ref.getMonth(), 1), end: new Date(ref.getFullYear(), ref.getMonth() + 1, 1) }
  return { start: new Date(ref.getFullYear(), 0, 1), end: new Date(ref.getFullYear() + 1, 0, 1) }
}
export const inRange = (ts, r) => ts >= r.start.getTime() && ts < r.end.getTime()

// CSV for Excel (UTF-8 with BOM so Tamil opens correctly).
export function downloadCsv(name, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 3000)
}
