/**
 * Pasa un texto a minusculas y sin tildes, para que la busqueda no dependa de
 * como se escribio: "nunez" encuentra "Nuñez" y "ordenes" encuentra "Órdenes".
 */
const normalizarTexto = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/**
 * Indica si alguno de los textos contiene todas las palabras buscadas.
 * "air 502" encuentra "Air Tractor AT-502" aunque las palabras no esten juntas.
 * @param {string} busqueda - Lo que escribio el usuario
 * @param {Array<unknown>} textos - Campos del registro donde buscar
 */
const coincideBusqueda = (busqueda, textos) => {
  const palabras = normalizarTexto(busqueda).split(/\s+/).filter(Boolean)

  if (palabras.length === 0) {
    return true
  }

  const contenido = textos.map(normalizarTexto).join(' ')
  return palabras.every((palabra) => contenido.includes(palabra))
}

/** Ordena alfabeticamente las opciones de un desplegable de filtro. */
const ordenarOpciones = (opciones) =>
  [...opciones].sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es', { sensitivity: 'base' }))

export { coincideBusqueda, normalizarTexto, ordenarOpciones }
