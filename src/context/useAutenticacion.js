import { useContext } from 'react'
import AutenticacionContext from './autenticacionContext'

const useAutenticacion = () => {
  const context = useContext(AutenticacionContext)

  if (!context) {
    throw new Error('useAutenticacion debe usarse dentro de AutenticacionProvider')
  }

  return context
}

export default useAutenticacion
