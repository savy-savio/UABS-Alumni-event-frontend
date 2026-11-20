import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { approveRegistration, checkInPass, extractToken, rejectRegistration, scanPass } from './api.js'
import ParticipantCard from './ParticipantCard.jsx'

const fmt = (d) => new Date(d).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })

function beep(ok) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = ok ? 880 : 200
    g.gain.value = 0.08
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + (ok ? 0.12 : 0.4))
  } catch {}
}

const TITLES = {
  VALID: 'Approved: ready to check in',
  CHECKED_IN: 'Checked in',
  NOT_APPROVED: 'Awaiting approval',
  ALREADY_CHECKED_IN: 'Already checked in',
  REJECTED: 'Registration rejected',
  CANCELLED: 'Registration cancelled',
  REVOKED: 'Pass has been revoked',
  EXPIRED: 'Pass has expired',
  EVENT_CANCELLED: 'Event cancelled',
  WRONG_EVENT: 'Pass is for another event',
  INVALID: 'Invalid code',
  ERROR: 'Something went wrong',
}
const FRIENDLY = {
  VALID: 'Compare the photo with the person in front of you, then check them in.',
  NOT_APPROVED: 'Compare the photo and details with the person, then approve or reject.',
  CHECKED_IN: 'Approved and checked in.',
  ALREADY_CHECKED_IN: 'This person has already been checked in.',
  REJECTED: 'This registration was rejected.',
  CANCELLED: 'This registration was cancelled.',
  REVOKED: 'This QR code was revoked. Ask an organiser for help.',
  EXPIRED: 'This QR code has expired.',
}
const TONE = { VALID: 'ok', CHECKED_IN: 'ok', NOT_APPROVED: 'warn', ALREADY_CHECKED_IN: 'warn' }
const tone = (o) => TONE[o] || 'bad'

const STEPS = ['Scan QR code', 'Review & approve']
const stepFor = (scan) => {
  if (!scan) return 0
  if (scan.outcome === 'CHECKED_IN' || scan.outcome === 'ALREADY_CHECKED_IN') return 2
  return 1
}

export default function Scanner({ onCheckedIn, onUpdated }) {
  const [cameraOn, setCameraOn] = useState(false)
  const [camError, setCamError] = useState('')
  const [manual, setManual] = useState('')
  const [scan, setScan] = useState(null) // { token, outcome, message, participant, scanProof }
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [history, setHistory] = useState([])
  const last = useRef({ code: '', at: 0 })
  const currentToken = useRef('')
  const processRef = useRef()
  const inputRef = useRef()

  const remember = (entry) => setHistory((h) => [{ ...entry, at: new Date().toISOString() }, ...h].slice(0, 8))

  async function process(raw, fromCamera) {
    const token = extractToken(raw)
    if (!token) return
    const now = Date.now()
    // The camera keeps seeing the same QR: ignore repeats while that person is still on screen
    if (fromCamera && (currentToken.current === token || (last.current.code === token && now - last.current.at < 3000))) return
    last.current = { code: token, at: now }
    currentToken.current = token
    setActionError('')
    setBusy(true)
    try {
      const res = await scanPass(token)
      setScan({ token, ...res })
      remember({ name: res.participant?.fullName || 'Unknown code', outcome: res.outcome })
      beep(res.outcome === 'VALID' || res.outcome === 'NOT_APPROVED')
    } catch (e) {
      setScan({ token, outcome: 'ERROR', message: e.message, participant: null })
      remember({ name: 'Scan error', outcome: 'ERROR' })
      beep(false)
    } finally {
      setBusy(false)
    }
  }
  processRef.current = process

  useEffect(() => {
    if (!cameraOn) return
    setCamError('')
    const scanner = new Html5Qrcode('qr-reader')
    const starting = scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => processRef.current(text, true),
        () => {}
      )
      .catch(() => {
        setCamError('Camera unavailable. Allow camera access (needs HTTPS or localhost), or use the code field instead.')
        setCameraOn(false)
        return null
      })
    return () => {
      starting.then((ok) => ok !== null && scanner.stop().then(() => scanner.clear())).catch(() => {})
    }
  }, [cameraOn])

  function submitManual(e) {
    e.preventDefault()
    process(manual, false)
    setManual('')
    inputRef.current?.focus()
  }

  function clearResult() {
    currentToken.current = ''
    setScan(null)
    setActionError('')
    inputRef.current?.focus()
  }

  async function run(fn) {
    setBusy(true)
    setActionError('')
    try {
      await fn()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusy(false)
    }
  }

  // Approving a person also checks them in (the server records the check-in)
  const approve = () =>
    run(async () => {
      const p = scan.participant
      await approveRegistration(p.id, scan.scanProof)
      const when = new Date().toISOString()
      setScan((s) => ({
        ...s,
        outcome: 'CHECKED_IN',
        message: 'Approved and checked in.',
        custom: true,
        scanProof: null,
        participant: { ...s.participant, registrationStatus: 'APPROVED', checkedInAt: when },
      }))
      onUpdated(p.id, { status: 'APPROVED' })
      onCheckedIn({ id: p.id, checkedInAt: when })
      remember({ name: p.fullName, outcome: 'CHECKED_IN' })
      beep(true)
    })

  const reject = (reason) =>
    run(async () => {
      const p = scan.participant
      await rejectRegistration(p.id, reason, scan.scanProof)
      setScan((s) => ({
        ...s,
        outcome: 'REJECTED',
        message: 'Registration rejected.',
        custom: true,
        scanProof: null,
        participant: { ...s.participant, registrationStatus: 'REJECTED' },
      }))
      onUpdated(p.id, { status: 'REJECTED' })
      remember({ name: p.fullName, outcome: 'REJECTED' })
    })

  // Fallback for people approved before approval counted as check-in
  const checkIn = () =>
    run(async () => {
      const res = await checkInPass(scan.token)
      const when = res.checkedInAt || new Date().toISOString()
      setScan((s) => ({
        ...s,
        outcome: res.outcome,
        message: res.message,
        participant: { ...s.participant, ...(res.participant || {}), photo: s.participant?.photo, checkedInAt: when },
      }))
      if (res.outcome === 'CHECKED_IN') {
        onCheckedIn({ id: scan.participant.id, checkedInAt: when })
        remember({ name: scan.participant.fullName, outcome: 'CHECKED_IN' })
        beep(true)
      } else {
        beep(false)
      }
    })

  const p = scan?.participant
  const step = stepFor(scan)
  const canApprove = !!scan?.scanProof && p?.registrationStatus === 'PENDING'

  return (
    <div className="ad-scan">
      <ol className="steps" aria-label="Approval steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i < step ? 'is-done' : i === step ? 'is-now' : ''}>
            <span>{i < step ? '✓' : i + 1}</span> {label}
          </li>
        ))}
      </ol>

      <section className="card">
        <h2>Scan a participant’s pass</h2>
        <p className="muted">Registrations can only be approved after their QR code has been scanned here.</p>
        <div className="ad-cam">
          {cameraOn ? <div id="qr-reader" /> : <div className="ad-cam__off">Camera is off</div>}
        </div>
        <button className="btn btn--gold" onClick={() => setCameraOn((v) => !v)}>
          {cameraOn ? 'Stop camera' : 'Start camera'}
        </button>
        {camError && <p className="server-error" role="alert">{camError}</p>}

        <form onSubmit={submitManual} className="ad-manual">
          <label htmlFor="code">USB scanner or pass code</label>
          <div>
            <input id="code" ref={inputRef} value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Click here, then scan or paste the code" autoComplete="off" />
            <button className="btn btn--ghost" disabled={!manual.trim() || busy}>Look up</button>
          </div>
        </form>
      </section>

      <section>
        <div className={`ad-result ad-result--${scan ? tone(scan.outcome) : 'idle'}`} role="status" aria-live="polite">
          {scan ? (
            <>
              <h2>{TITLES[scan.outcome] || scan.outcome}</h2>
              {(scan.custom ? scan.message : FRIENDLY[scan.outcome] || scan.message) && (
                <p className="ad-result__msg">{scan.custom ? scan.message : FRIENDLY[scan.outcome] || scan.message}</p>
              )}
              {p && (
                <ParticipantCard
                  participant={p}
                  busy={busy}
                  error={actionError}
                  canApprove={canApprove}
                  canCheckIn={scan.outcome === 'VALID'}
                  onApprove={approve}
                  onReject={reject}
                  onCheckIn={checkIn}
                />
              )}
              {!p && actionError && <p className="server-error">{actionError}</p>}
              {p?.checkedInAt && scan.outcome !== 'VALID' && <p className="ad-result__msg">Checked in at {fmt(p.checkedInAt)}</p>}
              <button className="btn btn--ghost btn--sm ad-next" onClick={clearResult}>Scan next person</button>
            </>
          ) : (
            <p>{busy ? 'Looking up pass…' : 'Scan a pass to see the person’s photo and details here.'}</p>
          )}
        </div>

        <h3>Recent scans</h3>
        <ul className="ad-history">
          {history.map((h, i) => (
            <li key={i} className={`ad-history--${tone(h.outcome === 'APPROVED' ? 'VALID' : h.outcome)}`}>
              <span>{h.name}</span>
              <em>{TITLES[h.outcome] || (h.outcome === 'APPROVED' ? 'Approved' : h.outcome)} · {fmt(h.at)}</em>
            </li>
          ))}
          {!history.length && <li className="muted">No scans yet.</li>}
        </ul>
      </section>
    </div>
  )
}