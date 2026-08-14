import apiClient from './apiClient'

const getUsuarios = async () => {
  const response = await apiClient.get('/usuarios')

  return response.data
}

const createUsuario = async (usuario) => {
  const response = await apiClient.post('/usuarios', usuario)

  return response.data
}

const updateUsuario = async (id, usuario) => {
  const response = await apiClient.put(`/usuarios/${id}`, usuario)

  return response.data
}

const deleteUsuario = async (id) => {
  const response = await apiClient.delete(`/usuarios/${id}`)

  return response.data
}

export { createUsuario, deleteUsuario, getUsuarios, updateUsuario }
