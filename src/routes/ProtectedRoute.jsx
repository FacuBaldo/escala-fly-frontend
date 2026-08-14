import { Navigate } from 'react-router-dom'
import useAutenticacion from '../context/useAutenticacion'

function ProtectedRoute({ children }) {
  const { token } = useAutenticacion()

  if (!token) {
    return <Navigate to="/iniciar-sesion" replace />
  }

  return children
}

export default ProtectedRoute
