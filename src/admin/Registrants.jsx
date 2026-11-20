import { useEffect, useMemo, useState } from 'react'
import { getParticipantDetail } from './api.js'
import ParticipantCard from './ParticipantCard.jsx'
import Icon from './Icon.jsx'

const PAGE = 12
const fmt = (d) => (d ? new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '')
const PILL = { APPROVED: 'in', PENDING: 'warn', REJECTED: 'bad', CANCELLED: 'bad' }
const initials = (n = '') => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

export default function Registrants({ rows, loading, onGo }) {
  const [q, setQ] = useState('')
  const [f, setF] = useState('all')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState(null) // { loading, person, error }

  const counts = useMemo(
    () => ({
      all: rows.length,
      PENDING: rows.filter((r) => r.status === 'PENDING').length,
      APPROVED: rows.filter((r) => r.status === 'APPROVED').length,
      IN: rows.filter((r) => r.checkedInAt).length,
      REJECTED: rows.filter((r) => r.status === 'REJECTED' || r.status === 'CANCELLED').length,
    }),
    [rows]
  )

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows.filter((r) => {
      const hit = !s || [r.name, r.matric, r.email, r.reference].some((x) => x?.toLowerCase().includes(s))
      const st =
        f === 'all' ||
        (f === 'IN' ? !!r.checkedInAt : f === 'REJECTED' ? r.status === 'REJECTED' || r.status === 'CANCELLED' : r.status === f)
      return hit && st
    })
  }, [rows, q, f])

  const pages = Math.max(1, Math.ceil(list.length / PAGE))
  const cur = Math.min(page, pages)
  const shown = list.slice((cur - 1) * PAGE, cur * PAGE)

  useEffect(() => {
    if (!viewing) return
    const onKey = (e) => e.key === 'Escape' && setViewing(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewing])

  async function view(r) {
    setViewing({ loading: true, person: null, error: '' })
    try {
      setViewing({ loading: false, person: await getParticipantDetail(r.id), error: '' })
    } catch (e) {
      setViewing({ loading: false, person: null, error: e.message })
    }
  }

  function exportCsv() {
    const head = ['Name', 'Matric no', 'Programme', 'Graduation year', 'Email', 'Reference', 'Registration status', 'Registered', 'Checked in']
    const esc = (v) => {
      let s = String(v ?? '')
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
      return `"${s.replace(/"/g, '""')}"`
    }
    const lines = [head, ...list.map((r) => [r.name, r.matric, r.programme, r.graduationYear, r.email, r.reference, r.status, r.registeredAt, r.checkedInAt || ''])]
    const blob = new Blob(['\ufeff' + lines.map((l) => l.map(esc).join(',')).join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'uabs-registrants.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const chips = [
    ['all', 'All'],
    ['PENDING', 'Pending'],
    ['APPROVED', 'Approved'],
    ['IN', 'Checked in'],
    ['REJECTED', 'Rejected'],
  ]

  return (
    <>
      <div className="ad-toolbar">
        <label className="ad-search">
          <Icon name="search" size={18} />
          <input type="search" placeholder="Search name, matric no, email or code" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} aria-label="Search registrants" />
        </label>
        <button className="btn btn--ghost btn--sm ad-iconbtn" onClick={exportCsv} disabled={!list.length}>
          <Icon name="download" size={17} /> Export CSV
        </button>
      </div>

      <div className="chips" role="tablist" aria-label="Filter by status">
        {chips.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={f === id} className={f === id ? 'is-active' : ''} onClick={() => { setF(id); setPage(1) }}>
            {label} <em>{counts[id]}</em>
          </button>
        ))}
      </div>

      <div className="ad-table">
        <table>
          <thead>
            <tr><th>Participant</th><th>Matric no.</th><th>Programme</th><th>Registered</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id}>
                <td data-l="Participant">
                  <div className="who">
                    <span className="who__av">{initials(r.name)}</span>
                    <div><strong>{r.name}</strong><small>{r.email}</small></div>
                  </div>
                </td>
                <td data-l="Matric no.">{r.matric || '-'}</td>
                <td data-l="Programme">{r.programme}{r.graduationYear ? ` · ${r.graduationYear}` : ''}</td>
                <td data-l="Registered">{fmt(r.registeredAt)}</td>
                <td data-l="Status">
                  <span className={`ad-pill ad-pill--${PILL[r.status] || ''}`}>{r.status}</span>
                  {r.checkedInAt && <small>Checked in · {fmt(r.checkedInAt)}</small>}
                </td>
                <td className="ad-actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => view(r)}>Details</button>
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr><td colSpan="6" className="ad-empty">{loading ? 'Loading registrants…' : rows.length ? 'No one matches this search.' : 'No registrations yet.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {list.length > PAGE && (
        <div className="pager">
          <span>{(cur - 1) * PAGE + 1}–{Math.min(cur * PAGE, list.length)} of {list.length}</span>
          <div>
            <button className="btn btn--ghost btn--sm" disabled={cur <= 1} onClick={() => setPage(cur - 1)}>Previous</button>
            <button className="btn btn--ghost btn--sm" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Next</button>
          </div>
        </div>
      )}

      {viewing && (
        <div className="drawer" role="dialog" aria-modal="true" aria-label="Registrant details" onClick={() => setViewing(null)}>
          <div className="drawer__panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer__head">
              <h2>Registrant details</h2>
              <button onClick={() => setViewing(null)} aria-label="Close"><Icon name="close" /></button>
            </div>
            {viewing.loading && <p className="muted">Loading details…</p>}
            {viewing.error && <p className="server-error">{viewing.error}</p>}
            {viewing.person && (
              <>
                <ParticipantCard participant={viewing.person} />
                {viewing.person.registrationStatus === 'PENDING' && (
                  <div className="notice">
                    <strong>Approval happens at the scanner.</strong>
                    <p>To approve or reject this registration, scan the participant’s QR code. Their details and photo will open there with the approval buttons.</p>
                    <button className="btn btn--gold btn--sm" onClick={() => { setViewing(null); onGo('scanner') }}>Open scanner</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}