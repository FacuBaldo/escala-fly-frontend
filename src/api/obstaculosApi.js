import apiClient from './apiClient'

// Obstáculos del lote: molino, casa, galpón, silo (puntos) y cables (líneas)

const getObstaculosDeLote = async (loteId) => {
  const response = await apiClient.get(`/lotes/${loteId}/obstaculos`)
  return response.data
}

const getObstaculosDeOrden = async (ordenId) => {
  const response = await apiClient.get(`/ordenes/${ordenId}/obstaculos`)
  return response.data
}

const createObstaculo = async (loteId, obstaculo) => {
  const response = await apiClient.post(`/lotes/${loteId}/obstaculos`, obstaculo)
  return response.data
}

const updateObstaculo = async (id, cambios) => {
  const response = await apiClient.put(`/obstaculos/${id}`, cambios)
  return response.data
}

const deleteObstaculo = async (id) => {
  const response = await apiClient.delete(`/obstaculos/${id}`)
  return response.data
}

export { createObstaculo, deleteObstaculo, getObstaculosDeLote, getObstaculosDeOrden, updateObstaculo }
