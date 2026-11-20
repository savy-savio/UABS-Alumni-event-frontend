import { useState } from 'react'
import { login } from './api.js'

function EyeIcon({ off }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  )
}

export default function Login({ onDone }) {
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await login(u.trim(), p)
      onDone()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ad-login">
      <form className="ad-login__card" onSubmit={submit}>
        <img src="/logo.jpeg" alt="" />
        <h1>Admin sign in</h1>
        <p className="muted">UABS Alumni Launch 2026</p>
        <div className="field">
          <label htmlFor="u">Email</label>
          <input id="u" type="email" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" autoFocus />
        </div>
        <div className="field">
          <label htmlFor="p">Password</label>
          <div className="pw">
            <input
              id="p"
              type={show ? 'text' : 'password'}
              value={p}
              onChange={(e) => setP(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="pw__toggle"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Hide password' : 'Show password'}
              aria-pressed={show}
              title={show ? 'Hide password' : 'Show password'}
            >
              <EyeIcon off={show} />
            </button>
          </div>
        </div>
        {err && <p className="server-error" role="alert">{err}</p>}
        <button className="btn btn--gold" disabled={busy || !u || !p}>
          {busy ? <><span className="spinner" /> Signing in</> : 'Sign in'}
        </button>
        <a href="/" className="ad-back">Back to the event page</a>
      </form>
    </div>
  )
}