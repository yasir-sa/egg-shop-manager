import { useState } from 'react'
import { useShop } from '../lib/store'
import { fmtShort, fmtTime, sameDay } from '../lib/format'
import { Empty, Icon, PageHead, SearchBox, Seg } from '../components/ui'

const KIND_ICON = { bill: 'bill', payment: 'cash', order: 'orders', stock: 'egg', waste: 'broken', tray: 'tray', expense: 'expense', customer: 'user', staff: 'staff', supplier: 'factory', price: 'cash', delete: 'trash', info: 'info' }

// Who did what and when — every action is recorded.
export default function Activity() {
  const { tr, lang, data } = useShop()
  const [who, setWho] = useState('all')
  const [q, setQ] = useState('')
  const list = [...data.activity].sort((a, b) => b.date - a.date)
    .filter((a) => who === 'all' || a.by?.role === who)
    .filter((a) => !q || `${a.ta} ${a.en} ${a.by?.name}`.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 200)
  let lastDay = null
  return (
    <section className="page">
      <PageHead icon="activity" title={tr('யார் என்ன செய்தார்', 'Activity log')} sub={tr('எல்லா செயல்களும் பதிவாகும்', 'Every action is recorded')} />
      <SearchBox value={q} onChange={setQ} placeholder={tr('தேடு (பெயர், பில் எண்…)', 'Search (name, bill no…)')} />
      <Seg value={who} onChange={setWho} options={[
        { value: 'all', label: tr('எல்லாம்', 'All') }, { value: 'owner', label: tr('உரிமையாளர்', 'Owner') }, { value: 'staff', label: tr('பணியாளர்', 'Staff') }, { value: 'customer', label: tr('வாடிக்கையாளர்', 'Customer') },
      ]} />
      {list.length === 0 ? <Empty icon="activity" text="—" /> : (
        <ul className="timeline">
          {list.map((a) => {
            const head = !lastDay || !sameDay(lastDay, a.date)
            lastDay = a.date
            return (
              <li key={a.id} className={head ? 'has-day' : ''}>
                {head && <span className="timeline__day">{sameDay(a.date, Date.now()) ? tr('இன்று', 'Today') : fmtShort(a.date, lang)}</span>}
                <span className={`timeline__dot kind--${a.kind}`}><Icon name={KIND_ICON[a.kind] ?? 'info'} size={16} /></span>
                <span className="grow"><b>{tr(a.ta, a.en)}</b><small>{fmtTime(a.date, lang)} · {a.by?.name ?? '—'}{a.by?.role && a.by.role !== 'system' ? ` (${a.by.role === 'owner' ? tr('உரிமையாளர்', 'owner') : a.by.role === 'staff' ? tr('பணியாளர்', 'staff') : tr('வாடிக்கையாளர்', 'customer')})` : ''}</small></span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
