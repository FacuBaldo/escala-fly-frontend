const errorMessages = {
  'El correo electronico y la contrasena son obligatorios': 'El correo electronico y la contrasena son obligatorios.',
  'nombre, apellido, email y contrasena son obligatorios': 'Todos los campos son obligatorios.',
  'Correo o contrasena incorrectos': 'Correo o contrasena incorrectos.',
  'El correo electronico ya esta registrado': 'El correo electronico ya esta registrado.',
  'El usuario no existe': 'El usuario no existe.',
  'No se pudo crear el usuario': 'No se pudo crear el usuario.',
  'No se pudieron cargar los usuarios': 'No se pudieron cargar los usuarios.',
  'No se pudo cargar el usuario': 'No se pudo cargar el usuario.',
  'No se pudo actualizar el usuario': 'No se pudo actualizar el usuario.',
  'No se pudo eliminar el usuario': 'No se pudo eliminar el usuario.',
  'No se pudo iniciar sesion': 'No se pudo iniciar sesion.',
  'La autenticacion no esta configurada correctamente': 'La autenticacion no esta configurada correctamente.',
}

function getErrorMessage(error, fallback = 'Ocurrio un error inesperado.') {
  const apiMessage = error?.response?.data?.message

  if (!apiMessage) {
    return fallback
  }

  return errorMessages[apiMessage] || apiMessage
}

export default getErrorMessage
