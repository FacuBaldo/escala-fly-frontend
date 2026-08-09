import axios from 'axios'

const TOKEN_KEY = 'authToken'
const USER_KEY = 'authUser'

const apiClient = axios.create({
  baseURL: '/api',
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (error.config?.url !== '/auth/login') {
        error.isAuthLogout = true
        window.dispatchEvent(
          new CustomEvent('app:toast', {
            detail: {
              message: 'Tu sesion expiro. Volve a iniciar sesion.',
              type: 'error',
            },
          }),
        )
      }

      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.dispatchEvent(new Event('auth:logout'))
    }

    return Promise.reject(error)
  },
)

export { TOKEN_KEY, USER_KEY }
export default apiClient
