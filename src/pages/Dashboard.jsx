import { useMemo, useState } from 'react'
import { useShop } from '../lib/store'
import { daysAgo, eggsText, fmtTime, money, periodRange } from '../lib/format'
import { summarize, totalCredit, totalTraysOut } from '../lib/report'
import { CountUp, EggDot, Icon, Seg } from '../components/ui'

export default function Dashboard({ goTo }) {
  const { tr, lang, data, settings, stockOf } = useShop()
  const [period, setPeriod] = useState(() => { try { return localStorage.getItem('eggshop-dash-period') || 'today' } catch { return 'today' } })
  const choose = (p) => { setPeriod(p); try { localStorage.setItem('eggshop-dash-period', p) } catch { /* ignore */ } }
  const today = useMemo(() => summarize(data, periodRange(period), period), [data, period])
  // Words for the chosen period: "இன்றைய" / "இந்த வார" / "இந்த மாத"
  const W = {
    today: { sales: tr('இன்றைய விற்பனை', "Today's sales"), profit: tr('இன்று கையில் மிச்சம்', 'Profit today'), loss: tr('இன்று நஷ்டம்', 'Loss today'), credit: tr('இன்று கடன்', 'Credit today') },
    week: { sales: tr('7 நாள் விற்பனை', '7-day sales'), profit: tr('7 நாள் லாபம்', '7-day profit'), loss: tr('7 நாள் நஷ்டம்', '7-day loss'), credit: tr('7 நாள் கடன்', '7-day credit') },
    year: { sales: tr('இந்த வருட விற்பனை', 'This year sales'), profit: tr('இந்த வருட லாபம்', 'This year profit'), loss: tr('இந்த வருட நஷ்டம்', 'This year loss'), credit: tr('இந்த வருட கடன்', 'Credit this year') },
    all: { sales: tr('மொத்த விற்பனை', 'Total sales'), profit: tr('மொத்த லாபம்', 'Total profit'), loss: tr('மொத்த நஷ்டம்', 'Total loss'), credit: tr('மொத்தம் கொடுத்த கடன்', 'Total credit given') },
    month: { sales: tr('இந்த மாத விற்பனை', 'This month sales'), profit: tr('இந்த மாத லாபம்', 'This month profit'), loss: tr('இந்த மாத நஷ்டம்', 'This month loss'), credit: tr('இந்த மாத கடன்', 'Credit this month') },
  }[period]
  const credit = totalCredit(data.customers)
  const traysOut = totalTraysOut(data.customers)
  const pending = data.orders.filter((o) => o.status === 'pending')
  const hour = new Date().getHours()
  const greet = hour < 12 ? tr('காலை வணக்கம்', 'Good morning') : hour < 17 ? tr('மதிய வணக்கம்', 'Good afternoon') : tr('மாலை வணக்கம்', 'Good evening')

  const stock = data.products.filter((p) => p.active).map((p) => {
    const lots = data.lots.filter((l) => l.productId === p.id && l.remaining > 0).sort((a, b) => a.date - b.date)
    return { p, eggs: stockOf(p.id), oldest: lots[0] ? daysAgo(lots[0].date) : null }
  })
  const alerts = [
    ...stock.filter((s) => s.eggs < 300).map((s) => ({ tone: 'amber', icon: 'egg', text: tr(`${s.p.ta} இருப்பு குறைவு: ${eggsText(s.eggs, 'ta')}`, `${s.p.en} stock low: ${eggsText(s.eggs, 'en')}`), go: 'stock' })),
    ...stock.filter((s) => s.oldest !== null && s.oldest >= 7).map((s) => ({ tone: 'rose', icon: 'alert', text: tr(`${s.p.ta}: ${s.oldest} நாள் பழைய முட்டை உள்ளது`, `${s.p.en}: ${s.oldest}-day-old eggs in stock`), go: 'stock' })),
    ...data.customers.filter((c) => c.balance > 2000).slice(0, 3).map((c) => ({ tone: 'violet', icon: 'wallet', text: tr(`${c.name} – கடன் ${money(c.balance)}`, `${c.name} owes ${money(c.balance)}`), go: 'credit' })),
  ]

  return (
    <section className="page">
      <div className="hero">
        <div>
          <p className="hero__greet">{greet} 🙏</p>
          <h1>{tr(settings.ownerTa, settings.ownerEn)}</h1>
          <p className="hero__date">{new Date().toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button type="button" className="btn btn-gold btn-lg" onClick={() => goTo('billing')}><Icon name="plus" /> {tr('புதிய பில்', 'New bill')}</button>
      </div>

      <Seg full value={period} onChange={choose} options={[
        { value: 'today', label: tr('இன்று', 'Today') }, { value: 'week', label: tr('7 நாள்', '7 days') }, { value: 'month', label: tr('மாதம்', 'Month') },
        { value: 'year', label: tr('வருடம்', 'Year') }, { value: 'all', label: tr('மொத்தம்', 'All') },
      ]} />

      <div className="kpis">
        <button type="button" className="kpi kpi--green" onClick={() => goTo('reports')}>
          <span className="kpi__icon"><Icon name="cash" /></span>
          <small>{W.sales}</small>
          <strong><CountUp value={today.sales} /></strong>
          <span className="kpi__foot">{today.bills.length} {tr('பில்', 'bills')} · {eggsText(today.eggsSold, lang)}</span>
        </button>
        <button type="button" className={`kpi ${today.net >= 0 ? 'kpi--mint' : 'kpi--rose'}`} onClick={() => goTo('reports')}>
          <span className="kpi__icon"><Icon name="chart" /></span>
          <small>{today.net >= 0 ? W.profit : W.loss}</small>
          <strong><CountUp value={Math.abs(today.net)} /></strong>
          <span className="kpi__foot">{tr('விற்றதில் லாபம்', 'From selling')} {money(today.gross)}</span>
        </button>
        <button type="button" className="kpi kpi--violet" onClick={() => goTo('credit')}>
          <span className="kpi__icon"><Icon name="wallet" /></span>
          <small>{tr('மொத்த கடன் வர வேண்டியது', 'Total credit due')}</small>
          <strong><CountUp value={credit} /></strong>
          <span className="kpi__foot">{data.customers.filter((c) => c.balance > 0).length} {tr('பேர்', 'customers')}</span>
        </button>
        <button type="button" className="kpi kpi--amber" onClick={() => goTo('orders')}>
          <span className="kpi__icon"><Icon name="bell" /></span>
          <small>{tr('புதிய ஆர்டர்கள்', 'New orders')}</small>
          <strong><CountUp value={pending.length} format={(n) => Math.round(n)} /></strong>
          <span className="kpi__foot">{tr('காலி தட்டு வெளியே', 'Trays out')}: {traysOut}</span>
        </button>
      </div>

      <div className="money-strip">
        <span><Icon name="cash" size={18} /> {tr('ரொக்கம்', 'Cash')} <b>{money(today.cashIn)}</b></span>
        <span><Icon name="qr" size={18} /> UPI <b>{money(today.upiIn)}</b></span>
        <span><Icon name="credit" size={18} /> {W.credit} <b>{money(today.creditGiven)}</b></span>
        <span><Icon name="expense" size={18} /> {tr('செலவு', 'Expense')} <b>{money(today.expenseTotal)}</b></span>
      </div>

      {alerts.length > 0 && (
        <div className="card">
          <h2 className="card__title"><Icon name="bell" /> {tr('கவனிக்க வேண்டியவை', 'Needs attention')}</h2>
          <div className="alerts">
            {alerts.map((a, i) => (
              <button key={i} type="button" className={`alert alert--${a.tone}`} onClick={() => goTo(a.go)} style={{ animationDelay: `${i * 50}ms` }}>
                <Icon name={a.icon} size={20} /> <span className="grow">{a.text}</span> <Icon name="right" size={18} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card__row">
            <h2 className="card__title"><Icon name="egg" /> {tr('இருப்பு', 'Stock')}</h2>
            <button type="button" className="link" onClick={() => goTo('stock')}>{tr('எல்லாம்', 'All')} <Icon name="right" size={16} /></button>
          </div>
          <ul className="stock-list">
            {stock.map(({ p, eggs }) => (
              <li key={p.id}>
                <EggDot tone={p.tone} size={30} />
                <span className="grow"><b>{tr(p.ta, p.en)}</b><small>{money(p.retailRate)} / {tr('முட்டை', 'egg')} · {tr('மொத்தம்', 'wholesale')} {money(p.wholesaleRate)}</small></span>
                <strong className={eggs < 300 ? 'warn-text' : ''}>{eggsText(eggs, lang)}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="card__row">
            <h2 className="card__title"><Icon name="orders" /> {tr('காத்திருக்கும் ஆர்டர்கள்', 'Waiting orders')}</h2>
            <button type="button" className="link" onClick={() => goTo('orders')}>{tr('எல்லாம்', 'All')} <Icon name="right" size={16} /></button>
          </div>
          {pending.length === 0 ? <p className="muted">{tr('புதிய ஆர்டர் இல்லை 👍', 'No new orders 👍')}</p> : (
            <ul className="mini-list">
              {pending.slice(0, 5).map((o) => {
                const c = data.customers.find((x) => x.id === o.customerId)
                return (
                  <li key={o.id} onClick={() => goTo('orders')}>
                    <span className="badge badge--amber">#{o.no}</span>
                    <span className="grow"><b>{c?.name}</b><small>{eggsText(o.items.reduce((n, i) => n + i.eggs, 0), lang)} · {o.mode === 'delivery' ? tr('டெலிவரி', 'Delivery') : tr('கடையில்', 'Pickup')}</small></span>
                    <small className="muted">{fmtTime(o.createdAt, lang)}</small>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
