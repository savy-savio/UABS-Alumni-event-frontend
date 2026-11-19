import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { checkIn } from './api.js'

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

const MESSAGES = {
  checked_in: 'Access granted',
  already: 'Already checked in',
  invalid: 'Invalid code',
  error: 'Check-in failed',
}

export default function Scanner({ onCheckedIn }) {
  const [cameraOn, setCameraOn] = useState(false)
  const [camError, setCamError] = useState('')
  const [manual, setManual] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const last = useRef({ code: '', at: 0 })
  const processRef = useRef()
  const inputRef = useRef()

  async function process(raw, fromCamera) {
    const code = String(raw).trim()
    if (!code) return
    const now = Date.now()
    if (fromCamera && last.current.code === code && now - last.current.at < 3000) return
    last.current = { code, at: now }
    let res
    try {
      res = await checkIn(code)
    } catch (e) {
      res = { status: 'error', message: e.message }
    }
    setResult({ ...res, code, at: new Date().toISOString() })
    setHistory((h) => [{ ...res, code, at: new Date().toISOString() }, ...h].slice(0, 8))
    if (res.registrant && res.status === 'checked_in') onCheckedIn(res.registrant)
    beep(res.status === 'checked_in')
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

  const r = result?.registrant

  return (
    <div className="ad-scan">
      <section>
        <h2>Scan a pass</h2>
        <div className="ad-cam">
          {cameraOn ? <div id="qr-reader" /> : <div className="ad-cam__off">Camera is off</div>}
        </div>
        <button className="btn btn--gold" onClick={() => setCameraOn((v) => !v)}>
          {cameraOn ? 'Stop camera' : 'Start camera'}
        </button>
        {camError && <p className="server-error" role="alert">{camError}</p>}

        <form onSubmit={submitManual} className="ad-manual">
          <label htmlFor="code">USB scanner or manual code</label>
          <div>
            <input id="code" ref={inputRef} value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Click here, then scan or type the code" autoComplete="off" />
            <button className="btn btn--ghost" disabled={!manual.trim()}>Check in</button>
          </div>
        </form>
      </section>

      <section>
        <div className={`ad-result ad-result--${result?.status || 'idle'}`} role="status" aria-live="polite">
          {result ? (
            <>
              <h2>{MESSAGES[result.status]}</h2>
              {r ? (
                <>
                  <p className="ad-result__name">{r.name}</p>
                  <p>{r.matric}</p>
                  <p>{r.programme}</p>
                  {result.status === 'already' && <p>First checked in at {fmt(r.checkedInAt)}</p>}
                </>
              ) : (
                <p>{result.message || `No registration matches “${result.code}”.`}</p>
              )}
            </>
          ) : (
            <p>Results appear here after you scan a pass.</p>
          )}
        </div>

        <h3>Recent scans</h3>
        <ul className="ad-history">
          {history.map((h, i) => (
            <li key={i} className={`ad-history--${h.status}`}>
              <span>{h.registrant?.name || h.code}</span>
              <em>{MESSAGES[h.status]} · {fmt(h.at)}</em>
            </li>
          ))}
          {!history.length && <li className="muted">No scans yet.</li>}
        </ul>
      </section>
    </div>
  )
}
