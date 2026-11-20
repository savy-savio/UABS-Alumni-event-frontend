const API = import.meta.env.VITE_API_URL
export const IS_DEMO = !API

const DEMO_KEY = 'uabs_demo_registrations'
const TOKEN_KEY = 'uabs_admin_token'
const PROFILE_KEY = 'uabs_admin_profile'

/* ---------- demo mode (only when VITE_API_URL is empty): registration form only ---------- */
export function addDemoRegistration(values) {
  let rows = []
  try { rows = JSON.parse(localStorage.getItem(DEMO_KEY)) || [] } catch {}
  const reference = 'UABS-2026-' + Math.floor(100000 + Math.random() * 900000)
  rows.unshift({
    id: String(Date.now()),
    reference,
    name: values.name,
    matric: values.matric,
    programme: values.programme,
    email: values.email,
    registeredAt: new Date().toISOString(),
  })
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(rows)) } catch {}
  return { reference }
}

/* ---------- auth ---------- */
export const isAuthed = () => !!sessionStorage.getItem(TOKEN_KEY)

export function getAdmin() {
  try { return JSON.parse(sessionStorage.getItem(PROFILE_KEY)) } catch { return null }
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(PROFILE_KEY)
  if (API) fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
}

export async function login(email, password) {
  if (IS_DEMO) throw new Error('The backend is not connected. Set VITE_API_URL and rebuild the site.')
  let res
  try {
    res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw new Error('Cannot reach the server. Check your connection.')
  }
  const body = await res.json().catch(() => ({}))
  const token = body?.data?.accessToken
  if (!res.ok || !token) throw new Error(body.message || 'Wrong email or password.')
  sessionStorage.setItem(TOKEN_KEY, token)
  try { sessionStorage.setItem(PROFILE_KEY, JSON.stringify(body.data.administrator || null)) } catch {}
}

async function refreshSession() {
  try {
    const res = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' })
    if (!res.ok) return false
    const body = await res.json()
    if (!body?.data?.accessToken) return false
    sessionStorage.setItem(TOKEN_KEY, body.data.accessToken)
    return true
  } catch {
    return false
  }
}

/** Authenticated request. Retries once with a refreshed access token when the old one has expired. */
async function request(path, { method = 'GET', body } = {}, retried = false) {
  if (IS_DEMO) throw new Error('The backend is not connected. Set VITE_API_URL and rebuild the site.')
  let res
  try {
    res = await fetch(`${API}${path}`, {
      method,
      credentials: 'include',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${sessionStorage.getItem(TOKEN_KEY) || ''}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Check your connection.')
  }
  if (res.status === 401 && !retried) {
    if (await refreshSession()) return request(path, { method, body }, true)
    sessionStorage.removeItem(TOKEN_KEY)
    throw new Error('Session expired. Sign in again.')
  }
  const data = await res.json().catch(() => ({}))
  return { status: res.status, ok: res.ok, data }
}

/* ---------- registrations ---------- */
export async function getRegistrations() {
  const rows = []
  let page = 1
  let pages = 1
  do {
    const r = await request(`/admin/participants?limit=100&page=${page}`)
    if (!r.ok) throw new Error(r.data?.message || 'Could not load registrations.')
    rows.push(...(r.data.data || []))
    pages = r.data.pagination?.totalPages || 1
    page += 1
  } while (page <= pages && page <= 50)

  // Check-in times live in the attendance records
  const checkedIn = {}
  try {
    page = 1
    pages = 1
    do {
      const r = await request(`/admin/attendance?limit=100&page=${page}`)
      if (!r.ok) break
      for (const a of r.data.data || []) checkedIn[a.participant?.registrationId] = a.checkedInAt
      pages = r.data.pagination?.pages || 1
      page += 1
    } while (page <= pages && page <= 50)
  } catch {}

  return rows.map((p) => ({
    id: p._id,
    reference: p.registrationId,
    name: p.fullName,
    matric: p.matriculationNumber,
    programme: p.enrolledProgramme,
    graduationYear: p.graduationYear,
    email: p.email,
    registeredAt: p.registeredAt,
    status: p.registrationStatus,
    checkedInAt: checkedIn[p.registrationId] || null,
  }))
}

/** Full details plus photo for one registrant (read-only view). */
export async function getParticipantDetail(id) {
  const r = await request(`/admin/participants/${id}`)
  if (!r.ok) throw new Error(r.data?.message || 'Could not load this registrant.')
  const p = r.data.data
  return {
    id: p._id,
    fullName: p.fullName,
    registrationId: p.registrationId,
    category: p.categoryId?.name,
    email: p.email,
    matriculationNumber: p.matriculationNumber,
    enrolledProgramme: p.enrolledProgramme,
    graduationYear: p.graduationYear,
    registrationStatus: p.registrationStatus,
    photo: p.photo || null,
  }
}

/** Approving needs the scanProof the server issued when the QR code was scanned. */
export async function approveRegistration(id, scanProof) {
  const r = await request(`/admin/participants/${id}/approve`, { method: 'PATCH', body: { scanProof } })
  if (!r.ok) throw new Error(r.data?.message || 'Could not approve this registration.')
}

export async function rejectRegistration(id, reason, scanProof) {
  const r = await request(`/admin/participants/${id}/reject`, { method: 'PATCH', body: { reason, scanProof } })
  if (!r.ok) throw new Error(r.data?.message || 'Could not reject this registration.')
}

/* ---------- scanning ---------- */
/** The QR may hold either the raw token or a link such as https://site/verify?token=... */
export function extractToken(text) {
  const t = String(text).trim()
  try {
    const q = new URL(t).searchParams.get('token')
    if (q) return q
  } catch {}
  return t
}

// Looks the pass up WITHOUT checking the person in. Returns { outcome, message, participant, scanProof }
export async function scanPass(token) {
  if (token.length < 20) return { outcome: 'INVALID', message: 'This is not a valid pass code.', participant: null, scanProof: null }
  const r = await request('/accreditation/scan', { method: 'POST', body: { token } })
  if (r.status === 429) throw new Error('Scanning too fast. Wait a few seconds and try again.')
  const d = r.data || {}
  if (!d.outcome) throw new Error(d.message || 'Scan failed. Try again.')
  return { outcome: d.outcome, message: d.message, participant: d.participant || null, scanProof: d.scanProof || null }
}

// Marks the person as arrived. Returns { outcome, message, participant?, checkedInAt? }
export async function checkInPass(token) {
  const r = await request('/accreditation/check-in', { method: 'POST', body: { token } })
  const d = r.data || {}
  if (r.status === 429) throw new Error('Scanning too fast. Wait a few seconds and try again.')
  if (!d.outcome) throw new Error(d.message || 'Check-in failed. Try again.')
  return { outcome: d.outcome, message: d.message, participant: d.participant || null, checkedInAt: d.checkedInAt }
}