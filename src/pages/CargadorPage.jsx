import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { getCargasDeOrden } from '../api/ordenesApi'
import PageLoader from '../components/compartidos/feedback/PageLoader'
import getErrorMessage from '../utils/getErrorMessage'
import { formatearFecha, formatearLitros, formatearNumero } from '../utils/ordenes'

const nombreProducto = (producto) => (producto.marca ? `${producto.nombre} (${producto.marca})` : producto.nombre)
const nombrePersona = (persona) => (persona ? `${persona.nombre} ${persona.apellido}` : 'Sin asignar')

/**
 * Orden para el cargador: hoja para imprimir con lo que lleva cada carga del avión.
 * Se abre en una pestaña aparte desde la ruta de la orden.
 */
function CargadorPage() {
  const { ordenId } = useParams()
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true
    getCargasDeOrden(ordenId)
      .then((respuesta) => { if (vigente) setDatos(respuesta) })
      .catch((requestError) => { if (vigente) setError(getErrorMessage(requestError, 'No se pudo cargar la orden del cargador.')) })
    return () => { vigente = false }
  }, [ordenId])

  useEffect(() => {
    if (datos) document.title = `Orden del cargador #${datos.orden.numero}`
  }, [datos])

  if (error) return <p className="p-6 text-sm text-red-700">{error}</p>
  if (!datos) return <PageLoader message="Armando la orden del cargador..." />

  const { orden, viajes } = datos
  const productos = datos.productos.filter((producto) => producto.criterio !== 'SIN_DATOS')

  return (
    <main className="mx-auto max-w-4xl bg-white p-6 text-slate-900 print:max-w-none print:p-0">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-slate-500">Revisá los datos e imprimí o guardá como PDF para entregarla al cargador.</p>
        <button className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800" onClick={() => window.print()} type="button">
          <Printer aria-hidden="true" size={16} /> Imprimir
        </button>
      </div>

      <header className="border-b-2 border-slate-900 pb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{orden.empresa?.nombre}</p>
        <h1 className="text-2xl font-bold">Orden del cargador · Orden #{orden.numero}</h1>
        <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          <div><dt className="inline font-semibold">Fecha: </dt><dd className="inline">{formatearFecha(orden.fechaPrevista)}</dd></div>
          <div><dt className="inline font-semibold">Campo / lote: </dt><dd className="inline">{orden.lote?.campo?.nombre} · {orden.lote?.nombre}</dd></div>
          <div><dt className="inline font-semibold">Superficie: </dt><dd className="inline">{formatearNumero(orden.planVuelo?.superficieHa ?? orden.lote?.superficie, 1)} ha</dd></div>
          <div><dt className="inline font-semibold">Aeronave: </dt><dd className="inline">{orden.aeronave?.matricula} · {orden.aeronave?.modelo}</dd></div>
          <div><dt className="inline font-semibold">Piloto: </dt><dd className="inline">{nombrePersona(orden.piloto)}</dd></div>
          <div><dt className="inline font-semibold">Cliente: </dt><dd className="inline">{nombrePersona(orden.cliente)}</dd></div>
          <div><dt className="inline font-semibold">Caldo: </dt><dd className="inline">{formatearNumero(orden.litrosPorHectarea)} L/ha · {formatearLitros(orden.planVuelo?.caldoTotalLitros)} en total</dd></div>
          <div><dt className="inline font-semibold">Cargas: </dt><dd className="inline">{viajes.length}</dd></div>
        </dl>
        {orden.observaciones && <p className="mt-2 text-sm"><span className="font-semibold">Observaciones: </span>{orden.observaciones}</p>}
      </header>

      {productos.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">La orden no tiene productos con dosis o cantidad para repartir. Solo se carga caldo.</p>
      ) : (
        <>
          <section className="mt-4">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide">Productos de la mezcla</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-400 text-left">
                  <th className="py-1 pr-2">Producto</th>
                  <th className="py-1 pr-2 text-right">Dosis</th>
                  <th className="py-1 pr-2 text-right">Total a cargar</th>
                  <th className="py-1 text-right">Trajo el cliente</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
                  <tr className="border-b border-slate-200" key={producto.productoId}>
                    <td className="py-1 pr-2 font-semibold">{nombreProducto(producto)}</td>
                    <td className="py-1 pr-2 text-right">{producto.dosisPorHectarea ? `${formatearNumero(producto.dosisPorHectarea, 3)} ${producto.unidad}/ha` : '—'}</td>
                    <td className="py-1 pr-2 text-right">{formatearNumero(producto.asignado)} {producto.unidad}</td>
                    <td className="py-1 text-right">
                      {producto.cantidadTotalCliente ? `${formatearNumero(producto.cantidadTotalCliente)} ${producto.unidad}` : '—'}
                      {producto.diferenciaCliente !== null && Math.abs(producto.diferenciaCliente) >= 0.005 && (
                        <span className="block text-xs font-semibold">
                          {producto.diferenciaCliente > 0 ? `Sobran ${formatearNumero(producto.diferenciaCliente)} ${producto.unidad}` : `Faltan ${formatearNumero(-producto.diferenciaCliente)} ${producto.unidad}`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-6">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide">Carga por viaje</h2>
            <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
              {viajes.map((viaje) => (
                <article className="break-inside-avoid rounded-md border border-slate-400 p-3" key={viaje.numero}>
                  <div className="flex items-baseline justify-between gap-2 border-b border-slate-300 pb-1">
                    <h3 className="text-lg font-bold">Carga {viaje.numero}</h3>
                    <span className="text-xs">Pista: {viaje.pistaCargaNombre}</span>
                  </div>
                  <p className="mt-1 text-sm"><span className="font-semibold">Caldo total:</span> {formatearLitros(viaje.caldoLitros)} <span className="text-xs text-slate-500">({formatearNumero(viaje.superficieHa, 1)} ha)</span></p>
                  <ul className="mt-1 space-y-0.5 text-sm">
                    {productos.map((producto) => {
                      const item = viaje.productos.find((p) => p.productoId === producto.productoId)
                      return (
                        <li className="flex items-center justify-between gap-2" key={producto.productoId}>
                          <span className="flex items-center gap-2">
                            <span aria-hidden="true" className="inline-block h-3.5 w-3.5 border border-slate-500" />
                            {nombreProducto(producto)}
                          </span>
                          <span className="font-bold">{formatearNumero(item?.cantidad ?? 0)} {producto.unidad}</span>
                        </li>
                      )
                    })}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <footer className="mt-8 grid grid-cols-2 gap-8 text-sm">
        <p className="border-t border-slate-500 pt-1">Firma del cargador</p>
        <p className="border-t border-slate-500 pt-1">Firma del piloto</p>
      </footer>
    </main>
  )
}

export default CargadorPage
