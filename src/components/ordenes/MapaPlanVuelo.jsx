import { Fragment, useEffect, useMemo } from 'react'
import L from 'leaflet'
import { LayersControl, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { geoJsonPoligonoALatLngs } from '../../utils/mapa'
import { colorDeViaje, formatearDistancia, formatearLitros, formatearNumero } from '../../utils/ordenes'
import { ESTILOS_TRAMO, obtenerTramosVuelo } from '../../utils/tramosVuelo'
import IndicacionesVuelo from './IndicacionesVuelo'

const COLOR_LOTE = '#16a34a'
const COLOR_PISTA_PRINCIPAL = '#1d4ed8'
const COLOR_PISTA_CARGA = '#ea580c'
const OPACIDAD_ATENUADA = 0.15

const ESTILO_BORDE_RECORRIDO = { color: '#ffffff', weight: 6, lineCap: 'round', lineJoin: 'round' }
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
const iconoExtremo = (texto, color) => L.divIcon({
  className: '', iconSize: [24, 24], iconAnchor: [12, 12],
  html: `<span style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:2px solid white;border-radius:50%;background:${color};color:white;font:bold 12px sans-serif;box-shadow:0 1px 4px #0008">${texto}</span>`,
})
const iconoInicio = iconoExtremo('I', '#047857')
const iconoFin = iconoExtremo('F', '#be123c')

/** Encuadra el lote junto con las dos pistas para ver el trayecto completo */
function AjustarVista({ plan }) {
  const map = useMap()

  useEffect(() => {
    if (!plan?.lote?.geometria) {
      return
    }

    const puntos = geoJsonPoligonoALatLngs(plan.lote.geometria)[0].slice()
    // Incluye las curvas, que pueden extenderse bastante fuera del lote.
    for (const viaje of plan.viajes) {
      for (const [lng, lat] of viaje.recorrido.coordinates) puntos.push([lat, lng])
    }

    for (const pista of [plan.pistaPrincipal, plan.pistaCarga]) {
      if (pista && Number.isFinite(pista.latitud) && Number.isFinite(pista.longitud)) {
        puntos.push([pista.latitud, pista.longitud])
      }
    }

    map.fitBounds(L.latLngBounds(puntos), { padding: [40, 40] })
  }, [map, plan])

  return null
}

function ControlesVista({ viajes, viajeDetalle }) {
  const map = useMap()
  const acercarAlTrabajo = () => {
    const puntos = (viajeDetalle ? [viajeDetalle] : viajes).flatMap((viaje) =>
      viaje.tramos.filter((tramo) => tramo.tipo !== 'TRASLADO').flatMap((tramo) => tramo.posiciones))
    if (puntos.length) map.fitBounds(L.latLngBounds(puntos), { paddingTopLeft: [40, 55], paddingBottomRight: [40, 150], maxZoom: 17 })
  }
  return <div className="absolute left-14 top-3 z-[1000]">
    <button type="button" onClick={acercarAlTrabajo} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-md hover:bg-slate-50">
      Acercar al trabajo
    </button>
  </div>
}

/** Referencias del mapa, en la esquina inferior izquierda. No captura el mouse. */
function Leyenda({ vistaGeneral }) {
  return (
    <div
      aria-label="Referencias del mapa"
      className="pointer-events-none absolute bottom-6 left-2 z-[1000] grid gap-1.5 rounded-md bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-md"
    >
      {Object.entries(ESTILOS_TRAMO).map(([tipo, estilo]) => (
        <span className="flex items-center gap-2" key={tipo}>
          <svg aria-hidden="true" height="10" width="28">
            <line stroke={estilo.color} strokeDasharray={estilo.dashArray} strokeWidth={estilo.weight} x1="2" x2="26" y1="5" y2="5" />
          </svg>
          {tipo === 'APLICACION' && vistaGeneral ? 'Aplicación (color por viaje)' : estilo.nombre}
        </span>
      ))}
      <span>→ Sentido de vuelo · I Inicio · F Fin</span>
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
  const viajes = useMemo(() => (plan?.viajes || []).map((viaje) => ({
    ...viaje, tramos: obtenerTramosVuelo(viaje),
  })), [plan])
  const viajeDetalle = viajes.find((viaje) => viaje.numero === viajeSeleccionado) || (viajes.length === 1 ? viajes[0] : null)
  const aplicaciones = viajeDetalle?.tramos.filter((tramo) => tramo.tipo === 'APLICACION') || []
  const inicio = aplicaciones[0]?.posiciones[0]
  const fin = aplicaciones.at(-1)?.posiciones.at(-1)
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

        {[...viajes].sort((a, b) => Number(a.numero === viajeSeleccionado) - Number(b.numero === viajeSeleccionado)).map((viaje) => {
          const resaltado = !viajeSeleccionado || viajeSeleccionado === viaje.numero
          const opacidad = resaltado ? 1 : OPACIDAD_ATENUADA
          return (
            <Fragment key={viaje.id || viaje.numero}>
              {viaje.tramos.map((tramo, indice) => {
                const estilo = ESTILOS_TRAMO[tramo.tipo]
                const color = tramo.tipo === 'APLICACION' && !viajeDetalle ? colorDeViaje(viaje.numero) : estilo.color
                return (
                  <Fragment key={indice}>
                    {resaltado && <Polyline interactive={false} positions={tramo.posiciones} pathOptions={{ ...ESTILO_BORDE_RECORRIDO, opacity: OPACIDAD_BORDE }} />}
                    <Polyline positions={tramo.posiciones} pathOptions={{ color, weight: estilo.weight, dashArray: estilo.dashArray || null, opacity: opacidad }}>
                      <Tooltip sticky>
                        <span className="font-bold">Viaje {viaje.numero} · {estilo.nombre}</span>
                        {tramo.numeroPasada && <><br />Orden de pasada en este viaje: {tramo.numeroPasada}</>}
                        <br />
                        {formatearLitros(viaje.caldoLitros)} · {formatearNumero(viaje.superficieHa)} ha
                        <br />
                        {formatearDistancia(viaje.distanciaMetros)} de vuelo
                      </Tooltip>
                    </Polyline>
                  </Fragment>
                )
              })}
            </Fragment>
          )
        })}

        {viajeDetalle && <IndicacionesVuelo tramos={viajeDetalle.tramos} />}
        {inicio && <Marker icon={iconoInicio} position={inicio} zIndexOffset={600}>
          <Tooltip direction="top" offset={[0, -12]} permanent>Inicio de aplicación · Viaje {viajeDetalle.numero}</Tooltip>
        </Marker>}
        {fin && <Marker icon={iconoFin} position={fin} zIndexOffset={600}>
          <Tooltip direction="bottom" offset={[0, 12]} permanent>Fin de aplicación · Viaje {viajeDetalle.numero}</Tooltip>
        </Marker>}

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
        <ControlesVista viajes={viajes} viajeDetalle={viajeDetalle} />
      </MapContainer>
      <Leyenda vistaGeneral={!viajeDetalle} />
    </div>
  )
}

export default MapaPlanVuelo
