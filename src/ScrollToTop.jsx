import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const css = `
.to-top{
  position:fixed;right:20px;bottom:24px;z-index:60;
  width:46px;height:46px;display:grid;place-items:center;
  margin:0;padding:0;border:0;border-radius:50%;
  background:#0b4d22;color:#e8b923;cursor:pointer;
  box-shadow:0 8px 22px rgba(6,47,21,.35);
  opacity:0;visibility:hidden;transform:translateY(14px);
  transition:opacity .25s,transform .25s,visibility .25s,background .2s;
  -webkit-appearance:none;appearance:none;
}
.to-top.is-visible{opacity:1;visibility:visible;transform:none}
.to-top:hover{background:#062f15;transform:translateY(-3px)}
.to-top:focus-visible{outline:3px solid #e8b923;outline-offset:3px}
.to-top svg{display:block}
@media (max-width:1000px){
  .to-top--admin{bottom:84px}
}
@media (prefers-reduced-motion:reduce){
  .to-top{transition:none}
}
`

export default function ScrollToTop() {
  const { pathname } = useLocation()
  const [show, setShow] = useState(false)
  const prev = useRef(pathname)

  // Moving to another page: start at the very top, instantly (not on first load, so #links still work)
  useEffect(() => {
    if (prev.current === pathname) return
    prev.current = pathname
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function goTop() {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' })
  }

  const admin = pathname.startsWith('/admin')

  return (
    <>
      <style>{css}</style>
      <button
        type="button"
        className={`to-top${show ? ' is-visible' : ''}${admin ? ' to-top--admin' : ''}`}
        onClick={goTop}
        aria-label="Scroll to top"
        title="Back to top"
        tabIndex={show ? 0 : -1}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </>
  )
}