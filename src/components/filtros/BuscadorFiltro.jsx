import { Search, X } from 'lucide-react'

/** Campo de busqueda con lupa y boton para borrar lo escrito. */
function BuscadorFiltro({ disabled = false, etiqueta = 'Buscar', onChange, placeholder, valor }) {
  return (
    <div className="relative min-w-0 flex-1 basis-56">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        size={16}
      />
      <input
        aria-label={etiqueta}
        className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={valor}
      />
      {valor && !disabled && (
        <button
          aria-label="Borrar busqueda"
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          onClick={() => onChange('')}
          title="Borrar"
          type="button"
        >
          <X aria-hidden="true" size={14} />
        </button>
      )}
    </div>
  )
}

export default BuscadorFiltro
