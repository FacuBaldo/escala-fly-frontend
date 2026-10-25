import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { LayersControl, MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import BuscadorMapa from '../lotes/BuscadorMapa'

// San Francisco, Cordoba
const CENTRO_POR_DEFECTO = [-31.4278, -62.0828]
const ZOOM_POR_DEFECTO = 12
const ZOOM_PISTA = 15

const COLOR_ACTIVA = '#059669'
const COLOR_INACTIVA = '#64748b'
const COLOR_RESALTADA = '#f59e0b'

// Los iconos se cachean por color: crearlos en cada render reinicia los marcadores
const iconosPorColor = {}

const iconoDe = (color) => {
  if (!iconosPorColor[color]) {
    iconosPorColor[color] = L.divIcon({
      className: '',
      html:
        `<span style="display:flex;height:30px;width:30px;align-items:center;justify-content:center;` +
        `border-radius:9999px;background:${color};color:#fff;border:3px solid #fff;` +
        'box-shadow:0 1px 4px rgba(0,0,0,.45);font-size:15px">&#9992;</span>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })
  }

  return iconosPorColor[color]
}

const colorDePista = (pista, isSelected) => {
  if (isSelected) {
    return COLOR_RESALTADA
  }

  return pista.activo ? COLOR_ACTIVA : COLOR_INACTIVA
}

const tieneUbicacion = (pista) => Number.isFinite(pista?.latitud) && Number.isFinite(pista?.longitud)

/** Encuadra todas las pistas al entrar y sigue a la que se selecciona en la lista */
function AjustarVista({ pistas, selectedPistaId, vistaVersion }) {
  const map = useMap()
  const pistasRef = useRef(pistas)

  useEffect(() => {
    pistasRef.current = pistas
  }, [pistas])

  useEffect(() => {
    const ubicadas = pistasRef.current.filter(tieneUbicacion)

    if (ubicadas.length === 0) {
      return
    }

    if (ubicadas.length === 1) {
      map.setView([ubicadas[0].latitud, ubicadas[0].longitud], ZOOM_PISTA)
      return
    }

    const bounds = L.latLngBounds(ubicadas.map((pista) => [pista.latitud, pista.longitud]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: ZOOM_PISTA })
  }, [map, vistaVersion])

  useEffect(() => {
    const pista = pistasRef.current.find((item) => item.id === selectedPistaId)

    if (!tieneUbicacion(pista)) {
      return
    }

    map.flyTo([pista.latitud, pista.longitud], Math.max(map.getZoom(), ZOOM_PISTA))
  }, [map, selectedPistaId])

  return null
}

/** En modo marcar, el clic sobre el mapa define donde esta la pista */
function CapturarClic({ activo, onUbicacionMarcada }) {
  const map = useMap()

  useEffect(() => {
    if (!activo) {
      return undefined
    }

    const contenedor = map.getContainer()
    contenedor.style.cursor = 'crosshair'

    return () => {
      contenedor.style.cursor = ''
    }
  }, [activo, map])

  useMapEvents({
    click: (event) => {
      if (activo) {
        onUbicacionMarcada(event.latlng.lat, event.latlng.lng)
      }
    },
  })

  return null
}

/**
 * Mapa de pistas de la empresa. Soporta dos modos ademas del de consulta:
 * marcar una pista nueva con un clic y mover de lugar una existente.
 */
function MapaPistas({
  isMarcando,
  onSelectPista,
  onUbicacionEditada,
  onUbicacionMarcada,
  pistaEnEdicion,
  pistas,
  selectedPistaId,
  vistaVersion,
}) {
  const isInteractivo = !isMarcando && !pistaEnEdicion

  return (
    <MapContainer
      center={CENTRO_POR_DEFECTO}
      className="h-full w-full"
      scrollWheelZoom
      zoom={ZOOM_POR_DEFECTO}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Satelital">
          <TileLayer
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            maxNativeZoom={17}
            maxZoom={19}
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Calles">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {pistas
        .filter((pista) => tieneUbicacion(pista) && pista.id !== pistaEnEdicion?.id)
        .map((pista) => (
          <Marker
            eventHandlers={isInteractivo ? { click: () => onSelectPista(pista.id) } : undefined}
            icon={iconoDe(colorDePista(pista, pista.id === selectedPistaId))}
            interactive={isInteractivo}
            key={`${pista.id}-${pista.updatedAt}-${pista.id === selectedPistaId}`}
            position={[pista.latitud, pista.longitud]}
          >
            {isInteractivo && (
              <Tooltip direction="top" offset={[0, -16]}>
                <span className="font-bold">{pista.nombre}</span>
                {!pista.activo && <> · Dada de baja</>}
              </Tooltip>
            )}
          </Marker>
        ))}

      {/* Pista que se esta moviendo: se arrastra y avisa su nueva posicion */}
      {tieneUbicacion(pistaEnEdicion) && (
        <Marker
          draggable
          eventHandlers={{
            dragend: (event) => {
              const { lat, lng } = event.target.getLatLng()
              onUbicacionEditada(lat, lng)
            },
          }}
          icon={iconoDe(COLOR_RESALTADA)}
          position={[pistaEnEdicion.latitud, pistaEnEdicion.longitud]}
        >
          <Tooltip direction="top" offset={[0, -16]} permanent>
            Arrastra el marcador
          </Tooltip>
        </Marker>
      )}

      <BuscadorMapa />
      <AjustarVista pistas={pistas} selectedPistaId={selectedPistaId} vistaVersion={vistaVersion} />
      <CapturarClic activo={isMarcando} onUbicacionMarcada={onUbicacionMarcada} />
    </MapContainer>
  )
}

export default MapaPistas
