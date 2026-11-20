import Pass from './Pass.jsx'
import { PROGRAMMES } from './data.js'
import { useRegistrationStore } from './store/registrationStore.js'

export default function Register() {
  const values = useRegistrationStore((s) => s.values)
  const errors = useRegistrationStore((s) => s.errors)
  const status = useRegistrationStore((s) => s.status)
  const serverError = useRegistrationStore((s) => s.serverError)
  const result = useRegistrationStore((s) => s.result)
  const setField = useRegistrationStore((s) => s.setField)
  const setPhoto = useRegistrationStore((s) => s.setPhoto)
  const removePhoto = useRegistrationStore((s) => s.removePhoto)
  const submit = useRegistrationStore((s) => s.submit)
  const reset = useRegistrationStore((s) => s.reset)

  const onSubmit = (e) => {
    e.preventDefault()
    submit()
  }

  const field = (k, label, props = {}) => (
    <div className={`field ${errors[k] ? 'field--error' : ''}`}>
      <label htmlFor={k}>{label}</label>
      <input id={k} value={values[k]} onChange={(e) => setField(k, e.target.value)} aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <p role="alert">{errors[k]}</p>}
    </div>
  )

  return (
    <section id="register" className="section register">
      <div className="wrap register__grid">
        <div>
          {status === 'done' && result ? (
            <div className="done" role="status">
              <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M15 27l8 8 15-17" /></svg>
              <h2>You are registered</h2>
              {result.emailSent ? (
                <p>We sent your QR code pass to <strong>{result.email}</strong>. Keep that email safe and do not delete it. You will need it to check in on 25 November.</p>
              ) : (
                <p>Your registration is saved, but we could not email your pass just now. Download your QR code below and keep it safe. You will need it to check in on 25 November.</p>
              )}
              {result.reference && <p>Registration ID: <strong>{result.reference}</strong></p>}
              {result.emailSent && <p className="muted">Can’t find it? Check your spam folder.</p>}
              {result.qrImage && (
                <a className="btn btn--gold" href={result.qrImage} download={`uabs-qr-${result.reference || 'pass'}.png`}>Download my QR code</a>
              )}
              <button className="btn btn--ghost" onClick={reset}>Register another person</button>
            </div>
          ) : (
            <>
              <h2>Register for the launch</h2>
              <p className="lead">Fill in your details exactly as they appear in your university records. Your pass fills in as you type, and the QR code is emailed to you once you register.</p>
              <form onSubmit={onSubmit} noValidate>
                {field('name', 'Full name', { autoComplete: 'name', placeholder: 'e.g. Aaron Okiemute Omere' })}
                {field('matric', 'Matriculation number', { placeholder: 'e.g. 23/407BADP/097' })}
                {field('email', 'Email address', { type: 'email', autoComplete: 'email', placeholder: 'you@email.com' })}

                <div className={`field ${errors.programme ? 'field--error' : ''}`}>
                  <label htmlFor="programme">Enrolled programme</label>
                  <select id="programme" value={values.programme} onChange={(e) => setField('programme', e.target.value)} aria-invalid={!!errors.programme}>
                    <option value="">Select programme</option>
                    {PROGRAMMES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                  {errors.programme && <p role="alert">{errors.programme}</p>}
                </div>

                <div className={`field ${errors.graduationDate ? 'field--error' : ''}`}>
                  <label htmlFor="graduationDate">Year of graduation</label>
                  <input
                    id="graduationDate"
                    type="date"
                    min="1990-01-01"
                    max="2035-12-31"
                    value={values.graduationDate}
                    onChange={(e) => setField('graduationDate', e.target.value)}
                    aria-invalid={!!errors.graduationDate}
                  />
                  {errors.graduationDate && <p role="alert">{errors.graduationDate}</p>}
                </div>

                <div className={`field photo-field ${errors.photo ? 'field--error' : ''}`}>
                  <label htmlFor="photo">Passport photograph</label>
                  <div className="photo-field__row">
                    <div className="photo-field__preview">
                      {values.photo ? <img src={values.photo} alt="Preview of your photo" /> : <span>No photo</span>}
                    </div>
                    <div className="photo-field__side">
                      <input
                        id="photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        aria-invalid={!!errors.photo}
                        onChange={(e) => {
                          setPhoto(e.target.files?.[0])
                          e.target.value = ''
                        }}
                      />
                      <small>A clear, recent photo of your face. Admins will see it at check-in to confirm it is you.</small>
                      {values.photo && (
                        <button type="button" className="btn btn--ghost btn--sm" onClick={removePhoto}>Remove photo</button>
                      )}
                    </div>
                  </div>
                  {errors.photo && <p role="alert">{errors.photo}</p>}
                </div>

                {serverError && <p className="server-error" role="alert">{serverError}</p>}
                <button className="btn btn--gold" disabled={status === 'sending'}>
                  {status === 'sending' ? <><span className="spinner" /> Registering</> : 'Register and get my pass'}
                </button>
              </form>
            </>
          )}
        </div>
        <div className="register__pass">
          <Pass
            {...values}
            graduationYear={values.graduationDate.slice(0, 4)}
            code={result?.reference}
            qrImage={result?.qrImage}
            confirmed={status === 'done'}
          />
        </div>
      </div>
    </section>
  )
}