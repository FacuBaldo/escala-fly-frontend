import apiClient from './apiClient'

const getEmpresas = async (params) => {
  const response = await apiClient.get('/empresas', { params })

  return response.data
}

const getEmpresaById = async (id) => {
  const response = await apiClient.get(`/empresas/${id}`)
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

export { createEmpresa, deleteEmpresa, getEmpresaById, getEmpresas, updateEmpresa }
