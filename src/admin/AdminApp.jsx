
import { useCallback, useEffect, useState } from 'react'
import Login from './Login.jsx'
import Registrants from './Registrants.jsx'
import Scanner from './Scanner.jsx'
import { getRegistrations, isAuthed, logout } from './api.js'
import './admin.css'

export default function AdminApp() {
  const [authed, setAuthed] = useState(isAuthed())
  const [tab, setTab] = useState('registrants')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load registrations from the backend
  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getRegistrations()

      // Support either an array or { data: [...] } response
      const registrations = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : null

      if (!registrations) {
        throw new Error('Invalid registrations response from server.')
      }

      setRows(registrations)
    } catch (e) {
      setError(e.message || 'Could not load registrations.')

      if (!isAuthed()) {
        setAuthed(false)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch registrations after authentication
  useEffect(() => {
    if (authed) {
      load()
    }
  }, [authed, load])

  // Update a registrant after successful check-in
  const onCheckedIn = (r) => {
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? { ...x, ...r }
          : x
      )
    )
  }

  // Sign out admin
  const handleLogout = () => {
    logout()
    setRows([])
    setError('')
    setAuthed(false)
    setTab('registrants')
  }

  // Show login screen when not authenticated
  if (!authed) {
    return <Login onDone={() => setAuthed(true)} />
  }

  return (
    <div className="ad">
      <header className="ad-top">
        <div className="ad-top__in">
          <div className="ad-brand">
            <img src="/logo.jpeg" alt="UABS Alumni Launch" />

            <div>
              <strong>UABS Alumni Launch</strong>
              <span>Admin Dashboard</span>
            </div>
          </div>

          <nav className="ad-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'registrants'}
              onClick={() => setTab('registrants')}
            >
              Registrants
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={tab === 'scanner'}
              onClick={() => setTab('scanner')}
            >
              Scanner
            </button>
          </nav>

          <button
            type="button"
            className="btn btn--ghost-light btn--sm"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="ad-main">
        {tab === 'registrants' ? (
          <Registrants
            rows={rows}
            loading={loading}
            error={error}
            onRefresh={load}
            onCheckedIn={onCheckedIn}
          />
        ) : (
          <Scanner onCheckedIn={onCheckedIn} />
        )}
      </main>
    </div>
  )
}
