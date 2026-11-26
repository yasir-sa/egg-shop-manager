import { useMemo, useState } from 'react'
import { useShop } from '../lib/store'
import { downloadCsv, eggsText, fmtDate, money, periodRange } from '../lib/format'
import { summarize } from '../lib/report'
import { Avatar, BarChart, CountUp, EggDot, Icon, PageHead, Seg } from '../components/ui'

const MONTHS_TA = ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Reports() {
  const { tr, lang, data, settings } = useShop()
  const [period, setPeriod] = useState('week')
  const [field, setField] = useState('sales')
  const s = useMemo(() => summarize(data, periodRange(period), period), [data, period])
  const labelOf = (b) => (b.label ?? (b.month !== undefined ? `${(lang === 'ta' ? MONTHS_TA : MONTHS_EN)[b.month]}${b.year !== undefined ? ` '${String(b.year).slice(2)}` : ''}` : String(b.day.getDate())))
  const periodName = { today: tr('இன்று', 'Today'), week: tr('கடந்த 7 நாள்', 'Last 7 days'), month: tr('இந்த மாதம்', 'This month'), year: tr('இந்த வருடம்', 'This year'), all: tr('மொத்தம் (தொடக்கம் முதல்)', 'All time (since start)') }[period]

  const exportCsv = () => {
    const rows = [[tr('பில் எண்', 'Bill no'), tr('தேதி', 'Date'), tr('வாடிக்கையாளர்', 'Customer'), tr('முட்டை', 'Eggs'), tr('மொத்தம்', 'Total'), tr('கொடுத்தது', 'Paid'), tr('கடன்', 'Credit'), tr('முறை', 'Mode'), tr('லாபம்', 'Profit')]]
    s.bills.forEach((b) => {
      const c = data.customers.find((x) => x.id === b.customerId)
      rows.push([b.no, fmtDate(b.date, lang), c?.name || b.walkName || 'Walk-in', b.lines.reduce((n, l) => n + l.eggs, 0), b.total, b.paid, b.credit, b.payMode, Math.round((b.total - b.lines.reduce((n, l) => n + l.cost, 0)) * 100) / 100])
    })
    rows.push([], [tr('விற்பனை', 'Sales'), s.sales], [tr('வாங்கிய விலை', 'Cost'), s.cost], [tr('உடைந்தது', 'Broken'), s.wasteLoss], [tr('செலவு', 'Expenses'), s.expenseTotal], [tr('நிகர லாபம்', 'Net profit'), s.net])
    downloadCsv(`eggshop-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`, rows)
  }

  return (
    <section className="page report">
      <PageHead icon="chart" title={tr('அறிக்கை & லாபம்', 'Reports & profit')} sub={periodName}
        action={<div className="head-actions no-print">
          <button type="button" className="icon-btn" onClick={exportCsv} title="Excel (CSV)" aria-label="Excel"><Icon name="download" /></button>
          <button type="button" className="icon-btn" onClick={() => window.print()} title={tr('அச்சிடு / PDF', 'Print / PDF')} aria-label="Print"><Icon name="print" /></button>
        </div>} />
      <div className="print-only print-head"><b>{settings.shopTa}</b> — {tr('அறிக்கை', 'Report')}: {periodName} · {fmtDate(Date.now(), lang)}</div>
      <div className="no-print">
        <Seg full value={period} onChange={setPeriod} options={[
          { value: 'today', label: tr('இன்று', 'Today') }, { value: 'week', label: tr('7 நாள்', '7 days') }, { value: 'month', label: tr('மாதம்', 'Month') }, { value: 'year', label: tr('வருடம்', 'Year') }, { value: 'all', label: tr('மொத்தம்', 'All') },
        ]} />
      </div>

      {/* Profit in plain words */}
      <div className={`profit-card ${s.net < 0 ? 'neg' : ''}`}>
        <small>{s.net < 0 ? tr('நஷ்டம்', 'Loss') : tr('உண்மையான லாபம் (கையில் மிச்சம்)', 'Real profit (left in hand)')}</small>
        <strong><CountUp value={s.net} /></strong>
        <ol className="profit-steps">
          <li><span>{tr('விற்பனை', 'Sold for')}</span><b>{money(s.sales)}</b></li>
          <li><span>− {tr('முட்டை வாங்கிய விலை', 'Cost of those eggs')}</span><b>{money(s.cost)}</b></li>
          <li className="sub"><span>= {tr('விற்றதில் லாபம்', 'Profit from selling')}</span><b>{money(s.gross)}</b></li>
          <li><span>− {tr('உடைந்த முட்டை', 'Broken eggs')} ({s.brokenEggs})</span><b>{money(s.wasteLoss)}</b></li>
          <li><span>− {tr('கடை செலவு', 'Shop expenses')}</span><b>{money(s.expenseTotal)}</b></li>
          <li className="grand"><span>= {tr('மிச்சம்', 'Left')}</span><b>{money(s.net)}</b></li>
        </ol>
      </div>

      <div className="kpis kpis--sm">
        <div className="kpi kpi--green"><span className="kpi__label">{tr('விற்ற முட்டை', 'Eggs sold')}</span><span className="kpi__value">{eggsText(s.eggsSold, lang)}</span></div>
        <div className="kpi kpi--blue"><span className="kpi__label">{tr('பில்கள்', 'Bills')}</span><span className="kpi__value">{s.bills.length}</span></div>
        <div className="kpi kpi--teal"><span className="kpi__label">{tr('வந்த பணம்', 'Money received')}</span><span className="kpi__value">{money(s.cashIn + s.upiIn)}</span><span className="kpi__foot">{tr('ரொக்கம்', 'Cash')} {money(s.cashIn)} · UPI {money(s.upiIn)}</span></div>
        <div className="kpi kpi--violet"><span className="kpi__label">{tr('கடனாக கொடுத்தது', 'Given on credit')}</span><span className="kpi__value">{money(s.creditGiven)}</span><span className="kpi__foot">{tr('வசூல்', 'Collected')} {money(s.collected)}</span></div>
      </div>

      <div className="card">
        <div className="card__row">
          <h2 className="card__title"><Icon name="chart" /> {field === 'sales' ? tr('விற்பனை', 'Sales') : tr('லாபம்', 'Profit')}</h2>
          <Seg value={field} onChange={setField} options={[{ value: 'sales', label: tr('விற்பனை', 'Sales') }, { value: 'profit', label: tr('லாபம்', 'Profit') }]} />
        </div>
        <BarChart data={s.chart} field={field} labelOf={labelOf} />
        <p className="muted small">{tr('கம்பியைத் தொட்டால் தொகை தெரியும்', 'Tap a bar to see the amount')}</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="card__title"><Icon name="egg" /> {tr('முட்டை வகை வாரியாக', 'By egg type')}</h2>
          {s.byProduct.length === 0 ? <p className="muted">—</p> : (
            <ul className="mini-list">
              {s.byProduct.map((r) => (
                <li key={r.product.id}>
                  <EggDot tone={r.product.tone} size={30} />
                  <span className="grow"><b>{tr(r.product.ta, r.product.en)}</b><small>{eggsText(r.eggs, lang)} · {tr('லாபம்', 'profit')} {money(r.profit)}</small></span>
                  <b>{money(r.amount)}</b>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h2 className="card__title"><Icon name="users" /> {tr('அதிகம் வாங்கியவர்கள்', 'Top customers')}</h2>
          {s.topCustomers.length === 0 ? <p className="muted">—</p> : (
            <ul className="mini-list">
              {s.topCustomers.map((r, i) => (
                <li key={r.customer.id}>
                  <Avatar name={r.customer.name} tone={i} size={36} />
                  <span className="grow"><b>{r.customer.name}</b><small>{r.customer.code}</small></span>
                  <b>{money(r.amount)}</b>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
