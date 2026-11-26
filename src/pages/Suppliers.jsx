import { useState } from 'react'
import { useShop } from '../lib/store'
import { fmtShort, money, waLink } from '../lib/format'
import { Avatar, Empty, Icon, Modal, PageHead } from '../components/ui'

function SupplierForm({ s, onClose }) {
  const { tr, saveSupplier, toast } = useShop()
  const [f, setF] = useState(s ?? { name: '', phone: '', place: '' })
  const save = async (e) => {
    e.preventDefault()
    if (!f.name.trim()) return toast(tr('பெயர் போடவும்', 'Enter a name'), 'error')
    await saveSupplier({ ...f, name: f.name.trim() })
    toast(tr('சேமிக்கப்பட்டது', 'Saved'))
    onClose()
  }
  return (
    <Modal title={s ? tr('சப்ளையர் மாற்று', 'Edit supplier') : tr('புதிய சப்ளையர்', 'New supplier')} icon="factory" onClose={onClose}>
      <form className="form" onSubmit={save}>
        <label className="field"><span>{tr('பெயர் / பண்ணை', 'Name / farm')}</span><input className="input-big" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></label>
        <label className="field"><span>Phone</span><input className="input-big" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
        <label className="field"><span>{tr('ஊர்', 'Place')}</span><input className="input-big" value={f.place || ''} onChange={(e) => setF({ ...f, place: e.target.value })} placeholder="Namakkal" /></label>
        <div className="actions"><button type="button" className="btn btn-ghost" onClick={onClose}>{tr('ரத்து', 'Cancel')}</button><button type="submit" className="btn btn-primary"><Icon name="check" /> {tr('சேமி', 'Save')}</button></div>
      </form>
    </Modal>
  )
}

function PaySheet({ s, due, onClose }) {
  const { tr, paySupplier, toast } = useShop()
  const [amount, setAmount] = useState(due > 0 ? String(due) : '')
  const [note, setNote] = useState('')
  const save = async () => {
    const a = Number(amount)
    if (!(a > 0)) return
    await paySupplier({ supplierId: s.id, amount: a, note })
    toast(tr(`${s.name}-க்கு ${money(a)} கொடுத்தது`, `Paid ${money(a)} to ${s.name}`))
    onClose()
  }
  return (
    <Modal title={tr('சப்ளையருக்கு பணம் கொடு', 'Pay supplier')} icon="cash" onClose={onClose}>
      <div className="collect-head"><Avatar name={s.name} tone={3} /><div className="grow"><b>{s.name}</b><small>{tr('பாக்கி', 'Due')} {money(due)}</small></div></div>
      <label className="field"><span>{tr('தொகை ₹', 'Amount ₹')}</span><input className="input-big input-money" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
      <label className="field"><span>{tr('குறிப்பு', 'Note')}</span><input className="input-big" value={note} onChange={(e) => setNote(e.target.value)} placeholder={tr('உதா: GPay', 'e.g. GPay')} /></label>
      <button type="button" className="btn btn-primary btn-lg btn-block" onClick={save}><Icon name="check" /> {tr('பதிவு செய்', 'Save')}</button>
    </Modal>
  )
}

export default function Suppliers() {
  const { tr, lang, data, supplierDue } = useShop()
  const [editing, setEditing] = useState(undefined)
  const [paying, setPaying] = useState(null)
  const [open, setOpen] = useState(null)
  const totalDue = data.suppliers.reduce((n, s) => n + Math.max(0, supplierDue(s.id)), 0)

  const history = (s) => [
    ...data.lots.filter((l) => l.supplierId === s.id).map((l) => ({ id: l.id, date: l.date, kind: 'buy', amount: l.eggs * l.costPerEgg, eggs: l.eggs, paid: l.paid })),
    ...data.supplierPays.filter((p) => p.supplierId === s.id).map((p) => ({ id: p.id, date: p.date, kind: 'pay', amount: p.amount, note: p.note })),
  ].sort((a, b) => b.date - a.date)

  return (
    <section className="page">
      <PageHead icon="factory" title={tr('சப்ளையர்கள்', 'Suppliers')} sub={tr('முட்டை வாங்கும் இடம்', 'Where you buy eggs')}
        action={<button type="button" className="btn btn-primary" onClick={() => setEditing(null)}><Icon name="plus" /> {tr('புதியவர்', 'Add')}</button>} />
      <div className="total-banner total-banner--violet">
        <small>{tr('சப்ளையருக்கு கொடுக்க வேண்டியது', 'You owe suppliers')}</small>
        <strong>{money(totalDue)}</strong>
        <span>{data.suppliers.length} {tr('சப்ளையர்', 'suppliers')}</span>
      </div>
      {data.suppliers.length === 0 ? <Empty icon="factory" text={tr('சப்ளையர் இல்லை', 'No suppliers')} /> : (
        <div className="supplier-cards">
          {data.suppliers.map((s, i) => {
            const due = supplierDue(s.id)
            const bought = data.lots.filter((l) => l.supplierId === s.id)
            return (
              <div key={s.id} className="card supplier" style={{ animationDelay: `${i * 50}ms` }}>
                <button type="button" className="supplier__head" onClick={() => setOpen(open === s.id ? null : s.id)}>
                  <Avatar name={s.name} tone={i + 3} />
                  <span className="grow"><b>{s.name}</b><small>{s.place || '—'} · {bought.length} {tr('கொள்முதல்', 'purchases')}</small></span>
                  <span className={`due-pill${due > 0 ? '' : ' clear'}`}>{due > 0 ? money(due) : tr('பாக்கி இல்லை', 'Clear')}</span>
                </button>
                <div className="actions actions--wrap">
                  {s.phone && <a className="btn btn-sm btn-ghost" href={`tel:${s.phone}`}><Icon name="phone" size={18} /> {tr('அழை', 'Call')}</a>}
                  {s.phone && <a className="btn btn-sm btn-wa" href={waLink(s.phone, tr('வணக்கம், ', 'Hello, '))} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18} /></a>}
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditing(s)}><Icon name="edit" size={18} /></button>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => setPaying({ s, due })}><Icon name="cash" size={18} /> {tr('பணம் கொடு', 'Pay')}</button>
                </div>
                {open === s.id && (
                  <ul className="ledger">
                    {history(s).slice(0, 20).map((r) => (
                      <li key={r.id}>
                        <span className={`ledger__icon ${r.kind === 'buy' ? 'bill' : 'pay'}`}><Icon name={r.kind === 'buy' ? 'egg' : 'check'} size={18} /></span>
                        <span className="grow"><b>{r.kind === 'buy' ? `${tr('வாங்கியது', 'Bought')} ${r.eggs} ${tr('முட்டை', 'eggs')}` : tr('பணம் கொடுத்தது', 'Paid')}</b><small>{fmtShort(r.date, lang)}{r.paid ? ` · ${tr('அப்போதே', 'paid then')} ${money(r.paid)}` : ''}{r.note ? ` · ${r.note}` : ''}</small></span>
                        <span className={`ledger__amt ${r.kind === 'pay' ? 'green' : ''}`}><b>{r.kind === 'pay' ? '−' : ''}{money(r.amount)}</b></span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
      {editing !== undefined && <SupplierForm s={editing} onClose={() => setEditing(undefined)} />}
      {paying && <PaySheet s={paying.s} due={paying.due} onClose={() => setPaying(null)} />}
    </section>
  )
}
