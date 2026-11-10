/**
 * Desplegable de filtro. La primera opcion ("Todos los ...") deja el filtro sin
 * aplicar. Cuando hay un valor elegido el borde se marca, para que se note que
 * esa columna esta filtrada.
 * @param {Array<{ valor: string, etiqueta: string }>} props.opciones
 */
function FiltroSelect({ className = '', disabled = false, etiqueta, onChange, opciones, todos, valor }) {
  return (
    <select
      aria-label={etiqueta}
      className={`h-10 w-full min-w-0 rounded-lg border bg-slate-50/50 px-3 text-sm outline-none transition hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50 ${
        valor ? 'border-emerald-500 font-semibold text-emerald-900' : 'border-slate-200 text-slate-700'
      } ${className}`}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      title={etiqueta}
      value={valor}
    >
      <option value="">{todos}</option>
      {opciones.map((opcion) => (
        <option key={opcion.valor} value={opcion.valor}>
          {opcion.etiqueta}
        </option>
      ))}
    </select>
  )
}

export default FiltroSelect
