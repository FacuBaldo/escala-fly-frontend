import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { claseCampo } from '../compartidos/formularios/estilosFormulario'
import apiClient from '../../api/apiClient'
import SelectorConBusqueda from '../compartidos/formularios/SelectorConBusqueda'
import NuevoProductoRapido from './NuevoProductoRapido'

const LIMITE = 20

// Se muestra la marca junto al nombre generico: en el campo usan los dos indistintamente
const etiquetaProducto = (item) => (item.marca ? `${item.nombre} · ${item.marca}` : item.nombre)

/**
 * Primera pagina de productos de la empresa (sin busqueda). Se pide una sola vez al
 * abrir el formulario y la comparten todas las filas: antes cada fila hacia su propio
 * pedido recien al agregarla, y el desplegable se abria vacio mientras llegaba.
 */
function usePrimeraPaginaProductos(empresaId, disabled, version) {
  // version cambia al crear un producto desde la orden, para volver a pedir la lista
  const clave = disabled ? null : `${empresaId || 'propia'}|${version}`
  const [resultado, setResultado] = useState({ clave: undefined, data: [], hasNextPage: false, error: '' })

  useEffect(() => {
    if (clave === null) return undefined
    let vigente = true
    apiClient.get('/productos', { params: { page: 1, limit: LIMITE, ...(empresaId ? { empresaId } : {}) } })
      .then(({ data }) => { if (vigente) setResultado({ clave, data: data.data, hasNextPage: data.pagination.hasNextPage, error: '' }) })
      .catch(() => { if (vigente) setResultado({ clave, data: [], hasNextPage: false, error: 'No se pudieron cargar los productos.' }) })
    return () => { vigente = false }
  }, [clave, empresaId])

  return { ...resultado, cargando: resultado.clave !== clave }
}

/**
 * Selector de un producto. Sin texto de busqueda muestra la primera pagina compartida;
 * al escribir o pedir mas, consulta al servidor. Las paginas ya traidas quedan guardadas.
 */
function SelectorProducto({ primeraPagina, empresaId, value, onChange, onSeleccionado, mensajeVacio, version, onCrear }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [paginas, setPaginas] = useState({})
  const [error, setError] = useState('')
  const [actual, setActual] = useState(null)
  const callback = useRef(onSeleccionado)
  useEffect(() => { callback.current = onSeleccionado }, [onSeleccionado])

  const clave = `${version}|${search}|${page}`
  const pendiente = !(search === '' && page === 1) && !paginas[clave]

  useEffect(() => {
    if (!pendiente) return undefined
    let vigente = true
    // Solo se espera mientras se escribe; "cargar mas" va directo
    const timer = setTimeout(() => apiClient.get('/productos', { params: { page, limit: LIMITE, search, ...(empresaId ? { empresaId } : {}) } })
      .then(({ data }) => { if (vigente) { setPaginas((previas) => ({ ...previas, [clave]: { data: data.data, hasNextPage: data.pagination.hasNextPage } })); setError('') } })
      .catch(() => { if (vigente) setError('No se pudieron cargar los productos.') }), page === 1 ? 250 : 0)
    return () => { vigente = false; clearTimeout(timer) }
  }, [pendiente, clave, page, search, empresaId])

  const { cargando: primeraCargando, data: primeraData, hasNextPage: primeraHayMas } = primeraPagina
  // Paginas 1..page de la busqueda actual (null = todavia no llego)
  const listas = useMemo(() => Array.from({ length: page }, (_, i) => (
    search === '' && i === 0
      ? (primeraCargando ? null : { data: primeraData, hasNextPage: primeraHayMas })
      : paginas[`${version}|${search}|${i + 1}`] || null
  )), [page, search, version, paginas, primeraCargando, primeraData, primeraHayMas])
  const opciones = useMemo(
    () => listas.filter(Boolean).flatMap((lista) => lista.data).filter((item, i, todos) => todos.findIndex((otro) => otro.id === item.id) === i),
    [listas],
  )
  const cargando = listas.some((lista) => lista === null) && !error
  const hayMas = Boolean(listas[page - 1]?.hasNextPage)
  const errorVisible = error || (search === '' ? primeraPagina.error : '')

  useEffect(() => {
    if (!value) return undefined
    const encontrado = opciones.find((item) => item.id === value) || (actual?.id === value ? actual : null)
    if (encontrado) { callback.current?.(encontrado); return undefined }
    let vigente = true
    apiClient.get(`/productos/${encodeURIComponent(value)}`).then(({ data }) => { if (vigente) { setActual(data); callback.current?.(data) } }).catch(() => {})
    return () => { vigente = false }
  }, [value, opciones, actual])

  const elegida = opciones.find((item) => item.id === value) || (actual?.id === value ? actual : null)

  return (
    <SelectorConBusqueda
      accionExtra={{ etiqueta: (texto) => (texto.trim() ? `+ Crear producto "${texto.trim()}"` : '+ Crear producto nuevo'), onClick: (texto) => onCrear(texto.trim()) }}
      busqueda={search}
      cargando={cargando}
      error={errorVisible}
      etiqueta={etiquetaProducto}
      hayMas={hayMas}
      mensajeVacio={mensajeVacio}
      onBuscar={(texto) => { setError(''); setPage(1); setSearch(texto) }}
      onCargarMas={() => setPage((p) => p + 1)}
      onSeleccionar={(item) => { setActual(item); callback.current?.(item); onChange({ target: { value: item?.id || '' } }, item) }}
      opciones={opciones}
      placeholder="Selecciona un producto"
      required
      seleccion={elegida}
      value={value}
    />
  )
}

const inputClassName = `h-10 text-sm ${claseCampo}`

/**
 * Filas dinamicas de productos con su dosis por hectarea.
 * La mezcla es opcional: una orden puede generarse solo con los parametros de vuelo.
 */
function SelectorProductosMezcla({ disabled = false, empresaId, filas, onChange, superficieHa }) {
  const [productos, setProductos] = useState({})
  const [versionProductos, setVersionProductos] = useState(0)
  // Fila en la que se esta dando de alta un producto nuevo: { indice, nombre }
  const [creando, setCreando] = useState(null)
  const primeraPagina = usePrimeraPaginaProductos(empresaId, disabled, versionProductos)
  const sinProductos = !primeraPagina.cargando && !primeraPagina.error && primeraPagina.data.length === 0
  const actualizarFila = (indice, campo, valor) => {
    onChange(filas.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)))
  }

  const agregarFila = () => onChange([...filas, { productoId: '', dosisPorHectarea: '' }])

  const quitarFila = (indice) => {
    setCreando(null)
    onChange(filas.filter((_, i) => i !== indice))
  }

  const productoCreado = (indice, producto) => {
    setProductos((actuales) => ({ ...actuales, [producto.id]: producto }))
    actualizarFila(indice, 'productoId', producto.id)
    setVersionProductos((version) => version + 1)
    setCreando(null)
  }

  const productoPorId = (id) => productos[id]

  return (
    <div className="grid gap-2">
      <div className="flex justify-end">
        <button
          className="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          onClick={agregarFila}
          title={disabled ? 'Selecciona primero una empresa' : 'Agregar producto a la mezcla'}
          type="button"
        >
          <Plus aria-hidden="true" size={14} />
          Agregar producto
        </button>
      </div>

      {filas.length === 0 && (
        <p className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-500">
          {disabled
            ? 'Selecciona primero una empresa para agregar productos.'
            : sinProductos
              ? 'Esta empresa todavia no tiene productos cargados. Usa "Agregar producto" y crealo desde la lista.'
              : 'Podes agregar agroquimicos con su dosis por hectarea.'}
        </p>
      )}

      {filas.map((fila, indice) => {
        const producto = productoPorId(fila.productoId)
        const dosis = Number(fila.dosisPorHectarea)
        const totalProducto = Number.isFinite(dosis) && superficieHa ? dosis * superficieHa : null
        // La dosis se carga en la unidad del producto, por hectarea
        const unidadDosis = producto?.unidadMedida?.abreviatura ? `${producto.unidadMedida.abreviatura}/ha` : '/ha'

        return (
          <div className="grid grid-cols-[minmax(0,1fr)_8.5rem_2.25rem] items-center gap-2" key={indice}>
            <SelectorProducto empresaId={empresaId} mensajeVacio="Esta empresa no tiene productos cargados." onCrear={(nombre) => setCreando({ indice, nombre })} version={versionProductos} onChange={(event) => actualizarFila(indice, 'productoId', event.target.value)} onSeleccionado={(item) => { if (item) setProductos((actuales) => actuales[item.id] === item ? actuales : { ...actuales, [item.id]: item }) }} primeraPagina={primeraPagina} value={fila.productoId} />

            <span className="relative block">
              <input
                aria-label={`Dosis del producto ${indice + 1}`}
                className={`campo-con-unidad w-full pr-14 ${inputClassName}`}
                min={0}
                onChange={(event) => actualizarFila(indice, 'dosisPorHectarea', event.target.value)}
                placeholder="Dosis"
                step="any"
                type="number"
                value={fila.dosisPorHectarea}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {unidadDosis}
              </span>
            </span>

            <button
              aria-label={`Quitar producto ${indice + 1}`}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-700 transition hover:bg-red-100"
              onClick={() => quitarFila(indice)}
              title="Quitar"
              type="button"
            >
              <Trash2 aria-hidden="true" size={16} />
            </button>

            {creando?.indice === indice && (
              <NuevoProductoRapido
                empresaId={empresaId}
                nombreInicial={creando.nombre}
                onCancelar={() => setCreando(null)}
                onCreado={(producto) => productoCreado(indice, producto)}
              />
            )}

            {totalProducto > 0 && (
              <p className="col-span-3 -mt-1 text-xs text-slate-500">
                {producto?.nombre}: {totalProducto.toLocaleString('es-AR', { maximumFractionDigits: 2 })}{' '}
                {producto?.unidadMedida?.abreviatura || ''} para todo el lote
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default SelectorProductosMezcla
