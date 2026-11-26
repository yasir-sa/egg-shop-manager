import { useMemo, useState } from 'react'
import { useShop } from '../lib/store'
import { TRAY, eggsText, fmtDate, fmtTime, money, round2, waLink } from '../lib/format'
import { Avatar, EggDot, Icon, Modal, PageHead, SearchBox, Stepper } from '../components/ui'

const QUICK = [1, 6, 10, 12, TRAY]

// Bill text for WhatsApp.
export function billText(bill, customer, settings, lang) {
  const ta = lang === 'ta'
  const lines = bill.lines.map((l) => `• ${ta ? l.ta : l.en}: ${eggsText(l.eggs, lang)} × ₹${l.rate} = ₹${l.amount}`).join('\n')
  return [
    `*${ta ? settings.shopTa : settings.shopEn}*`,
    `${ta ? 'பில்' : 'Bill'} #${bill.no} • ${fmtDate(bill.date, lang)} ${fmtTime(bill.date, lang)}`,
    customer ? `${ta ? 'வாடிக்கையாளர்' : 'Customer'}: ${customer.name} (${customer.code})` : '',
    '', lines, '',
    bill.discount ? `${ta ? 'தள்ளுபடி' : 'Discount'}: −₹${bill.discount}` : '',
    `*${ta ? 'மொத்தம்' : 'Total'}: ₹${bill.total}*`,
    bill.credit ? `${ta ? 'கடனில்' : 'On credit'}: ₹${bill.credit}` : '',
    customer && customer.balance > 0 ? `${ta ? 'மொத்த நிலுவை' : 'Total balance due'}: ₹${customer.balance}` : '',
    '', ta ? 'நன்றி! மீண்டும் வருக 🙏' : 'Thank you! 🙏',
  ].filter((x) => x !== '').join('\n')
}

function CustomerPicker({ onPick, onClose }) {
  const { tr, data } = useShop()
  const [q, setQ] = useState('')
  const list = data.customers.filter((c) => c.active !== false)
    .filter((c) => !q || `${c.name} ${c.code} ${c.phone} ${c.area}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <Modal title={tr('வாடிக்கையாளர் தேர்வு', 'Choose customer')} icon="users" onClose={onClose}>
      <button type="button" className="pick-walkin" onClick={() => onPick(null)}>
        <span className="avatar avatar--4"><Icon name="store" /></span>
        <span className="grow"><b>{tr('நேரடி வாடிக்கையாளர்', 'Walk-in customer')}</b><small>{tr('பெயர் தேவையில்லை – சில்லறை விலை', 'No name needed – retail price')}</small></span>
        <Icon name="right" />
      </button>
      <SearchBox value={q} onChange={setQ} placeholder={tr('பெயர் / ID / phone தேடு', 'Search name / ID / phone')} />
      <ul className="people">
        {list.map((c, i) => (
          <li key={c.id}>
            <button type="button" onClick={() => onPick(c)}>
              <Avatar name={c.name} tone={i} />
              <span className="grow"><b>{c.name}</b><small>{c.code} · {c.area}</small></span>
              <span className={`badge ${c.type === 'wholesale' ? 'badge--violet' : 'badge--green'}`}>{c.type === 'wholesale' ? tr('மொத்தம்', 'Wholesale') : tr('சில்லறை', 'Retail')}</span>
              {c.balance > 0 && <span className="due">{money(c.balance)}</span>}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

export default function Billing() {
  const { tr, lang, data, settings, me, rateFor, stockOf, createBill, toast } = useShop()
  const owner = me.role === 'owner'
  const [customer, setCustomer] = useState(null)
  const [picking, setPicking] = useState(false)
  const [lines, setLines] = useState([]) // { productId, eggs, rate }
  const [discount, setDiscount] = useState(0)
  const [payMode, setPayMode] = useState('cash')
  const [paidNow, setPaidNow] = useState('')
  const [trays, setTrays] = useState(null) // null = auto (full trays)
  const [done, setDone] = useState(null)
  const products = data.products.filter((p) => p.active)

  const total = round2(Math.max(0, lines.reduce((n, l) => n + l.eggs * l.rate, 0) - discount))
  const eggs = lines.reduce((n, l) => n + l.eggs, 0)
  const autoTrays = customer ? Math.floor(eggs / TRAY) : 0
  const traysGiven = trays ?? autoTrays

  const add = (p, n) => setLines((ls) => {
    const i = ls.findIndex((l) => l.productId === p.id)
    if (i < 0) return [...ls, { productId: p.id, eggs: n, rate: rateFor(p, customer) }]
    return ls.map((l, j) => (j === i ? { ...l, eggs: l.eggs + n } : l))
  })
  const setLine = (id, patch) => setLines((ls) => ls.map((l) => (l.productId === id ? { ...l, ...patch } : l)).filter((l) => l.eggs > 0))
  const pickCustomer = (c) => {
    setCustomer(c)
    setPicking(false)
    setLines((ls) => ls.map((l) => ({ ...l, rate: rateFor(data.products.find((p) => p.id === l.productId), c) })))
    if (!c && (payMode === 'credit' || payMode === 'part')) setPayMode('cash')
  }
  const reset = () => { setLines([]); setDiscount(0); setPayMode('cash'); setPaidNow(''); setTrays(null); setCustomer(null); setDone(null) }

  const save = async () => {
    if (!lines.length) return
    const bill = await createBill({ customerId: customer?.id ?? null, walkName: customer ? '' : 'Walk-in', items: lines, discount, payMode, paidNow: Number(paidNow) || 0, traysGiven })
    toast(tr(`பில் #${bill.no} சேமிக்கப்பட்டது`, `Bill #${bill.no} saved`))
    setDone(bill)
  }

  if (done) {
    const c = data.customers.find((x) => x.id === done.customerId)
    return (
      <section className="page">
        <div className="success card">
          <svg className="tick" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-16" /></svg>
          <h2>{tr('பில் சேமிக்கப்பட்டது!', 'Bill saved!')}</h2>
          <p className="muted">#{done.no} · {c?.name ?? tr('நேரடி', 'Walk-in')}</p>
          <p className="success__amt">{money(done.total)}</p>
          {done.credit > 0 && <p className="badge badge--violet">{tr('கடனில்', 'On credit')} {money(done.credit)}</p>}
          <div className="receipt" id="print-receipt">
            <b>{tr(settings.shopTa, settings.shopEn)}</b>
            <small>{tr(settings.addressTa, settings.addressEn)} · {settings.phone}</small>
            <hr />
            {done.lines.map((l) => <div key={l.productId} className="receipt__row"><span>{tr(l.ta, l.en)} · {eggsText(l.eggs, lang)} × ₹{l.rate}</span><b>{money(l.amount)}</b></div>)}
            {done.discount > 0 && <div className="receipt__row"><span>{tr('தள்ளுபடி', 'Discount')}</span><b>−{money(done.discount)}</b></div>}
            <div className="receipt__row receipt__total"><span>{tr('மொத்தம்', 'Total')}</span><b>{money(done.total)}</b></div>
          </div>
          <div className="actions actions--wrap">
            {c?.phone && <a className="btn btn-wa" href={waLink(c.phone, billText(done, c, settings, lang))} target="_blank" rel="noreferrer"><Icon name="whatsapp" /> {tr('WhatsApp-ல் அனுப்பு', 'Send on WhatsApp')}</a>}
            <button type="button" className="btn btn-ghost" onClick={() => window.print()}><Icon name="print" /> {tr('அச்சிடு', 'Print')}</button>
            <button type="button" className="btn btn-primary btn-lg" onClick={reset}><Icon name="plus" /> {tr('அடுத்த பில்', 'Next bill')}</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <PageHead icon="bill" title={tr('புதிய பில்', 'New bill')} sub={tr('வாடிக்கையாளர் → முட்டை → பணம்', 'Customer → eggs → payment')} />

      <div className="bill-layout">
        <div>
          <button type="button" className="cust-pick" onClick={() => setPicking(true)}>
            {customer ? <Avatar name={customer.name} /> : <span className="avatar avatar--4"><Icon name="store" /></span>}
            <span className="grow">
              <small>{tr('வாடிக்கையாளர்', 'Customer')}</small>
              <b>{customer ? `${customer.name} (${customer.code})` : tr('நேரடி வாடிக்கையாளர்', 'Walk-in customer')}</b>
              {customer && <em>{customer.type === 'wholesale' ? tr('மொத்த விலை', 'Wholesale rate') : tr('சில்லறை விலை', 'Retail rate')}{customer.balance > 0 ? ` · ${tr('பழைய கடன்', 'Old credit')} ${money(customer.balance)}` : ''}</em>}
            </span>
            <span className="btn btn-sm btn-ghost">{tr('மாற்று', 'Change')}</span>
          </button>

          <h3 className="section-title">{tr('முட்டை வகை – தொட்டு சேர்க்கவும்', 'Egg type – tap to add')}</h3>
          <div className="products">
            {products.map((p, i) => {
              const line = lines.find((l) => l.productId === p.id)
              const left = stockOf(p.id)
              return (
                <div key={p.id} className={`product${line ? ' on' : ''}`} style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="product__top">
                    <EggDot tone={p.tone} size={40} />
                    <div className="grow"><b>{tr(p.ta, p.en)}</b><small>{money(rateFor(p, customer))} / {tr('முட்டை', 'egg')} · {tr('தட்டு', 'tray')} {money(rateFor(p, customer) * TRAY)}</small></div>
                    {line && <span className="product__count">{eggsText(line.eggs, lang)}</span>}
                  </div>
                  <div className="quick">
                    {QUICK.map((n) => (
                      <button key={n} type="button" onClick={() => add(p, n)}>+{n === TRAY ? tr('1 தட்டு', '1 tray') : n}</button>
                    ))}
                  </div>
                  <small className={`product__stock${left < 300 ? ' low' : ''}`}>{tr('இருப்பு', 'Stock')}: {eggsText(left, lang)}</small>
                </div>
              )
            })}
          </div>
        </div>

        <aside className="cart card">
          <h2 className="card__title"><Icon name="bill" /> {tr('பில்', 'Bill')}</h2>
          {lines.length === 0 ? <p className="muted center">{tr('முட்டை வகையைத் தொட்டு சேர்க்கவும்', 'Tap an egg type to add')}</p> : (
            <ul className="cart__lines">
              {lines.map((l) => {
                const p = data.products.find((x) => x.id === l.productId)
                return (
                  <li key={l.productId}>
                    <div className="cart__head">
                      <EggDot tone={p?.tone} size={26} />
                      <b className="grow">{tr(p?.ta, p?.en)}</b>
                      <button type="button" className="icon-btn icon-btn--sm" onClick={() => setLine(l.productId, { eggs: 0 })} aria-label="remove"><Icon name="trash" size={18} /></button>
                    </div>
                    <div className="cart__qty">
                      <Stepper value={l.eggs} onChange={(v) => setLine(l.productId, { eggs: v })} />
                      <span className="muted">{eggsText(l.eggs, lang)}</span>
                    </div>
                    <div className="cart__rate">
                      <span>{tr('விலை / முட்டை', 'Rate / egg')} ₹</span>
                      <input type="number" inputMode="decimal" step="0.1" value={l.rate} disabled={!owner} onChange={(e) => setLine(l.productId, { rate: Number(e.target.value) || 0 })} />
                      <b>{money(l.eggs * l.rate)}</b>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {lines.length > 0 && (
            <>
              {owner && (
                <label className="row-field">
                  <span><Icon name="minus" size={18} /> {tr('தள்ளுபடி ₹', 'Discount ₹')}</span>
                  <input type="number" inputMode="decimal" value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value) || 0)} placeholder="0" />
                </label>
              )}
              {customer && (
                <div className="row-field">
                  <span><Icon name="tray" size={18} /> {tr('கொடுத்த தட்டு', 'Trays given')}</span>
                  <Stepper value={traysGiven} onChange={setTrays} />
                </div>
              )}
              <div className="total"><span>{tr('மொத்தம்', 'Total')}</span><strong key={total} className="pop">{money(total)}</strong></div>

              <p className="label">{tr('பணம் எப்படி?', 'How is it paid?')}</p>
              <div className="pay-modes">
                {[['cash', 'cash', 'ரொக்கம்', 'Cash'], ['upi', 'qr', 'UPI', 'UPI'], ['credit', 'credit', 'கடன்', 'Credit'], ['part', 'wallet', 'பாதி பணம்', 'Part paid']].map(([id, icon, ta, en]) => (
                  <button key={id} type="button" disabled={!customer && (id === 'credit' || id === 'part')} className={payMode === id ? 'on' : ''} onClick={() => setPayMode(id)}>
                    <Icon name={icon} /> {tr(ta, en)}
                  </button>
                ))}
              </div>
              {!customer && <p className="hint">{tr('கடன் கொடுக்க வாடிக்கையாளரைத் தேர்ந்தெடுக்கவும்', 'Choose a customer to give credit')}</p>}
              {payMode === 'part' && (
                <label className="row-field">
                  <span>{tr('இப்போது வாங்கியது ₹', 'Paid now ₹')}</span>
                  <input type="number" inputMode="decimal" value={paidNow} onChange={(e) => setPaidNow(e.target.value)} placeholder="0" />
                </label>
              )}
              {payMode === 'upi' && settings.upiQr && <img className="upi-qr" src={settings.upiQr} alt="UPI QR" />}
              {(payMode === 'credit' || payMode === 'part') && customer && (
                <p className="hint hint--violet">{tr('கடனில் சேரும்', 'Goes to credit')}: <b>{money(payMode === 'credit' ? total : Math.max(0, total - (Number(paidNow) || 0)))}</b> · {tr('புதிய நிலுவை', 'New balance')} <b>{money(customer.balance + (payMode === 'credit' ? total : Math.max(0, total - (Number(paidNow) || 0))))}</b></p>
              )}
              <button type="button" className="btn btn-primary btn-lg btn-block" onClick={save}><Icon name="check" /> {tr('பில் சேமி', 'Save bill')} · {money(total)}</button>
            </>
          )}
        </aside>
      </div>

      {lines.length > 0 && (
        <div className="cartbar">
          <span><small>{eggsText(eggs, lang)}</small><b>{money(total)}</b></span>
          <button type="button" className="btn btn-gold" onClick={() => document.querySelector('.cart')?.scrollIntoView({ behavior: 'smooth' })}>{tr('பணம் →', 'Pay →')}</button>
        </div>
      )}
      {picking && <CustomerPicker onPick={pickCustomer} onClose={() => setPicking(false)} />}
    </section>
  )
}
