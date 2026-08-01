import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use(config => {
  if (!config.headers.Authorization) {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  res => {
    window.dispatchEvent(new CustomEvent('api-connection-ok'))
    return res
  },
  err => {
    if (!err.response) {
      // Sin respuesta del servidor — backend o DB caído
      window.dispatchEvent(new CustomEvent('api-connection-error'))
    } else if (err.response.status === 503) {
      window.dispatchEvent(new CustomEvent('api-connection-error'))
    }

    if (err.response?.status === 401) {
      const authPaths = ['/login', '/register', '/accept-invite']
      const isAuthPage = authPaths.some(p => window.location.pathname.startsWith(p))
      if (!isAuthPage) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
