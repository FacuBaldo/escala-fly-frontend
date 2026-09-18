import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { LayersControl, MapContainer, Polygon, TileLayer, Tooltip, useMap } from 'react-leaflet'
import '@geoman-io/leaflet-geoman-free'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import { formatearSuperficie } from '../../utils/lotes'
import { buscarLugares, parseCoordenadas } from '../../utils/mapa'
import BuscadorMapa from './BuscadorMapa'

// San Francisco, Cordoba
const CENTRO_POR_DEFECTO = [-31.4278, -62.0828]
const ZOOM_POR_DEFECTO = 12

const COLOR_ACTIVO = '#059669'
const COLOR_INACTIVO = '#64748b'
const COLOR_RESALTADO = '#f59e0b'

// GeoJSON usa [lng, lat]; Leaflet usa [lat, lng]
const toLatLngs = (geometria) =>
  geometria.coordinates.map((anillo) => anillo.map(([lng, lat]) => [lat, lng]))

const getEstilo = (lote, isSelected) => {
  if (isSelected) {
    return { color: COLOR_RESALTADO, fillColor: COLOR_RESALTADO, fillOpacity: 0.35, weight: 3 }
  }

  if (!lote.activo) {
    return { color: COLOR_INACTIVO, fillColor: COLOR_INACTIVO, fillOpacity: 0.15, weight: 2, dashArray: '6 6' }
  }

  return { color: COLOR_ACTIVO, fillColor: COLOR_ACTIVO, fillOpacity: 0.25, weight: 2 }
}

function AjustarVista({ lotes, selectedLoteId, ubicacionCampo, vistaVersion }) {
  const map = useMap()
  const lotesRef = useRef(lotes)
  const ubicacionRef = useRef(ubicacionCampo)

  useEffect(() => {
    lotesRef.current = lotes
    ubicacionRef.current = ubicacionCampo
  }, [lotes, ubicacionCampo])

  useEffect(() => {
    const lotesActuales = lotesRef.current

    if (lotesActuales.length > 0) {
      const bounds = L.latLngBounds(lotesActuales.flatMap((lote) => toLatLngs(lote.geometria)[0]))
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 })
      return undefined
    }

    // Campo sin lotes: centrar el mapa en la ubicacion cargada del campo (coordenadas o localidad)
    const ubicacion = ubicacionRef.current?.trim()
    if (!ubicacion) {
      return undefined
    }

    const coordenadas = parseCoordenadas(ubicacion)
    if (coordenadas) {
      map.setView([coordenadas.lat, coordenadas.lng], 14)
      return undefined
    }

    const controller = new AbortController()
    buscarLugares(ubicacion, { signal: controller.signal })
      .then(([lugar]) => {
        if (lugar) {
          map.fitBounds(lugar.bounds, { maxZoom: 14 })
        }
      })
      .catch(() => {})

    return () => controller.abort()
  }, [map, vistaVersion])

  useEffect(() => {
    const lote = lotesRef.current.find((item) => item.id === selectedLoteId)

    if (!lote) {
      return
    }

    map.flyToBounds(L.latLngBounds(toLatLngs(lote.geometria)[0]), { padding: [64, 64], maxZoom: 16 })
  }, [map, selectedLoteId])

  return null
}

function ControlDibujo({ activo, onPoligonoDibujado }) {
  const map = useMap()

  useEffect(() => {
    if (!activo) {
      return undefined
    }

    const handleCreate = (event) => {
      const geometria = event.layer.toGeoJSON().geometry
      map.removeLayer(event.layer)
      onPoligonoDibujado(geometria)
    }

    map.on('pm:create', handleCreate)
    map.pm.enableDraw('Polygon', {
      allowSelfIntersection: false,
      hintlineStyle: { color: COLOR_RESALTADO, dashArray: [5, 5] },
      pathOptions: { color: COLOR_RESALTADO },
      templineStyle: { color: COLOR_RESALTADO },
    })

    return () => {
      map.off('pm:create', handleCreate)
      map.pm.disableDraw()
    }
  }, [activo, map, onPoligonoDibujado])

  return null
}

function ControlEdicion({ lote, onGeometriaChange }) {
  const map = useMap()

  useEffect(() => {
    if (!lote) {
      return undefined
    }

    const layer = L.polygon(toLatLngs(lote.geometria), getEstilo(lote, true)).addTo(map)
    const handleEdit = () => onGeometriaChange(layer.toGeoJSON().geometry)

    layer.pm.enable({ allowSelfIntersection: false })
    layer.on('pm:edit', handleEdit)
    map.fitBounds(layer.getBounds(), { padding: [64, 64] })

    return () => {
      layer.off('pm:edit', handleEdit)
      layer.pm.disable()
      map.removeLayer(layer)
    }
  }, [lote, map, onGeometriaChange])

  return null
}

function MapaLotes({
  isDibujando,
  loteEnEdicion,
  lotes,
  onGeometriaEditada,
  onPoligonoDibujado,
  onSelectLote,
  selectedLoteId,
  ubicacionCampo,
  vistaVersion,
}) {
  const isInteractivo = !isDibujando && !loteEnEdicion

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

      {lotes
        .filter((lote) => lote.id !== loteEnEdicion?.id)
        .map((lote) => (
          <Polygon
            eventHandlers={isInteractivo ? { click: () => onSelectLote(lote.id) } : undefined}
            interactive={isInteractivo}
            key={`${lote.id}-${lote.updatedAt}-${isInteractivo}`}
            pathOptions={getEstilo(lote, lote.id === selectedLoteId)}
            positions={toLatLngs(lote.geometria)}
          >
            {isInteractivo && (
              <Tooltip sticky>
                <span className="font-bold">{lote.nombre}</span>
                <br />
                {formatearSuperficie(lote.superficie)}
                {!lote.activo && ' · Dado de baja'}
              </Tooltip>
            )}
          </Polygon>
        ))}

      <BuscadorMapa />
      <AjustarVista
        lotes={lotes}
        selectedLoteId={selectedLoteId}
        ubicacionCampo={ubicacionCampo}
        vistaVersion={vistaVersion}
      />
      <ControlDibujo activo={isDibujando} onPoligonoDibujado={onPoligonoDibujado} />
      <ControlEdicion lote={loteEnEdicion} onGeometriaChange={onGeometriaEditada} />
    </MapContainer>
  )
}

export default MapaLotes
