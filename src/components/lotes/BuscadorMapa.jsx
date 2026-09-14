import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import { LoaderCircle, LocateFixed, Search, X } from 'lucide-react'
import { buscarLugares, parseCoordenadas } from '../../utils/mapa'

const ZOOM_PUNTO = 15
const COLOR_MARCADOR = '#2563eb'

/**
 * Buscador superpuesto al mapa: ciudad o direccion (OpenStreetMap), coordenadas
 * "latitud, longitud" o la ubicacion actual del dispositivo.
 */
function BuscadorMapa() {
  const map = useMap()
  const contenedorRef = useRef(null)
  const marcadorRef = useRef(null)
  const abortRef = useRef(null)
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [isBuscando, setIsBuscando] = useState(false)

  // Evita que escribir o hacer clic en el buscador arrastre o haga zoom sobre el mapa
  useEffect(() => {
    const contenedor = contenedorRef.current
    L.DomEvent.disableClickPropagation(contenedor)
    L.DomEvent.disableScrollPropagation(contenedor)
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      marcadorRef.current?.remove()
    }
  }, [])

  const marcar = (lat, lng, etiqueta) => {
    marcadorRef.current?.remove()
    marcadorRef.current = L.circleMarker([lat, lng], {
      color: '#ffffff',
      fillColor: COLOR_MARCADOR,
      fillOpacity: 1,
      radius: 8,
      weight: 3,
    })
      .bindTooltip(etiqueta, { direction: 'top', offset: [0, -8] })
      .addTo(map)
      .openTooltip()
  }

  const irALugar = (lugar) => {
    setResultados([])
    setMensaje('')
    map.flyToBounds(lugar.bounds, { maxZoom: ZOOM_PUNTO, padding: [24, 24] })
    marcar(lugar.lat, lugar.lng, lugar.nombre.split(',')[0])
  }

  const handleBuscar = async (event) => {
    event.preventDefault()
    const consulta = texto.trim()

    if (!consulta) {
      return
    }

    setResultados([])
    setMensaje('')

    const coordenadas = parseCoordenadas(consulta)
    if (coordenadas) {
      map.flyTo([coordenadas.lat, coordenadas.lng], ZOOM_PUNTO)
      marcar(coordenadas.lat, coordenadas.lng, `${coordenadas.lat}, ${coordenadas.lng}`)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsBuscando(true)

    try {
      const lugares = await buscarLugares(consulta, { signal: controller.signal })

      if (lugares.length === 0) {
        setMensaje('No se encontraron resultados. Proba con otra ciudad o con coordenadas.')
      } else if (lugares.length === 1) {
        irALugar(lugares[0])
      } else {
        setResultados(lugares)
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setMensaje('No se pudo realizar la busqueda. Revisa tu conexion e intenta de nuevo.')
      }
    } finally {
      if (abortRef.current === controller) {
        setIsBuscando(false)
      }
    }
  }

  const handleUbicacionActual = () => {
    setResultados([])

    if (!navigator.geolocation) {
      setMensaje('Tu navegador no permite obtener la ubicacion.')
      return
    }

    setMensaje('Obteniendo tu ubicacion...')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setMensaje('')
        map.flyTo([coords.latitude, coords.longitude], ZOOM_PUNTO)
        marcar(coords.latitude, coords.longitude, 'Tu ubicacion')
      },
      () => setMensaje('No se pudo obtener tu ubicacion. Verifica los permisos del navegador.'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const limpiar = () => {
    abortRef.current?.abort()
    setTexto('')
    setResultados([])
    setMensaje('')
    setIsBuscando(false)
    marcadorRef.current?.remove()
    marcadorRef.current = null
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setResultados([])
      setMensaje('')
    }
  }

  return (
    <div
      className="absolute left-14 right-14 top-2.5 z-[1000] max-w-md sm:right-auto sm:w-96"
      onKeyDown={handleKeyDown}
      ref={contenedorRef}
    >
      <form
        className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-md"
        onSubmit={handleBuscar}
        role="search"
      >
        <input
          aria-label="Buscar ciudad, direccion o coordenadas"
          className="h-8 min-w-0 flex-1 rounded px-2 text-sm text-slate-950 outline-none"
          onChange={(event) => setTexto(event.target.value)}
          placeholder="Ciudad, direccion o coordenadas"
          type="text"
          value={texto}
        />
        {texto && (
          <button
            aria-label="Limpiar busqueda"
            className="flex h-8 w-8 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={limpiar}
            title="Limpiar"
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        )}
        <button
          aria-label="Buscar"
          className="flex h-8 w-8 items-center justify-center rounded bg-emerald-700 text-white transition hover:bg-emerald-800 disabled:opacity-70"
          disabled={isBuscando}
          title="Buscar"
          type="submit"
        >
          {isBuscando ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
          ) : (
            <Search aria-hidden="true" size={16} />
          )}
        </button>
        <button
          aria-label="Ir a mi ubicacion"
          className="flex h-8 w-8 items-center justify-center rounded text-slate-600 transition hover:bg-slate-100 hover:text-emerald-800"
          onClick={handleUbicacionActual}
          title="Mi ubicacion"
          type="button"
        >
          <LocateFixed aria-hidden="true" size={16} />
        </button>
      </form>

      {resultados.length > 0 && (
        <ul className="mt-1 max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-md">
          {resultados.map((lugar) => (
            <li key={lugar.id}>
              <button
                className="w-full px-3 py-2 text-left text-slate-700 transition hover:bg-emerald-50"
                onClick={() => irALugar(lugar)}
                type="button"
              >
                {lugar.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}

      {mensaje && (
        <p className="mt-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-md">
          {mensaje}
        </p>
      )}
    </div>
  )
}

export default BuscadorMapa
