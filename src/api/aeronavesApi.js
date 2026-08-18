import apiClient from './apiClient'

const getAeronaves = async ({ estado, empresaId } = {}) => {
  const response = await apiClient.get('/aeronaves', {
    params: { estado, empresaId },
  })

  return response.data
}

const createAeronave = async (aeronave) => {
  const response = await apiClient.post('/aeronaves', aeronave)

  return response.data
}

const updateAeronave = async (id, aeronave) => {
  const response = await apiClient.put(`/aeronaves/${id}`, aeronave)

  return response.data
}

const deleteAeronave = async (id) => {
  const response = await apiClient.delete(`/aeronaves/${id}`)

  return response.data
}

export { createAeronave, deleteAeronave, getAeronaves, updateAeronave }
