import apiClient from './apiClient'

const getOrdenes = async (params = {}) => {
  const response = await apiClient.get('/ordenes', {
    params: Object.keys(params).length > 0 ? params : undefined,
  })

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

const asignarClienteOrden = async (id, clienteId) => {
  const response = await apiClient.patch(`/ordenes/${id}/cliente`, { clienteId })
  return response.data
}

const cambiarEstadoOrden = async (id, estado) => {
  const response = await apiClient.patch(`/ordenes/${id}/estado`, { estado })
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

// Orden del cargador: lo que lleva de cada producto cada carga del plan
const getCargasDeOrden = async (id) => {
  const response = await apiClient.get(`/ordenes/${id}/cargas`)
  return response.data
}

const actualizarCargasDeOrden = async (id, cargas) => {
  const response = await apiClient.put(`/ordenes/${id}/cargas`, { cargas })
  return response.data
}

const restablecerCargasDeOrden = async (id) => {
  const response = await apiClient.post(`/ordenes/${id}/cargas/restablecer`)
  return response.data
}

export {
  asignarClienteOrden,
  cambiarEstadoOrden,
  createOrden,
  deleteOrden,
  getOrdenes,
  getPlanDeOrden,
  regenerarPlan,
  updateOrden,
}

// Orden del cargador (export aparte para no mezclarlo con el resto de la API de ordenes)
export { actualizarCargasDeOrden, getCargasDeOrden, restablecerCargasDeOrden }
