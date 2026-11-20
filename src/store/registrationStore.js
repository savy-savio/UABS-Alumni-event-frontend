
import { create } from 'zustand'

// Backend API URL
const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

if (!API) {
  throw new Error(
    'VITE_API_URL is missing. Please configure your backend API URL.'
  )
}

const EMPTY = {
  name: '',
  matric: '',
  programme: '',
  email: '',
}

// Backend field name -> form field name
const FIELD_MAP = {
  fullName: 'name',
  matriculationNumber: 'matric',
  enrolledProgramme: 'programme',
  email: 'email',
}

/* ---------- Validation ---------- */

function validate(v) {
  const e = {}

  if (v.name.trim().length < 3) {
    e.name = 'Enter your full name.'
  }

  if (!v.matric.trim()) {
    e.matric = 'Enter your matriculation number.'
  }

  if (!v.programme) {
    e.programme = 'Select your programme.'
  }

  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) {
    e.email = 'Enter a valid email address.'
  }

  return e
}

/* ---------- Backend Registration ---------- */

/**
 * Calls the backend and returns:
 * {
 *   reference,
 *   email,
 *   qrImage,
 *   emailSent
 * }
 */

async function postRegistration(values) {
  let res

  try {
    res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: values.name.trim(),
        matriculationNumber: values.matric.trim(),
        enrolledProgramme: values.programme,
        email: values.email.trim().toLowerCase(),
      }),
    })
  } catch {
    throw new Error(
      'Cannot reach the server. Check your internet connection and try again.'
    )
  }

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    // Map backend validation errors to frontend form fields
    const fieldErrors = {}

    for (const item of body.errors || []) {
      const key = FIELD_MAP[item.path]

      if (key && !fieldErrors[key]) {
        fieldErrors[key] = item.message
      }
    }

    const err = new Error(
      body.message || 'Registration failed. Please try again.'
    )

    err.fieldErrors = fieldErrors
    throw err
  }

  const d = body.data || {}

  if (!d.registrationId) {
    throw new Error(
      'Registration was received, but the server returned an invalid response.'
    )
  }

  return {
    reference: d.registrationId,
    email: d.email || values.email,
    qrImage: d.qrCode?.image || '',
    emailSent: Boolean(d.emailDelivery?.sent),
  }
}

/* ---------- Zustand Registration Store ---------- */

export const useRegistrationStore = create((set, get) => ({
  values: EMPTY,
  errors: {},
  status: 'idle', // idle | sending | done
  serverError: '',
  result: null,

  /* Update form fields */
  setField: (key, value) =>
    set((s) => ({
      values: {
        ...s.values,
        [key]: value,
      },
      errors: {
        ...s.errors,
        [key]: undefined,
      },
    })),

  /* Submit registration */
  submit: async () => {
    if (get().status === 'sending') return

    const values = get().values
    const errors = validate(values)

    set({ errors })

    if (Object.keys(errors).length > 0) return

    set({
      status: 'sending',
      serverError: '',
      result: null,
    })

    try {
      const result = await postRegistration(values)

      set({
        result,
        status: 'done',
        serverError: '',
      })
    } catch (err) {
      const fieldErrors = err.fieldErrors || {}
      const hasFieldErrors = Object.keys(fieldErrors).length > 0

      set((s) => ({
        status: 'idle',
        errors: {
          ...s.errors,
          ...fieldErrors,
        },
        serverError: hasFieldErrors
          ? 'Please correct the highlighted fields.'
          : err.message || 'Registration failed. Please try again.',
      }))
    }
  },

  /* Reset registration form */
  reset: () =>
    set({
      values: EMPTY,
      errors: {},
      status: 'idle',
      serverError: '',
      result: null,
    }),
}))
