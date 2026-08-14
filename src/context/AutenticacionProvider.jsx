import { useEffect, useMemo, useState } from 'react'
import { iniciarSesion as iniciarSesionRequest } from '../api/autenticacionApi'
import { CLAVE_TOKEN, CLAVE_USUARIO } from '../api/apiClient'
import AutenticacionContext from './autenticacionContext'

const readStoredUsuario = () => {
  const storedUsuario = localStorage.getItem(CLAVE_USUARIO)

  if (!storedUsuario) {
    return null
  }

  try {
    return JSON.parse(storedUsuario)
  } catch {
    localStorage.removeItem(CLAVE_USUARIO)
    return null
  }
}

function AutenticacionProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(CLAVE_TOKEN))
  const [usuario, setUsuario] = useState(readStoredUsuario)

  const cerrarSesion = () => {
    localStorage.removeItem(CLAVE_TOKEN)
    localStorage.removeItem(CLAVE_USUARIO)
    setToken(null)
    setUsuario(null)
  }

  const iniciarSesion = async (credenciales) => {
    const data = await iniciarSesionRequest(credenciales)

    localStorage.setItem(CLAVE_TOKEN, data.token)
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(data.usuario))
    setToken(data.token)
    setUsuario(data.usuario)
  }

  useEffect(() => {
    window.addEventListener('autenticacion:cerrar-sesion', cerrarSesion)

    return () => {
      window.removeEventListener('autenticacion:cerrar-sesion', cerrarSesion)
    }
  }, [])

  const value = useMemo(
    () => ({
      cerrarSesion,
      iniciarSesion,
      token,
      usuario,
    }),
    [token, usuario],
  )

  return <AutenticacionContext.Provider value={value}>{children}</AutenticacionContext.Provider>
}

export default AutenticacionProvider
