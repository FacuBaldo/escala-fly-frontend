const ROLES = {
  ADMIN: 'ADMIN',
  ENCARGADO: 'ENCARGADO',
  PILOTO: 'PILOTO',
  CLIENTE: 'CLIENTE',
}

const RUTA_SIN_ACCESO = '/sin-acceso'

const getDefaultRoute = (usuario) => {
  if (!usuario) {
    return '/iniciar-sesion'
  }

  if ([ROLES.ADMIN, ROLES.ENCARGADO].includes(usuario.rol)) {
    return '/usuarios'
  }

  return RUTA_SIN_ACCESO
}

const hasRole = (usuario, roles = []) => {
  return Boolean(usuario && roles.includes(usuario.rol))
}

export { ROLES, RUTA_SIN_ACCESO, getDefaultRoute, hasRole }
