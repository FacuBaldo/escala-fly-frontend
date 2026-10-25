/** Los índices del backend referencian la línea completa, en orden de vuelo. */
export function obtenerTramosVuelo(viaje) {
  const coordenadas = viaje.recorrido.coordinates
  let segmentos = viaje.segmentos

  // Compatibilidad con planes anteriores: las curvas se recuperan entre aplicaciones.
  if (!segmentos?.length) {
    segmentos = []
    let cursor = 0
    let pasadaIndice = -1
    let aplicacionAnterior = null
    const coincide = (a, b) => Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7
    viaje.tramosAplicacion.coordinates.forEach(([desde, hasta]) => {
      const inicio = coordenadas.findIndex((punto, indice) => indice >= cursor && coincide(punto, desde))
      const fin = coordenadas.findIndex((punto, indice) => indice > inicio && coincide(punto, hasta))
      if (inicio < cursor || fin <= inicio) return
      // Un hueco mantiene la dirección de la misma pasada; un giro la invierte.
      let continuaPasada = false
      if (aplicacionAnterior && inicio - cursor <= 1) {
        const [previoDesde, previoHasta] = aplicacionAnterior
        const u = [previoHasta[0] - previoDesde[0], previoHasta[1] - previoDesde[1]]
        const v = [hasta[0] - desde[0], hasta[1] - desde[1]]
        const salto = [desde[0] - previoHasta[0], desde[1] - previoHasta[1]]
        const largo = Math.hypot(...u)
        const paralelo = (vector) => Math.abs(u[0] * vector[1] - u[1] * vector[0]) <= largo * 1e-7
        continuaPasada = paralelo(v) && paralelo(salto) && u[0] * v[0] + u[1] * v[1] > 0
      }
      if (!continuaPasada) pasadaIndice++
      if (inicio > cursor) {
        segmentos.push({ tipo: cursor === 0 ? 'TRASLADO' : inicio - cursor > 1 ? 'GIRO' : 'ENLACE', inicio: cursor, fin: inicio })
      }
      segmentos.push({ tipo: 'APLICACION', inicio, fin, pasadaIndice })
      aplicacionAnterior = [desde, hasta]
      cursor = fin
    })
    if (cursor < coordenadas.length - 1) {
      segmentos.push({ tipo: 'TRASLADO', inicio: cursor, fin: coordenadas.length - 1 })
    }
  }

  let numeroPasada = 0
  let pasadaAnterior = null
  return segmentos.map((segmento) => {
    if (segmento.tipo === 'APLICACION' && segmento.pasadaIndice !== pasadaAnterior) {
      numeroPasada++
      pasadaAnterior = segmento.pasadaIndice
    }
    return {
      ...segmento,
      numeroPasada: segmento.tipo === 'APLICACION' ? numeroPasada : null,
      posiciones: coordenadas.slice(segmento.inicio, segmento.fin + 1).map(([lng, lat]) => [lat, lng]),
    }
  })
}

export const ESTILOS_TRAMO = {
  APLICACION: { nombre: 'Aplicación', color: '#2563eb', weight: 4 },
  GIRO: { nombre: 'Giro sin aplicación', color: '#d97706', weight: 3 },
  TRASLADO: { nombre: 'Traslado pista–lote', color: '#475569', weight: 3, dashArray: '10 8' },
  ENLACE: { nombre: 'Enlace sin aplicación', color: '#7c3aed', weight: 3, dashArray: '3 7' },
}
