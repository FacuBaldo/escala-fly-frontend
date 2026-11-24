import { Compass, Droplets, Layers, Navigation, Route, Sparkles } from 'lucide-react'
import { colorDeViaje, FORMAS_LOTE, formatearDistancia, formatearLitros, formatearNumero, nombrePatron, PATRONES_VUELO } from '../../utils/ordenes'
import EsquemaPatron from './EsquemaPatron'

// El motor mide desde el este; la orientación geográfica se expresa desde el norte.
const orientacionGeografica = (angulo) => ((90 - angulo) % 180 + 180) % 180

const DesgloseDistancias = ({ viajes }) => {
  if (!viajes.every((viaje) => viaje.segmentos?.length)) return null
  const totales = { APLICACION: 0, GIRO: 0, TRASLADO: 0, ENLACE: 0 }
  for (const viaje of viajes) {
    for (const tramo of viaje.segmentos) totales[tramo.tipo] += tramo.distanciaMetros
  }
  return <dl className="grid gap-1.5 text-xs">
    {Object.entries({ APLICACION: 'Aplicación', GIRO: 'Giros', TRASLADO: 'Traslados pista–lote', ENLACE: 'Enlaces sin aplicación' }).map(([tipo, nombre]) => (
      <div className="flex justify-between gap-2" key={tipo}>
        <dt className="text-slate-500">{nombre}</dt>
        <dd className="font-semibold text-slate-800">{formatearDistancia(totales[tipo])}</dd>
      </div>
    ))}
  </dl>
}

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
 * Planes anteriores al Sprint 4 (sin recomendación): cuánto menos vuela el patrón
 * elegido en automático que el otro, o null si no hubo comparación.
 */
const ahorroDelPatron = (plan) => {
  const comparacion = plan.comparacionPatrones || {}
  const otros = Object.entries(comparacion).filter(([patron]) => patron !== plan.patron)

  if (plan.recomendacion || plan.patronSolicitado !== 'AUTOMATICO' || otros.length === 0) {
    return null
  }

  const [otroPatron, distanciaOtro] = otros[0]
  return { otroPatron, metros: distanciaOtro - plan.distanciaTotalMetros }
}

/**
 * Recomendación según la forma del lote, para el piloto: qué patrón conviene y por
 * qué, y cuánto vuela cada uno. El piloto igual puede trabajar de otra manera.
 */
const Recomendacion = ({ plan }) => {
  const { recomendacion } = plan
  if (!recomendacion) return null
  const sigueRecomendacion = recomendacion.patron === plan.patron
  const comparacion = Object.entries(plan.comparacionPatrones || {}).sort((a, b) => a[1] - b[1])

  return (
    <div className="grid gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-950">
      <p className="flex items-start gap-2">
        <Sparkles aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
        <span>
          <span className="font-bold">Recomendado para este lote: {nombrePatron(recomendacion.patron)}</span>
          {' '}(forma: {FORMAS_LOTE[recomendacion.forma]?.toLowerCase() || recomendacion.forma}). {recomendacion.motivo}
        </span>
      </p>
      {!sigueRecomendacion && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-amber-900">
          La ruta se calculó con <span className="font-bold">{nombrePatron(plan.patron)}</span>, elegido en la orden.
        </p>
      )}
      {comparacion.length > 1 && (
        <dl className="grid gap-0.5">
          {comparacion.map(([patron, metros]) => (
            <div className="flex justify-between gap-2" key={patron}>
              <dt className={patron === plan.patron ? 'font-bold' : ''}>{nombrePatron(patron)}</dt>
              <dd className={patron === plan.patron ? 'font-bold' : ''}>{formatearDistancia(metros)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

/**
 * Resumen del plan, selector de viajes y ficha del viaje elegido.
 */
function PanelPlan({ plan, viajeSeleccionado, onSeleccionarViaje }) {
  const viaje = plan.viajes.find((item) => item.numero === viajeSeleccionado)
  const ahorro = ahorroDelPatron(plan)
  const esEspiral = plan.patron === 'ESPIRAL'

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2">
        <Tarjeta
          detalle={`${plan.cantidadPasadas} ${esEspiral ? 'vueltas' : 'pasadas'}`}
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
        {esEspiral ? (
          <Tarjeta
            detalle={plan.radioGiroMetros ? `Radio de giro ${formatearNumero(plan.radioGiroMetros, 0)} m` : undefined}
            icono={Compass}
            titulo="Recorrido"
            valor="Del borde al centro"
          />
        ) : (
          <Tarjeta
            detalle={`Desde el norte · ${plan.radioGiroMetros ? `radio de giro ${formatearNumero(plan.radioGiroMetros, 0)} m` : nombrePatron(plan.patron)}`}
            icono={Compass}
            titulo="Eje de pasadas"
            valor={`${formatearNumero(orientacionGeografica(plan.orientacionGrados), 0)}° / ${formatearNumero(orientacionGeografica(plan.orientacionGrados) + 180, 0)}°`}
          />
        )}
      </div>

      <DesgloseDistancias viajes={plan.viajes} />

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-sm font-bold text-slate-900">{nombrePatron(plan.patron)} · {PATRONES_VUELO[plan.patron]?.subtitulo}</p>
        <EsquemaPatron patron={plan.patron} />
        <p className="text-xs leading-5 text-slate-600">{PATRONES_VUELO[plan.patron]?.descripcion}</p>
        <p className="mt-1 text-xs text-slate-500">Esquema orientativo. Números = orden de vuelo; flechas = sentido.</p>
      </div>

      <Recomendacion plan={plan} />

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
              aria-pressed={viajeSeleccionado === item.numero}
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
          <div className="mt-3 border-t border-slate-200 pt-3"><DesgloseDistancias viajes={[viaje]} /></div>
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
        {viaje ? 'Azul: aplicación. Ámbar: giros. Gris discontinuo: traslados. Violeta punteado: enlaces sin aplicar. Las flechas indican el sentido y los números, el orden de las pasadas dentro del viaje (al acercar el mapa).'
          : 'Seleccioná un viaje para ver flechas, orden de pasadas e inicio/fin de aplicación. En la vista general, cada viaje tiene su propio color de aplicación.'}
      </p>
    </div>
  )
}

export default PanelPlan
