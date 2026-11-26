import { useRef, useState } from 'react'
import { useShop } from '../lib/store'
import { money } from '../lib/format'
import { Confirm, EggDot, Icon, Modal, PageHead, PinPad, Seg } from '../components/ui'

const TONES = ['white', 'country', 'brown', 'duck']

function ProductForm({ p, onClose }) {
  const { tr, saveProduct, toast } = useShop()
  const [f, setF] = useState(p ?? { ta: '', en: '', retailRate: '', wholesaleRate: '', tone: 'white', active: true })
  const save = async (e) => {
    e.preventDefault()
    if (!f.ta.trim() && !f.en.trim()) return toast(tr('பெயர் போடவும்', 'Enter a name'), 'error')
    await saveProduct({ ...f, ta: f.ta.trim() || f.en.trim(), en: f.en.trim() || f.ta.trim(), retailRate: Number(f.retailRate) || 0, wholesaleRate: Number(f.wholesaleRate) || 0 })
    toast(tr('சேமிக்கப்பட்டது', 'Saved'))
    onClose()
  }
  return (
    <Modal title={p ? tr('முட்டை வகை மாற்று', 'Edit egg type') : tr('புதிய முட்டை வகை', 'New egg type')} icon="egg" onClose={onClose}>
      <form className="form" onSubmit={save}>
        <div className="two">
          <label className="field"><span>தமிழ் பெயர்</span><input className="input-big" value={f.ta} onChange={(e) => setF({ ...f, ta: e.target.value })} /></label>
          <label className="field"><span>English name</span><input className="input-big" value={f.en} onChange={(e) => setF({ ...f, en: e.target.value })} /></label>
        </div>
        <div className="two">
          <label className="field"><span>{tr('சில்லறை விலை ₹ / முட்டை', 'Retail ₹ / egg')}</span><input className="input-big" type="number" step="0.05" inputMode="decimal" value={f.retailRate} onChange={(e) => setF({ ...f, retailRate: e.target.value })} /></label>
          <label className="field"><span>{tr('மொத்த விலை ₹ / முட்டை', 'Wholesale ₹ / egg')}</span><input className="input-big" type="number" step="0.05" inputMode="decimal" value={f.wholesaleRate} onChange={(e) => setF({ ...f, wholesaleRate: e.target.value })} /></label>
        </div>
        <p className="label">{tr('நிறம்', 'Colour')}</p>
        <div className="type-pick">
          {TONES.map((t) => <button key={t} type="button" className={f.tone === t ? 'on' : ''} onClick={() => setF({ ...f, tone: t })}><EggDot tone={t} size={30} /></button>)}
        </div>
        {p && (
          <label className="switch-row"><input type="checkbox" checked={f.active !== false} onChange={(e) => setF({ ...f, active: e.target.checked })} /> {tr('விற்பனையில் உள்ளது', 'Currently sold')}</label>
        )}
        <div className="actions"><button type="button" className="btn btn-ghost" onClick={onClose}>{tr('ரத்து', 'Cancel')}</button><button type="submit" className="btn btn-primary"><Icon name="check" /> {tr('சேமி', 'Save')}</button></div>
      </form>
    </Modal>
  )
}

function PinChange({ onClose }) {
  const { tr, checkPin, saveSettings, toast } = useShop()
  const [step, setStep] = useState(0)
  const [oldPin, setOldPin] = useState('')
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [err, setErr] = useState(false)
  const titles = [tr('பழைய PIN', 'Current PIN'), tr('புதிய PIN', 'New PIN'), tr('புதிய PIN மீண்டும்', 'New PIN again')]
  const done = async (v) => {
    if (step === 0) { if (checkPin(v)) setStep(1); else { setErr(true); setOldPin('') } return }
    if (step === 1) { setStep(2); return }
    if (v !== pin) { setErr(true); setPin2(''); return }
    await saveSettings({ ownerPin: v })
    toast(tr('PIN மாற்றப்பட்டது', 'PIN changed'))
    onClose()
  }
  const val = [oldPin, pin, pin2][step]
  const set = [setOldPin, setPin, setPin2][step]
  return (
    <Modal title={tr('Owner PIN மாற்று', 'Change owner PIN')} icon="lock" onClose={onClose}>
      <p className="label center">{titles[step]}</p>
      <PinPad key={step} value={val} onChange={(v) => { set(v); setErr(false) }} error={err} onDone={done} />
      {err && <p className="error-text center"><Icon name="alert" size={18} /> {step === 0 ? tr('PIN தவறு', 'Wrong PIN') : tr('இரண்டும் ஒன்றாக இல்லை', 'PINs do not match')}</p>}
    </Modal>
  )
}

export default function Settings() {
  const { tr, data, settings, saveSettings, exportBackup, importBackup, seedDemo, toast } = useShop()
  const [f, setF] = useState(settings)
  const [product, setProduct] = useState(undefined)
  const [pinOpen, setPinOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const fileRef = useRef(null)
  const qrRef = useRef(null)

  const saveShop = async () => {
    const keys = ['shopTa', 'shopEn', 'ownerTa', 'ownerEn', 'phone', 'tagTa', 'tagEn', 'addressTa', 'addressEn', 'upiId']
    await saveSettings(Object.fromEntries(keys.map((k) => [k, f[k]])))
    toast(tr('கடை விவரம் சேமிக்கப்பட்டது', 'Shop details saved'))
  }
  const onQr = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    img.onload = async () => {
      const max = 480
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = img.width * k; c.height = img.height * k
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      await saveSettings({ upiQr: c.toDataURL('image/jpeg', 0.85) })
      toast(tr('UPI QR சேமிக்கப்பட்டது', 'UPI QR saved'))
    }
    img.src = URL.createObjectURL(file)
    e.target.value = ''
  }
  const field = (k, label, props = {}) => (
    <label className="field"><span>{label}</span><input className="input-big" value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} {...props} /></label>
  )

  return (
    <section className="page">
      <PageHead icon="settings" title={tr('அமைப்புகள்', 'Settings')} sub={tr('கடை விவரம், விலை, PIN, Backup', 'Shop, rates, PIN, backup')} />

      <div className="card">
        <h2 className="card__title"><Icon name="globe" /> {tr('மொழி & தோற்றம்', 'Language & look')}</h2>
        <div className="two">
          <Seg full value={settings.lang} onChange={(lang) => saveSettings({ lang })} options={[{ value: 'ta', label: 'தமிழ்' }, { value: 'en', label: 'English' }]} />
          <Seg full value={settings.theme} onChange={(theme) => saveSettings({ theme })} options={[{ value: 'light', label: tr('வெளிச்சம்', 'Light'), icon: 'sun' }, { value: 'dark', label: tr('இருள்', 'Dark'), icon: 'moon' }]} />
        </div>
      </div>

      <div className="card">
        <div className="card__row">
          <h2 className="card__title"><Icon name="egg" /> {tr('முட்டை வகைகள் & விலை', 'Egg types & rates')}</h2>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setProduct(null)}><Icon name="plus" size={18} /> {tr('புதியது', 'Add')}</button>
        </div>
        <ul className="mini-list">
          {data.products.map((p) => (
            <li key={p.id} className={p.active === false ? 'off' : ''}>
              <EggDot tone={p.tone} size={30} />
              <span className="grow"><b>{tr(p.ta, p.en)}</b><small>{tr('சில்லறை', 'Retail')} {money(p.retailRate)} · {tr('மொத்தம்', 'Wholesale')} {money(p.wholesaleRate)}</small></span>
              <button type="button" className="icon-btn icon-btn--sm" onClick={() => setProduct(p)} aria-label="Edit"><Icon name="edit" size={18} /></button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 className="card__title"><Icon name="store" /> {tr('கடை விவரம் (பில்லில் வரும்)', 'Shop details (on bills)')}</h2>
        <div className="two">{field('shopTa', 'கடை பெயர் (தமிழ்)')}{field('shopEn', 'Shop name (English)')}</div>
        <div className="two">{field('ownerTa', 'உரிமையாளர்')}{field('ownerEn', 'Owner (English)')}</div>
        <div className="two">{field('phone', 'Phone', { inputMode: 'tel' })}{field('tagTa', tr('வாசகம்', 'Tagline'))}</div>
        {field('addressTa', 'முகவரி (தமிழ்)')}
        {field('addressEn', 'Address (English)')}
        <button type="button" className="btn btn-primary btn-block" onClick={saveShop}><Icon name="check" /> {tr('சேமி', 'Save')}</button>
      </div>

      <div className="card">
        <h2 className="card__title"><Icon name="qr" /> {tr('UPI பணம் பெற', 'Receive UPI payments')}</h2>
        <p className="muted">{tr('வாடிக்கையாளர் app-ல் இந்த QR தெரியும்.', 'Customers see this QR in their app.')}</p>
        <div className="upi-row">
          {settings.upiQr ? <img className="upi-qr" src={settings.upiQr} alt="UPI QR" /> : <div className="upi-qr upi-qr--empty"><Icon name="qr" size={40} /></div>}
          <div className="grow">
            {field('upiId', 'UPI ID', { placeholder: 'shop@okaxis' })}
            <div className="actions actions--wrap">
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => qrRef.current?.click()}><Icon name="upload" size={18} /> {tr('QR படம் போடு', 'Upload QR')}</button>
              {settings.upiQr && <button type="button" className="btn btn-sm btn-ghost-danger" onClick={() => saveSettings({ upiQr: null })}><Icon name="trash" size={18} /></button>}
              <button type="button" className="btn btn-sm btn-primary" onClick={saveShop}><Icon name="check" size={18} /> {tr('சேமி', 'Save')}</button>
            </div>
          </div>
          <input ref={qrRef} type="file" accept="image/*" hidden onChange={onQr} />
        </div>
      </div>

      <div className="card">
        <h2 className="card__title"><Icon name="lock" /> {tr('பாதுகாப்பு', 'Security')}</h2>
        <button type="button" className="row-btn" onClick={() => setPinOpen(true)}><Icon name="lock" /> <span className="grow">{tr('Owner PIN மாற்று', 'Change owner PIN')}</span><Icon name="right" /></button>
      </div>

      <div className="card">
        <h2 className="card__title"><Icon name="download" /> {tr('Backup (பாதுகாப்பு நகல்)', 'Backup')}</h2>
        <p className="muted">{tr('வாரம் ஒரு முறை backup எடுத்து WhatsApp / Drive-ல் வைக்கவும்.', 'Take a backup once a week and keep it in WhatsApp / Drive.')}</p>
        <button type="button" className="row-btn" onClick={exportBackup}><Icon name="download" /> <span className="grow">{tr('Backup எடு', 'Download backup')}</span><Icon name="right" /></button>
        <button type="button" className="row-btn" onClick={() => fileRef.current?.click()}><Icon name="upload" /> <span className="grow">{tr('Backup-லிருந்து மீட்டெடு', 'Restore from backup')}</span><Icon name="right" /></button>
        <button type="button" className="row-btn danger" onClick={() => setConfirm('demo')}><Icon name="back" /> <span className="grow">{tr('Demo தரவை மீண்டும் போடு', 'Reset demo data')}</span><Icon name="right" /></button>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) setConfirm({ file }) }} />
      </div>

      <p className="foot-note">{tr(settings.shopTa, settings.shopEn)} · v1.0</p>

      {product !== undefined && <ProductForm p={product} onClose={() => setProduct(undefined)} />}
      {pinOpen && <PinChange onClose={() => setPinOpen(false)} />}
      {confirm && <Confirm needPin text={confirm === 'demo' ? tr('இப்போதுள்ள எல்லா தரவும் அழிந்து demo தரவு வரும். சரியா?', 'All current data will be replaced with demo data. OK?') : tr('இப்போதுள்ள தரவு backup-ல் உள்ளதால் மாற்றப்படும். சரியா?', 'Current data will be replaced by the backup. OK?')}
        onNo={() => setConfirm(null)}
        onYes={async () => {
          try {
            if (confirm === 'demo') await seedDemo(); else await importBackup(confirm.file)
            toast(tr('முடிந்தது', 'Done'))
          } catch { toast(tr('தவறான கோப்பு', 'Invalid file'), 'error') }
          setConfirm(null)
        }} />}
    </section>
  )
}
