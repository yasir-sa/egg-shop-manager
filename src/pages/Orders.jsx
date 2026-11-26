import { useState } from 'react'
import { useShop } from '../lib/store'
import { eggsText, fmtShort, fmtTime, money, round2, waLink } from '../lib/format'
import { Avatar, Empty, Icon, Modal, PageHead, Seg } from '../components/ui'
import { OrderForm } from './CustomerPages'

const STATUS = {
  pending: ['காத்திருப்பு', 'Waiting', 'amber'],
  accepted: ['ஏற்கப்பட்டது', 'Accepted', 'blue'],
  out: ['டெலிவரிக்கு போகிறது', 'Out for delivery', 'violet'],
  delivered: ['முடிந்தது', 'Delivered', 'green'],
  rejected: ['மறுக்கப்பட்டது', 'Rejected', 'rose'],
}
export const statusLabel = (s, tr) => tr(STATUS[s][0], STATUS[s][1])
export const statusTone = (s) => STATUS[s][2]

// Deliver an order: make the bill (cash / UPI / credit) and mark it delivered.
export function DeliverSheet({ order, onClose }) {
  const { tr, lang, data, rateFor, createBill, setOrderStatus, toast } = useShop()
  const customer = data.customers.find((c) => c.id === order.customerId)
  const items = order.items.map((i) => ({ ...i, rate: rateFor(data.products.find((p) => p.id === i.productId), customer) }))
  const total = round2(items.reduce((n, i) => n + i.eggs * i.rate, 0))
  const [mode, setMode] = useState('credit')
  const go = async () => {
    const eggs = items.reduce((n, i) => n + i.eggs, 0)
    const bill = await createBill({ customerId: customer.id, items, payMode: mode, traysGiven: Math.floor(eggs / 30), orderId: order.id })
    await setOrderStatus(order, 'delivered', { billId: bill.id })
    toast(tr(`ஆர்டர் #${order.no} முடிந்தது · பில் #${bill.no}`, `Order #${order.no} delivered · Bill #${bill.no}`))
    onClose()
  }
  return (
    <Modal title={tr(`ஆர்டர் #${order.no} – டெலிவரி`, `Deliver order #${order.no}`)} icon="truck" onClose={onClose}>
      <p className="muted">{customer?.name} · {customer?.area}</p>
      <ul className="lines">
        {items.map((i) => {
          const p = data.products.find((x) => x.id === i.productId)
          return <li key={i.productId}><span className="grow">{tr(p?.ta, p?.en)} · {eggsText(i.eggs, lang)} × ₹{i.rate}</span><b>{money(i.eggs * i.rate)}</b></li>
        })}
      </ul>
      <div className="total"><span>{tr('மொத்தம்', 'Total')}</span><strong>{money(total)}</strong></div>
      <p className="label">{tr('பணம்', 'Payment')}</p>
      <div className="pay-modes">
        {[['cash', 'cash', 'ரொக்கம்', 'Cash'], ['upi', 'qr', 'UPI', 'UPI'], ['credit', 'credit', 'கடன்', 'Credit']].map(([id, icon, ta, en]) => (
          <button key={id} type="button" className={mode === id ? 'on' : ''} onClick={() => setMode(id)}><Icon name={icon} /> {tr(ta, en)}</button>
        ))}
      </div>
      <button type="button" className="btn btn-primary btn-lg btn-block" onClick={go}><Icon name="check" /> {tr('டெலிவரி முடிந்தது – பில் போடு', 'Delivered – make bill')}</button>
    </Modal>
  )
}

export function OrderCard({ o, i = 0, staffView = false, onDeliver }) {
  const { tr, lang, data, me, setOrderStatus, toast } = useShop()
  const c = data.customers.find((x) => x.id === o.customerId)
  const staff = data.staff.filter((s) => s.active !== false)
  const eggs = o.items.reduce((n, it) => n + it.eggs, 0)
  const act = async (status, extra, msg) => { await setOrderStatus(o, status, extra); toast(msg) }
  return (
    <article className="order" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
      <header>
        <Avatar name={c?.name} tone={i} size={42} />
        <div className="grow">
          <b>{c?.name}</b>
          <small>{c?.code} · {c?.area} · {fmtShort(o.createdAt, lang)} {fmtTime(o.createdAt, lang)}</small>
        </div>
        <span className={`badge badge--${statusTone(o.status)}`}>#{o.no} · {statusLabel(o.status, tr)}</span>
      </header>
      <ul className="order__items">
        {o.items.map((it) => {
          const p = data.products.find((x) => x.id === it.productId)
          return <li key={it.productId}><Icon name="egg" size={16} /> {tr(p?.ta, p?.en)} — <b>{eggsText(it.eggs, lang)}</b></li>
        })}
      </ul>
      <p className="order__meta">
        <span><Icon name={o.mode === 'delivery' ? 'truck' : 'store'} size={16} /> {o.mode === 'delivery' ? tr('டெலிவரி', 'Delivery') : tr('கடையில் வாங்குவார்', 'Pickup')}</span>
        <span><Icon name="calendar" size={16} /> {fmtShort(o.wantDate, lang)}</span>
        <span><Icon name="egg" size={16} /> {eggsText(eggs, lang)}</span>
        {o.staffId && <span><Icon name="staff" size={16} /> {data.staff.find((s) => s.id === o.staffId)?.name}</span>}
      </p>
      {o.note && <p className="order__note">“{o.note}”</p>}
      <div className="order__actions">
        {c?.phone && <a className="icon-btn" href={`tel:${c.phone}`} aria-label="Call"><Icon name="phone" size={20} /></a>}
        {c?.phone && <a className="icon-btn icon-btn--wa" href={waLink(c.phone, tr(`வணக்கம் ${c.name}, உங்கள் ஆர்டர் #${o.no} – ${statusLabel(o.status, tr)}`, `Hello ${c.name}, your order #${o.no} is ${statusLabel(o.status, tr)}`))} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icon name="whatsapp" size={20} /></a>}
        <span className="grow"></span>
        {o.status === 'pending' && !staffView && (
          <>
            <button type="button" className="btn btn-sm btn-ghost-danger" onClick={() => act('rejected', {}, tr('மறுக்கப்பட்டது', 'Rejected'))}><Icon name="x" size={18} /> {tr('மறு', 'Reject')}</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => act('accepted', {}, tr('ஏற்கப்பட்டது', 'Accepted'))}><Icon name="check" size={18} /> {tr('ஏற்கவும்', 'Accept')}</button>
          </>
        )}
        {(o.status === 'accepted' || o.status === 'pending') && staffView && o.status === 'accepted' && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => act('out', { staffId: o.staffId || me.id }, tr('டெலிவரிக்கு புறப்பட்டது', 'Out for delivery'))}><Icon name="truck" size={18} /> {tr('புறப்படு', 'Start')}</button>
        )}
        {o.status === 'accepted' && !staffView && (
          <select className="select-sm" value={o.staffId || ''} onChange={(e) => act('accepted', { staffId: e.target.value || null }, tr('பணியாளர் ஒதுக்கப்பட்டார்', 'Staff assigned'))}>
            <option value="">{tr('யார் டெலிவரி?', 'Who delivers?')}</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        {(o.status === 'accepted' || o.status === 'out') && (
          <button type="button" className="btn btn-sm btn-gold" onClick={() => onDeliver(o)}><Icon name="check" size={18} /> {tr('டெலிவரி முடிந்தது', 'Delivered')}</button>
        )}
      </div>
    </article>
  )
}

export default function Orders() {
  const { tr, data, me } = useShop()
  const [tab, setTab] = useState('pending')
  const [delivering, setDelivering] = useState(null)
  const [creating, setCreating] = useState(false)
  const count = (s) => data.orders.filter((o) => o.status === s).length
  const list = data.orders.filter((o) => (tab === 'done' ? ['delivered', 'rejected'].includes(o.status) : o.status === tab || (tab === 'accepted' && o.status === 'out')))
    .sort((a, b) => b.createdAt - a.createdAt)
  return (
    <section className="page">
      <PageHead icon="orders" title={tr('ஆர்டர்கள்', 'Orders')} sub={tr('வாடிக்கையாளர் போட்ட ஆர்டர்கள்', 'Orders from customers')}
        action={<button type="button" className="btn btn-primary" onClick={() => setCreating(true)}><Icon name="plus" /> {tr('ஆர்டர்', 'Order')}</button>} />
      <Seg full value={tab} onChange={setTab} options={[
        { value: 'pending', label: `${tr('புதியது', 'New')} (${count('pending')})` },
        { value: 'accepted', label: `${tr('ஏற்றது', 'Accepted')} (${count('accepted') + count('out')})` },
        { value: 'done', label: tr('முடிந்தவை', 'Done') },
      ]} />
      <div className="orders">
        {list.length === 0 ? <Empty icon="orders" text={tr('இங்கே ஆர்டர் எதுவும் இல்லை', 'No orders here')} /> :
          list.slice(0, 50).map((o, i) => <OrderCard key={o.id} o={o} i={i} staffView={me.role === 'staff'} onDeliver={setDelivering} />)}
      </div>
      {delivering && <DeliverSheet order={delivering} onClose={() => setDelivering(null)} />}
      {creating && (
        <Modal title={tr('போன் / நேரடி ஆர்டர்', 'Phone / walk-in order')} icon="orders" onClose={() => setCreating(false)} wide>
          <OrderForm onDone={() => setCreating(false)} />
        </Modal>
      )}
    </section>
  )
}
