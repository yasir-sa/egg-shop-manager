import { useState } from 'react'
import { useShop } from '../lib/store'
import { TRAY, daysAgo, eggsText, fmtShort, money, round2, toInputDate, fromInputDate } from '../lib/format'
import { Confirm, EggDot, Empty, Icon, Modal, PageHead, Seg, Stepper } from '../components/ui'

const ageTone = (d) => (d <= 3 ? 'green' : d <= 7 ? 'amber' : 'rose')

function PurchaseSheet({ onClose }) {
  const { tr, lang, data, addLot, toast } = useShop()
  const products = data.products.filter((p) => p.active)
  const [productId, setProductId] = useState(products[0]?.id)
  const [supplierId, setSupplierId] = useState(data.suppliers[0]?.id ?? '')
  const [trays, setTrays] = useState(10)
  const [extra, setExtra] = useState(0)
  const [traysCost, setTraysCost] = useState('')
  const [paid, setPaid] = useState('')
  const [date, setDate] = useState(toInputDate())
  const eggs = trays * TRAY + extra
  const costPerEgg = (Number(traysCost) || 0) / TRAY // keep full precision: ₹145/tray × 20 = ₹2,900 exactly
  const total = round2(eggs * costPerEgg)
  const save = async () => {
    if (!eggs || !costPerEgg) return toast(tr('அளவு, விலை போடவும்', 'Enter quantity and price'), 'error')
    await addLot({ productId, supplierId, eggs, costPerEgg, paid: Number(paid) || 0, date: fromInputDate(date) })
    toast(tr('கொள்முதல் சேமிக்கப்பட்டது', 'Purchase saved'))
    onClose()
  }
  return (
    <Modal title={tr('கொள்முதல் சேர் (வாங்கியது)', 'Add purchase')} icon="egg" onClose={onClose}>
      <p className="label">{tr('முட்டை வகை', 'Egg type')}</p>
      <div className="type-pick">
        {products.map((p) => (
          <button key={p.id} type="button" className={productId === p.id ? 'on' : ''} onClick={() => setProductId(p.id)}><EggDot tone={p.tone} size={30} /> {tr(p.ta, p.en)}</button>
        ))}
      </div>
      <label className="field"><span>{tr('யாரிடம் வாங்கினீர்கள்?', 'Bought from')}</span>
        <select className="input-big" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="">—</option>
          {data.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <div className="two">
        <div className="field"><span>{tr('தட்டு (30)', 'Trays (30)')}</span><Stepper value={trays} onChange={setTrays} /></div>
        <div className="field"><span>{tr('+ தனி முட்டை', '+ loose eggs')}</span><Stepper value={extra} onChange={setExtra} /></div>
      </div>
      <label className="field"><span>{tr('ஒரு தட்டு வாங்கிய விலை ₹', 'Cost price per tray ₹')}</span>
        <input className="input-big input-money" type="number" inputMode="decimal" value={traysCost} onChange={(e) => setTraysCost(e.target.value)} placeholder="145" />
      </label>
      <div className="two">
        <label className="field"><span>{tr('இப்போது கொடுத்தது ₹', 'Paid now ₹')}</span><input className="input-big" type="number" inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0" /></label>
        <label className="field"><span>{tr('தேதி', 'Date')}</span><input className="input-big" type="date" value={date} max={toInputDate()} onChange={(e) => setDate(e.target.value)} /></label>
      </div>
      <div className="summary-box">
        <span>{eggsText(eggs, lang)} · {money(costPerEgg)}/{tr('முட்டை', 'egg')}</span>
        <b>{money(total)}</b>
        {total > 0 && <small>{tr('சப்ளையருக்கு பாக்கி', 'Due to supplier')}: {money(Math.max(0, total - (Number(paid) || 0)))}</small>}
      </div>
      <button type="button" className="btn btn-primary btn-lg btn-block" onClick={save}><Icon name="check" /> {tr('சேமி', 'Save')}</button>
    </Modal>
  )
}

function BrokenSheet({ onClose }) {
  const { tr, lang, data, addWaste, stockOf, toast } = useShop()
  const products = data.products.filter((p) => p.active)
  const [productId, setProductId] = useState(products[0]?.id)
  const [eggs, setEggs] = useState(6)
  const [reason, setReason] = useState('broken')
  const save = async () => {
    if (!eggs) return
    const w = await addWaste({ productId, eggs, reason })
    toast(tr(`நஷ்டம் ${money(w.loss)} பதிவு`, `Loss ${money(w.loss)} recorded`))
    onClose()
  }
  return (
    <Modal title={tr('உடைந்த / கெட்ட முட்டை', 'Broken / bad eggs')} icon="broken" onClose={onClose}>
      <div className="type-pick">
        {products.map((p) => (
          <button key={p.id} type="button" className={productId === p.id ? 'on' : ''} onClick={() => setProductId(p.id)}><EggDot tone={p.tone} size={30} /> {tr(p.ta, p.en)}</button>
        ))}
      </div>
      <div className="field"><span>{tr('எத்தனை முட்டை?', 'How many eggs?')}</span><Stepper value={eggs} onChange={setEggs} /></div>
      <p className="muted">{tr('இருப்பு', 'Stock')}: {eggsText(stockOf(productId), lang)} · {tr('பழைய லாட்டிலிருந்து கழிக்கப்படும்', 'Taken from the oldest lot')}</p>
      <div className="chips">
        {[['broken', 'உடைந்தது', 'Broken'], ['rotten', 'கெட்டுப்போனது', 'Spoiled'], ['other', 'மற்றவை', 'Other']].map(([id, ta, en]) => (
          <button key={id} type="button" className={reason === id ? 'on' : ''} onClick={() => setReason(id)}>{tr(ta, en)}</button>
        ))}
      </div>
      <button type="button" className="btn btn-danger btn-lg btn-block" onClick={save}><Icon name="broken" /> {tr('நஷ்டமாக பதிவு செய்', 'Record as loss')}</button>
    </Modal>
  )
}

function RatesSheet({ onClose }) {
  const { tr, data, saveProduct, toast } = useShop()
  const [rates, setRates] = useState(Object.fromEntries(data.products.map((p) => [p.id, { r: p.retailRate, w: p.wholesaleRate }])))
  const save = async () => {
    for (const p of data.products) {
      const v = rates[p.id]
      if (v.r !== p.retailRate || v.w !== p.wholesaleRate) await saveProduct({ ...p, retailRate: Number(v.r) || 0, wholesaleRate: Number(v.w) || 0 })
    }
    toast(tr('இன்றைய விலை சேமிக்கப்பட்டது', "Today's rates saved"))
    onClose()
  }
  return (
    <Modal title={tr('இன்றைய முட்டை விலை', "Today's egg rate")} icon="cash" onClose={onClose}>
      <p className="muted">{tr('ஒரு முட்டைக்கான விலை. இனி போடும் எல்லா பில்லுக்கும் இது பொருந்தும்.', 'Price for one egg. Applies to all new bills.')}</p>
      <div className="rates">
        <div className="rates__head"><span></span><span>{tr('சில்லறை', 'Retail')}</span><span>{tr('மொத்தம்', 'Wholesale')}</span></div>
        {data.products.map((p) => (
          <div key={p.id} className="rates__row">
            <span><EggDot tone={p.tone} size={26} /> {tr(p.ta, p.en)}</span>
            <input type="number" inputMode="decimal" step="0.05" value={rates[p.id].r} onChange={(e) => setRates((x) => ({ ...x, [p.id]: { ...x[p.id], r: e.target.value } }))} />
            <input type="number" inputMode="decimal" step="0.05" value={rates[p.id].w} onChange={(e) => setRates((x) => ({ ...x, [p.id]: { ...x[p.id], w: e.target.value } }))} />
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-primary btn-lg btn-block" onClick={save}><Icon name="check" /> {tr('சேமி', 'Save')}</button>
    </Modal>
  )
}

export default function Stock() {
  const { tr, lang, data, stockOf, deleteLot, deleteWaste, toast } = useShop()
  const [tab, setTab] = useState('stock')
  const [sheet, setSheet] = useState(null)
  const [removing, setRemoving] = useState(null)
  const products = data.products.filter((p) => p.active)
  const value = round2(data.lots.reduce((n, l) => n + l.remaining * l.costPerEgg, 0))

  return (
    <section className="page">
      <PageHead icon="egg" title={tr('இருப்பு & கொள்முதல்', 'Stock & purchase')} sub={`${tr('இருப்பு மதிப்பு', 'Stock value')} ${money(value)}`} />
      <div className="quick-actions">
        <button type="button" className="qa qa--green" onClick={() => setSheet('buy')}><Icon name="plus" size={26} /><b>{tr('கொள்முதல் சேர்', 'Add purchase')}</b></button>
        <button type="button" className="qa qa--rose" onClick={() => setSheet('broken')}><Icon name="broken" size={26} /><b>{tr('உடைந்த முட்டை', 'Broken eggs')}</b></button>
        <button type="button" className="qa qa--amber" onClick={() => setSheet('rates')}><Icon name="cash" size={26} /><b>{tr('இன்றைய விலை', "Today's rate")}</b></button>
      </div>
      <Seg full value={tab} onChange={setTab} options={[
        { value: 'stock', label: tr('இருப்பு', 'Stock') }, { value: 'lots', label: tr('கொள்முதல் பட்டியல்', 'Purchases') }, { value: 'broken', label: tr('உடைந்தவை', 'Broken') },
      ]} />

      {tab === 'stock' && (
        <div className="stock-cards">
          {products.map((p, i) => {
            const lots = data.lots.filter((l) => l.productId === p.id && l.remaining > 0).sort((a, b) => a.date - b.date)
            const left = stockOf(p.id)
            return (
              <div key={p.id} className="stock-card" style={{ animationDelay: `${i * 50}ms` }}>
                <header>
                  <EggDot tone={p.tone} size={46} />
                  <div className="grow"><b>{tr(p.ta, p.en)}</b><small>{tr('விற்பனை', 'Sell')} {money(p.retailRate)} · {tr('மொத்தம்', 'Wholesale')} {money(p.wholesaleRate)}</small></div>
                  <strong className={left < 300 ? 'warn-text' : ''}>{eggsText(left, lang)}</strong>
                </header>
                {lots.length === 0 ? <p className="muted">{tr('இருப்பு இல்லை', 'No stock')}</p> : (
                  <ul className="lot-list">
                    {lots.map((l) => {
                      const d = daysAgo(l.date)
                      return (
                        <li key={l.id}>
                          <span className={`age age--${ageTone(d)}`}>{d === 0 ? tr('இன்று', 'Today') : `${d} ${tr('நாள்', 'd')}`}</span>
                          <span className="grow">{fmtShort(l.date, lang)} · {money(l.costPerEgg)}/{tr('முட்டை', 'egg')}</span>
                          <b>{eggsText(l.remaining, lang)}</b>
                          <span className="meter"><span style={{ width: `${(l.remaining / l.eggs) * 100}%` }}></span></span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'lots' && (data.lots.length === 0 ? <Empty icon="egg" text={tr('கொள்முதல் இல்லை', 'No purchases')} /> : (
        <ul className="mini-list card">
          {[...data.lots].sort((a, b) => b.date - a.date).map((l) => {
            const p = data.products.find((x) => x.id === l.productId)
            const s = data.suppliers.find((x) => x.id === l.supplierId)
            return (
              <li key={l.id}>
                <EggDot tone={p?.tone} size={28} />
                <span className="grow"><b>{tr(p?.ta, p?.en)} · {eggsText(l.eggs, lang)}</b><small>{fmtShort(l.date, lang)} · {s?.name ?? '—'} · {money(l.costPerEgg)}/{tr('முட்டை', 'egg')}</small></span>
                <b>{money(l.eggs * l.costPerEgg)}</b>
                <button type="button" className="icon-btn icon-btn--sm" onClick={() => setRemoving({ kind: 'lot', item: l })} aria-label="Delete"><Icon name="trash" size={16} /></button>
              </li>
            )
          })}
        </ul>
      ))}

      {tab === 'broken' && (data.wastes.length === 0 ? <Empty icon="check" text={tr('உடைந்த முட்டை இல்லை 👍', 'No broken eggs 👍')} /> : (
        <ul className="mini-list card">
          {[...data.wastes].sort((a, b) => b.date - a.date).map((w) => {
            const p = data.products.find((x) => x.id === w.productId)
            return (
              <li key={w.id}>
                <span className="ledger__icon loss"><Icon name="broken" size={18} /></span>
                <span className="grow"><b>{tr(p?.ta, p?.en)} · {w.eggs} {tr('முட்டை', 'eggs')}</b><small>{fmtShort(w.date, lang)} · {w.by?.name}</small></span>
                <b className="rose">−{money(w.loss)}</b>
                <button type="button" className="icon-btn icon-btn--sm" onClick={() => setRemoving({ kind: 'waste', item: w })} aria-label="Undo"><Icon name="back" size={16} /></button>
              </li>
            )
          })}
        </ul>
      ))}

      {sheet === 'buy' && <PurchaseSheet onClose={() => setSheet(null)} />}
      {sheet === 'broken' && <BrokenSheet onClose={() => setSheet(null)} />}
      {sheet === 'rates' && <RatesSheet onClose={() => setSheet(null)} />}
      {removing && (
        <Confirm needPin text={removing.kind === 'lot' ? tr('இந்த கொள்முதலை நீக்கவா?', 'Delete this purchase?') : tr('இந்த உடைந்த முட்டை பதிவை நீக்கவா? இருப்பு திரும்ப சேரும்.', 'Undo this broken-egg entry? Stock goes back.')}
          onNo={() => setRemoving(null)}
          onYes={async () => { if (removing.kind === 'lot') await deleteLot(removing.item); else await deleteWaste(removing.item); setRemoving(null); toast(tr('நீக்கப்பட்டது', 'Done')) }} />
      )}
    </section>
  )
}
