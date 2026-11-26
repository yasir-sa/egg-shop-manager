import { useState } from 'react'
import { useShop } from '../lib/store'
import { fmtShort, money, waLink } from '../lib/format'
import { Avatar, Confirm, Empty, Icon, Modal, PageHead, SearchBox, Seg } from '../components/ui'

export const loginMessage = (c, settings, lang) => (lang === 'ta'
  ? `வணக்கம் ${c.name} 🙏\n${settings.shopTa} app-ல் நீங்கள் முட்டை ஆர்டர் செய்யலாம், உங்கள் கணக்கைப் பார்க்கலாம்.\n\nஉங்கள் ID: *${c.code}*\nPIN: *${c.pin}*\n\nApp link: ${location.origin}${location.pathname}`
  : `Hello ${c.name} 🙏\nYou can now order eggs and see your account in the ${settings.shopEn} app.\n\nYour ID: *${c.code}*\nPIN: *${c.pin}*\n\nApp link: ${location.origin}${location.pathname}`)

function CustomerForm({ customer, onClose }) {
  const { tr, saveCustomer, toast } = useShop()
  const [f, setF] = useState(customer ?? { name: '', phone: '', area: '', type: 'retail', rateOff: 0 })
  const set = (p) => setF((x) => ({ ...x, ...p }))
  const submit = async (e) => {
    e.preventDefault()
    if (!f.name.trim()) return toast(tr('பெயர் போடவும்', 'Enter a name'), 'error')
    const saved = await saveCustomer({ ...f, name: f.name.trim(), rateOff: Number(f.rateOff) || 0 })
    toast(customer ? tr('சேமிக்கப்பட்டது', 'Saved') : tr(`புதிய வாடிக்கையாளர் ${saved.code}`, `New customer ${saved.code}`))
    onClose(saved)
  }
  return (
    <Modal title={customer ? tr('வாடிக்கையாளர் மாற்று', 'Edit customer') : tr('புதிய வாடிக்கையாளர்', 'New customer')} icon="users" onClose={() => onClose()}>
      <form className="form" onSubmit={submit}>
        <label className="field"><span>{tr('பெயர் / கடைப் பெயர்', 'Name / shop name')}</span><input className="input-big" value={f.name} onChange={(e) => set({ name: e.target.value })} autoFocus /></label>
        <label className="field"><span>{tr('Phone (WhatsApp)', 'Phone (WhatsApp)')}</span><input className="input-big" inputMode="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="98xxxxxxxx" /></label>
        <label className="field"><span>{tr('பகுதி / ஏரியா', 'Area')}</span><input className="input-big" value={f.area} onChange={(e) => set({ area: e.target.value })} placeholder="Velachery" /></label>
        <div className="field">
          <span>{tr('வகை', 'Type')}</span>
          <Seg full value={f.type} onChange={(type) => set({ type })} options={[
            { value: 'retail', label: tr('சில்லறை', 'Retail'), icon: 'user' },
            { value: 'wholesale', label: tr('மொத்தம் (ஹோட்டல் / கடை)', 'Wholesale (hotel / shop)'), icon: 'store' },
          ]} />
        </div>
        <label className="field"><span>{tr('சிறப்பு தள்ளுபடி – ஒரு முட்டைக்கு ₹ (விருப்பம்)', 'Special discount per egg ₹ (optional)')}</span>
          <input className="input-big" type="number" inputMode="decimal" step="0.05" value={f.rateOff || ''} onChange={(e) => set({ rateOff: e.target.value })} placeholder="0" />
        </label>
        <div className="actions"><button type="button" className="btn btn-ghost" onClick={() => onClose()}>{tr('ரத்து', 'Cancel')}</button><button type="submit" className="btn btn-primary"><Icon name="check" /> {tr('சேமி', 'Save')}</button></div>
      </form>
    </Modal>
  )
}

function CustomerSheet({ c, onClose, onEdit }) {
  const { tr, lang, data, settings, saveCustomer, toast } = useShop()
  const [confirm, setConfirm] = useState(null)
  const bills = data.bills.filter((b) => b.customerId === c.id)
  const last = bills.sort((a, b) => b.date - a.date)[0]
  const spent = bills.reduce((n, b) => n + b.total, 0)
  return (
    <Modal title={c.name} icon="user" onClose={onClose}>
      <div className="cust-stats">
        <div className={c.balance > 0 ? 'due' : ''}><small>{tr('நிலுவை', 'Balance')}</small><b>{money(Math.max(0, c.balance))}</b></div>
        <div><small>{tr('தட்டு', 'Trays')}</small><b>{c.trays}</b></div>
        <div><small>{tr('மொத்த வாங்கியது', 'Total bought')}</small><b>{money(spent)}</b></div>
      </div>
      <ul className="info-list">
        <li><Icon name="user" size={18} /> {c.code} · {c.type === 'wholesale' ? tr('மொத்தம்', 'Wholesale') : tr('சில்லறை', 'Retail')}{c.rateOff ? ` · −₹${c.rateOff}/${tr('முட்டை', 'egg')}` : ''}</li>
        <li><Icon name="phone" size={18} /> {c.phone || '—'}</li>
        <li><Icon name="pin" size={18} /> {c.area || '—'}</li>
        <li><Icon name="calendar" size={18} /> {tr('கடைசி பில்', 'Last bill')}: {last ? fmtShort(last.date, lang) : '—'}</li>
      </ul>
      <div className="login-box">
        <div><small>{tr('App login', 'App login')}</small><b>ID {c.code} · PIN {c.pin}</b></div>
        {c.phone && <a className="btn btn-sm btn-wa" href={waLink(c.phone, loginMessage(c, settings, lang))} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18} /> {tr('அனுப்பு', 'Send')}</a>}
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirm('pin')}>{tr('புதிய PIN', 'New PIN')}</button>
      </div>
      <div className="actions actions--wrap">
        {c.phone && <a className="btn btn-ghost" href={`tel:${c.phone}`}><Icon name="phone" /> {tr('அழை', 'Call')}</a>}
        <button type="button" className="btn btn-ghost" onClick={onEdit}><Icon name="edit" /> {tr('மாற்று', 'Edit')}</button>
        <button type="button" className="btn btn-ghost-danger" onClick={() => setConfirm('off')}><Icon name="trash" /> {c.active === false ? tr('மீண்டும் இயக்கு', 'Enable') : tr('நிறுத்து', 'Disable')}</button>
      </div>
      {confirm && (
        <Confirm needPin danger={confirm === 'off'} text={confirm === 'pin' ? tr('புதிய PIN உருவாக்கவா? பழைய PIN வேலை செய்யாது.', 'Make a new PIN? The old one stops working.') : tr('இந்த வாடிக்கையாளரின் login நிறுத்தப்படும். கணக்கு அப்படியே இருக்கும்.', "This customer's login will be disabled. Their account stays.")}
          onNo={() => setConfirm(null)}
          onYes={async () => {
            if (confirm === 'pin') await saveCustomer({ ...c, pin: String(Math.floor(1000 + Math.random() * 9000)) })
            else await saveCustomer({ ...c, active: c.active === false })
            toast(tr('சேமிக்கப்பட்டது', 'Saved'))
            setConfirm(null); onClose()
          }} />
      )}
    </Modal>
  )
}

export default function Customers() {
  const { tr, data } = useShop()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(undefined)
  const [open, setOpen] = useState(null)
  const list = data.customers
    .filter((c) => filter === 'all' || (filter === 'due' ? c.balance > 0 : c.type === filter))
    .filter((c) => !q || `${c.name} ${c.code} ${c.phone} ${c.area}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.active === false) - (b.active === false) || a.code.localeCompare(b.code))
  return (
    <section className="page">
      <PageHead icon="users" title={tr('வாடிக்கையாளர்கள்', 'Customers')} sub={`${data.customers.length} ${tr('பேர்', 'people')}`}
        action={<button type="button" className="btn btn-primary" onClick={() => setEditing(null)}><Icon name="plus" /> {tr('புதியவர்', 'Add')}</button>} />
      <SearchBox value={q} onChange={setQ} placeholder={tr('பெயர் / ID / phone / ஏரியா', 'Name / ID / phone / area')} />
      <Seg value={filter} onChange={setFilter} options={[
        { value: 'all', label: tr('எல்லாம்', 'All') }, { value: 'wholesale', label: tr('மொத்தம்', 'Wholesale') },
        { value: 'retail', label: tr('சில்லறை', 'Retail') }, { value: 'due', label: tr('கடன் உள்ளவர்', 'With credit') },
      ]} />
      {list.length === 0 ? <Empty icon="users" text={tr('யாரும் இல்லை', 'Nobody here')} /> : (
        <ul className="people people--cards">
          {list.map((c, i) => (
            <li key={c.id} className={c.active === false ? 'off' : ''} style={{ animationDelay: `${Math.min(i, 15) * 30}ms` }}>
              <button type="button" onClick={() => setOpen(c)}>
                <Avatar name={c.name} tone={i} />
                <span className="grow"><b>{c.name}</b><small>{c.code} · {c.area || '—'}{c.trays ? ` · ${c.trays} ${tr('தட்டு', 'trays')}` : ''}</small></span>
                <span className={`badge ${c.type === 'wholesale' ? 'badge--violet' : 'badge--green'}`}>{c.type === 'wholesale' ? tr('மொத்தம்', 'Wholesale') : tr('சில்லறை', 'Retail')}</span>
                {c.balance > 0 && <span className="due">{money(c.balance)}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {editing !== undefined && <CustomerForm customer={editing} onClose={(saved) => { setEditing(undefined); if (saved && !editing) setOpen(saved) }} />}
      {open && <CustomerSheet c={data.customers.find((x) => x.id === open.id) ?? open} onClose={() => setOpen(null)} onEdit={() => { setEditing(open); setOpen(null) }} />}
    </section>
  )
}
