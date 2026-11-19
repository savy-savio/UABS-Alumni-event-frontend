const API = import.meta.env.VITE_API_URL
export const IS_DEMO = !API

const DEMO_KEY = 'uabs_demo_registrations'
const TOKEN_KEY = 'uabs_admin_token'

/* ---------- demo data (used only when VITE_API_URL is empty) ---------- */
const NAMES = ['Amina Yusuf', 'Chinedu Okafor', 'Ngozi Eze', 'Ibrahim Musa', 'Tolu Adeyemi', 'Grace Okon', 'Emeka Nwosu', 'Fatima Bello', 'Samuel Danjuma', 'Blessing Ade', 'Hauwa Sani', 'David Ogbu']
const PROGS = ['MBA', 'MSc', 'PhD', 'Doctor of Business Administration (DBA)', 'PGD']

function seed() {
  return NAMES.map((name, i) => ({
    id: String(i + 1),
    reference: `UABS-2026-${100001 + i}`,
    name,
    matric: `23/407BADP/${String(i + 10).padStart(3, '0')}`,
    programme: PROGS[i % PROGS.length],
    email: name.toLowerCase().replace(' ', '.') + '@example.com',
    registeredAt: new Date(Date.now() - (i + 1) * 3600e3 * 5).toISOString(),
    checkedInAt: null,
  }))
}

function readDemo() {
  try {
    const raw = localStorage.getItem(DEMO_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  const s = seed()
  writeDemo(s)
  return s
}
function writeDemo(rows) {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(rows)) } catch {}
}

export function addDemoRegistration(values) {
  const rows = readDemo()
  const reference = 'UABS-2026-' + Math.floor(100000 + Math.random() * 900000)
  rows.unshift({
    id: String(Date.now()),
    reference,
    name: values.name,
    matric: values.matric,
    programme: values.programme,
    email: values.email,
    registeredAt: new Date().toISOString(),
    checkedInAt: null,
  })
  writeDemo(rows)
  return { reference }
}

/* ---------- auth ---------- */
export const isAuthed = () => !!sessionStorage.getItem(TOKEN_KEY)
export const logout = () => sessionStorage.removeItem(TOKEN_KEY)

export async function login(username, password) {
  if (IS_DEMO) {
    if (username === 'admin' && password === 'admin123') {
      sessionStorage.setItem(TOKEN_KEY, 'demo')
      return
    }
    throw new Error('Wrong username or password.')
  }
  const res = await fetch(`${API}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.token) throw new Error(body.message || 'Wrong username or password.')
  sessionStorage.setItem(TOKEN_KEY, body.token)
}

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${sessionStorage.getItem(TOKEN_KEY)}`,
})

/* ---------- registrations + check-in ---------- */
export async function getRegistrations() {
  if (IS_DEMO) return readDemo()
  const res = await fetch(`${API}/admin/registrations`, { headers: authHeaders() })
  if (res.status === 401) { logout(); throw new Error('Session expired. Sign in again.') }
  if (!res.ok) throw new Error('Could not load registrations.')
  return res.json()
}

// Returns { status: 'checked_in' | 'already' | 'invalid', registrant? }
export async function checkIn(code) {
  const clean = String(code).trim()
  if (IS_DEMO) {
    const rows = readDemo()
    const r = rows.find((x) => x.reference.toLowerCase() === clean.toLowerCase())
    if (!r) return { status: 'invalid' }
    if (r.checkedInAt) return { status: 'already', registrant: r }
    r.checkedInAt = new Date().toISOString()
    writeDemo(rows)
    return { status: 'checked_in', registrant: r }
  }
  const res = await fetch(`${API}/admin/checkin`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ code: clean }),
  })
  if (res.status === 401) { logout(); throw new Error('Session expired. Sign in again.') }
  if (!res.ok && res.status !== 404 && res.status !== 409) throw new Error('Check-in failed. Try again.')
  return res.json()
}
