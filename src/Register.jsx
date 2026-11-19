import { useState } from 'react'
import Pass from './Pass.jsx'
import { PROGRAMMES } from './data.js'
import { addDemoRegistration } from './admin/api.js'

const API = import.meta.env.VITE_API_URL

const empty = { name: '', matric: '', programme: '', email: '' }

function validate(v) {
  const e = {}
  if (v.name.trim().length < 3) e.name = 'Enter your full name.'
  if (!v.matric.trim()) e.matric = 'Enter your matriculation number.'
  if (!v.programme) e.programme = 'Select your programme.'
  if (!/^\S+@\S+\.\S+$/.test(v.email)) e.email = 'Enter a valid email address.'
  return e
}

async function submit(values) {
  if (!API) {
    await new Promise((r) => setTimeout(r, 1200)) // demo mode
    return addDemoRegistration(values) // saved locally so it shows on the dashboard
  }
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || 'Registration failed. Try again.')
  }
  return res.json()
}

export default function Register() {
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | done
  const [serverError, setServerError] = useState('')
  const [reference, setReference] = useState('')

  const set = (k) => (e) => {
    setV({ ...v, [k]: e.target.value })
    if (errors[k]) setErrors({ ...errors, [k]: undefined })
  }

  async function onSubmit(e) {
    e.preventDefault()
    const errs = validate(v)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setStatus('sending')
    setServerError('')
    try {
      const data = await submit(v)
      setReference(data.reference || '')
      setStatus('done')
    } catch (err) {
      setServerError(err.message)
      setStatus('idle')
    }
  }

  const field = (k, label, props = {}) => (
    <div className={`field ${errors[k] ? 'field--error' : ''}`}>
      <label htmlFor={k}>{label}</label>
      <input id={k} value={v[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <p role="alert">{errors[k]}</p>}
    </div>
  )

  return (
    <section id="register" className="section register">
      <div className="wrap register__grid">
        <div>
          {status === 'done' ? (
            <div className="done" role="status">
              <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M15 27l8 8 15-17" /></svg>
              <h2>You are registered</h2>
              <p>We sent your QR code pass to <strong>{v.email}</strong>. Keep that email safe and do not delete it. You will need it to check in on 25 November.</p>
              <p className="muted">Can’t find it? Check your spam folder.</p>
              <button className="btn btn--ghost" onClick={() => { setV(empty); setStatus('idle') }}>Register another person</button>
            </div>
          ) : (
            <>
              <h2>Register for the launch</h2>
              <p className="lead">Fill in your details exactly as they appear in your university records. Your pass fills in as you type, and the QR code is emailed to you once you register.</p>
              <form onSubmit={onSubmit} noValidate>
                {field('name', 'Full name', { autoComplete: 'name', placeholder: 'e.g. Aaron Okiemute Omere' })}
                {field('matric', 'Matriculation number', { placeholder: 'e.g. 23/407BADP/097' })}
                <div className={`field ${errors.programme ? 'field--error' : ''}`}>
                  <label htmlFor="programme">Enrolled programme</label>
                  <select id="programme" value={v.programme} onChange={set('programme')} aria-invalid={!!errors.programme}>
                    <option value="">Select programme</option>
                    {PROGRAMMES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                  {errors.programme && <p role="alert">{errors.programme}</p>}
                </div>
                {field('email', 'Email address', { type: 'email', autoComplete: 'email', placeholder: 'you@email.com' })}
                {serverError && <p className="server-error" role="alert">{serverError}</p>}
                <button className="btn btn--gold" disabled={status === 'sending'}>
                  {status === 'sending' ? <><span className="spinner" /> Registering</> : 'Register and get my pass'}
                </button>
              </form>
            </>
          )}
        </div>
        <div className="register__pass">
          <Pass {...v} code={reference} confirmed={status === 'done'} />
        </div>
      </div>
    </section>
  )
}
