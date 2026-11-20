import { create } from 'zustand'
import { addDemoRegistration } from '../admin/api.js'

// e.g. http://localhost:5000/api/v1  (leave empty to run in demo mode)
const API = import.meta.env.VITE_API_URL

const EMPTY = { name: '', matric: '', programme: '', email: '' }



// backend field name -> form field name
const FIELD_MAP = {
  fullName: 'name',
  matriculationNumber: 'matric',
  enrolledProgramme: 'programme',
  graduationYear: 'graduationYear',
  email: 'email',
}

function validate(v) {
  const e = {}
  if (v.name.trim().length < 3) e.name = 'Enter your full name.'
  if (!v.matric.trim()) e.matric = 'Enter your matriculation number.'
  if (!v.programme) e.programme = 'Select your programme.'
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = 'Enter a valid email address.'
  if (!v.graduationYear) e.graduationYear = 'Select your year of graduation.'
  return e
}

/** Calls the backend and returns a normalised result: { reference, email, qrImage, emailSent } */
async function postRegistration(values) {
  // Demo mode: no backend configured
  if (!API) {
    await new Promise((r) => setTimeout(r, 1200))
    const { reference } = addDemoRegistration(values)
    return { reference, email: values.email, qrImage: '', emailSent: true }
  }

  let res
  try {
    res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: values.name.trim(),
        matriculationNumber: values.matric.trim(),
        enrolledProgramme: values.programme,
        email: values.email.trim().toLowerCase(),
        graduationYear: Number(values.graduationYear),
      }),
    })
  } catch {
    throw new Error('Cannot reach the server. Check your internet connection and try again.')
  }

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    // Zod validation errors arrive as [{ path, message }]; map them onto the form fields
    const fieldErrors = {}
    for (const item of body.errors || []) {
      const key = FIELD_MAP[item.path]
      if (key && !fieldErrors[key]) fieldErrors[key] = item.message
    }
    const err = new Error(body.message || 'Registration failed. Please try again.')
    err.fieldErrors = fieldErrors
    throw err
  }

  const d = body.data || {}
  return {
    reference: d.registrationId || '',
    email: d.email || values.email,
    qrImage: d.qrCode?.image || '',
    emailSent: Boolean(d.emailDelivery?.sent),
  }
}

export const useRegistrationStore = create((set, get) => ({
  values: EMPTY,
  errors: {},
  status: 'idle', // idle | sending | done
  serverError: '',
  result: null,

  setField: (key, value) =>
    set((s) => ({
      values: { ...s.values, [key]: value },
      errors: { ...s.errors, [key]: undefined },
    })),

  submit: async () => {
    if (get().status === 'sending') return

    const errors = validate(get().values)
    set({ errors })
    if (Object.keys(errors).length) return

    set({ status: 'sending', serverError: '' })
    try {
      const result = await postRegistration(get().values)
      set({ result, status: 'done' })
    } catch (err) {
      const fieldErrors = err.fieldErrors || {}
      const hasFieldErrors = Object.keys(fieldErrors).length > 0
      set((s) => ({
        status: 'idle',
        errors: { ...s.errors, ...fieldErrors },
        serverError: hasFieldErrors ? 'Please correct the highlighted fields.' : err.message,
      }))
    }
  },

  reset: () => set({ values: EMPTY, errors: {}, status: 'idle', serverError: '', result: null }),
}))