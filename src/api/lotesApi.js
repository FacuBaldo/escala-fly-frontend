import apiClient from './apiClient'

const getLotes = async (campoId, activo) => {
  const params = {}
  if (campoId) params.campoId = campoId
  if (activo !== undefined) params.activo = activo

  const response = await apiClient.get('/lotes', {
    params: Object.keys(params).length > 0 ? params : undefined,
  })

  return response.data
}

const getLoteById = async (id) => {
  const response = await apiClient.get(`/lotes/${id}`)

  return response.data
}

const createLote = async (lote) => {
  const response = await apiClient.post('/lotes', lote)

  return response.data
}

const updateLote = async (id, lote) => {
  const response = await apiClient.put(`/lotes/${id}`, lote)

  return response.data
}

const cambiarEstadoLote = async (id, activo) => {
  const response = await apiClient.patch(`/lotes/${id}/baja`, { activo })

  return response.data
}

const deleteLote = async (id) => {
  const response = await apiClient.delete(`/lotes/${id}`)

  return response.data
}

export { cambiarEstadoLote, createLote, deleteLote, getLoteById, getLotes, updateLote }
