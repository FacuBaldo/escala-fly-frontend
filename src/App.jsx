import { Navigate, Route, Routes } from 'react-router-dom'
import useAutenticacion from './context/useAutenticacion'
import IniciarSesionPage from './pages/IniciarSesionPage'
import UsuariosPage from './pages/UsuariosPage'
import EmpresasPage from './pages/EmpresasPage'
import CamposPage from './pages/CamposPage'
import AeronavesPage from './pages/AeronavesPage'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicRoute from './routes/PublicRoute'
import './App.css'

function App() {
  const { token } = useAutenticacion()

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
          <ProtectedRoute>
            <UsuariosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/empresas"
        element={
          <ProtectedRoute>
            <EmpresasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/campos"
        element={
          <ProtectedRoute>
            <CamposPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aeronaves"
        element={
          <ProtectedRoute>
            <AeronavesPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={token ? '/usuarios' : '/iniciar-sesion'} replace />} />
    </Routes>
  )
}

export default App
