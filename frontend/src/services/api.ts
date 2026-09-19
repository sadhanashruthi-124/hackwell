import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401 (except for auth requests)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/api/auth/')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/api/auth/register', { name, email, password }),
  me: () => api.get('/api/auth/me'),
  completeOnboarding: () => api.post('/api/auth/complete-onboarding'),
}

// ── Institution ────────────────────────────────────────────────────────────
export const institutionAPI = {
  get: () => api.get('/api/institution'),
  save: (data: object) => api.post('/api/institution', data),
}

// ── Events ─────────────────────────────────────────────────────────────────
export const eventsAPI = {
  list: (status?: string) => api.get('/api/events', { params: status ? { status } : {} }),
  get: (id: number) => api.get(`/api/events/${id}`),
  create: (data: object) => api.post('/api/events', data),
  update: (id: number, data: object) => api.put(`/api/events/${id}`, data),
  delete: (id: number) => api.delete(`/api/events/${id}`),
}

// ── Resources ──────────────────────────────────────────────────────────────
export const resourcesAPI = {
  list: () => api.get('/api/resources'),
  create: (data: object) => api.post('/api/resources', data),
  update: (id: number, data: object) => api.put(`/api/resources/${id}`, data),
  delete: (id: number) => api.delete(`/api/resources/${id}`),
  estimate: (eventId: number) => api.get(`/api/resources/estimate/${eventId}`),
  loadSample: () => api.post('/api/resources/load-sample'),
}

// ── Venues ─────────────────────────────────────────────────────────────────
export const venuesAPI = {
  list: () => api.get('/api/venues'),
}

// ── Predictions ────────────────────────────────────────────────────────────
export const predictionsAPI = {
  run: (eventId: number) => api.post(`/api/predictions/${eventId}`),
  get: (eventId: number) => api.get(`/api/predictions/${eventId}`),
}

// ── Optimization ───────────────────────────────────────────────────────────
export const optimizationAPI = {
  run: (eventId: number) => api.post(`/api/optimization/${eventId}`),
  get: (eventId: number) => api.get(`/api/optimization/${eventId}`),
}

// ── Reports ────────────────────────────────────────────────────────────────
export const reportsAPI = {
  pdf: (eventId: number) =>
    api.post(`/api/reports/${eventId}/pdf`, {}, { responseType: 'blob' }),
  excel: (eventId: number) =>
    api.post(`/api/reports/${eventId}/excel`, {}, { responseType: 'blob' }),
}

// ── History ────────────────────────────────────────────────────────────────
export const historyAPI = {
  list: (eventType?: string) =>
    api.get('/api/history', { params: eventType ? { event_type: eventType } : {} }),
  count: (eventType?: string) =>
    api.get('/api/history/count', { params: eventType ? { event_type: eventType } : {} }),
  create: (data: object) => api.post('/api/history', data),
  update: (id: number, data: object) => api.put(`/api/history/${id}`, data),
  delete: (id: number) => api.delete(`/api/history/${id}`),
  importCsv: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/history/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  csvTemplate: () => api.get('/api/history/csv-template', { responseType: 'blob' }),
  loadSample: () => api.post('/api/history/load-sample'),
}

// ── Settings ───────────────────────────────────────────────────────────────
export const settingsAPI = {
  getAllocationRules: () => api.get('/api/settings/allocation-rules'),
  updateAllocationRules: (data: object) => api.put('/api/settings/allocation-rules', data),
}

export default api
