import { Marker, Polyline, Tooltip } from 'react-leaflet'
import { ESTILO_CABLE, describirObstaculo, iconoObstaculo } from '../../utils/obstaculos'

// Un icono por tipo, compartido por todos los mapas (Leaflet los reutiliza)
const ICONOS = {}
const icono = (tipo) => {
  if (!ICONOS[tipo]) ICONOS[tipo] = iconoObstaculo(tipo)
  return ICONOS[tipo]
}

/**
 * Obstáculos dibujados sobre un mapa de react-leaflet: un marcador por estructura y
 * una línea roja punteada por cable. Se usa en el mapa del campo y en el de la ruta.
 */
function CapaObstaculos({ obstaculos = [], resaltadoId = null }) {
  return obstaculos.map((obstaculo) => {
    const texto = describirObstaculo(obstaculo)
    const { type, coordinates } = obstaculo.geometria || {}

    if (type === 'LineString') {
      const resaltado = obstaculo.id === resaltadoId
      return (
        <Polyline
          key={obstaculo.id}
          pathOptions={resaltado ? { ...ESTILO_CABLE, weight: 7 } : ESTILO_CABLE}
          positions={coordinates.map(([lng, lat]) => [lat, lng])}
        >
          <Tooltip sticky>{texto}</Tooltip>
        </Polyline>
      )
    }

    if (type === 'Point') {
      return (
        <Marker icon={icono(obstaculo.tipo)} key={obstaculo.id} position={[coordinates[1], coordinates[0]]} zIndexOffset={obstaculo.id === resaltadoId ? 1000 : 0}>
          <Tooltip direction="top" offset={[0, -14]}>{texto}</Tooltip>
        </Marker>
      )
    }

    return null
  })
}

export default CapaObstaculos
