import { Fragment, useEffect } from 'react'
import L from 'leaflet'
import { LayersControl, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { geoJsonLineaALatLngs, geoJsonMultiLineaALatLngs, geoJsonPoligonoALatLngs } from '../../utils/mapa'
import { colorDeViaje, formatearDistancia, formatearLitros, formatearNumero } from '../../utils/ordenes'

const COLOR_LOTE = '#16a34a'
const COLOR_PISTA_PRINCIPAL = '#1d4ed8'
const COLOR_PISTA_CARGA = '#ea580c'
const OPACIDAD_ATENUADA = 0.15

// Traslados y giros: punteados del color del viaje, sobre un borde blanco que los
// despega de la imagen satelital (antes eran grises de 2 px y se perdian en el fondo)
const ESTILO_BORDE_RECORRIDO = { color: '#ffffff', weight: 6, lineCap: 'round', lineJoin: 'round' }
const ESTILO_RECORRIDO = { weight: 3, dashArray: '10 8', lineCap: 'butt', lineJoin: 'round' }
const OPACIDAD_BORDE = 0.6

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

const iconoPrincipal = iconoPista(COLOR_PISTA_PRINCIPAL, 'Pista principal')
const iconoCarga = iconoPista(COLOR_PISTA_CARGA, 'Pista de carga')

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

/** Referencias del mapa, en la esquina inferior izquierda. No captura el mouse. */
function Leyenda() {
  return (
    <div
      aria-label="Referencias del mapa"
      className="pointer-events-none absolute bottom-6 left-2 z-[1000] grid gap-1.5 rounded-md bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-md"
    >
      <span className="flex items-center gap-2">
        <svg aria-hidden="true" height="8" width="28">
          <line stroke="#2563eb" strokeLinecap="round" strokeWidth="4" x1="2" x2="26" y1="4" y2="4" />
        </svg>
        Pulverizando
      </span>
      <span className="flex items-center gap-2">
        <svg aria-hidden="true" height="8" width="28">
          <line stroke="#cbd5e1" strokeLinecap="round" strokeWidth="6" x1="3" x2="25" y1="4" y2="4" />
          <line stroke="#2563eb" strokeDasharray="6 4" strokeWidth="3" x1="2" x2="26" y1="4" y2="4" />
        </svg>
        Traslados y giros
      </span>
      <span className="flex items-center gap-2">
        <span className="flex w-7 justify-center">
          <span className="h-3 w-3 rounded-full border-2 border-white shadow" style={{ background: COLOR_PISTA_PRINCIPAL }} />
        </span>
        Pista principal
      </span>
      <span className="flex items-center gap-2">
        <span className="flex w-7 justify-center">
          <span className="h-3 w-3 rounded-full border-2 border-white shadow" style={{ background: COLOR_PISTA_CARGA }} />
        </span>
        Pista de carga
      </span>
    </div>
  )
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
    <div className="relative h-full w-full">
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
          const recorrido = geoJsonLineaALatLngs(viaje.recorrido.coordinates)

          return (
            <Fragment key={viaje.id || viaje.numero}>
              {/* Traslados y giros: primero el borde blanco, encima el punteado del color del viaje */}
              <Polyline
                interactive={false}
                // Los viajes atenuados van sin borde: si no, dejan una neblina blanca alrededor del lote
              pathOptions={{ ...ESTILO_BORDE_RECORRIDO, opacity: resaltado ? OPACIDAD_BORDE : 0 }}
                positions={recorrido}
              />
              <Polyline
                interactive={false}
                pathOptions={{ ...ESTILO_RECORRIDO, color, opacity: opacidad }}
                positions={recorrido}
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
      <Leyenda />
    </div>
  )
}

export default MapaPlanVuelo
