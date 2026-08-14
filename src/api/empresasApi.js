import apiClient from './apiClient'

const getEmpresas = async () => {
  const response = await apiClient.get('/empresas')

  return response.data
}

const createEmpresa = async (empresa) => {
  const response = await apiClient.post('/empresas', empresa)

  return response.data
}

const updateEmpresa = async (id, empresa) => {
  const response = await apiClient.put(`/empresas/${id}`, empresa)

  return response.data
}

const deleteEmpresa = async (id) => {
  const response = await apiClient.delete(`/empresas/${id}`)

  return response.data
}

export { createEmpresa, deleteEmpresa, getEmpresas, updateEmpresa }
