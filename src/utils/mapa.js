// Geocodificacion gratuita de OpenStreetMap (sin API key). Politica de uso: busquedas
// puntuales iniciadas por el usuario, sin autocompletado. https://operations.osmfoundation.org/policies/nominatim/
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const PAIS_BUSQUEDA = 'ar'

const aNumero = (texto) => Number(texto.replace(',', '.'))

/**
 * Interpreta un texto como coordenadas "latitud, longitud" (el mismo orden que Google Maps).
 * Acepta "-31.4278, -62.0828", "-31.4278 -62.0828", "-31.4278;-62.0828" y "-31,4278; -62,0828".
 * Devuelve { lat, lng } o null si el texto no son coordenadas validas.
 */
const parseCoordenadas = (texto) => {
  const limpio = texto.trim()
  const numero = String.raw`[-+]?\d+(?:[.,]\d+)?`
  const separador = String.raw`\s*;\s*|\s*,\s+|\s+|,`
  const match = limpio.match(new RegExp(`^(${numero})(?:${separador})(${numero})$`))

  if (!match) {
    return null
  }

  const lat = aNumero(match[1])
  const lng = aNumero(match[2])

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null
  }

  return { lat, lng }
}

/**
 * Busca ciudades, localidades o direcciones. Devuelve hasta 5 resultados con su centro y extension.
 */
const buscarLugares = async (consulta, { signal } = {}) => {
  const params = new URLSearchParams({
    q: consulta,
    format: 'jsonv2',
    limit: '5',
    countrycodes: PAIS_BUSQUEDA,
    'accept-language': 'es',
  })

  const response = await fetch(`${NOMINATIM_URL}?${params}`, { signal })

  if (!response.ok) {
    throw new Error('No se pudo consultar el servicio de busqueda')
  }

  const resultados = await response.json()

  return resultados.map((resultado) => {
    const [sur, norte, oeste, este] = resultado.boundingbox.map(Number)

    return {
      id: resultado.place_id,
      nombre: resultado.display_name,
      lat: Number(resultado.lat),
      lng: Number(resultado.lon),
      bounds: [
        [sur, oeste],
        [norte, este],
      ],
    }
  })
}

export { buscarLugares, parseCoordenadas }
