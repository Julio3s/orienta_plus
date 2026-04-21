import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('orienta_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('orienta_refresh_token')
      if (refresh) {
        try {
          const { data } = await api.post('/token/refresh/', { refresh })
          localStorage.setItem('orienta_access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.removeItem('orienta_access_token')
          localStorage.removeItem('orienta_refresh_token')
          window.location.href = '/admin/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── Helpers ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post('/token/', credentials),
  refresh: (token) => api.post('/token/refresh/', { refresh: token }),
}

export const seriesAPI = {
  list: () => api.get('/series/'),
  get: (id) => api.get(`/series/${id}/`),
  create: (data) => api.post('/series/', data),
  update: (id, data) => api.put(`/series/${id}/`, data),
  delete: (id) => api.delete(`/series/${id}/`),
}

export const matieresAPI = {
  list: () => api.get('/matieres/'),
  create: (data) => api.post('/matieres/', data),
  update: (id, data) => api.put(`/matieres/${id}/`, data),
  delete: (id) => api.delete(`/matieres/${id}/`),
}

export const universitesAPI = {
  list: () => api.get('/universites/'),
  get: (id) => api.get(`/universites/${id}/`),
  create: (data) => api.post('/universites/', data),
  update: (id, data) => api.put(`/universites/${id}/`, data),
  delete: (id) => api.delete(`/universites/${id}/`),
}

export const filieresAPI = {
  list: () => api.get('/filieres/'),
  get: (id) => api.get(`/filieres/${id}/`),
  create: (data) => api.post('/filieres/', data),
  update: (id, data) => api.put(`/filieres/${id}/`, data),
  delete: (id) => api.delete(`/filieres/${id}/`),
}

export const seuilsAPI = {
  list: () => api.get('/seuils/'),
  create: (data) => api.post('/seuils/', data),
  update: (id, data) => api.put(`/seuils/${id}/`, data),
  delete: (id) => api.delete(`/seuils/${id}/`),
}

export const suggererAPI = {
  suggerer: (payload) => api.post('/suggerer/', payload),
}

export const simulationAPI = {
  envoyerResultats: (payload) => api.post('/envoyer-resultats/', payload),
}

export const chatbotAPI = {
  envoyer: (payload) => api.post('/chatbot/', payload),
}

export const statsAPI = {
  dashboard: () => api.get('/stats/'),
}
