import { useCallback, useEffect, useState } from 'react'
import Login from './Login.jsx'
import Overview from './Overview.jsx'
import Registrants from './Registrants.jsx'
import Scanner from './Scanner.jsx'
// import Icon from './Icon.jsx'
import Icon from '../Icon.jsx'
import { getAdmin, getRegistrations, isAuthed, logout, IS_DEMO } from './api.js'
import './admin.css'

const VIEWS = {
  overview: { label: 'Overview', title: 'Overview', icon: 'overview' },
  registrants: { label: 'Registrants', title: 'Registrants', icon: 'users' },
  scanner: { label: 'Scan & Approve', title: 'Scan & Approve', icon: 'scan' },
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(isAuthed())
  const [view, setView] = useState('overview')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const admin = getAdmin()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRows(await getRegistrations())
    } catch (e) {
      setError(e.message)
      if (!isAuthed()) setAuthed(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (authed) load() }, [authed, load])

      // Each admin section starts at the top, instead of keeping the old scroll position
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [view])

  const onUpdated = (id, patch) => setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const onCheckedIn = (r) => onUpdated(r.id, { checkedInAt: r.checkedInAt })

  if (!authed) return <Login onDone={() => setAuthed(true)} />

  const pending = rows.filter((r) => r.status === 'PENDING').length
  const name = admin?.fullName || 'Administrator'

  return (
    <div className="ad">
      <aside className="ad-side">
        <div className="ad-brand">
          <img src="/logo.jpeg" alt="" />
          <div>
            <strong>UABS Alumni</strong>
            <span>Launch 2026</span>
          </div>
        </div>

        <nav className="ad-nav" aria-label="Admin sections">
          {Object.entries(VIEWS).map(([id, v]) => (
            <button key={id} className={view === id ? 'is-active' : ''} onClick={() => setView(id)} aria-current={view === id ? 'page' : undefined}>
              <Icon name={v.icon} />
              <span>{v.label}</span>
              {id === 'scanner' && pending > 0 && <em className="ad-badge">{pending}</em>}
            </button>
          ))}
        </nav>

        <div className="ad-side__foot">
          <div className="ad-user">
            <span className="ad-user__avatar">{name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}</span>
            <div>
              <strong>{name}</strong>
              <span>{admin?.role ? admin.role.replace('_', ' ').toLowerCase() : 'admin'}</span>
            </div>
          </div>
          <button className="ad-signout" onClick={() => { logout(); setAuthed(false) }}>
            <Icon name="logout" size={18} /> Sign out
          </button>
        </div>
      </aside>

      <div className="ad-body">
        <header className="ad-head">
          <div>
            <h1>{VIEWS[view].title}</h1>
            <p className="muted">{IS_DEMO ? 'Backend not connected' : new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <button className="btn btn--ghost btn--sm ad-iconbtn" onClick={load} disabled={loading}>
            <Icon name="refresh" size={17} /> {loading ? 'Refreshing' : 'Refresh'}
          </button>
        </header>

        <main className="ad-main">
          {error && <p className="ad-alert" role="alert">{error}</p>}
          {view === 'overview' && <Overview rows={rows} loading={loading} onGo={setView} admin={admin} />}
          {view === 'registrants' && <Registrants rows={rows} loading={loading} onGo={setView} />}
          {view === 'scanner' && <Scanner onCheckedIn={onCheckedIn} onUpdated={onUpdated} />}
        </main>
      </div>
    </div>
  )
}