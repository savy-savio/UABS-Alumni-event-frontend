import { useCallback, useEffect, useState } from 'react'
import Login from './Login.jsx'
import Registrants from './Registrants.jsx'
import Scanner from './Scanner.jsx'
import { getRegistrations, isAuthed, logout, IS_DEMO } from './api.js'
import './admin.css'

export default function AdminApp() {
  const [authed, setAuthed] = useState(isAuthed())
  const [tab, setTab] = useState('registrants')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const onUpdated = (id, patch) =>
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const onCheckedIn = (r) => onUpdated(r.id, { checkedInAt: r.checkedInAt })

  if (!authed) return <Login onDone={() => setAuthed(true)} />

  return (
    <div className="ad">
      <header className="ad-top">
        <div className="ad-top__in">
          <div className="ad-brand">
            <img src="/logo.jpeg" alt="" />
            <div>
              <strong>UABS Alumni Launch</strong>
              <span>Admin{IS_DEMO ? ' (backend not connected)' : ''}</span>
            </div>
          </div>
          <nav className="ad-tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'registrants'} onClick={() => setTab('registrants')}>Registrants</button>
            <button role="tab" aria-selected={tab === 'scanner'} onClick={() => setTab('scanner')}>Scanner</button>
          </nav>
          <button className="btn btn--ghost-light btn--sm" onClick={() => { logout(); setAuthed(false) }}>Sign out</button>
        </div>
      </header>

      <main className="ad-main">
        {tab === 'registrants' ? (
          <Registrants rows={rows} loading={loading} error={error} onRefresh={load} onUpdated={onUpdated} />
        ) : (
          <Scanner onCheckedIn={onCheckedIn} onUpdated={onUpdated} />
        )}
      </main>
    </div>
  )
}
