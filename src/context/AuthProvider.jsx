import { useEffect, useMemo, useState } from 'react'
import { login as loginRequest } from '../api/authApi'
import { TOKEN_KEY, USER_KEY } from '../api/apiClient'
import AuthContext from './authContext'

const readStoredUser = () => {
  const storedUser = localStorage.getItem(USER_KEY)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readStoredUser)

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  const login = async (credentials) => {
    const data = await loginRequest(credentials)

    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }

  useEffect(() => {
    window.addEventListener('auth:logout', logout)

    return () => {
      window.removeEventListener('auth:logout', logout)
    }
  }, [])

  const value = useMemo(
    () => ({
      login,
      logout,
      token,
      user,
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
