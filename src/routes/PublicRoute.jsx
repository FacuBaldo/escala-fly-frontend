import { Navigate } from 'react-router-dom'
import useAuth from '../context/useAuth'

function PublicRoute({ children }) {
  const { token } = useAuth()

  if (token) {
    return <Navigate to="/users" replace />
  }

  return children
}

export default PublicRoute
