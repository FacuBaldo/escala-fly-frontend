import { useEffect, useRef, useState } from 'react'
import { getTiposProducto, getUnidadesMedida } from '../../api/catalogosApi'
import { createProducto } from '../../api/productosApi'
import getErrorMessage from '../../utils/getErrorMessage'
import { claseCampo } from '../compartidos/formularios/estilosFormulario'

const claseInput = `h-10 text-sm ${claseCampo}`

/**
 * Alta rapida de un producto sin salir de la orden. Es un <div> y no un <form>
 * porque vive dentro del formulario de la orden (los formularios no se anidan):
 * Enter guarda el producto en lugar de enviar la orden.
 */
function NuevoProductoRapido({ empresaId, nombreInicial = '', onCreado, onCancelar }) {
  const [datos, setDatos] = useState({ nombre: nombreInicial, marca: '', tipoId: '', unidadMedidaId: '' })
  const [catalogos, setCatalogos] = useState(null)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const nombreRef = useRef(null)

  useEffect(() => { nombreRef.current?.focus() }, [])

  useEffect(() => {
    let vigente = true
    Promise.all([getTiposProducto({ page: 1, limit: 100 }), getUnidadesMedida({ page: 1, limit: 100 })])
      .then(([tipos, unidades]) => { if (vigente) setCatalogos({ tipos: tipos.data || tipos, unidades: unidades.data || unidades }) })
      .catch(() => { if (vigente) { setCatalogos({ tipos: [], unidades: [] }); setError('No se pudieron cargar los tipos y unidades.') } })
    return () => { vigente = false }
  }, [])

  const cambiar = (campo) => (event) => setDatos((actuales) => ({ ...actuales, [campo]: event.target.value }))

  const guardar = async () => {
    if (!datos.nombre.trim() || !datos.tipoId || !datos.unidadMedidaId) {
      setError('Completá nombre, tipo y unidad.')
      return
    }

    setGuardando(true)
    setError('')

    try {
      // empresaId solo lo usa el backend cuando quien carga es ADMIN
      const producto = await createProducto({ ...datos, empresaId })
      onCreado(producto)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo crear el producto.'))
      setGuardando(false)
    }
  }

  const alPresionarTecla = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      guardar()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onCancelar()
    }
  }

  const sinCatalogos = catalogos && (catalogos.tipos.length === 0 || catalogos.unidades.length === 0)

  return (
    <div className="col-span-full grid gap-2 rounded-md border border-emerald-200 bg-emerald-50/60 p-3" onKeyDown={alPresionarTecla} role="group" aria-label="Nuevo producto">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-900">Nuevo producto</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input aria-label="Nombre del producto" className={claseInput} disabled={guardando} onChange={cambiar('nombre')} placeholder="Nombre genérico (ej: Glifosato)" ref={nombreRef} value={datos.nombre} />
        <input aria-label="Marca" className={claseInput} disabled={guardando} onChange={cambiar('marca')} placeholder="Marca (opcional)" value={datos.marca} />
        <select aria-label="Tipo de producto" className={claseInput} disabled={guardando || !catalogos} onChange={cambiar('tipoId')} value={datos.tipoId}>
          <option value="">{catalogos ? 'Tipo de producto' : 'Cargando tipos...'}</option>
          {catalogos?.tipos.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>)}
        </select>
        <select aria-label="Unidad de medida" className={claseInput} disabled={guardando || !catalogos} onChange={cambiar('unidadMedidaId')} value={datos.unidadMedidaId}>
          <option value="">{catalogos ? 'Unidad (de la dosis)' : 'Cargando unidades...'}</option>
          {catalogos?.unidades.map((unidad) => <option key={unidad.id} value={unidad.id}>{unidad.nombre} ({unidad.abreviatura})</option>)}
        </select>
      </div>
      {sinCatalogos && <p className="text-xs text-amber-800">Faltan tipos o unidades: se cargan en Configuración (ADMIN).</p>}
      {error && <p className="text-xs text-red-700" role="alert">{error}</p>}
      <div className="flex gap-2">
        <button className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-70" disabled={guardando} onClick={guardar} type="button">
          {guardando ? 'Creando...' : 'Crear y usar'}
        </button>
        <button className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50" disabled={guardando} onClick={onCancelar} type="button">
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default NuevoProductoRapido
