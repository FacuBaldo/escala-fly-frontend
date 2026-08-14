import axios from 'axios'

const CLAVE_TOKEN = 'tokenAutenticacion'
const CLAVE_USUARIO = 'usuarioAutenticado'

const apiClient = axios.create({
  baseURL: '/api',
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(CLAVE_TOKEN)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (error.config?.url !== '/autenticacion/iniciar-sesion') {
        error.cierreSesionPorAutenticacion = true
        window.dispatchEvent(
          new CustomEvent('app:toast', {
            detail: {
              message: 'Tu sesion expiro. Volve a iniciar sesion.',
              type: 'error',
            },
          }),
        )
      }

      localStorage.removeItem(CLAVE_TOKEN)
      localStorage.removeItem(CLAVE_USUARIO)
      window.dispatchEvent(new Event('autenticacion:cerrar-sesion'))
    }

    return Promise.reject(error)
  },
)

export { CLAVE_TOKEN, CLAVE_USUARIO }
export default apiClient
