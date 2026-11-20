import { useState } from 'react'

const STATUS_TONE = { APPROVED: 'in', PENDING: 'warn', REJECTED: 'bad', CANCELLED: 'bad' }

export default function ParticipantCard({ participant: p, busy, error, canCheckIn, onApprove, onReject, onCheckIn }) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const pending = p.registrationStatus === 'PENDING'

  function confirmReject(e) {
    e.preventDefault()
    if (reason.trim().length < 3) return
    onReject(reason.trim())
    setRejecting(false)
    setReason('')
  }

  return (
    <div className="pc">
      <div className="pc__photo">
        {p.photo ? <img src={p.photo} alt={`Photo of ${p.fullName}`} /> : <span>No photo on file</span>}
      </div>

      <div className="pc__info">
        <h3>{p.fullName}</h3>
        <span className={`ad-pill ad-pill--${STATUS_TONE[p.registrationStatus] || ''}`}>{p.registrationStatus}</span>
        <dl>
          <div><dt>Registration ID</dt><dd>{p.registrationId}</dd></div>
          <div><dt>Matric no.</dt><dd>{p.matriculationNumber || '-'}</dd></div>
          <div><dt>Programme</dt><dd>{p.enrolledProgramme || '-'}</dd></div>
          <div><dt>Graduation year</dt><dd>{p.graduationYear || '-'}</dd></div>
          <div><dt>Email</dt><dd>{p.email}</dd></div>
          {p.category && <div><dt>Category</dt><dd>{p.category}</dd></div>}
        </dl>
      </div>

      {error && <p className="server-error pc__error" role="alert">{error}</p>}

      <div className="pc__actions">
        {pending && onApprove && (
          <button className="btn btn--gold" disabled={busy} onClick={onApprove}>Approve registration</button>
        )}
        {pending && onReject && !rejecting && (
          <button className="btn btn--ghost" disabled={busy} onClick={() => setRejecting(true)}>Reject</button>
        )}
        {canCheckIn && onCheckIn && (
          <button className="btn btn--gold" disabled={busy} onClick={onCheckIn}>{busy ? 'Working' : 'Check in'}</button>
        )}
      </div>

      {rejecting && (
        <form className="pc__reject" onSubmit={confirmReject}>
          <label htmlFor="reason">Reason for rejecting (shown to the organisers)</label>
          <input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Photo does not match" autoFocus />
          <div>
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => setRejecting(false)}>Cancel</button>
            <button className="btn btn--gold btn--sm" disabled={reason.trim().length < 3 || busy}>Confirm reject</button>
          </div>
        </form>
      )}
    </div>
  )
}
