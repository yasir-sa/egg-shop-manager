import { useState } from 'react'
import { useShop } from '../lib/store'
import { eggsText } from '../lib/format'
import { Empty, Icon, PageHead, Seg } from '../components/ui'
import { DeliverSheet, OrderCard } from './Orders'

// Today's deliveries grouped by area. Staff see their own + unassigned ones.
export default function Delivery() {
  const { tr, lang, data, me } = useShop()
  const [who, setWho] = useState(me.role === 'staff' ? 'mine' : 'all')
  const [delivering, setDelivering] = useState(null)
  const open = data.orders.filter((o) => ['accepted', 'out'].includes(o.status) && o.mode === 'delivery')
    .filter((o) => who === 'all' || !o.staffId || o.staffId === me.id)
  const areas = [...new Set(open.map((o) => data.customers.find((c) => c.id === o.customerId)?.area || '—'))]
  const totalEggs = open.reduce((n, o) => n + o.items.reduce((m, i) => m + i.eggs, 0), 0)

  return (
    <section className="page">
      <PageHead icon="truck" title={tr('டெலிவரி', 'Delivery')} sub={`${open.length} ${tr('ஆர்டர்', 'orders')} · ${eggsText(totalEggs, lang)} ${tr('ஏற்ற வேண்டும்', 'to load')}`} />
      {me.role === 'staff' && (
        <Seg value={who} onChange={setWho} options={[{ value: 'mine', label: tr('எனக்கு', 'Mine') }, { value: 'all', label: tr('எல்லாம்', 'All') }]} />
      )}
      {open.length === 0 ? <Empty icon="truck" text={tr('டெலிவரி எதுவும் இல்லை 👍', 'No deliveries pending 👍')} /> : areas.map((area) => (
        <div key={area} className="area-group">
          <h3 className="section-title"><Icon name="pin" size={18} /> {area}</h3>
          {open.filter((o) => (data.customers.find((c) => c.id === o.customerId)?.area || '—') === area)
            .map((o, i) => <OrderCard key={o.id} o={o} i={i} staffView={me.role === 'staff'} onDeliver={setDelivering} />)}
        </div>
      ))}
      {delivering && <DeliverSheet order={delivering} onClose={() => setDelivering(null)} />}
    </section>
  )
}
