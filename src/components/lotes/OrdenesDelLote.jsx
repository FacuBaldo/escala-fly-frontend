import { useEffect, useState } from 'react'
import { AlertTriangle, ChevronRight, Plus } from 'lucide-react'
import { getOrdenes } from '../../api/ordenesApi'
import { ESTADOS_ORDEN, formatearFecha } from '../../utils/ordenes'

const LIMITE = 5

/**
 * Ordenes de un lote dentro de la pantalla del campo: permite ver las existentes
 * y crear una nueva sin salir del campo.
 */
function OrdenesDelLote({ lote, version, onNuevaOrden, onVerOrden, onAsignarPistas }) {
  const [ordenes, setOrdenes] = useState([])
  const [hayMas, setHayMas] = useState(false)
  const [error, setError] = useState('')
  // Se considera cargando hasta que llega la respuesta para este lote y esta version
  const clave = `${lote.id}:${version}`
  const [claveCargada, setClaveCargada] = useState(null)
  const cargando = claveCargada !== clave

  const faltanPistas = !lote.pistaPrincipalId || !lote.pistaCargaId

  useEffect(() => {
    let vigente = true
    getOrdenes({ loteId: lote.id, page: 1, limit: LIMITE })
      .then((respuesta) => {
        if (!vigente) return
        setOrdenes(respuesta.data)
        setHayMas(respuesta.pagination.hasNextPage)
        setError('')
      })
      .catch(() => { if (vigente) setError('No se pudieron cargar las órdenes.') })
      .finally(() => { if (vigente) setClaveCargada(clave) })
    return () => { vigente = false }
  }, [lote.id, clave])

  return (
    <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">Órdenes del lote</h3>
        {!faltanPistas && lote.activo && (
          <button
            className="inline-flex min-h-8 items-center gap-1 rounded-md bg-emerald-700 px-2.5 text-xs font-bold text-white transition hover:bg-emerald-800"
            onClick={onNuevaOrden}
            type="button"
          >
            <Plus aria-hidden="true" size={14} />
            Nueva orden
          </button>
        )}
      </div>

      {!lote.activo && (
        <p className="mb-2 text-xs text-slate-500">El lote está de baja: reactivalo para crear órdenes.</p>
      )}

      {lote.activo && faltanPistas && (
        <div className="mb-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs leading-5 text-amber-900">
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
          <span>
            Para crear órdenes el lote necesita pista principal y de carga.{' '}
            <button className="font-bold underline hover:text-amber-950" onClick={onAsignarPistas} type="button">
              Asignar pistas
            </button>
          </span>
        </div>
      )}

      {cargando && <p className="text-xs text-slate-500">Cargando órdenes...</p>}
      {!cargando && error && <p className="text-xs text-red-700">{error}</p>}
      {!cargando && !error && ordenes.length === 0 && (
        <p className="text-xs text-slate-500">Todavía no hay órdenes para este lote.</p>
      )}

      {!cargando && !error && ordenes.length > 0 && (
        <ul className="space-y-1">
          {ordenes.map((orden) => (
            <li key={orden.id}>
              <button
                className="flex w-full items-center justify-between gap-2 rounded-md bg-white px-2.5 py-1.5 text-left text-xs shadow-sm ring-1 ring-slate-200 transition hover:ring-emerald-300"
                onClick={() => onVerOrden(orden)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="font-bold text-slate-900">#{orden.numero}</span>
                  <span className="text-slate-500"> · {ESTADOS_ORDEN[orden.estado] || orden.estado} · {formatearFecha(orden.fechaPrevista)}</span>
                </span>
                <ChevronRight aria-hidden="true" className="shrink-0 text-slate-400" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {hayMas && <p className="mt-1.5 text-xs text-slate-500">Se muestran las últimas {LIMITE}. El resto está en Órdenes.</p>}
    </div>
  )
}

export default OrdenesDelLote
