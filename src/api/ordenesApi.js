import apiClient from './apiClient'

const getOrdenes = async ({ loteId, campoId, estado, empresaId } = {}) => {
  const params = {}
  if (loteId) params.loteId = loteId
  if (campoId) params.campoId = campoId
  if (estado) params.estado = estado
  if (empresaId) params.empresaId = empresaId

  const response = await apiClient.get('/ordenes', {
    params: Object.keys(params).length > 0 ? params : undefined,
  })

  return response.data
}

const getOrdenById = async (id) => {
  const response = await apiClient.get(`/ordenes/${id}`)

  return response.data
}

/**
 * Plan de vuelo con las geometrias de cada viaje, listo para dibujar en el mapa.
 */
const getPlanDeOrden = async (id) => {
  const response = await apiClient.get(`/ordenes/${id}/plan`)

  return response.data
}

const createOrden = async (orden) => {
  const response = await apiClient.post('/ordenes', orden)

  return response.data
}

const updateOrden = async (id, orden) => {
  const response = await apiClient.put(`/ordenes/${id}`, orden)

  return response.data
}

const regenerarPlan = async (id) => {
  const response = await apiClient.post(`/ordenes/${id}/plan/regenerar`)

  return response.data
}

const deleteOrden = async (id) => {
  const response = await apiClient.delete(`/ordenes/${id}`)

  return response.data
}

export {
  createOrden,
  deleteOrden,
  getOrdenById,
  getOrdenes,
  getPlanDeOrden,
  regenerarPlan,
  updateOrden,
}
