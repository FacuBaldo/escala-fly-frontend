import { Compass, Droplets, Layers, Navigation, Route, Sparkles } from 'lucide-react'
import { colorDeViaje, formatearDistancia, formatearLitros, formatearNumero, nombrePatron } from '../../utils/ordenes'

const Tarjeta = ({ icono: Icono, titulo, valor, detalle }) => (
  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2">
    <p className="flex items-center gap-1 text-xs font-semibold uppercase text-emerald-900">
      <Icono aria-hidden="true" size={13} />
      {titulo}
    </p>
    <p className="mt-1 text-lg font-bold text-slate-950">{valor}</p>
    {detalle && <p className="text-xs text-slate-500">{detalle}</p>}
  </div>
)

/**
 * En automatico el planificador calcula los dos patrones: devuelve cuanto menos
 * vuela el elegido que el otro, o null si no hubo comparacion.
 */
const ahorroDelPatron = (plan) => {
  const comparacion = plan.comparacionPatrones || {}
  const otros = Object.entries(comparacion).filter(([patron]) => patron !== plan.patron)

  if (plan.patronSolicitado !== 'AUTOMATICO' || otros.length === 0) {
    return null
  }

  const [otroPatron, distanciaOtro] = otros[0]
  return { otroPatron, metros: distanciaOtro - plan.distanciaTotalMetros }
}

/**
 * Resumen del plan, selector de viajes y ficha del viaje elegido.
 */
function PanelPlan({ plan, viajeSeleccionado, onSeleccionarViaje }) {
  const viaje = plan.viajes.find((item) => item.numero === viajeSeleccionado)
  const ahorro = ahorroDelPatron(plan)

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2">
        <Tarjeta
          detalle={`${plan.cantidadPasadas} pasadas`}
          icono={Layers}
          titulo="Superficie"
          valor={`${formatearNumero(plan.superficieHa)} ha`}
        />
        <Tarjeta icono={Droplets} titulo="Caldo total" valor={formatearLitros(plan.caldoTotalLitros)} />
        <Tarjeta
          detalle={`${formatearDistancia(plan.distanciaAplicacionMetros)} aplicando · ${formatearDistancia(
            plan.distanciaGirosMetros,
          )} en giros`}
          icono={Route}
          titulo="Distancia"
          valor={formatearDistancia(plan.distanciaTotalMetros)}
        />
        <Tarjeta
          detalle={`${nombrePatron(plan.patron)}${plan.radioGiroMetros ? ` · giros de ${formatearNumero(plan.radioGiroMetros, 0)} m` : ''}`}
          icono={Compass}
          titulo="Rumbo y patron"
          valor={`${formatearNumero(plan.orientacionGrados, 0)}°`}
        />
      </div>

      {ahorro && ahorro.metros > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">
          <Sparkles aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
          <span>
            Se eligio <span className="font-bold">{nombrePatron(plan.patron)}</span>: vuela{' '}
            <span className="font-bold">{formatearDistancia(ahorro.metros)} menos</span> que{' '}
            {nombrePatron(ahorro.otroPatron).toLowerCase()}.
          </span>
        </p>
      )}

      <div className="grid gap-2">
        <span className="text-sm font-semibold text-slate-700">
          Viajes ({plan.cantidadViajes})
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-md border px-3 py-1.5 text-xs font-bold transition ${
              viajeSeleccionado === null
                ? 'border-emerald-700 bg-emerald-700 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => onSeleccionarViaje(null)}
            type="button"
          >
            Ver todos
          </button>

          {plan.viajes.map((item) => (
            <button
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-bold transition ${
                viajeSeleccionado === item.numero
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              key={item.numero}
              onClick={() => onSeleccionarViaje(item.numero)}
              type="button"
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colorDeViaje(item.numero) }}
              />
              Viaje {item.numero}
            </button>
          ))}
        </div>
      </div>

      {viaje ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-950">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: colorDeViaje(viaje.numero) }}
            />
            Viaje {viaje.numero}
          </p>

          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Sale de</dt>
              <dd className="text-right font-semibold text-slate-800">
                {viaje.pistaSalidaNombre} <span className="text-xs font-normal text-slate-500">({viaje.tipoSalida === 'PRINCIPAL' ? 'principal' : 'carga'})</span>
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Llega a</dt>
              <dd className="text-right font-semibold text-slate-800">
                {viaje.pistaLlegadaNombre} <span className="text-xs font-normal text-slate-500">({viaje.tipoLlegada === 'PRINCIPAL' ? 'principal' : 'carga'})</span>
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Caldo</dt>
              <dd className="font-semibold text-slate-800">{formatearLitros(viaje.caldoLitros)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Superficie</dt>
              <dd className="font-semibold text-slate-800">{formatearNumero(viaje.superficieHa)} ha</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Distancia</dt>
              <dd className="font-semibold text-slate-800">
                {formatearDistancia(viaje.distanciaMetros)}
                <span className="ml-1 text-xs font-normal text-slate-500">
                  ({formatearDistancia(viaje.distanciaAplicacionMetros)} aplicando)
                </span>
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white text-sm">
          {plan.viajes.map((item) => (
            <li className="flex items-center justify-between gap-2 px-3 py-2" key={item.numero}>
              <span className="flex items-center gap-2 font-semibold text-slate-800">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: colorDeViaje(item.numero) }}
                />
                Viaje {item.numero}
              </span>
              <span className="text-right text-xs text-slate-500">
                {formatearLitros(item.caldoLitros)} · {formatearNumero(item.superficieHa)} ha ·{' '}
                {formatearDistancia(item.distanciaMetros)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <Navigation aria-hidden="true" size={13} />
        Las lineas punteadas son traslados y giros; las solidas, los tramos con pulverizacion activa.
      </p>
    </div>
  )
}

export default PanelPlan
