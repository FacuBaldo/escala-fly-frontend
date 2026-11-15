import { Check, Trash2 } from 'lucide-react'
import { TIPOS_OBSTACULO, svgDe } from '../../utils/obstaculos'

const IconoTipo = ({ tipo, tamano = 18 }) => {
  const { color } = TIPOS_OBSTACULO[tipo] || TIPOS_OBSTACULO.OTRO
  if (tipo === 'CABLE') {
    return <span aria-hidden="true" className="inline-block h-1 w-5 rounded" style={{ background: `repeating-linear-gradient(90deg, ${color} 0 6px, transparent 6px 9px)` }} />
  }
  return (
    <span aria-hidden="true" className="inline-flex items-center justify-center rounded-full" style={{ background: color, color, height: tamano + 6, width: tamano + 6 }}>
      <svg dangerouslySetInnerHTML={{ __html: svgDe(tipo) }} fill="none" height={tamano} viewBox="0 0 24 24" width={tamano} />
    </span>
  )
}

/**
 * Barra para marcar obstáculos: se elige qué marcar y se hace clic en el mapa.
 * La herramienta queda activa para marcar varios seguidos.
 */
function BarraHerramientasObstaculos({ herramienta, nombreLote, onElegir, onTerminar }) {
  const ayuda = !herramienta
    ? 'Elegí qué querés marcar y hacé clic en el mapa.'
    : herramienta === 'CABLE'
      ? 'Marcá los puntos del cable y hacé clic en el último para terminarlo. Podés trazar varios.'
      : `Hacé clic en el mapa para ubicar cada ${TIPOS_OBSTACULO[herramienta].nombre.toLowerCase()}. Podés marcar varios seguidos.`

  return (
    <div className="mb-4 grid gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p><span className="font-bold">Obstáculos de {nombreLote}.</span> {ayuda}</p>
        <button className="flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 font-bold text-white transition hover:bg-emerald-800" onClick={onTerminar} type="button">
          <Check aria-hidden="true" size={16} /> Listo
        </button>
      </div>
      <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Qué obstáculo marcar">
        {Object.entries(TIPOS_OBSTACULO).map(([tipo, { nombre }]) => {
          const activa = herramienta === tipo
          return (
            <button
              aria-pressed={activa}
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-semibold transition ${activa ? 'border-emerald-700 bg-white text-emerald-900 ring-2 ring-emerald-200' : 'border-amber-200 bg-white text-slate-700 hover:border-emerald-300'}`}
              key={tipo}
              onClick={() => onElegir(activa ? null : tipo)}
              type="button"
            >
              <IconoTipo tamano={14} tipo={tipo} />
              {nombre}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Lista de obstáculos del lote con nombre y altura opcionales. Los cambios se guardan
 * al salir del campo, para que cargarlos sea rápido.
 */
function ListaObstaculos({ obstaculos, editable, onActualizar, onEliminar }) {
  if (obstaculos.length === 0) {
    return <p className="text-xs text-slate-500">{editable ? 'Todavía no hay obstáculos marcados en este lote.' : 'Sin obstáculos marcados.'}</p>
  }

  const guardarSiCambio = (obstaculo, campo, valor) => {
    const anterior = obstaculo[campo] ?? ''
    if (String(anterior) !== valor) onActualizar(obstaculo.id, { [campo]: valor === '' ? null : valor })
  }

  return (
    <ul className="space-y-1.5">
      {obstaculos.map((obstaculo, indice) => (
        <li className="grid grid-cols-[auto_minmax(0,1fr)_4.5rem_auto] items-center gap-1.5 rounded-md bg-white px-2 py-1.5 text-xs shadow-sm ring-1 ring-slate-200" key={obstaculo.id}>
          <IconoTipo tamano={13} tipo={obstaculo.tipo} />
          {editable ? (
            <>
              <input
                aria-label={`Nombre del obstáculo ${indice + 1}`}
                className="h-7 min-w-0 rounded border border-slate-200 px-1.5 outline-none focus:border-emerald-500"
                defaultValue={obstaculo.nombre || ''}
                maxLength={80}
                onBlur={(event) => guardarSiCambio(obstaculo, 'nombre', event.target.value.trim())}
                placeholder={TIPOS_OBSTACULO[obstaculo.tipo]?.nombre}
              />
              <input
                aria-label={`Altura del obstáculo ${indice + 1} en metros`}
                className="h-7 min-w-0 rounded border border-slate-200 px-1.5 outline-none focus:border-emerald-500"
                defaultValue={obstaculo.alturaMetros ?? ''}
                min={0}
                onBlur={(event) => guardarSiCambio(obstaculo, 'alturaMetros', event.target.value)}
                placeholder="Alt. m"
                step="any"
                type="number"
              />
              <button aria-label={`Eliminar obstáculo ${indice + 1}`} className="flex h-7 w-7 items-center justify-center rounded text-red-700 hover:bg-red-50" onClick={() => onEliminar(obstaculo.id)} type="button">
                <Trash2 aria-hidden="true" size={14} />
              </button>
            </>
          ) : (
            <span className="col-span-3 text-slate-700">
              {obstaculo.nombre || TIPOS_OBSTACULO[obstaculo.tipo]?.nombre}
              {obstaculo.alturaMetros ? ` · ${obstaculo.alturaMetros} m` : ''}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

export { BarraHerramientasObstaculos, IconoTipo, ListaObstaculos }
