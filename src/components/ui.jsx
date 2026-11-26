import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useShop } from '../lib/store'
import { money } from '../lib/format'

// ---------- Icons (clean line icons, inline SVG — work offline) ----------
const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  bill: 'M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4',
  orders: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
  users: 'M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14.5h.01',
  egg: 'M12 3c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11z',
  broken: 'M12 3c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11zM8 12l2 2 2-3 2 3 2-2',
  tray: 'M3 5h18v14H3zM8 5v14M13 5v14M3 10h18M3 15h18',
  truck: 'M2 6h11v10H2zM13 9h4l4 4v3h-8M6 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01',
  factory: 'M3 21V9l6 4V9l6 4V5h6v16zM7 17h2M13 17h2M17 17h2',
  expense: 'M12 3v13m0 0-5-5m5 5 5-5M4 21h16',
  chart: 'M4 20V11M10 20V4M16 20v-6M22 20H2',
  staff: 'M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M4 21a8 8 0 0 1 16 0M12 15v6',
  activity: 'M12 8v4l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z',
  more: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  x: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12l5 5L20 7',
  search: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM21 21l-4.3-4.3',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  whatsapp: 'M3 21l1.7-4.8A9 9 0 1 1 8 19.5zM8.5 9c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-.9-.8.9A4 4 0 0 1 10 10.6l.9-.8-.9-2z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  store: 'M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6',
  calendar: 'M4 5h16v16H4zM4 9h16M8 3v4M16 3v4',
  cash: 'M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 9v.01M18 15v.01',
  qr: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3zM14 21v-1M21 14v1',
  credit: 'M6 2h12M6 22h12M7 2v4a5 5 0 0 0 10 0V2M7 22v-4a5 5 0 0 1 10 0v4',
  right: 'M9 6l6 6-6 6',
  left: 'M15 6l-6 6 6 6',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20',
  download: 'M12 3v12m0 0-5-5m5 5 5-5M4 21h16',
  upload: 'M12 21V9m0 0-5 5m5-5 5 5M4 3h16',
  print: 'M6 9V3h12v6M6 18H4v-7h16v7h-2M6 14h12v7H6z',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  pin: 'M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  back: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
}
export function Icon({ name, size = 22, stroke = 1.9, className = '' }) {
  return (
    <svg className={`ic ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] ?? P.info} />
    </svg>
  )
}

// Egg badge coloured by egg type.
export function EggDot({ tone = 'white', size = 36 }) {
  return <span className={`egg egg--${tone}`} style={{ width: size * 0.78, height: size }} aria-hidden="true"></span>
}

export function Avatar({ name = '?', tone = 0, size = 44 }) {
  const initials = name.replace(/\(.*?\)/g, '').trim().split(/\s+/).map((w) => [...w][0]).slice(0, 2).join('')
  return <span className={`avatar avatar--${tone % 6}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials}</span>
}

// ---------- Modal / bottom sheet ----------
export function Modal({ open = true, onClose, title, icon, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('no-scroll') }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="sheet-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`sheet${wide ? ' sheet--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet__grab" aria-hidden="true"></div>
        {title && (
          <header className="sheet__head">
            {icon && <span className="sheet__icon"><Icon name={icon} /></span>}
            <h2>{title}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
          </header>
        )}
        <div className="sheet__body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

// Confirm, optionally asking for the owner PIN (for delete / price changes).
export function Confirm({ text, onYes, onNo, danger = true, needPin = false }) {
  const { tr, checkPin } = useShop()
  const [pin, setPin] = useState('')
  const [err, setErr] = useState(false)
  const ok = () => {
    if (needPin && !checkPin(pin)) { setErr(true); setPin(''); return }
    onYes()
  }
  return (
    <Modal onClose={onNo} title={tr('உறுதி செய்யவும்', 'Please confirm')} icon={danger ? 'alert' : 'info'}>
      <p className="confirm-text">{text}</p>
      {needPin && (
        <>
          <p className="label">{tr('Owner PIN', 'Owner PIN')}</p>
          <PinPad value={pin} onChange={(v) => { setPin(v); setErr(false) }} error={err} onDone={ok} />
        </>
      )}
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={onNo}>{tr('வேண்டாம்', 'Cancel')}</button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={ok} disabled={needPin && pin.length < 4}>
          <Icon name="check" size={20} /> {tr('சரி', 'Yes')}
        </button>
      </div>
    </Modal>
  )
}

// Big number keypad — easy for anyone (login PIN, owner PIN).
export function PinPad({ value, onChange, length = 4, error = false, onDone }) {
  const press = (k) => {
    if (k === 'del') return onChange(value.slice(0, -1))
    if (value.length >= length) return
    const next = value + k
    onChange(next)
    if (next.length === length) setTimeout(() => onDone?.(next), 120)
  }
  return (
    <div className={`pinpad${error ? ' is-error' : ''}`}>
      <div className="pinpad__dots">{Array.from({ length }, (_, i) => <span key={i} className={i < value.length ? 'on' : ''}></span>)}</div>
      <div className="pinpad__keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k, i) => (k === '' ? <span key={i}></span> : (
          <button key={i} type="button" onClick={() => press(k)} aria-label={k === 'del' ? 'Delete' : k}>
            {k === 'del' ? <Icon name="back" size={22} /> : k}
          </button>
        )))}
      </div>
    </div>
  )
}

export function Toasts() {
  const { toasts } = useShop()
  return createPortal(
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`}><Icon name={t.kind === 'error' ? 'alert' : 'check'} size={20} /> {t.text}</div>
      ))}
    </div>,
    document.body,
  )
}

export function Seg({ value, onChange, options, full = false }) {
  return (
    <div className={`seg${full ? ' seg--full' : ''}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={18} />}{o.label}
        </button>
      ))}
    </div>
  )
}

export function CountUp({ value, format = money }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    let raf = 0
    const step = (t) => {
      const p = Math.min(1, (t - start) / 700)
      setShown(a + (value - a) * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step)
      else from.current = value
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{format(shown)}</>
}

export function PageHead({ icon, title, sub, action }) {
  return (
    <header className="page-head">
      <span className="page-head__icon"><Icon name={icon} size={26} /></span>
      <div className="grow">
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </header>
  )
}

export function Empty({ icon = 'info', text }) {
  return <div className="empty"><span><Icon name={icon} size={34} /></span><p>{text}</p></div>
}

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <label className="search">
      <Icon name="search" size={20} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {value && <button type="button" onClick={() => onChange('')} aria-label="Clear"><Icon name="x" size={18} /></button>}
    </label>
  )
}

// Bars that can go below zero (losses).
export function BarChart({ data, field, labelOf }) {
  const [active, setActive] = useState(null)
  const vals = data.map((d) => d[field] || 0)
  const pos = Math.max(0, ...vals)
  const neg = Math.max(0, ...vals.map((v) => -v))
  const range = Math.max(1, pos + neg)
  const zero = (neg / range) * 100
  return (
    <div className="chart">
      <div className="chart__bars">
        {neg > 0 && <span className="chart__zero" style={{ bottom: `${zero}%` }}></span>}
        {data.map((d, i) => {
          const v = vals[i]
          const h = (Math.abs(v) / range) * 100
          return (
            <button key={d.key} type="button" className={`chart__col${active === i ? ' on' : ''}`} onClick={() => setActive(active === i ? null : i)} aria-label={`${labelOf(d)} ${money(v)}`}>
              {active === i && <span className="chart__tip" style={{ bottom: `calc(${zero + (v > 0 ? h : 0)}% + 6px)` }}>{money(v)}</span>}
              <span className={`chart__bar${v < 0 ? ' neg' : ''}`} style={{ height: `${h}%`, bottom: v < 0 ? `${zero - h}%` : `${zero}%`, animationDelay: `${i * 20}ms` }}></span>
            </button>
          )
        })}
      </div>
      <div className="chart__labels">
        {data.map((d, i) => <span key={d.key}>{data.length > 16 ? (i % Math.ceil(data.length / 8) === 0 ? labelOf(d) : '') : labelOf(d)}</span>)}
      </div>
    </div>
  )
}

// Number stepper with big buttons (eggs, trays).
export function Stepper({ value, onChange, step = 1, min = 0 }) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(Math.max(min, value - step))} aria-label="minus"><Icon name="minus" /></button>
      <input type="number" inputMode="numeric" value={value} min={min} onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))} />
      <button type="button" onClick={() => onChange(value + step)} aria-label="plus"><Icon name="plus" /></button>
    </div>
  )
}

