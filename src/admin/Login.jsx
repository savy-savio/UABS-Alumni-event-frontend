
import { useState } from 'react'
import { login } from './api.js'

export default function Login({ onDone }) {
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()

    if (busy) return

    setBusy(true)
    setErr('')

    try {
      await login(u.trim(), p)
      onDone()
    } catch (error) {
      setErr(error.message || 'Unable to sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ad-login">
      <form className="ad-login__card" onSubmit={submit}>
        <img src="/logo.jpeg" alt="UABS Alumni Launch" />

        <h1>Admin sign in</h1>
        <p className="muted">UABS Alumni Launch 2026</p>

        <div className="field">
          <label htmlFor="u">Username</label>
          <input
            id="u"
            type="text"
            value={u}
            onChange={(e) => setU(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </div>

        <div className="field">
          <label htmlFor="p">Password</label>
          <input
            id="p"
            type="password"
            value={p}
            onChange={(e) => setP(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {err && (
          <p className="server-error" role="alert">
            {err}
          </p>
        )}

        <button
          type="submit"
          className="btn btn--gold"
          disabled={busy || !u.trim() || !p}
        >
          {busy ? (
            <>
              <span className="spinner" /> Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>

        <a href="/" className="ad-back">
          Back to the event page
        </a>
      </form>
    </div>
  )
}
