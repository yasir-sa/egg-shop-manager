import { useState } from 'react'
import { useShop } from '../lib/store'
import { daysAgo, fmtShort, fmtTime, money, waLink } from '../lib/format'
import { totalCredit } from '../lib/report'
import { Avatar, Confirm, CountUp, Empty, Icon, Modal, PageHead, SearchBox } from '../components/ui'

const reminder = (c, settings, lang) => (lang === 'ta'
  ? `வணக்கம் ${c.name} 🙏\n${settings.shopTa} – உங்கள் நிலுவைத் தொகை *₹${c.balance}*.\nவசதிப்படும்போது செலுத்தவும். நன்றி!`
  : `Hello ${c.name} 🙏\n${settings.shopEn} – your pending balance is *₹${c.balance}*.\nPlease pay when convenient. Thank you!`)

function CollectSheet({ c, onClose }) {
  const { tr, addPayment, toast } = useShop()
  const [amount, setAmount] = useState(String(c.balance))
  const [mode, setMode] = useState('cash')
  const save = async () => {
    const a = Number(amount)
    if (!(a > 0)) return
    await addPayment({ customerId: c.id, amount: a, mode })
    toast(tr(`${c.name}: ${money(a)} வசூல்`, `${c.name}: ${money(a)} collected`))
    onClose()
  }
  return (
    <Modal title={tr('பணம் வாங்கு', 'Collect payment')} icon="wallet" onClose={onClose}>
      <div className="collect-head"><Avatar name={c.name} /><div className="grow"><b>{c.name}</b><small>{tr('நிலுவை', 'Balance')} {money(c.balance)}</small></div></div>
      <div className="chips">
        {[c.balance, Math.round(c.balance / 2), 500, 1000].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((v) => (
          <button key={v} type="button" className={Number(amount) === v ? 'on' : ''} onClick={() => setAmount(String(v))}>{money(v)}{v === c.balance ? ` · ${tr('முழுசும்', 'full')}` : ''}</button>
        ))}
      </div>
      <label className="field"><span>{tr('தொகை ₹', 'Amount ₹')}</span><input className="input-big input-money" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
      <div className="pay-modes pay-modes--2">
        <button type="button" className={mode === 'cash' ? 'on' : ''} onClick={() => setMode('cash')}><Icon name="cash" /> {tr('ரொக்கம்', 'Cash')}</button>
        <button type="button" className={mode === 'upi' ? 'on' : ''} onClick={() => setMode('upi')}><Icon name="qr" /> UPI</button>
      </div>
      {Number(amount) > 0 && <p className="hint hint--green">{tr('மீதி நிலுவை', 'Remaining')}: <b>{money(c.balance - Number(amount))}</b></p>}
      <button type="button" className="btn btn-primary btn-lg btn-block" onClick={save}><Icon name="check" /> {tr('பதிவு செய்', 'Save')} · {money(Number(amount) || 0)}</button>
    </Modal>
  )
}

export default function Credit() {
  const { tr, lang, data, me, settings, deletePayment, toast } = useShop()
  const owner = me.role === 'owner'
  const [q, setQ] = useState('')
  const [collect, setCollect] = useState(null)
  const [removing, setRemoving] = useState(null)
  const due = data.customers.filter((c) => c.balance > 0)
    .filter((c) => !q || `${c.name} ${c.code} ${c.area}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.balance - a.balance)
  const lastPay = (id) => data.payments.filter((p) => p.customerId === id).sort((a, b) => b.date - a.date)[0]
  const oldestCredit = (id) => data.bills.filter((b) => b.customerId === id && b.credit > 0).sort((a, b) => a.date - b.date)[0]
  const recent = [...data.payments].sort((a, b) => b.date - a.date).slice(0, 15)

  return (
    <section className="page">
      <PageHead icon="wallet" title={tr('கடன் & வசூல்', 'Credit & collection')} sub={tr('யார் எவ்வளவு தர வேண்டும்', 'Who owes how much')} />
      <div className="total-banner">
        <small>{tr('மொத்தம் வர வேண்டியது', 'Total to collect')}</small>
        <strong><CountUp value={totalCredit(data.customers)} /></strong>
        <span>{due.length} {tr('வாடிக்கையாளர்கள்', 'customers')}</span>
      </div>
      <SearchBox value={q} onChange={setQ} placeholder={tr('பெயர் தேடு', 'Search name')} />
      {due.length === 0 ? <Empty icon="check" text={tr('யாரிடமும் கடன் இல்லை 🎉', 'Nobody owes money 🎉')} /> : (
        <ul className="credit-list">
          {due.map((c, i) => {
            const lp = lastPay(c.id)
            const old = oldestCredit(c.id)
            const age = old ? daysAgo(old.date) : 0
            return (
              <li key={c.id} style={{ animationDelay: `${Math.min(i, 15) * 30}ms` }}>
                <Avatar name={c.name} tone={i} />
                <div className="grow">
                  <b>{c.name}</b>
                  <small>{c.code} · {lp ? `${tr('கடைசி வசூல்', 'Last paid')} ${fmtShort(lp.date, lang)}` : tr('இன்னும் வசூல் இல்லை', 'No payment yet')}</small>
                  {age >= 15 && <span className="badge badge--rose">{age} {tr('நாள் பழைய கடன்', 'days old')}</span>}
                </div>
                <strong className="credit-amt">{money(c.balance)}</strong>
                <div className="credit-actions">
                  {c.phone && <a className="icon-btn icon-btn--wa" href={waLink(c.phone, reminder(c, settings, lang))} target="_blank" rel="noreferrer" aria-label="WhatsApp reminder" title={tr('WhatsApp நினைவூட்டல்', 'WhatsApp reminder')}><Icon name="whatsapp" size={20} /></a>}
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => setCollect(c)}><Icon name="cash" size={18} /> {tr('வசூல்', 'Collect')}</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="card">
        <h2 className="card__title"><Icon name="check" /> {tr('சமீபத்திய வசூல்', 'Recent payments')}</h2>
        {recent.length === 0 ? <p className="muted">—</p> : (
          <ul className="mini-list">
            {recent.map((p) => {
              const c = data.customers.find((x) => x.id === p.customerId)
              return (
                <li key={p.id}>
                  <span className="grow"><b>{c?.name}</b><small>{fmtShort(p.date, lang)} {fmtTime(p.date, lang)} · {p.mode === 'upi' ? 'UPI' : tr('ரொக்கம்', 'Cash')} · {p.by?.name}</small></span>
                  <b className="green">{money(p.amount)}</b>
                  {owner && <button type="button" className="icon-btn icon-btn--sm" onClick={() => setRemoving(p)} aria-label="Delete"><Icon name="trash" size={16} /></button>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {collect && <CollectSheet c={collect} onClose={() => setCollect(null)} />}
      {removing && <Confirm needPin text={tr(`இந்த வசூல் (${money(removing.amount)}) நீக்கவா? நிலுவை மீண்டும் கூடும்.`, `Delete this payment (${money(removing.amount)})? The balance goes back up.`)}
        onNo={() => setRemoving(null)} onYes={async () => { await deletePayment(removing); setRemoving(null); toast(tr('நீக்கப்பட்டது', 'Deleted')) }} />}
    </section>
  )
}
