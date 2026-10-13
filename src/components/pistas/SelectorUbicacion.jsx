import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import BuscadorMapa from '../lotes/BuscadorMapa'

// San Francisco, Cordoba
const CENTRO_POR_DEFECTO = [-31.4278, -62.0828]
const ZOOM_POR_DEFECTO = 12
const ZOOM_CON_UBICACION = 15

const iconoPista = L.divIcon({
  className: '',
  html:
    '<span style="display:flex;height:28px;width:28px;align-items:center;justify-content:center;' +
    'border-radius:9999px;background:#047857;color:#fff;border:3px solid #fff;' +
    'box-shadow:0 1px 4px rgba(0,0,0,.4);font-size:14px">&#9992;</span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

function CapturarClick({ onSeleccionar }) {
  useMapEvents({
    click: (evento) => onSeleccionar(evento.latlng.lat, evento.latlng.lng),
  })

  return null
}

/**
 * Mapa para elegir la ubicacion de una pista: se hace clic sobre el mapa o se
 * busca la zona por ciudad, direccion o coordenadas con el buscador.
 * El encuadre inicial se fija al abrir; despues lo maneja el usuario.
 */
function SelectorUbicacion({ latitud, longitud, onSeleccionar }) {
  const tienePosicion = Number.isFinite(latitud) && Number.isFinite(longitud)

  return (
    <div className="relative z-0 h-72 overflow-hidden rounded-md border border-slate-200">
      <MapContainer
        center={tienePosicion ? [latitud, longitud] : CENTRO_POR_DEFECTO}
        className="h-full w-full"
        scrollWheelZoom
        zoom={tienePosicion ? ZOOM_CON_UBICACION : ZOOM_POR_DEFECTO}
      >
        <TileLayer
          attribution="Tiles &copy; Esri"
          maxNativeZoom={17}
          maxZoom={19}
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <BuscadorMapa />
        <CapturarClick onSeleccionar={onSeleccionar} />
        {tienePosicion && <Marker icon={iconoPista} position={[latitud, longitud]} />}
      </MapContainer>
    </div>
  )
}

export default SelectorUbicacion
