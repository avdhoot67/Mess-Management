import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
let accessToken = null
let refreshRequest = null
let onAuthenticationExpired = null

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

const refreshableRequest = (url = '') => ![
  '/auth/login',
  '/auth/logout',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
].includes(url)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retried || !refreshableRequest(originalRequest.url)) {
      return Promise.reject(error)
    }

    originalRequest._retried = true
    try {
      if (!refreshRequest) {
        refreshRequest = api.post('/auth/refresh').finally(() => { refreshRequest = null })
      }
      const response = await refreshRequest
      setAccessToken(response.data.token)
      return api(originalRequest)
    } catch (refreshError) {
      clearAccessToken()
      onAuthenticationExpired?.()
      return Promise.reject(refreshError)
    }
  }
)

export const setAccessToken = (token) => {
  accessToken = token || null
}

export const clearAccessToken = () => {
  accessToken = null
}

export const setAuthenticationExpiredHandler = (handler) => {
  onAuthenticationExpired = handler
}

export const checkBackendHealth = async () => {
  const response = await api.get('/health')
  return response.data
}

export default api
