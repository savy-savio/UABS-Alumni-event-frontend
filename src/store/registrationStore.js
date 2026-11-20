import { create } from 'zustand'
import { addDemoRegistration } from '../admin/api.js'

// e.g. http://localhost:5000/api/v1  (leave empty to run in demo mode)
const API = "https://uabs-alumni-event-backend.onrender.com/api/v1"

const EMPTY = { name: '', matric: '', email: '', programme: '', graduationDate: '', photo: '' }

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const PHOTO_MAX_INPUT = 10 * 1024 * 1024 // 10 MB picked from the phone/camera
const PHOTO_MAX_SIDE = 600 // px
const PHOTO_MAX_OUTPUT = 450 * 1024 // bytes, after resizing (backend limit is 500 KB)

/** Resizes the picked image to a small JPEG data URL so uploads stay fast. */
function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff' // PNGs with transparency become white, not black
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      for (const quality of [0.85, 0.7, 0.55, 0.4]) {
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        const bytes = ((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4
        if (bytes <= PHOTO_MAX_OUTPUT) return resolve(dataUrl)
      }
      reject(new Error('too large'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('unreadable'))
    }
    img.src = url
  })
}

// backend field name -> form field name
const FIELD_MAP = {
  fullName: 'name',
  matriculationNumber: 'matric',
  enrolledProgramme: 'programme',
  graduationYear: 'graduationDate',
  photo: 'photo',
  email: 'email',
}

function validate(v) {
  const e = {}
  if (v.name.trim().length < 3) e.name = 'Enter your full name.'
  if (!v.matric.trim()) e.matric = 'Enter your matriculation number.'
  if (!v.programme) e.programme = 'Select your programme.'
  if (!v.graduationDate) e.graduationDate = 'Pick your graduation date.'
  else {
    const y = Number(v.graduationDate.slice(0, 4))
    if (y < 1990 || y > 2035) e.graduationDate = 'Pick a date between 1990 and 2035.'
  }
  if (!v.photo) e.photo = 'Add your passport photograph.'
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = 'Enter a valid email address.'
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
        graduationYear: Number(values.graduationDate.slice(0, 4)),
        photo: values.photo,
        email: values.email.trim().toLowerCase(),
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

  setPhoto: async (file) => {
    if (!file) return
    const fail = (msg) => set((s) => ({ errors: { ...s.errors, photo: msg } }))
    if (!PHOTO_TYPES.includes(file.type)) return fail('Use a JPG, PNG or WebP photo.')
    if (file.size > PHOTO_MAX_INPUT) return fail('That photo is too large. Choose one under 10 MB.')
    try {
      const photo = await resizePhoto(file)
      set((s) => ({ values: { ...s.values, photo }, errors: { ...s.errors, photo: undefined } }))
    } catch {
      fail('We could not read that image. Try a different photo.')
    }
  },

  removePhoto: () => set((s) => ({ values: { ...s.values, photo: '' } })),

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