import { useMemo, useState } from 'react'
import { approveRegistration, getParticipantDetail, rejectRegistration } from './api.js'
import ParticipantCard from './ParticipantCard.jsx'

const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

const PILL = { APPROVED: 'in', PENDING: 'warn', REJECTED: 'bad', CANCELLED: 'bad' }

export default function Registrants({ rows, loading, error, onRefresh, onUpdated }) {
  const [q, setQ] = useState('')
  const [f, setF] = useState('all')
  const [busy, setBusy] = useState('')
  const [viewing, setViewing] = useState(null) // { loading, person, error }
  const [actionError, setActionError] = useState('')

  const total = rows.length
  const pending = rows.filter((r) => r.status === 'PENDING').length
  const approved = rows.filter((r) => r.status === 'APPROVED').length
  const done = rows.filter((r) => r.checkedInAt).length
  const pct = approved ? Math.round((done / approved) * 100) : 0

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows.filter((r) => {
      const hit = !s || [r.name, r.matric, r.email, r.reference].some((x) => x?.toLowerCase().includes(s))
      const st = f === 'all' || (f === 'IN' ? !!r.checkedInAt : r.status === f)
      return hit && st
    })
  }, [rows, q, f])

  async function quickApprove(r) {
    setBusy(r.id)
    try {
      await approveRegistration(r.id)
      onUpdated(r.id, { status: 'APPROVED' })
    } catch (e) {
      window.alert(e.message)
    } finally {
      setBusy('')
    }
  }

  async function view(r) {
    setActionError('')
    setViewing({ loading: true, person: null, error: '' })
    try {
      setViewing({ loading: false, person: await getParticipantDetail(r.id), error: '' })
    } catch (e) {
      setViewing({ loading: false, person: null, error: e.message })
    }
  }

  async function modalAction(fn, status) {
    const id = viewing.person.id
    setBusy(id)
    setActionError('')
    try {
      await fn()
      setViewing((v) => ({ ...v, person: { ...v.person, registrationStatus: status } }))
      onUpdated(id, { status })
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusy('')
    }
  }

  function exportCsv() {
    const head = ['Name', 'Matric no', 'Programme', 'Graduation year', 'Email', 'Reference', 'Registration status', 'Registered', 'Checked in']
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = [head, ...list.map((r) => [r.name, r.matric, r.programme, r.graduationYear, r.email, r.reference, r.status, r.registeredAt, r.checkedInAt || ''])]
    const blob = new Blob([lines.map((l) => l.map(esc).join(',')).join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'uabs-registrants.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <div className="ad-stats">
        <div><span>Registered</span><b>{total}</b></div>
        <div><span>Pending approval</span><b>{pending}</b></div>
        <div><span>Checked in</span><b>{done}</b></div>
        <div>
          <span>Attendance (of approved)</span><b>{pct}%</b>
          <div className="ad-bar"><i style={{ width: pct + '%' }} /></div>
        </div>
      </div>

      <div className="ad-toolbar">
        <input type="search" placeholder="Search name, matric no, email or code" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search registrants" />
        <select value={f} onChange={(e) => setF(e.target.value)} aria-label="Filter by status">
          <option value="all">All</option>
          <option value="PENDING">Pending approval</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="IN">Checked in</option>
        </select>
        <button className="btn btn--ghost btn--sm" onClick={onRefresh} disabled={loading}>{loading ? 'Refreshing' : 'Refresh'}</button>
        <button className="btn btn--ghost btn--sm" onClick={exportCsv} disabled={!list.length}>Export CSV</button>
      </div>

      {error && <p className="server-error" role="alert">{error}</p>}

      <div className="ad-table">
        <table>
          <thead>
            <tr><th>Name</th><th>Matric no.</th><th>Programme</th><th>Email</th><th>Registered</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td data-l="Name"><strong>{r.name}</strong><small>{r.reference}</small></td>
                <td data-l="Matric no.">{r.matric}</td>
                <td data-l="Programme">{r.programme}{r.graduationYear ? ` · ${r.graduationYear}` : ''}</td>
                <td data-l="Email">{r.email}</td>
                <td data-l="Registered">{fmt(r.registeredAt)}</td>
                <td data-l="Status">
                  <span className={`ad-pill ad-pill--${PILL[r.status] || ''}`}>{r.status}</span>
                  {r.checkedInAt && <small>In · {fmt(r.checkedInAt)}</small>}
                </td>
                <td className="ad-actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => view(r)}>View</button>
                  {r.status === 'PENDING' && (
                    <button className="btn btn--gold btn--sm" onClick={() => quickApprove(r)} disabled={busy === r.id}>
                      {busy === r.id ? 'Approving' : 'Approve'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr><td colSpan="7" className="ad-empty">{loading ? 'Loading registrants' : total ? 'No one matches this search.' : 'No registrations yet.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewing && (
        <div className="ad-modal" role="dialog" aria-modal="true" aria-label="Registrant details" onClick={() => setViewing(null)}>
          <div className="ad-modal__box" onClick={(e) => e.stopPropagation()}>
            <button className="ad-modal__close" onClick={() => setViewing(null)} aria-label="Close">×</button>
            {viewing.loading && <p>Loading details</p>}
            {viewing.error && <p className="server-error">{viewing.error}</p>}
            {viewing.person && (
              <ParticipantCard
                participant={viewing.person}
                busy={busy === viewing.person.id}
                error={actionError}
                onApprove={() => modalAction(() => approveRegistration(viewing.person.id), 'APPROVED')}
                onReject={(reason) => modalAction(() => rejectRegistration(viewing.person.id, reason), 'REJECTED')}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
