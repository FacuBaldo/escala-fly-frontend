const errorMessages = {
  'email and password are required': 'El correo electronico y la contrasena son obligatorios.',
  'Invalid email or password': 'Correo o contrasena incorrectos.',
  'firstName, lastName, email and password are required': 'Todos los campos son obligatorios.',
  'Email is already registered': 'El correo electronico ya esta registrado.',
  'User not found': 'El usuario no existe.',
  'Error creating user': 'No se pudo crear el usuario.',
  'Error getting users': 'No se pudieron cargar los usuarios.',
  'Error getting user': 'No se pudo cargar el usuario.',
  'Error updating user': 'No se pudo actualizar el usuario.',
  'Error deleting user': 'No se pudo eliminar el usuario.',
  'Error logging in': 'No se pudo iniciar sesion.',
  'JWT_SECRET is not configured': 'La autenticacion no esta configurada correctamente.',
}

function getErrorMessage(error, fallback = 'Ocurrio un error inesperado.') {
  const apiMessage = error?.response?.data?.message

  if (!apiMessage) {
    return fallback
  }

  return errorMessages[apiMessage] || apiMessage
}

export default getErrorMessage
