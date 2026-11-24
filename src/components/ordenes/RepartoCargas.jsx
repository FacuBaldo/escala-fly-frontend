import { useEffect, useState } from 'react'
import { ClipboardList, Pencil, Printer, RotateCcw } from 'lucide-react'
import { actualizarCargasDeOrden, getCargasDeOrden, restablecerCargasDeOrden } from '../../api/ordenesApi'
import getErrorMessage from '../../utils/getErrorMessage'
import { formatearLitros, formatearNumero } from '../../utils/ordenes'

const claveCelda = (numeroViaje, productoId) => `${numeroViaje}|${productoId}`

const nombreProducto = (producto) => (producto.marca ? `${producto.nombre} · ${producto.marca}` : producto.nombre)

/**
 * Reparto de los productos de la mezcla entre las cargas (viajes) del plan. El sistema
 * lo calcula solo; el encargado puede corregir lo que lleva cada carga y abrir la
 * orden imprimible para el cargador.
 */
function RepartoCargas({ ordenId, versionPlan, editable, onNotificar }) {
  const [vista, setVista] = useState(null)
  const [error, setError] = useState('')
  const [claveCargada, setClaveCargada] = useState(null)
  const [editando, setEditando] = useState(false)
  const [valores, setValores] = useState({})
  const [guardando, setGuardando] = useState(false)

  // Se vuelve a pedir cada vez que cambia el plan (regenerar o editar la orden)
  const clave = `${ordenId}:${versionPlan}`
  const cargando = claveCargada !== clave

  useEffect(() => {
    let vigente = true
    getCargasDeOrden(ordenId)
      .then((datos) => { if (vigente) { setVista(datos); setError(''); setEditando(false) } })
      .catch((requestError) => { if (vigente) setError(getErrorMessage(requestError, 'No se pudo cargar el reparto de productos.')) })
      .finally(() => { if (vigente) setClaveCargada(clave) })
    return () => { vigente = false }
  }, [ordenId, clave])

  if (cargando && !vista) return <p className="text-sm text-slate-500">Cargando reparto de productos...</p>
  if (error) return <p className="text-sm text-red-700">{error}</p>
  if (!vista) return null

  const productos = vista.productos.filter((producto) => producto.criterio !== 'SIN_DATOS')
  const sinDatos = vista.productos.filter((producto) => producto.criterio === 'SIN_DATOS')

  if (vista.productos.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
        Esta orden no tiene productos en la mezcla. Agregalos editando la orden para armar la orden del cargador.
      </p>
    )
  }

  const cantidadDe = (viaje, productoId) => viaje.productos.find((item) => item.productoId === productoId)

  const empezarEdicion = () => {
    const iniciales = {}
    vista.viajes.forEach((viaje) => viaje.productos.forEach((item) => {
      iniciales[claveCelda(viaje.numero, item.productoId)] = String(item.cantidad)
    }))
    setValores(iniciales)
    setEditando(true)
  }

  // Total asignado por producto con los valores que se estan editando
  const asignadoEnEdicion = (productoId) => vista.viajes.reduce((total, viaje) => {
    const valor = Number(valores[claveCelda(viaje.numero, productoId)])
    return total + (Number.isFinite(valor) ? valor : 0)
  }, 0)

  const guardar = async () => {
    const cargas = []
    for (const viaje of vista.viajes) {
      for (const item of viaje.productos) {
        const texto = valores[claveCelda(viaje.numero, item.productoId)]
        const cantidad = Number(texto)
        if (texto === '' || !Number.isFinite(cantidad) || cantidad < 0) {
          onNotificar({ message: `Revisá la cantidad de la carga ${viaje.numero}: tiene que ser un número mayor o igual a 0.`, type: 'error' })
          return
        }
        if (Math.abs(cantidad - item.cantidad) >= 0.005) cargas.push({ numeroViaje: viaje.numero, productoId: item.productoId, cantidad })
      }
    }

    if (cargas.length === 0) {
      setEditando(false)
      return
    }

    setGuardando(true)
    try {
      setVista(await actualizarCargasDeOrden(ordenId, cargas))
      setEditando(false)
      onNotificar({ message: 'Reparto de productos actualizado.', type: 'success' })
    } catch (requestError) {
      onNotificar({ message: getErrorMessage(requestError, 'No se pudo guardar el reparto.'), type: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  const restablecer = async () => {
    if (!window.confirm('¿Descartar las correcciones y volver al reparto automático?')) return
    setGuardando(true)
    try {
      setVista(await restablecerCargasDeOrden(ordenId))
      setEditando(false)
      onNotificar({ message: 'Se restableció el reparto automático.', type: 'success' })
    } catch (requestError) {
      onNotificar({ message: getErrorMessage(requestError, 'No se pudo restablecer el reparto.'), type: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  const hayManuales = vista.viajes.some((viaje) => viaje.productos.some((item) => item.manual))
  const claseBoton = 'inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-950">
            <ClipboardList aria-hidden="true" className="text-emerald-700" size={18} />
            Productos por carga
          </h2>
          <p className="text-xs text-slate-500">
            Calculado según la dosis y las hectáreas de cada viaje. {editable && 'Podés corregir lo que lleva cada carga.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && !editando && productos.length > 0 && (
            <button className={`${claseBoton} border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50`} disabled={guardando} onClick={empezarEdicion} type="button">
              <Pencil aria-hidden="true" size={15} /> Corregir
            </button>
          )}
          {editable && !editando && hayManuales && (
            <button className={`${claseBoton} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`} disabled={guardando} onClick={restablecer} type="button">
              <RotateCcw aria-hidden="true" size={15} /> Restablecer
            </button>
          )}
          {editando && (
            <>
              <button className={`${claseBoton} bg-emerald-700 text-white hover:bg-emerald-800`} disabled={guardando} onClick={guardar} type="button">
                {guardando ? 'Guardando...' : 'Guardar reparto'}
              </button>
              <button className={`${claseBoton} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`} disabled={guardando} onClick={() => setEditando(false)} type="button">
                Cancelar
              </button>
            </>
          )}
          {!editando && productos.length > 0 && (
            <a className={`${claseBoton} bg-emerald-700 text-white hover:bg-emerald-800`} href={`/ordenes/${ordenId}/cargador`} rel="noreferrer" target="_blank">
              <Printer aria-hidden="true" size={15} /> Orden para el cargador
            </a>
          )}
        </div>
      </div>

      {sinDatos.length > 0 && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Sin dosis ni cantidad del cliente, no se reparten: {sinDatos.map(nombreProducto).join(', ')}. Completalos editando la orden.
        </p>
      )}

      {productos.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-2">Carga</th>
                <th className="px-3 py-2">Pista de carga</th>
                <th className="px-3 py-2 text-right">Caldo</th>
                <th className="px-3 py-2 text-right">Hectáreas</th>
                {productos.map((producto) => (
                  <th className="px-3 py-2 text-right" key={producto.productoId}>{nombreProducto(producto)} ({producto.unidad})</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vista.viajes.map((viaje) => (
                <tr key={viaje.numero}>
                  <td className="px-3 py-2 font-semibold text-slate-900">#{viaje.numero}</td>
                  <td className="px-3 py-2 text-slate-600">{viaje.pistaCargaNombre}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{formatearLitros(viaje.caldoLitros)}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{formatearNumero(viaje.superficieHa, 1)}</td>
                  {productos.map((producto) => {
                    const item = cantidadDe(viaje, producto.productoId)
                    const celda = claveCelda(viaje.numero, producto.productoId)
                    return (
                      <td className="px-3 py-2 text-right" key={producto.productoId}>
                        {editando && item ? (
                          <input
                            aria-label={`${producto.nombre} en la carga ${viaje.numero}`}
                            className="h-8 w-24 rounded-md border border-slate-200 px-2 text-right text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            min={0}
                            onChange={(event) => setValores((actuales) => ({ ...actuales, [celda]: event.target.value }))}
                            step="any"
                            type="number"
                            value={valores[celda] ?? ''}
                          />
                        ) : item ? (
                          <span className={item.manual ? 'font-semibold text-amber-700' : 'text-slate-800'} title={item.manual ? `Corregido a mano (el cálculo daba ${formatearNumero(item.cantidadAutomatica)})` : undefined}>
                            {formatearNumero(item.cantidad)}{item.manual && ' *'}
                          </span>
                        ) : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50 text-xs">
              <tr>
                <td className="px-3 py-2 font-bold text-slate-700" colSpan={4}>Total en las cargas</td>
                {productos.map((producto) => (
                  <td className="px-3 py-2 text-right font-bold text-slate-900" key={producto.productoId}>
                    {formatearNumero(editando ? asignadoEnEdicion(producto.productoId) : producto.asignado)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-1.5 text-slate-600" colSpan={4}>Según la dosis</td>
                {productos.map((producto) => (
                  <td className="px-3 py-1.5 text-right text-slate-600" key={producto.productoId}>
                    {producto.requerido !== null ? formatearNumero(producto.requerido) : 'sin dosis'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-1.5 text-slate-600" colSpan={4}>Trajo el cliente</td>
                {productos.map((producto) => {
                  const asignado = editando ? asignadoEnEdicion(producto.productoId) : producto.asignado
                    const diferencia = producto.cantidadTotalCliente != null ? producto.cantidadTotalCliente - asignado : null
                  return (
                    <td className="px-3 py-1.5 text-right" key={producto.productoId}>
                        {producto.cantidadTotalCliente != null ? formatearNumero(producto.cantidadTotalCliente) : <span className="text-slate-400">no informado</span>}
                      {diferencia !== null && Math.abs(diferencia) >= 0.005 && (
                        <span className={`block font-semibold ${diferencia < 0 ? 'text-red-700' : 'text-amber-700'}`}>
                          {diferencia < 0 ? `faltan ${formatearNumero(-diferencia)}` : `sobran ${formatearNumero(diferencia)}`}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {hayManuales && !editando && <p className="text-xs text-amber-700">* Cantidad corregida a mano por el encargado.</p>}
    </div>
  )
}

export default RepartoCargas
