import apiClient from './apiClient'

const getUsers = async () => {
  const response = await apiClient.get('/users')

  return response.data
}

const createUser = async (user) => {
  const response = await apiClient.post('/users', user)

  return response.data
}

const updateUser = async (id, user) => {
  const response = await apiClient.put(`/users/${id}`, user)

  return response.data
}

const deleteUser = async (id) => {
  const response = await apiClient.delete(`/users/${id}`)

  return response.data
}

export { createUser, deleteUser, getUsers, updateUser }
