import apiClient from './apiClient'

const getPistas = async (params = {}) => {
  const response = await apiClient.get('/pistas', {
    params: Object.keys(params).length > 0 ? params : undefined,
  })

  return response.data
}

const createPista = async (pista) => {
  const response = await apiClient.post('/pistas', pista)

  return response.data
}

const updatePista = async (id, pista) => {
  const response = await apiClient.put(`/pistas/${id}`, pista)

  return response.data
}

const cambiarEstadoPista = async (id, activo) => {
  const response = await apiClient.patch(`/pistas/${id}/baja`, { activo })

  return response.data
}

const deletePista = async (id) => {
  const response = await apiClient.delete(`/pistas/${id}`)

  return response.data
}

export { cambiarEstadoPista, createPista, deletePista, getPistas, updatePista }
