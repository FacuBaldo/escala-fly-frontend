import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { claseCampo } from '../compartidos/formularios/estilosFormulario'
import apiClient from '../../api/apiClient'

function SelectorRemoto({ url, value, onChange, name, placeholder, seleccion, empresaId, activo, disabled = false, required = false, etiqueta = (item) => item.nombre, onSeleccionado }) {
  const [opciones, setOpciones] = useState([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [hayMas, setHayMas] = useState(false)
  const [error, setError] = useState('')
  const [actual, setActual] = useState(seleccion || null)
  const callback = useRef(onSeleccionado)
  useEffect(() => { callback.current = onSeleccionado }, [onSeleccionado])
  useEffect(() => {
    if (disabled) return undefined
    let vigente = true
    const timer = setTimeout(() => apiClient.get(url, { params: { page, limit: 20, search, ...(empresaId ? { empresaId } : {}), ...(activo !== undefined ? { activo } : {}) } }).then(({ data }) => {
      if (vigente) { setOpciones((previas) => page === 1 ? data.data : [...previas, ...data.data.filter((item) => !previas.some((previo) => previo.id === item.id))]); setHayMas(data.pagination.hasNextPage); setError('') }
    }).catch(() => { if (vigente) setError('No se pudieron cargar las opciones.') }), 250)
    return () => { vigente = false; clearTimeout(timer) }
  }, [url, page, search, empresaId, activo, disabled])
  useEffect(() => {
    if (!value) return undefined
    const encontrado = opciones.find((item) => item.id === value) || (seleccion?.id === value ? seleccion : null) || (actual?.id === value ? actual : null)
    if (encontrado) { callback.current?.(encontrado); return undefined }
    let vigente = true
    apiClient.get(`${url}/${encodeURIComponent(value)}`).then(({ data }) => { if (vigente) { setActual(data); callback.current?.(data) } }).catch(() => {})
    return () => { vigente = false }
  }, [url, value, opciones, seleccion, actual])
  const elegida = opciones.find((item) => item.id === value) || (seleccion?.id === value ? seleccion : null) || (actual?.id === value ? actual : null)
  return <span className="grid gap-1"><input aria-label={`Buscar ${placeholder}`} className={`h-9 text-sm ${claseCampo}`} disabled={disabled} onChange={(e) => { setPage(1); setSearch(e.target.value) }} placeholder="Buscar..." type="search" value={search} /><select className={`h-11 ${claseCampo}`} disabled={disabled} name={name} onChange={(e) => { const item = opciones.find((opcion) => opcion.id === e.target.value) || null; setActual(item); callback.current?.(item); onChange(e, item) }} required={required} value={value}><option value="">{placeholder}</option>{elegida && !opciones.some((item) => item.id === elegida.id) && <option value={elegida.id}>{etiqueta(elegida)}</option>}{opciones.map((item) => <option key={item.id} value={item.id}>{etiqueta(item)}</option>)}</select>{hayMas && <button className="justify-self-start text-xs font-semibold text-emerald-700" disabled={disabled} onClick={() => setPage((p) => p + 1)} type="button">Cargar 20 más</button>}{error && <span className="text-xs text-red-700">{error}</span>}</span>
}

const inputClassName = `h-10 text-sm ${claseCampo}`

/**
 * Filas dinamicas de productos con su dosis por hectarea.
 * La mezcla es opcional: una orden puede generarse solo con los parametros de vuelo.
 */
function SelectorProductosMezcla({ disabled = false, empresaId, filas, onChange, superficieHa }) {
  const [productos, setProductos] = useState({})
  const actualizarFila = (indice, campo, valor) => {
    onChange(filas.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)))
  }

  const agregarFila = () => onChange([...filas, { productoId: '', dosisPorHectarea: '' }])

  const quitarFila = (indice) => onChange(filas.filter((_, i) => i !== indice))

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
          {disabled ? 'Selecciona primero una empresa para agregar productos.' : 'Podes agregar agroquimicos con su dosis por hectarea.'}
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
            <SelectorRemoto empresaId={empresaId} onChange={(event) => actualizarFila(indice, 'productoId', event.target.value)} onSeleccionado={(item) => { if (item) setProductos((actuales) => actuales[item.id] === item ? actuales : { ...actuales, [item.id]: item }) }} placeholder="Selecciona un producto" required url="/productos" value={fila.productoId} />

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
