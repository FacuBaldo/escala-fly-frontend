import apiClient from './apiClient'

const getProductos = async (empresaId, tipo) => {
  const params = {}
  if (empresaId) params.empresaId = empresaId
  if (tipo) params.tipo = tipo

  const response = await apiClient.get('/productos', {
    params: Object.keys(params).length > 0 ? params : undefined,
  })

  return response.data
}

const createProducto = async (producto) => {
  const response = await apiClient.post('/productos', producto)

  return response.data
}

const updateProducto = async (id, producto) => {
  const response = await apiClient.put(`/productos/${id}`, producto)

  return response.data
}

const deleteProducto = async (id) => {
  const response = await apiClient.delete(`/productos/${id}`)

  return response.data
}

export { createProducto, deleteProducto, getProductos, updateProducto }
