import { Fragment, useEffect } from 'react'
import L from 'leaflet'
import { LayersControl, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { geoJsonLineaALatLngs, geoJsonMultiLineaALatLngs, geoJsonPoligonoALatLngs } from '../../utils/mapa'
import { colorDeViaje, formatearDistancia, formatearLitros, formatearNumero } from '../../utils/ordenes'

const COLOR_LOTE = '#16a34a'
const OPACIDAD_ATENUADA = 0.15

const iconoPista = (color, titulo) =>
  L.divIcon({
    className: '',
    html:
      `<span title="${titulo}" style="display:flex;height:30px;width:30px;align-items:center;justify-content:center;` +
      `border-radius:9999px;background:${color};color:#fff;border:3px solid #fff;` +
      'box-shadow:0 1px 4px rgba(0,0,0,.45);font-size:15px">&#9992;</span>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })

const iconoPrincipal = iconoPista('#1d4ed8', 'Pista principal')
const iconoCarga = iconoPista('#ea580c', 'Pista de carga')

/** Encuadra el lote junto con las dos pistas para ver el trayecto completo */
function AjustarVista({ plan }) {
  const map = useMap()

  useEffect(() => {
    if (!plan?.lote?.geometria) {
      return
    }

    const puntos = geoJsonPoligonoALatLngs(plan.lote.geometria)[0].slice()

    for (const pista of [plan.pistaPrincipal, plan.pistaCarga]) {
      if (pista && Number.isFinite(pista.latitud) && Number.isFinite(pista.longitud)) {
        puntos.push([pista.latitud, pista.longitud])
      }
    }

    map.fitBounds(L.latLngBounds(puntos), { padding: [40, 40] })
  }, [map, plan])

  return null
}

/**
 * Dibuja el plan de vuelo: poligono del lote, pistas, recorrido de traslado y
 * tramos de pulverizacion. Si hay un viaje seleccionado, el resto se atenua.
 */
function MapaPlanVuelo({ plan, viajeSeleccionado }) {
  if (!plan?.lote?.geometria) {
    return null
  }

  const anillosLote = geoJsonPoligonoALatLngs(plan.lote.geometria)

  return (
    <MapContainer center={[-31.4278, -62.0828]} className="h-full w-full" scrollWheelZoom zoom={12}>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Satelital">
          <TileLayer
            attribution="Tiles &copy; Esri"
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

      <Polygon
        interactive={false}
        pathOptions={{ color: COLOR_LOTE, fillColor: COLOR_LOTE, fillOpacity: 0.15, weight: 2 }}
        positions={anillosLote}
      />

      {plan.viajes.map((viaje) => {
        const resaltado = !viajeSeleccionado || viajeSeleccionado === viaje.numero
        const opacidad = resaltado ? 1 : OPACIDAD_ATENUADA
        const color = colorDeViaje(viaje.numero)

        return (
          <Fragment key={viaje.id || viaje.numero}>
            {/* Traslados y giros */}
            <Polyline
              interactive={false}
              pathOptions={{ color: '#475569', weight: 2, opacity: opacidad * 0.8, dashArray: '6 6' }}
              positions={geoJsonLineaALatLngs(viaje.recorrido.coordinates)}
            />

            {/* Tramos con pulverizacion activa */}
            {geoJsonMultiLineaALatLngs(viaje.tramosAplicacion.coordinates).map((tramo, indice) => (
              <Polyline
                key={`${viaje.numero}-${indice}`}
                pathOptions={{ color, weight: resaltado ? 4 : 3, opacity: opacidad }}
                positions={tramo}
              >
                <Tooltip sticky>
                  <span className="font-bold">Viaje {viaje.numero}</span>
                  <br />
                  {formatearLitros(viaje.caldoLitros)} · {formatearNumero(viaje.superficieHa)} ha
                  <br />
                  {formatearDistancia(viaje.distanciaMetros)} de vuelo
                </Tooltip>
              </Polyline>
            ))}
          </Fragment>
        )
      })}

      {plan.pistaPrincipal && (
        <Marker icon={iconoPrincipal} position={[plan.pistaPrincipal.latitud, plan.pistaPrincipal.longitud]}>
          <Popup>
            <span className="font-bold">{plan.pistaPrincipal.nombre}</span>
            <br />
            Pista principal (despegue y aterrizaje)
          </Popup>
        </Marker>
      )}

      {plan.pistaCarga && plan.pistaCarga.id !== plan.pistaPrincipal?.id && (
        <Marker icon={iconoCarga} position={[plan.pistaCarga.latitud, plan.pistaCarga.longitud]}>
          <Popup>
            <span className="font-bold">{plan.pistaCarga.nombre}</span>
            <br />
            Pista de carga (recarga de caldo)
          </Popup>
        </Marker>
      )}

      <AjustarVista plan={plan} />
    </MapContainer>
  )
}

export default MapaPlanVuelo
