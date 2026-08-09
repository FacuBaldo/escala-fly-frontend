import { Navigate, Route, Routes } from 'react-router-dom'
import useAuth from './context/useAuth'
import LoginPage from './pages/LoginPage'
import UsersPage from './pages/UsersPage'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicRoute from './routes/PublicRoute'
import './App.css'

function App() {
  const { token } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={token ? '/users' : '/login'} replace />} />
    </Routes>
  )
}

export default App
