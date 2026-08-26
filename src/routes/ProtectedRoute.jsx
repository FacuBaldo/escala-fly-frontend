import { Navigate } from 'react-router-dom'
import PageLoader from '../components/PageLoader'
import { RUTA_SIN_ACCESO, hasRole } from '../auth/roles'
import useAutenticacion from '../context/useAutenticacion'

function ProtectedRoute({ children, roles }) {
  const { status, token, usuario } = useAutenticacion()

  if (status === 'loading') {
    return <PageLoader message="Cargando sesion..." />
  }

  if (!token) {
    return <Navigate to="/iniciar-sesion" replace />
  }

  if (roles?.length && !hasRole(usuario, roles)) {
    return <Navigate to={RUTA_SIN_ACCESO} replace />
  }

  return children
}

export default ProtectedRoute
