import { useMemo, useState } from 'react'
import { useShop } from '../lib/store'
import { fmtShort, fromInputDate, money, periodRange, toInputDate } from '../lib/format'
import { summarize } from '../lib/report'
import { Confirm, Empty, Icon, Modal, PageHead, Seg } from '../components/ui'

export const EXPENSE_TYPES = [
  ['rent', 'store', 'வாடகை', 'Rent'], ['electricity', 'sun', 'கரண்ட் (EB)', 'Electricity'], ['transport', 'truck', 'வண்டி / லோடு', 'Transport'],
  ['salary', 'staff', 'சம்பளம்', 'Salary'], ['trays', 'tray', 'தட்டு வாங்க', 'Trays'], ['other', 'expense', 'மற்றவை', 'Other'],
]
export const expenseType = (id) => EXPENSE_TYPES.find((t) => t[0] === id) ?? EXPENSE_TYPES[5]

function AddExpense({ onClose }) {
  const { tr, addExpense, toast } = useShop()
  const [type, setType] = useState('transport')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(toInputDate())
  const save = async () => {
    const a = Number(amount)
    if (!(a > 0)) return toast(tr('தொகை போடவும்', 'Enter amount'), 'error')
    await addExpense({ type, amount: a, note, date: fromInputDate(date) })
    toast(tr('செலவு சேமிக்கப்பட்டது', 'Expense saved'))
    onClose()
  }
  return (
    <Modal title={tr('செலவு சேர்', 'Add expense')} icon="expense" onClose={onClose}>
      <p className="label">{tr('எதற்கு செலவு?', 'What for?')}</p>
      <div className="type-grid">
        {EXPENSE_TYPES.map(([id, icon, ta, en]) => (
          <button key={id} type="button" className={type === id ? 'on' : ''} onClick={() => setType(id)}><Icon name={icon} size={24} /><span>{tr(ta, en)}</span></button>
        ))}
      </div>
      <label className="field"><span>{tr('தொகை ₹', 'Amount ₹')}</span><input className="input-big input-money" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></label>
      <div className="two">
        <label className="field"><span>{tr('குறிப்பு', 'Note')}</span><input className="input-big" value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <label className="field"><span>{tr('தேதி', 'Date')}</span><input className="input-big" type="date" value={date} max={toInputDate()} onChange={(e) => setDate(e.target.value)} /></label>
      </div>
      <button type="button" className="btn btn-primary btn-lg btn-block" onClick={save}><Icon name="check" /> {tr('சேமி', 'Save')}</button>
    </Modal>
  )
}

export default function Expenses() {
  const { tr, lang, data, remove, toast } = useShop()
  const [period, setPeriod] = useState('month')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState(null)
  const s = useMemo(() => summarize(data, periodRange(period), period), [data, period])
  const income = s.gross
  const byType = EXPENSE_TYPES.map(([id]) => ({ id, amount: s.expenses.filter((e) => e.type === id).reduce((n, e) => n + e.amount, 0) })).filter((r) => r.amount > 0)
  const max = Math.max(1, ...byType.map((r) => r.amount))

  return (
    <section className="page">
      <PageHead icon="expense" title={tr('வரவு / செலவு', 'Income / Expense')} sub={tr('கடை செலவுகள்', 'Shop expenses')}
        action={<button type="button" className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" /> {tr('செலவு', 'Expense')}</button>} />
      <Seg full value={period} onChange={setPeriod} options={[
        { value: 'today', label: tr('இன்று', 'Today') }, { value: 'week', label: tr('7 நாள்', '7 days') }, { value: 'month', label: tr('இந்த மாதம்', 'Month') }, { value: 'year', label: tr('வருடம்', 'Year') },
      ]} />
      <div className="io-cards">
        <div className="io io--in"><small>{tr('விற்றதில் லாபம் (வரவு)', 'Profit from sales (in)')}</small><b>{money(income)}</b></div>
        <div className="io io--out"><small>{tr('செலவு + உடைந்தது', 'Expenses + broken')}</small><b>{money(s.expenseTotal + s.wasteLoss)}</b></div>
        <div className={`io io--net ${s.net < 0 ? 'neg' : ''}`}><small>{s.net < 0 ? tr('நஷ்டம்', 'Loss') : tr('கையில் மிச்சம்', 'Left in hand')}</small><b>{money(s.net)}</b></div>
      </div>
      {byType.length > 0 && (
        <div className="card">
          <h2 className="card__title"><Icon name="chart" /> {tr('எதற்கு எவ்வளவு', 'Where the money went')}</h2>
          <ul className="hbars">
            {byType.map((r) => {
              const t = expenseType(r.id)
              return <li key={r.id}><span className="hbars__label"><Icon name={t[1]} size={18} /> {tr(t[2], t[3])}</span><span className="hbars__track"><span style={{ width: `${(r.amount / max) * 100}%` }}></span></span><b>{money(r.amount)}</b></li>
            })}
          </ul>
        </div>
      )}
      {s.expenses.length === 0 ? <Empty icon="expense" text={tr('இந்த காலத்தில் செலவு இல்லை', 'No expenses in this period')} /> : (
        <ul className="mini-list card">
          {[...s.expenses].sort((a, b) => b.date - a.date).map((e) => {
            const t = expenseType(e.type)
            return (
              <li key={e.id}>
                <span className="ledger__icon loss"><Icon name={t[1]} size={18} /></span>
                <span className="grow"><b>{tr(t[2], t[3])}</b><small>{fmtShort(e.date, lang)}{e.note ? ` · ${e.note}` : ''}</small></span>
                <b className="rose">−{money(e.amount)}</b>
                <button type="button" className="icon-btn icon-btn--sm" onClick={() => setRemoving(e)} aria-label="Delete"><Icon name="trash" size={16} /></button>
              </li>
            )
          })}
        </ul>
      )}
      {adding && <AddExpense onClose={() => setAdding(false)} />}
      {removing && <Confirm needPin text={tr(`இந்த செலவு (${money(removing.amount)}) நீக்கவா?`, `Delete this expense (${money(removing.amount)})?`)} onNo={() => setRemoving(null)}
        onYes={async () => { await remove('expenses', removing.id); setRemoving(null); toast(tr('நீக்கப்பட்டது', 'Deleted')) }} />}
    </section>
  )
}
