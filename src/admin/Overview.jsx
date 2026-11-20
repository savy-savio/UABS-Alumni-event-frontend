import { useMemo } from 'react'

const fmt = (d) => (d ? new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '')
const PILL = { APPROVED: 'in', PENDING: 'warn', REJECTED: 'bad', CANCELLED: 'bad' }

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Overview({ rows, loading, onGo, admin }) {
  const s = useMemo(() => {
    const count = (st) => rows.filter((r) => r.status === st).length
    const total = rows.length
    const approved = count('APPROVED')
    const pending = count('PENDING')
    const rejected = count('REJECTED')
    const cancelled = count('CANCELLED')
    const checkedIn = rows.filter((r) => r.checkedInAt).length
    const pct = approved ? Math.round((checkedIn / approved) * 100) : 0

    // Registrations per day, last 7 days
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({ key: d.toLocaleDateString('en-CA'), label: d.toLocaleDateString('en-NG', { weekday: 'short' }), n: 0 })
    }
    for (const r of rows) {
      const hit = days.find((x) => x.key === new Date(r.registeredAt).toLocaleDateString('en-CA'))
      if (hit) hit.n += 1
    }
    const max = Math.max(1, ...days.map((x) => x.n))
    return { total, approved, pending, rejected, cancelled, checkedIn, pct, days, max }
  }, [rows])

  const first = (admin?.fullName || '').split(/\s+/)[0]
  const waiting = rows.filter((r) => r.status === 'PENDING').slice(0, 5)
  const recent = rows.slice(0, 6)
  const seg = (n) => (s.total ? (n / s.total) * 100 : 0)

  return (
    <div className="ov">
      <section className="ov-hello">
        <div>
          <h2>{greeting()}{first ? `, ${first}` : ''}</h2>
          <p>
            {s.pending
              ? `${s.pending} registration${s.pending === 1 ? ' is' : 's are'} waiting for approval. Scan each person’s QR code to review their details and approve.`
              : 'Nothing is waiting for approval right now.'}
          </p>
        </div>
        <button className="btn btn--gold" onClick={() => onGo('scanner')}>Open scanner</button>
      </section>

      <section className="ad-stats">
        <div><span>Total registered</span><b>{s.total}</b></div>
        <div className="is-warn"><span>Awaiting approval</span><b>{s.pending}</b></div>
        <div><span>Approved</span><b>{s.approved}</b></div>
        <div><span>Checked in</span><b>{s.checkedIn}</b></div>
        <div>
          <span>Attendance (of approved)</span><b>{s.pct}%</b>
          <div className="ad-bar"><i style={{ width: s.pct + '%' }} /></div>
        </div>
      </section>

      <div className="ov-grid">
        <section className="card">
          <h3>Registrations, last 7 days</h3>
          <div className="spark" role="img" aria-label="Registrations per day for the last seven days">
            {s.days.map((d) => (
              <div key={d.key} className="spark__col">
                <b>{d.n || ''}</b>
                <i style={{ height: Math.max(4, (d.n / s.max) * 100) + '%' }} />
                <span>{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>Status breakdown</h3>
          <div className="split" aria-hidden="true">
            <i className="split--in" style={{ width: seg(s.approved) + '%' }} />
            <i className="split--warn" style={{ width: seg(s.pending) + '%' }} />
            <i className="split--bad" style={{ width: seg(s.rejected + s.cancelled) + '%' }} />
          </div>
          <ul className="legend">
            <li><i className="split--in" /> Approved <b>{s.approved}</b></li>
            <li><i className="split--warn" /> Pending <b>{s.pending}</b></li>
            <li><i className="split--bad" /> Rejected / cancelled <b>{s.rejected + s.cancelled}</b></li>
          </ul>
        </section>

        <section className="card">
          <div className="card__head">
            <h3>Awaiting approval</h3>
            <button className="link" onClick={() => onGo('scanner')}>Scan to approve</button>
          </div>
          <ul className="list">
            {waiting.map((r) => (
              <li key={r.id}>
                <div><strong>{r.name}</strong><small>{r.matric || r.reference}</small></div>
                <span className="muted">{fmt(r.registeredAt)}</span>
              </li>
            ))}
            {!waiting.length && <li className="muted">{loading ? 'Loading…' : 'All caught up.'}</li>}
          </ul>
        </section>

        <section className="card">
          <div className="card__head">
            <h3>Latest registrations</h3>
            <button className="link" onClick={() => onGo('registrants')}>View all</button>
          </div>
          <ul className="list">
            {recent.map((r) => (
              <li key={r.id}>
                <div><strong>{r.name}</strong><small>{r.programme || r.email}</small></div>
                <span className={`ad-pill ad-pill--${PILL[r.status] || ''}`}>{r.status}</span>
              </li>
            ))}
            {!recent.length && <li className="muted">{loading ? 'Loading…' : 'No registrations yet.'}</li>}
          </ul>
        </section>
      </div>
    </div>
  )
}