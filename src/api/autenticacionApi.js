import apiClient from './apiClient'

const iniciarSesion = async ({ email, contrasena }) => {
  const response = await apiClient.post('/autenticacion/iniciar-sesion', { email, contrasena })

  return response.data
}

const getSesionActual = async () => {
  const response = await apiClient.get('/autenticacion/me')

  return response.data
}

export { getSesionActual, iniciarSesion }
