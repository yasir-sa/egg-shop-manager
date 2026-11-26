import { useMemo, useState } from 'react'
import { useShop } from '../lib/store'
import { TRAY, eggsText, fmtDate, fmtShort, fmtTime, money, toInputDate, fromInputDate, addDays, waLink } from '../lib/format'
import { Avatar, CountUp, EggDot, Empty, Icon, PageHead, Stepper } from '../components/ui'
import { statusLabel, statusTone } from './Orders'

// Order form — used by customers (for themselves) and by owner/staff (phone orders).
export function OrderForm({ onDone }) {
  const { tr, lang, data, me, rateFor, placeOrder, toast } = useShop()
  const self = me.role === 'customer'
  const [customerId, setCustomerId] = useState(self ? me.id : '')
  const customer = data.customers.find((c) => c.id === customerId)
  const [qty, setQty] = useState({}) // productId -> eggs
  const [mode, setMode] = useState('delivery')
  const [date, setDate] = useState(toInputDate(addDays(new Date(), 1)))
  const [note, setNote] = useState('')
  const products = data.products.filter((p) => p.active)
  const total = products.reduce((n, p) => n + (qty[p.id] || 0) * rateFor(p, customer), 0)
  const eggs = Object.values(qty).reduce((n, v) => n + v, 0)

  const submit = async () => {
    if (!customerId || !eggs) return
    const o = await placeOrder({ customerId, items: products.map((p) => ({ productId: p.id, eggs: qty[p.id] || 0 })), wantDate: fromInputDate(date), mode, note })
    toast(tr(`ஆர்டர் #${o.no} அனுப்பப்பட்டது!`, `Order #${o.no} sent!`))
    setQty({}); setNote('')
    onDone?.(o)
  }

  return (
    <div className="order-form">
      {!self && (
        <label className="field">
          <span>{tr('வாடிக்கையாளர்', 'Customer')}</span>
          <select className="input-big" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">{tr('தேர்வு செய்யவும்', 'Choose')}</option>
            {data.customers.filter((c) => c.active !== false).map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </label>
      )}
      <p className="label">{tr('எவ்வளவு வேண்டும்?', 'How many?')}</p>
      <div className="order-products">
        {products.map((p) => (
          <div key={p.id} className={`oprod${qty[p.id] ? ' on' : ''}`}>
            <EggDot tone={p.tone} size={38} />
            <div className="grow">
              <b>{tr(p.ta, p.en)}</b>
              <small>{money(rateFor(p, customer))} / {tr('முட்டை', 'egg')} · {qty[p.id] ? eggsText(qty[p.id], lang) : tr('தட்டு = 30 முட்டை', '1 tray = 30 eggs')}</small>
            </div>
            <div className="oprod__btns">
              <button type="button" onClick={() => setQty((q) => ({ ...q, [p.id]: Math.max(0, (q[p.id] || 0) - TRAY) }))}>−{tr('தட்டு', 'tray')}</button>
              <button type="button" className="on" onClick={() => setQty((q) => ({ ...q, [p.id]: (q[p.id] || 0) + TRAY }))}>+{tr('தட்டு', 'tray')}</button>
            </div>
            <Stepper value={qty[p.id] || 0} onChange={(v) => setQty((q) => ({ ...q, [p.id]: v }))} />
          </div>
        ))}
      </div>
      <div className="two">
        <label className="field"><span>{tr('எந்த நாள்?', 'Which day?')}</span><input type="date" className="input-big" value={date} min={toInputDate()} onChange={(e) => setDate(e.target.value)} /></label>
        <div className="field">
          <span>{tr('எப்படி?', 'How?')}</span>
          <div className="pay-modes pay-modes--2">
            <button type="button" className={mode === 'delivery' ? 'on' : ''} onClick={() => setMode('delivery')}><Icon name="truck" /> {tr('டெலிவரி', 'Delivery')}</button>
            <button type="button" className={mode === 'pickup' ? 'on' : ''} onClick={() => setMode('pickup')}><Icon name="store" /> {tr('நான் வருகிறேன்', 'I will pick up')}</button>
          </div>
        </div>
      </div>
      <label className="field"><span>{tr('குறிப்பு (விருப்பம்)', 'Note (optional)')}</span><input className="input-big" value={note} onChange={(e) => setNote(e.target.value)} placeholder={tr('உதா: காலை 7 மணிக்குள்', 'e.g. before 7 am')} /></label>
      <div className="total"><span>{eggsText(eggs, lang)}</span><strong>{money(total)}</strong></div>
      <button type="button" className="btn btn-primary btn-lg btn-block" disabled={!customerId || !eggs} onClick={submit}><Icon name="check" /> {tr('ஆர்டர் அனுப்பு', 'Send order')}</button>
    </div>
  )
}

export function CustomerHome({ goTo }) {
  const { tr, lang, data, me, settings } = useShop()
  const c = data.customers.find((x) => x.id === me.id)
  const orders = data.orders.filter((o) => o.customerId === me.id).sort((a, b) => b.createdAt - a.createdAt)
  const lastBill = data.bills.filter((b) => b.customerId === me.id).sort((a, b) => b.date - a.date)[0]
  return (
    <section className="page">
      <div className="hero hero--cust">
        <Avatar name={c.name} size={56} />
        <div className="grow">
          <p className="hero__greet">{tr('வணக்கம்', 'Hello')} 🙏</p>
          <h1>{c.name}</h1>
          <p className="hero__date">{c.code} · {c.type === 'wholesale' ? tr('மொத்த வாடிக்கையாளர்', 'Wholesale customer') : tr('சில்லறை வாடிக்கையாளர்', 'Retail customer')}</p>
        </div>
      </div>

      <div className={`balance-card ${c.balance > 0 ? 'due' : 'clear'}`}>
        <small>{c.balance > 0 ? tr('நீங்கள் கொடுக்க வேண்டியது', 'You owe') : tr('நிலுவை இல்லை', 'No balance due')}</small>
        <strong><CountUp value={Math.max(0, c.balance)} /></strong>
        <div className="balance-card__foot">
          <span><Icon name="tray" size={18} /> {tr('உங்களிடம் உள்ள தட்டு', 'Trays with you')}: <b>{c.trays}</b></span>
          {lastBill && <span>{tr('கடைசி பில்', 'Last bill')}: {fmtShort(lastBill.date, lang)} · {money(lastBill.total)}</span>}
        </div>
        {c.balance > 0 && settings.upiQr && <img className="upi-qr upi-qr--sm" src={settings.upiQr} alt="UPI QR" />}
        {c.balance > 0 && settings.upiId && <p className="upi-id">UPI: <b>{settings.upiId}</b></p>}
      </div>

      <button type="button" className="big-action" onClick={() => goTo('corder')}>
        <span className="big-action__icon"><Icon name="plus" size={30} /></span>
        <span className="grow"><b>{tr('முட்டை ஆர்டர் செய்யுங்கள்', 'Order eggs')}</b><small>{tr('டெலிவரி அல்லது கடையில் வாங்கலாம்', 'Delivery or pickup')}</small></span>
        <Icon name="right" />
      </button>

      <div className="card">
        <h2 className="card__title"><Icon name="orders" /> {tr('என் ஆர்டர்கள்', 'My orders')}</h2>
        {orders.length === 0 ? <p className="muted">{tr('இன்னும் ஆர்டர் இல்லை', 'No orders yet')}</p> : (
          <ul className="mini-list">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id}>
                <span className="grow"><b>#{o.no} · {eggsText(o.items.reduce((n, i) => n + i.eggs, 0), lang)}</b><small>{fmtShort(o.createdAt, lang)} {fmtTime(o.createdAt, lang)} · {o.mode === 'delivery' ? tr('டெலிவரி', 'Delivery') : tr('கடையில்', 'Pickup')}</small></span>
                <span className={`badge badge--${statusTone(o.status)}`}>{statusLabel(o.status, tr)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card shop-card">
        <img src="./icon.svg" alt="" />
        <div className="grow"><b>{tr(settings.shopTa, settings.shopEn)}</b><small>{tr(settings.addressTa, settings.addressEn)}</small></div>
        <a className="icon-btn" href={`tel:${settings.phone.replace(/\s/g, '')}`} aria-label="Call"><Icon name="phone" /></a>
        <a className="icon-btn icon-btn--wa" href={waLink(settings.phone, tr('வணக்கம், ', 'Hello, '))} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icon name="whatsapp" /></a>
      </div>
    </section>
  )
}

export function CustomerOrder({ goTo }) {
  const { tr } = useShop()
  return (
    <section className="page">
      <PageHead icon="plus" title={tr('ஆர்டர் செய்யுங்கள்', 'Place an order')} sub={tr('கடைக்கு உடனே தெரியும்', 'The shop sees it instantly')} />
      <div className="card"><OrderForm onDone={() => goTo('chome')} /></div>
    </section>
  )
}

// Statement: bills (+) and payments (−) with a running balance.
export function CustomerHistory() {
  const { tr, lang, data, me } = useShop()
  const c = data.customers.find((x) => x.id === me.id)
  const rows = useMemo(() => [
    ...data.bills.filter((b) => b.customerId === me.id).map((b) => ({ id: b.id, date: b.date, kind: 'bill', b })),
    ...data.payments.filter((p) => p.customerId === me.id).map((p) => ({ id: p.id, date: p.date, kind: 'pay', p })),
  ].sort((a, b) => b.date - a.date), [data.bills, data.payments, me.id])
  return (
    <section className="page">
      <PageHead icon="bill" title={tr('என் கணக்கு', 'My account')} sub={`${tr('நிலுவை', 'Balance')}: ${money(Math.max(0, c.balance))}`} />
      {rows.length === 0 ? <Empty icon="bill" text={tr('இன்னும் பில் இல்லை', 'No bills yet')} /> : (
        <ul className="ledger card">
          {rows.slice(0, 80).map((r) => r.kind === 'bill' ? (
            <li key={r.id}>
              <span className="ledger__icon bill"><Icon name="bill" size={20} /></span>
              <span className="grow"><b>{tr('பில்', 'Bill')} #{r.b.no}</b><small>{fmtDate(r.date, lang)} · {r.b.lines.map((l) => `${tr(l.ta, l.en)} ${eggsText(l.eggs, lang)}`).join(', ')}</small></span>
              <span className="ledger__amt"><b>{money(r.b.total)}</b>{r.b.credit > 0 && <small className="violet">{tr('கடன்', 'credit')} {money(r.b.credit)}</small>}</span>
            </li>
          ) : (
            <li key={r.id}>
              <span className="ledger__icon pay"><Icon name="check" size={20} /></span>
              <span className="grow"><b>{tr('பணம் கட்டியது', 'Payment')}</b><small>{fmtDate(r.date, lang)} · {r.p.mode === 'upi' ? 'UPI' : tr('ரொக்கம்', 'Cash')}</small></span>
              <span className="ledger__amt green"><b>−{money(r.p.amount)}</b></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
