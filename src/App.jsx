import { useEffect, useState } from 'react'
import Register from './Register.jsx'
import { EVENT, PROGRAMME } from './data.js'

function useCountdown(target) {
  const calc = () => Math.max(0, new Date(target) - Date.now())
  const [ms, setMs] = useState(calc)
  useEffect(() => {
    const t = setInterval(() => setMs(calc()), 1000)
    return () => clearInterval(t)
  }, [])
  const s = Math.floor(ms / 1000)
  return [
    ['Days', Math.floor(s / 86400)],
    ['Hours', Math.floor((s % 86400) / 3600)],
    ['Minutes', Math.floor((s % 3600) / 60)],
    ['Seconds', s % 60],
  ]
}

function Countdown() {
  const parts = useCountdown(EVENT.start)
  return (
    <div className="countdown" role="timer" aria-label="Time until the launch">
      {parts.map(([label, n]) => (
        <div key={label}>
          <b key={n} className="tick">{String(n).padStart(2, '0')}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
      { threshold: 0.15 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

export default function App() {
  useReveal()
  const words = 'Where UABS alumni come together'.split(' ')
  return (
    <>
      <header className="nav">
        <div className="wrap nav__in">
          <a href="#top" className="brand"><img src="/logo.jpeg" alt="" /><span>UABS Alumni</span></a>
          <nav>
            <a href="#about">About</a>
            <a href="#programme">Programme</a>
            <a href="#venue">Venue</a>
            <a href="#register" className="btn btn--gold btn--sm">Register</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero__bg" aria-hidden="true"><i /><i /><i /></div>
          <div className="wrap hero__in">
            <p className="hero__org">{EVENT.org}</p>
            <h1>
              {words.map((w, i) => <span key={i} className="word" style={{ '--i': i }}>{w}&nbsp;</span>)}
            </h1>
            <p className="hero__sub">{EVENT.title}</p>
            <div className="hero__meta">
              <span>{EVENT.dateLabel}</span>
              <span>{EVENT.venue}</span>
              <span>{EVENT.format}</span>
            </div>
            <Countdown />
            <div className="hero__cta">
              <a href="#register" className="btn btn--gold">Register now</a>
              <a href="#about" className="btn btn--ghost-light">About the event</a>
            </div>
          </div>
        </section>

        <section id="about" className="section">
          <div className="wrap about">
            <div className="reveal">
              <h2>A launch for everyone who studied here</h2>
              <p className="lead">The University of Abuja Business School is launching its alumni association with a full day of conversation, celebration and connection across cohorts, programmes and industries.</p>
            </div>
            <blockquote className="theme reveal">
              <p>{EVENT.theme}</p>
              <cite>Conference theme</cite>
            </blockquote>
          </div>
          <div className="wrap hosts reveal">
            {EVENT.hosts.map((h) => (
              <div key={h.name}><strong>{h.name}</strong><span>{h.role}</span><em>{h.tag}</em></div>
            ))}
          </div>
        </section>

        <section id="programme" className="section section--tint">
          <div className="wrap">
            <h2 className="reveal">One day, three moments</h2>
            <ol className="timeline">
              {PROGRAMME.map((p) => (
                <li key={p.title} className="reveal">
                  <time>{p.time}</time>
                  <div><h3>{p.title}</h3><p>{p.text}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="venue" className="section">
          <div className="wrap venue reveal">
            <div>
              <h2>Join us in Kado</h2>
              <p className="lead">{EVENT.venue}. Bring your confirmation email: the QR code in it is your gate pass at check-in.</p>
            </div>
            <ul>
              <li><strong>Date</strong>{EVENT.dateLabel}</li>
              <li><strong>Venue</strong>{EVENT.venue}</li>
              <li><strong>Attendance</strong>In person, or online for those who can’t travel</li>
            </ul>
          </div>
        </section>

        <Register />
      </main>

      <footer className="footer">
        <div className="wrap footer__in">
          <div><img src="/logo.jpeg" alt="" /><p>{EVENT.org}<br />University of Abuja Business School (UABS)</p></div>
          <p>Questions? Call {EVENT.phones.map((p, i) => <span key={p}>{i ? ' or ' : ''}<a href={`tel:${p}`}>{p}</a></span>)}</p>
        </div>
      </footer>
    </>
  )
}
