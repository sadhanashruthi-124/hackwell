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

// Redirect to login on 401 (except for login requests)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/api/auth/login')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
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
  me: () => api.get('/api/auth/me'),
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
  estimate: (eventId: number) => api.get(`/api/resources/estimate/${eventId}`),
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
}

export default api
