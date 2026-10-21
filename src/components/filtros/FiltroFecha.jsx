/** Fecha de un filtro por rango ("desde" o "hasta"), con su texto delante. */
function FiltroFecha({ etiqueta, max, min, onChange, valor }) {
  return (
    <label
      className={`flex h-10 items-center gap-2 rounded-md border bg-white px-3 text-sm transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100 ${
        valor ? 'border-emerald-500 text-emerald-900' : 'border-slate-200 text-slate-500'
      }`}
    >
      <span className="text-xs font-semibold">{etiqueta}</span>
      <input
        aria-label={`Fecha prevista ${etiqueta.toLowerCase()}`}
        className="bg-transparent text-sm text-slate-950 outline-none"
        max={max || undefined}
        min={min || undefined}
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={valor}
      />
    </label>
  )
}

export default FiltroFecha
