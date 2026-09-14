import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import useAutenticacion from './context/useAutenticacion'
import PageLoader from './components/PageLoader'
import IniciarSesionPage from './pages/IniciarSesionPage'
import UsuariosPage from './pages/UsuariosPage'
import EmpresasPage from './pages/EmpresasPage'
import CamposPage from './pages/CamposPage'
import ProductosPage from './pages/ProductosPage'
import AeronavesPage from './pages/AeronavesPage'
import SinAccesoPage from './pages/SinAccesoPage'
import { ROLES, getDefaultRoute } from './auth/roles'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicRoute from './routes/PublicRoute'
import './App.css'

// El modulo de lotes carga Leaflet y Geoman; se separa del bundle principal
const LotesPage = lazy(() => import('./pages/LotesPage'))

function App() {
  const { token, usuario } = useAutenticacion()
  const rolesOperativos = [ROLES.ADMIN, ROLES.ENCARGADO]

  return (
    <Routes>
      <Route
        path="/iniciar-sesion"
        element={
          <PublicRoute>
            <IniciarSesionPage />
          </PublicRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute roles={rolesOperativos}>
            <UsuariosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/empresas"
        element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <EmpresasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/campos"
        element={
          <ProtectedRoute roles={rolesOperativos}>
            <CamposPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lotes"
        element={
          <ProtectedRoute roles={rolesOperativos}>
            <Suspense fallback={<PageLoader message="Cargando mapa..." />}>
              <LotesPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/productos"
        element={
          <ProtectedRoute roles={rolesOperativos}>
            <ProductosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aeronaves"
        element={
          <ProtectedRoute roles={rolesOperativos}>
            <AeronavesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sin-acceso"
        element={
          <ProtectedRoute>
            <SinAccesoPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={token ? getDefaultRoute(usuario) : '/iniciar-sesion'} replace />} />
    </Routes>
  )
}

export default App
