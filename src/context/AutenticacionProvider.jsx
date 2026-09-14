import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSesionActual, iniciarSesion as iniciarSesionRequest } from '../api/autenticacionApi'
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
  // Token cuya sesion ya fue confirmada contra el backend (/me o inicio de sesion)
  const [tokenVerificado, setTokenVerificado] = useState(null)

  // El estado se deriva del token en lugar de sincronizarlo con setState dentro de un efecto
  let status = 'anonymous'
  if (token) {
    status = tokenVerificado === token ? 'authenticated' : 'loading'
  }

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(CLAVE_TOKEN)
    localStorage.removeItem(CLAVE_USUARIO)
    setToken(null)
    setUsuario(null)
    setTokenVerificado(null)
  }, [])

  const iniciarSesion = useCallback(async (credenciales) => {
    const data = await iniciarSesionRequest(credenciales)

    localStorage.setItem(CLAVE_TOKEN, data.token)
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(data.usuario))
    setToken(data.token)
    setUsuario(data.usuario)
    setTokenVerificado(data.token)

    return data.usuario
  }, [])

  useEffect(() => {
    window.addEventListener('autenticacion:cerrar-sesion', cerrarSesion)

    return () => {
      window.removeEventListener('autenticacion:cerrar-sesion', cerrarSesion)
    }
  }, [cerrarSesion])

  useEffect(() => {
    if (!token || tokenVerificado === token) {
      return undefined
    }

    let isActive = true

    getSesionActual()
      .then((usuarioActual) => {
        if (!isActive) {
          return
        }

        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuarioActual))
        setUsuario(usuarioActual)
        setTokenVerificado(token)
      })
      .catch((error) => {
        if (isActive && !error.cierreSesionPorAutenticacion) {
          cerrarSesion()
        }
      })

    return () => {
      isActive = false
    }
  }, [cerrarSesion, token, tokenVerificado])

  const value = useMemo(
    () => ({
      cerrarSesion,
      iniciarSesion,
      status,
      token,
      usuario,
    }),
    [cerrarSesion, iniciarSesion, status, token, usuario],
  )

  return <AutenticacionContext.Provider value={value}>{children}</AutenticacionContext.Provider>
}

export default AutenticacionProvider
