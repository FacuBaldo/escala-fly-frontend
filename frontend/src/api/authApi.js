import apiClient from './apiClient'

const login = async ({ email, password }) => {
  const response = await apiClient.post('/auth/login', { email, password })

  return response.data
}

export { login }
