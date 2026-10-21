import apiClient from './apiClient'

// Catalogos globales de Configuracion. Todos los roles que cargan productos los
// leen; solo el ADMIN los modifica.

const getTiposProducto = async () => {
  const response = await apiClient.get('/tipos-producto')

  return response.data
}

const createTipoProducto = async (tipo) => {
  const response = await apiClient.post('/tipos-producto', tipo)

  return response.data
}

const updateTipoProducto = async (id, tipo) => {
  const response = await apiClient.put(`/tipos-producto/${id}`, tipo)

  return response.data
}

const deleteTipoProducto = async (id) => {
  const response = await apiClient.delete(`/tipos-producto/${id}`)

  return response.data
}

const getUnidadesMedida = async () => {
  const response = await apiClient.get('/unidades-medida')

  return response.data
}

const createUnidadMedida = async (unidad) => {
  const response = await apiClient.post('/unidades-medida', unidad)

  return response.data
}

const updateUnidadMedida = async (id, unidad) => {
  const response = await apiClient.put(`/unidades-medida/${id}`, unidad)

  return response.data
}

const deleteUnidadMedida = async (id) => {
  const response = await apiClient.delete(`/unidades-medida/${id}`)

  return response.data
}

export {
  createTipoProducto,
  createUnidadMedida,
  deleteTipoProducto,
  deleteUnidadMedida,
  getTiposProducto,
  getUnidadesMedida,
  updateTipoProducto,
  updateUnidadMedida,
}
