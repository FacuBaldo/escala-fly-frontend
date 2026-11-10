import { X } from 'lucide-react'

/**
 * Franja de filtros que va entre el titulo de la pantalla y la tabla. Recibe el
 * buscador y los desplegables como hijos, y suma el boton para limpiar cuando
 * hay algun filtro activo.
 */
function BarraFiltros({ children, disabled = false, hayFiltros, onLimpiar }) {
  return (
    <section
      aria-label="Filtros"
      className="mb-4 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.33fr)_repeat(4,minmax(0,1fr))]">{children}</div>

      {hayFiltros && (
        <div className="mt-2 flex justify-end">
          <button
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
            onClick={onLimpiar}
            type="button"
          >
            <X aria-hidden="true" size={14} />
            Limpiar filtros
          </button>
        </div>
      )}
    </section>
  )
}

export default BarraFiltros
