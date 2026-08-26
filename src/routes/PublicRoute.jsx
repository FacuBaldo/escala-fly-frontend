import { Navigate } from 'react-router-dom'
import PageLoader from '../components/PageLoader'
import { getDefaultRoute } from '../auth/roles'
import useAutenticacion from '../context/useAutenticacion'

function PublicRoute({ children }) {
  const { status, token, usuario } = useAutenticacion()

  if (status === 'loading') {
    return <PageLoader message="Cargando sesion..." />
  }

  if (token) {
    return <Navigate to={getDefaultRoute(usuario)} replace />
  }

  return children
}

export default PublicRoute
