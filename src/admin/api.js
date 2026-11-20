
const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')
const TOKEN_KEY = 'uabs_admin_token'

// Ensure the backend URL is configured
if (!API) {
  throw new Error(
    'VITE_API_URL is not configured. Please add it to your .env file.'
  )
}

/* ---------- API helper ---------- */

async function apiRequest(endpoint, options = {}) {
  let res

  try {
    res = await fetch(`${API}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  } catch {
    throw new Error(
      'Unable to connect to the server. Please check your internet connection and try again.'
    )
  }

  const body = await res.json().catch(() => ({}))

  if (res.status === 401) {
    logout()
    throw new Error('Session expired. Please sign in again.')
  }

  if (!res.ok) {
    throw new Error(
      body.message || 'Something went wrong. Please try again.'
    )
  }

  return body
}

/* ---------- Authentication ---------- */

export const isAuthed = () => {
  return !!sessionStorage.getItem(TOKEN_KEY)
}

export const logout = () => {
  sessionStorage.removeItem(TOKEN_KEY)
}

export async function login(username, password) {
  const body = await apiRequest('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

  if (!body.token) {
    throw new Error('Invalid login response from server.')
  }

  sessionStorage.setItem(TOKEN_KEY, body.token)
}

/* ---------- Auth headers ---------- */

const authHeaders = () => {
  const token = sessionStorage.getItem(TOKEN_KEY)

  if (!token) {
    throw new Error('You are not authenticated. Please sign in.')
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

/* ---------- Registrations ---------- */

export async function getRegistrations() {
  const body = await apiRequest('/admin/registrations', {
    method: 'GET',
    headers: authHeaders(),
  })

  return body
}

/* ---------- Check-in ---------- */

// Returns:
// { status: 'checked_in' | 'already' | 'invalid', registrant? }

export async function checkIn(code) {
  const clean = String(code).trim()

  if (!clean) {
    throw new Error('Please enter a registration code.')
  }

  try {
    const body = await apiRequest('/admin/checkin', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ code: clean }),
    })

    return body
  } catch (error) {
    // A 404 means registration code was not found.
    if (error.message === 'Registration not found.') {
      return { status: 'invalid' }
    }

    throw error
  }
}
