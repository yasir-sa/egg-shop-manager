import { useState } from 'react'
import { useShop } from '../lib/store'
import { fmtShort, waLink } from '../lib/format'
import { totalTraysOut } from '../lib/report'
import { Avatar, CountUp, Empty, Icon, Modal, PageHead, SearchBox, Stepper } from '../components/ui'

// Empty trays: who has how many, record trays given / returned.
export default function Trays() {
  const { tr, lang, data, settings, moveTrays, toast } = useShop()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const [count, setCount] = useState(1)
  const list = data.customers.filter((c) => c.active !== false)
    .filter((c) => !q || `${c.name} ${c.code}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.trays - a.trays)
  const recent = [...data.trays].sort((a, b) => b.date - a.date).slice(0, 12)
  const move = async (change) => {
    await moveTrays({ customerId: sel.id, change })
    toast(change < 0 ? tr(`${-change} தட்டு திரும்ப வந்தது`, `${-change} trays returned`) : tr(`${change} தட்டு கொடுத்தது`, `${change} trays given`))
    setSel(null)
  }
  return (
    <section className="page">
      <PageHead icon="tray" title={tr('காலி தட்டு கணக்கு', 'Empty trays')} sub={tr('யாரிடம் எத்தனை தட்டு உள்ளது', 'Who has how many trays')} />
      <div className="total-banner total-banner--teal">
        <small>{tr('வெளியே உள்ள தட்டுகள்', 'Trays outside')}</small>
        <strong><CountUp value={totalTraysOut(data.customers)} format={(n) => Math.round(n)} /></strong>
        <span>{data.customers.filter((c) => c.trays > 0).length} {tr('பேரிடம்', 'customers')}</span>
      </div>
      <SearchBox value={q} onChange={setQ} placeholder={tr('பெயர் தேடு', 'Search name')} />
      {list.length === 0 ? <Empty icon="tray" text="—" /> : (
        <ul className="people people--cards">
          {list.map((c, i) => (
            <li key={c.id}>
              <button type="button" onClick={() => { setSel(c); setCount(c.trays || 1) }}>
                <Avatar name={c.name} tone={i} />
                <span className="grow"><b>{c.name}</b><small>{c.code} · {c.area}</small></span>
                <span className={`tray-count${c.trays ? ' on' : ''}`}><Icon name="tray" size={18} /> {c.trays}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="card">
        <h2 className="card__title"><Icon name="activity" /> {tr('சமீபத்திய', 'Recent')}</h2>
        <ul className="mini-list">
          {recent.map((t) => {
            const c = data.customers.find((x) => x.id === t.customerId)
            return <li key={t.id}><span className="grow"><b>{c?.name}</b><small>{fmtShort(t.date, lang)} · {t.by?.name}</small></span><b className={t.change < 0 ? 'green' : 'violet'}>{t.change < 0 ? `↩ ${-t.change}` : `→ ${t.change}`}</b></li>
          })}
        </ul>
      </div>
      {sel && (
        <Modal title={sel.name} icon="tray" onClose={() => setSel(null)}>
          <p className="muted center">{tr('இப்போது இவரிடம்', 'Has now')}: <b>{sel.trays} {tr('தட்டு', 'trays')}</b></p>
          <div className="field"><span>{tr('எத்தனை தட்டு?', 'How many trays?')}</span><Stepper value={count} onChange={setCount} min={1} /></div>
          <div className="actions">
            <button type="button" className="btn btn-ghost" onClick={() => move(count)}><Icon name="right" /> {tr('கொடுத்தது', 'Given')}</button>
            <button type="button" className="btn btn-primary" onClick={() => move(-Math.min(count, sel.trays))} disabled={!sel.trays}><Icon name="back" /> {tr('திரும்ப வந்தது', 'Returned')}</button>
          </div>
          {sel.phone && sel.trays > 0 && (
            <a className="btn btn-wa btn-block" href={waLink(sel.phone, tr(`வணக்கம் ${sel.name}, உங்களிடம் ${sel.trays} காலி தட்டு உள்ளது. அடுத்த முறை திருப்பித் தரவும். – ${settings.shopTa}`, `Hello ${sel.name}, you have ${sel.trays} empty trays. Please return them next time. – ${settings.shopEn}`))} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" /> {tr('நினைவூட்டு', 'Remind')}
            </a>
          )}
        </Modal>
      )}
    </section>
  )
}
