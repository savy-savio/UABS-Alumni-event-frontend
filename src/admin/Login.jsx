import { useState } from 'react'
import { login } from './api.js'

export default function Login({ onDone }) {
  const [u, setU] = useState('')
  const [p, setP] = useState('')
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
          <input id="p" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" />
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
