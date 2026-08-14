import apiClient from './apiClient'

const getCampos = async (empresaId) => {
  const response = await apiClient.get('/campos', {
    params: empresaId ? { empresaId } : undefined,
  })

  return response.data
}

const createCampo = async (campo) => {
  const response = await apiClient.post('/campos', campo)

  return response.data
}

const updateCampo = async (id, campo) => {
  const response = await apiClient.put(`/campos/${id}`, campo)

  return response.data
}

const deleteCampo = async (id) => {
  const response = await apiClient.delete(`/campos/${id}`)

  return response.data
}

export { createCampo, deleteCampo, getCampos, updateCampo }
