import { Navigate } from 'react-router-dom'
import useAutenticacion from '../context/useAutenticacion'

function PublicRoute({ children }) {
  const { token } = useAutenticacion()

  if (token) {
    return <Navigate to="/usuarios" replace />
  }

  return children
}

export default PublicRoute
