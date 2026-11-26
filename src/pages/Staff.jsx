import { useState } from 'react'
import { useShop } from '../lib/store'
import { money, periodRange, inRange, waLink } from '../lib/format'
import { Avatar, Confirm, Empty, Icon, Modal, PageHead } from '../components/ui'

const loginMsg = (s, settings, lang) => (lang === 'ta'
  ? `வணக்கம் ${s.name} 🙏\n${settings.shopTa} app login:\nID: *${s.code}*\nPIN: *${s.pin}*\n\n${location.origin}${location.pathname}`
  : `Hello ${s.name} 🙏\n${settings.shopEn} app login:\nID: *${s.code}*\nPIN: *${s.pin}*\n\n${location.origin}${location.pathname}`)

function StaffForm({ s, onClose }) {
  const { tr, saveStaff, toast } = useShop()
  const [f, setF] = useState(s ?? { name: '', phone: '' })
  const save = async (e) => {
    e.preventDefault()
    if (!f.name.trim()) return toast(tr('பெயர் போடவும்', 'Enter a name'), 'error')
    const saved = await saveStaff({ ...f, name: f.name.trim() })
    toast(s ? tr('சேமிக்கப்பட்டது', 'Saved') : tr(`புதிய பணியாளர் ${saved.code} · PIN ${saved.pin}`, `New staff ${saved.code} · PIN ${saved.pin}`))
    onClose()
  }
  return (
    <Modal title={s ? tr('பணியாளர் மாற்று', 'Edit staff') : tr('புதிய பணியாளர்', 'New staff')} icon="staff" onClose={onClose}>
      <form className="form" onSubmit={save}>
        <label className="field"><span>{tr('பெயர்', 'Name')}</span><input className="input-big" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></label>
        <label className="field"><span>Phone (WhatsApp)</span><input className="input-big" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
        <p className="hint">{tr('ID, PIN தானாக உருவாகும். பணியாளர் பில் போடலாம், டெலிவரி, வசூல், தட்டு மட்டும் — லாபம், விலை மாற்ற முடியாது.', 'ID and PIN are created automatically. Staff can bill, deliver, collect and handle trays — they cannot see profit or change prices.')}</p>
        <div className="actions"><button type="button" className="btn btn-ghost" onClick={onClose}>{tr('ரத்து', 'Cancel')}</button><button type="submit" className="btn btn-primary"><Icon name="check" /> {tr('சேமி', 'Save')}</button></div>
      </form>
    </Modal>
  )
}

export default function Staff() {
  const { tr, lang, data, settings, saveStaff, toast } = useShop()
  const [editing, setEditing] = useState(undefined)
  const [confirm, setConfirm] = useState(null)
  const today = periodRange('today')
  const todayOf = (id) => {
    const bills = data.bills.filter((b) => b.by?.id === id && inRange(b.date, today))
    const pays = data.payments.filter((p) => p.by?.id === id && inRange(p.date, today))
    const deliv = data.orders.filter((o) => o.staffId === id && o.status === 'delivered' && inRange(o.updatedAt || 0, today))
    return { bills: bills.length, sales: bills.reduce((n, b) => n + b.total, 0), collected: pays.reduce((n, p) => n + p.amount, 0), delivered: deliv.length }
  }
  return (
    <section className="page">
      <PageHead icon="staff" title={tr('பணியாளர்கள்', 'Staff')} sub={tr('இன்று யார் என்ன செய்தார்', "Today's work by each person")}
        action={<button type="button" className="btn btn-primary" onClick={() => setEditing(null)}><Icon name="plus" /> {tr('புதியவர்', 'Add')}</button>} />
      {data.staff.length === 0 ? <Empty icon="staff" text={tr('பணியாளர் இல்லை', 'No staff')} /> : (
        <div className="staff-cards">
          {data.staff.map((s, i) => {
            const t = todayOf(s.id)
            return (
              <div key={s.id} className={`card staff-card${s.active === false ? ' off' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
                <header>
                  <Avatar name={s.name} tone={i + 2} size={52} />
                  <div className="grow"><b>{s.name}</b><small>{s.phone || '—'}</small></div>
                  <span className={`badge ${s.active === false ? 'badge--slate' : 'badge--green'}`}>{s.active === false ? tr('நிறுத்தப்பட்டது', 'Disabled') : tr('செயலில்', 'Active')}</span>
                </header>
                <div className="staff-today">
                  <div><small>{tr('பில்', 'Bills')}</small><b>{t.bills}</b></div>
                  <div><small>{tr('விற்பனை', 'Sales')}</small><b>{money(t.sales)}</b></div>
                  <div><small>{tr('வசூல்', 'Collected')}</small><b>{money(t.collected)}</b></div>
                  <div><small>{tr('டெலிவரி', 'Delivered')}</small><b>{t.delivered}</b></div>
                </div>
                <div className="login-box">
                  <div><small>App login</small><b>ID {s.code} · PIN {s.pin}</b></div>
                  {s.phone && <a className="btn btn-sm btn-wa" href={waLink(s.phone, loginMsg(s, settings, lang))} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18} /></a>}
                </div>
                <div className="actions actions--wrap">
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditing(s)}><Icon name="edit" size={18} /> {tr('மாற்று', 'Edit')}</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirm({ s, kind: 'pin' })}><Icon name="lock" size={18} /> {tr('புதிய PIN', 'New PIN')}</button>
                  <button type="button" className="btn btn-sm btn-ghost-danger" onClick={() => setConfirm({ s, kind: 'off' })}>{s.active === false ? tr('இயக்கு', 'Enable') : tr('நிறுத்து', 'Disable')}</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {editing !== undefined && <StaffForm s={editing} onClose={() => setEditing(undefined)} />}
      {confirm && <Confirm needPin danger={confirm.kind === 'off'}
        text={confirm.kind === 'pin' ? tr('புதிய PIN உருவாக்கவா?', 'Create a new PIN?') : confirm.s.active === false ? tr('மீண்டும் login அனுமதிக்கவா?', 'Allow login again?') : tr('இவரின் login நிறுத்தப்படும்.', 'This person will not be able to log in.')}
        onNo={() => setConfirm(null)}
        onYes={async () => {
          const s = confirm.s
          if (confirm.kind === 'pin') await saveStaff({ ...s, pin: String(Math.floor(1000 + Math.random() * 9000)) })
          else await saveStaff({ ...s, active: s.active === false })
          setConfirm(null); toast(tr('சேமிக்கப்பட்டது', 'Saved'))
        }} />}
    </section>
  )
}
