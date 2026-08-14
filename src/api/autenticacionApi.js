import apiClient from './apiClient'

const iniciarSesion = async ({ email, contrasena }) => {
  const response = await apiClient.post('/autenticacion/iniciar-sesion', { email, contrasena })

  return response.data
}

export { iniciarSesion }
