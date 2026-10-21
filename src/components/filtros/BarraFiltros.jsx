import { X } from 'lucide-react'

/**
 * Franja de filtros que va entre el titulo de la pantalla y la tabla. Recibe el
 * buscador y los desplegables como hijos, y suma el contador de resultados y el
 * boton para limpiar, que aparece solo si hay algun filtro activo.
 */
function BarraFiltros({ children, hayFiltros, onLimpiar, total, visibles }) {
  return (
    <section
      aria-label="Filtros"
      className="mb-4 rounded-lg border border-emerald-100 bg-white p-3 shadow-sm shadow-emerald-950/5"
    >
      <div className="flex flex-wrap items-center gap-2">{children}</div>

      <div className="mt-2 flex min-h-7 flex-wrap items-center justify-between gap-2 px-1">
        <p aria-live="polite" className="text-xs text-slate-500">
          {hayFiltros ? (
            <>
              Mostrando <span className="font-bold text-slate-900">{visibles}</span> de {total}
            </>
          ) : (
            <>
              <span className="font-bold text-slate-900">{total}</span> en total
            </>
          )}
        </p>

        {hayFiltros && (
          <button
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50"
            onClick={onLimpiar}
            type="button"
          >
            <X aria-hidden="true" size={14} />
            Limpiar filtros
          </button>
        )}
      </div>
    </section>
  )
}

export default BarraFiltros
