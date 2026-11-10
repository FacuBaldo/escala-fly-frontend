import { Navigate } from 'react-router-dom'
import PageLoader from '../components/compartidos/feedback/PageLoader'
import AppLayout from '../components/compartidos/layout/AppLayout'
import { RUTA_SIN_ACCESO, hasRole } from '../auth/roles'
import useAutenticacion from '../context/useAutenticacion'

function ProtectedRoute({ children, roles }) {
  const { status, token, usuario } = useAutenticacion()

  if (status === 'loading') {
    return <AppLayout><PageLoader /></AppLayout>
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
