import { useEffect, useState } from 'react'
import { useShop } from './lib/store'
import { Icon, PinPad, Toasts } from './components/ui'
import Dashboard from './pages/Dashboard'
import Billing from './pages/Billing'
import Orders from './pages/Orders'
import Customers from './pages/Customers'
import Credit from './pages/Credit'
import Stock from './pages/Stock'
import Trays from './pages/Trays'
import Delivery from './pages/Delivery'
import Suppliers from './pages/Suppliers'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import Staff from './pages/Staff'
import Activity from './pages/Activity'
import Settings from './pages/Settings'
import { CustomerHome, CustomerOrder, CustomerHistory } from './pages/CustomerPages'

// Pages each role can open, and the bottom navigation for each.
const PAGES = {
  dashboard: Dashboard, billing: Billing, orders: Orders, customers: Customers, credit: Credit, stock: Stock,
  trays: Trays, delivery: Delivery, suppliers: Suppliers, expenses: Expenses, reports: Reports, staff: Staff,
  activity: Activity, settings: Settings, more: More, chome: CustomerHome, corder: CustomerOrder, chistory: CustomerHistory,
}
const NAV = {
  owner: [['dashboard', 'home', 'முகப்பு', 'Home'], ['billing', 'bill', 'பில்', 'Bill'], ['orders', 'orders', 'ஆர்டர்', 'Orders'], ['customers', 'users', 'வாடிக்கையாளர்', 'Customers'], ['more', 'more', 'மேலும்', 'More']],
  staff: [['billing', 'bill', 'பில்', 'Bill'], ['delivery', 'truck', 'டெலிவரி', 'Delivery'], ['credit', 'wallet', 'வசூல்', 'Collect'], ['trays', 'tray', 'தட்டு', 'Trays']],
  customer: [['chome', 'home', 'முகப்பு', 'Home'], ['corder', 'plus', 'ஆர்டர் செய்', 'Order'], ['chistory', 'bill', 'என் கணக்கு', 'My account']],
}
const STAFF_ALLOWED = ['billing', 'delivery', 'credit', 'trays', 'orders']

// ---------- "More" — every owner module as big tiles ----------
function More({ goTo }) {
  const { tr, data } = useShop()
  const pending = data.orders.filter((o) => o.status === 'pending').length
  const tiles = [
    ['credit', 'wallet', 'கடன் & வசூல்', 'Credit & collection', 'green'], ['stock', 'egg', 'இருப்பு & கொள்முதல்', 'Stock & purchase', 'amber'],
    ['trays', 'tray', 'காலி தட்டு', 'Empty trays', 'teal'], ['delivery', 'truck', 'டெலிவரி', 'Delivery', 'blue'],
    ['suppliers', 'factory', 'சப்ளையர்', 'Suppliers', 'violet'], ['expenses', 'expense', 'வரவு / செலவு', 'Income / Expense', 'rose'],
    ['reports', 'chart', 'அறிக்கை & லாபம்', 'Reports & profit', 'green'], ['staff', 'staff', 'பணியாளர்கள்', 'Staff', 'blue'],
    ['activity', 'activity', 'யார் என்ன செய்தார்', 'Activity log', 'teal'], ['settings', 'settings', 'அமைப்புகள்', 'Settings', 'slate'],
  ]
  return (
    <section className="page">
      <header className="page-head">
        <span className="page-head__icon"><Icon name="more" size={26} /></span>
        <div className="grow"><h1>{tr('எல்லா வசதிகளும்', 'All features')}</h1><p>{tr('தொட்டு திறக்கவும்', 'Tap to open')}</p></div>
      </header>
      <div className="tiles">
        {tiles.map(([id, icon, ta, en, tone], i) => (
          <button key={id} type="button" className={`tile tile--${tone}`} style={{ animationDelay: `${i * 35}ms` }} onClick={() => goTo(id)}>
            <span className="tile__icon"><Icon name={icon} size={28} /></span>
            <b>{tr(ta, en)}</b>
            {id === 'delivery' && pending > 0 && <em>{pending}</em>}
          </button>
        ))}
      </div>
    </section>
  )
}

// ---------- Login ----------
function Login() {
  const { tr, settings, login, saveSettings } = useShop()
  const [role, setRole] = useState(null)
  const [code, setCode] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState(false)

  const tryLogin = (p = pin) => {
    if (!login(role, code, p)) { setErr(true); setPin('') }
  }
  const roles = [
    ['owner', 'store', 'உரிமையாளர்', 'Owner', tr('முழு கணக்கு', 'Full control')],
    ['staff', 'staff', 'பணியாளர்', 'Staff', tr('பில் & டெலிவரி', 'Billing & delivery')],
    ['customer', 'user', 'வாடிக்கையாளர்', 'Customer', tr('ஆர்டர் & என் கடன்', 'Order & my balance')],
  ]
  return (
    <div className="login">
      <div className="login__brand">
        <img src="./icon.svg" alt="" className="login__logo" />
        <h1>{tr(settings.shopTa, settings.shopEn)}</h1>
        <p className="login__tag">{tr(settings.tagTa, settings.tagEn)}</p>
        <p className="login__addr"><Icon name="pin" size={16} /> {tr('சென்னை', 'Chennai')} · <Icon name="phone" size={16} /> {settings.phone}</p>
      </div>

      <div className="login__card">
        {!role ? (
          <>
            <h2>{tr('நீங்கள் யார்?', 'Who are you?')}</h2>
            <div className="roles">
              {roles.map(([id, icon, ta, en, sub], i) => (
                <button key={id} type="button" className="role" style={{ animationDelay: `${i * 70}ms` }} onClick={() => { setRole(id); setErr(false) }}>
                  <span className="role__icon"><Icon name={icon} size={28} /></span>
                  <span className="grow"><b>{tr(ta, en)}</b><small>{sub}</small></span>
                  <Icon name="right" />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button type="button" className="link-back" onClick={() => { setRole(null); setPin(''); setCode(''); setErr(false) }}><Icon name="left" size={20} /> {tr('பின்செல்', 'Back')}</button>
            <h2>{roles.find((r) => r[0] === role)[tr(2, 3)]}</h2>
            {role !== 'owner' && (
              <label className="field">
                <span>{role === 'staff' ? tr('பணியாளர் ID (உதா: S01)', 'Staff ID (e.g. S01)') : tr('வாடிக்கையாளர் ID (உதா: C001)', 'Customer ID (e.g. C001)')}</span>
                <input className="input-big" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr(false) }} placeholder={role === 'staff' ? 'S01' : 'C001'} autoCapitalize="characters" />
              </label>
            )}
            <p className="label">{tr('4 இலக்க PIN', '4-digit PIN')}</p>
            <PinPad value={pin} onChange={(v) => { setPin(v); setErr(false) }} error={err} onDone={(v) => (role === 'owner' || code) && tryLogin(v)} />
            {err && <p className="error-text"><Icon name="alert" size={18} /> {tr('ID அல்லது PIN தவறு', 'Wrong ID or PIN')}</p>}
          </>
        )}
        <div className="demo-hint">
          <Icon name="info" size={18} />
          <span>{tr('Demo:', 'Demo:')} {tr('உரிமையாளர் PIN', 'Owner PIN')} <b>1234</b> · {tr('வாடிக்கையாளர்', 'Customer')} <b>C001</b> / <b>1111</b> · {tr('பணியாளர்', 'Staff')} <b>S01</b> / <b>2222</b></span>
        </div>
      </div>

      <button type="button" className="lang-pill" onClick={() => saveSettings({ lang: settings.lang === 'ta' ? 'en' : 'ta' })}>
        <Icon name="globe" size={18} /> {settings.lang === 'ta' ? 'English' : 'தமிழ்'}
      </button>
    </div>
  )
}

// ---------- App shell ----------
export default function App() {
  const { ready, me, tr, settings, saveSettings, logout, data } = useShop()
  const [page, setPage] = useState(null)

  useEffect(() => {
    if (!me) return
    const home = me.role === 'owner' ? 'dashboard' : me.role === 'staff' ? 'billing' : 'chome'
    setPage((p) => (p && canOpen(me.role, p) ? p : home))
  }, [me])

  if (!ready) return <div className="splash"><img src="./icon.svg" alt="" /><p>🥚 …</p></div>
  if (!me) return <><Login /><Toasts /></>

  const nav = NAV[me.role]
  const Current = PAGES[page] ?? PAGES[nav[0][0]]
  const pendingOrders = data.orders.filter((o) => o.status === 'pending').length
  const goTo = (p) => { if (canOpen(me.role, p)) { setPage(p); window.scrollTo({ top: 0 }) } }

  return (
    <div className={`app app--${me.role}`}>
      <header className="topbar">
        <img src="./icon.svg" alt="" className="topbar__logo" />
        <div className="topbar__title">
          <b>{tr(settings.shopTa, settings.shopEn)}</b>
          <small>{me.role === 'owner' ? tr('உரிமையாளர்', 'Owner') : me.role === 'staff' ? tr('பணியாளர்', 'Staff') : tr('வாடிக்கையாளர்', 'Customer')} · {me.name}</small>
        </div>
        <button type="button" className="icon-btn" onClick={() => saveSettings({ lang: settings.lang === 'ta' ? 'en' : 'ta' })} aria-label="Language" title={settings.lang === 'ta' ? 'English' : 'தமிழ்'}>
          <span className="lang-chip">{settings.lang === 'ta' ? 'EN' : 'த'}</span>
        </button>
        <button type="button" className="icon-btn" onClick={() => saveSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })} aria-label="Theme">
          <Icon name={settings.theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <button type="button" className="icon-btn" onClick={logout} aria-label={tr('வெளியேறு', 'Log out')} title={tr('வெளியேறு', 'Log out')}><Icon name="logout" /></button>
      </header>

      <nav className="nav" aria-label="Main">
        {nav.map(([id, icon, ta, en]) => (
          <button key={id} type="button" className={page === id || (id === 'more' && !nav.some((n) => n[0] === page)) ? 'on' : ''} onClick={() => goTo(id)}>
            <span className="nav__icon">
              <Icon name={icon} size={24} />
              {id === 'orders' && pendingOrders > 0 && <em>{pendingOrders}</em>}
            </span>
            <span>{tr(ta, en)}</span>
          </button>
        ))}
      </nav>

      <main className="main">
        <div key={page} className="page-anim"><Current goTo={goTo} /></div>
      </main>
      <Toasts />
    </div>
  )
}

function canOpen(role, page) {
  if (role === 'owner') return !['chome', 'corder', 'chistory'].includes(page)
  if (role === 'staff') return STAFF_ALLOWED.includes(page)
  return ['chome', 'corder', 'chistory'].includes(page)
}

