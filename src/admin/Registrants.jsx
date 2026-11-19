import { useMemo, useState } from 'react'
import { checkIn } from './api.js'

const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

export default function Registrants({ rows, loading, error, onRefresh, onCheckedIn }) {
  const [q, setQ] = useState('')
  const [f, setF] = useState('all')
  const [busy, setBusy] = useState('')

  const total = rows.length
  const done = rows.filter((r) => r.checkedInAt).length
  const pct = total ? Math.round((done / total) * 100) : 0

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows.filter((r) => {
      const hit = !s || [r.name, r.matric, r.email, r.reference].some((x) => x?.toLowerCase().includes(s))
      const st = f === 'all' || (f === 'in' && r.checkedInAt) || (f === 'out' && !r.checkedInAt)
      return hit && st
    })
  }, [rows, q, f])

  async function manual(r) {
    setBusy(r.id)
    try {
      const res = await checkIn(r.reference)
      if (res.registrant) onCheckedIn(res.registrant)
    } finally {
      setBusy('')
    }
  }

  function exportCsv() {
    const head = ['Name', 'Matric no', 'Programme', 'Email', 'Reference', 'Registered', 'Checked in']
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = [head, ...list.map((r) => [r.name, r.matric, r.programme, r.email, r.reference, r.registeredAt, r.checkedInAt || ''])]
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
        <div><span>Checked in</span><b>{done}</b></div>
        <div><span>Not yet arrived</span><b>{total - done}</b></div>
        <div>
          <span>Attendance</span><b>{pct}%</b>
          <div className="ad-bar"><i style={{ width: pct + '%' }} /></div>
        </div>
      </div>

      <div className="ad-toolbar">
        <input type="search" placeholder="Search name, matric no, email or code" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search registrants" />
        <select value={f} onChange={(e) => setF(e.target.value)} aria-label="Filter by status">
          <option value="all">All</option>
          <option value="in">Checked in</option>
          <option value="out">Not yet arrived</option>
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
                <td data-l="Programme">{r.programme}</td>
                <td data-l="Email">{r.email}</td>
                <td data-l="Registered">{fmt(r.registeredAt)}</td>
                <td data-l="Status">
                  {r.checkedInAt
                    ? <span className="ad-pill ad-pill--in">In · {fmt(r.checkedInAt)}</span>
                    : <span className="ad-pill">Not yet</span>}
                </td>
                <td>
                  {!r.checkedInAt && (
                    <button className="btn btn--ghost btn--sm" onClick={() => manual(r)} disabled={busy === r.id}>
                      {busy === r.id ? 'Checking in' : 'Check in'}
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
    </>
  )
}
