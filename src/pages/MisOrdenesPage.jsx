import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, LogOut, Map } from 'lucide-react'
import { cambiarEstadoOrden, getOrdenes, getPlanDeOrden } from '../api/ordenesApi'
import DataTable from '../components/compartidos/tablas/DataTable'
import MenuAcciones from '../components/compartidos/tablas/MenuAcciones'
import PageLoader from '../components/compartidos/feedback/PageLoader'
import MapaPlanVuelo from '../components/ordenes/MapaPlanVuelo'
import PanelPlan from '../components/ordenes/PanelPlan'
import useAutenticacion from '../context/useAutenticacion'
import useToast from '../context/useToast'
import getErrorMessage from '../utils/getErrorMessage'
import { ESTADOS_ORDEN, ESTILOS_ESTADO, formatearFecha } from '../utils/ordenes'
import { formatearSuperficie } from '../utils/lotes'
import { ROLES } from '../auth/roles'

function MisOrdenesPage() {
  const { usuario, cerrarSesion } = useAutenticacion()
  const esPiloto = usuario?.rol === ROLES.PILOTO
  const { showToast } = useToast()
  const [ordenes, setOrdenes] = useState([])
  const [pagina, setPagina] = useState(1)
  const [hayMas, setHayMas] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [primeraCarga, setPrimeraCarga] = useState(true)
  const [version, setVersion] = useState(0)
  const [detalle, setDetalle] = useState(null)
  const [plan, setPlan] = useState(null)
  const [viaje, setViaje] = useState(null)
  const [cargandoPlan, setCargandoPlan] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuRef = useRef(null)
  const avatarRef = useRef(null)
  const nombreCompleto = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ')
  const iniciales = [usuario?.nombre?.[0], usuario?.apellido?.[0]].filter(Boolean).join('').toUpperCase() || usuario?.email?.slice(0, 2).toUpperCase() || 'EF'

  useEffect(() => {
    if (!menuAbierto) return undefined
    const cerrarFuera = (event) => { if (!menuRef.current?.contains(event.target)) setMenuAbierto(false) }
    const cerrarEscape = (event) => {
      if (event.key === 'Escape') { setMenuAbierto(false); avatarRef.current?.focus() }
    }
    document.addEventListener('pointerdown', cerrarFuera)
    document.addEventListener('keydown', cerrarEscape)
    return () => { document.removeEventListener('pointerdown', cerrarFuera); document.removeEventListener('keydown', cerrarEscape) }
  }, [menuAbierto])

  const informarError = useCallback((error, mensaje) => {
    if (!error.cierreSesionPorAutenticacion) showToast({ message: getErrorMessage(error, mensaje), type: 'error' })
  }, [showToast])

  useEffect(() => {
    let vigente = true
    getOrdenes({ page: pagina, limit: 20 }).then((resultado) => {
      if (!vigente) return
      if (!resultado.data.length && pagina > 1) { setPagina((actual) => actual - 1); return }
      setOrdenes(resultado.data)
      setHayMas(resultado.pagination.hasNextPage)
    }).catch((error) => { if (vigente) informarError(error, 'No se pudieron cargar tus órdenes.') })
      .finally(() => { if (vigente) { setCargando(false); setPrimeraCarga(false) } })
    return () => { vigente = false }
  }, [pagina, version, informarError])

  const abrir = async (orden) => {
    setDetalle(orden)
    setPlan(null)
    setCargandoPlan(true)
    try {
      const resultado = await getPlanDeOrden(orden.id)
      setPlan(resultado)
      setViaje(resultado.viajes[0]?.numero ?? null)
    } catch (error) {
      informarError(error, 'No se pudo cargar el plan de vuelo.')
      setDetalle(null)
      setVersion((actual) => actual + 1)
    } finally { setCargandoPlan(false) }
  }

  const cambiarEstado = async (orden) => {
    const estado = orden.estado === 'PLANIFICADA' ? 'EN_EJECUCION' : 'FINALIZADA'
    setGuardando(true)
    try {
      await cambiarEstadoOrden(orden.id, estado)
      setDetalle((actual) => actual?.id === orden.id ? { ...actual, estado } : actual)
      setVersion((actual) => actual + 1)
      showToast({ message: 'Estado actualizado.', type: 'success' })
    } catch (error) {
      informarError(error, 'No se pudo actualizar la orden.')
      setDetalle(null)
      setVersion((actual) => actual + 1)
    } finally { setGuardando(false) }
  }

  const cambiarPagina = (numero) => {
    if (numero !== pagina) { setCargando(true); setPagina(numero) }
  }

  const columnas = [
    { key: 'numero', header: 'Orden', cellClassName: 'font-semibold text-slate-950', render: (orden) => `#${orden.numero}` },
    { key: 'fechaPrevista', header: 'Fecha', render: (orden) => formatearFecha(orden.fechaPrevista) },
    { key: 'lote', header: 'Lote', render: (orden) => <span>{orden.lote?.campo?.nombre ? `${orden.lote.campo.nombre} · ` : ''}{orden.lote?.nombre || '—'}<span className="block text-xs text-slate-500">{formatearSuperficie(orden.lote?.superficie)}</span></span> },
    { key: 'aeronave', header: 'Aeronave', render: (orden) => orden.aeronave?.matricula || '—' },
    { key: 'estado', header: 'Estado', render: (orden) => <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${ESTILOS_ESTADO[orden.estado] || 'bg-slate-100 text-slate-700'}`}>{ESTADOS_ORDEN[orden.estado] || orden.estado}</span> },
    { key: 'actions', header: 'Acciones', className: 'w-36 text-center', cellClassName: 'text-center', render: (orden) => <MenuAcciones acciones={[{ etiqueta: 'Ver orden y plan', icono: Map, onClick: () => abrir(orden) }]} etiqueta={`orden #${orden.numero}`} /> },
  ]

  return (
    <div className="min-h-screen bg-[#f7fbf8] text-slate-950">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-emerald-100 bg-white/95 px-4 backdrop-blur sm:px-8 lg:px-10">
        <img alt="Escala Fly" className="w-32" src="/images/LogoDrawer.png" />
        <div className="relative" ref={menuRef}>
          <button aria-expanded={menuAbierto} aria-haspopup="menu" aria-label="Menú de usuario" className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" onClick={() => setMenuAbierto((actual) => !actual)} ref={avatarRef} type="button">{iniciales}</button>
          {menuAbierto && <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10" onKeyDown={(event) => { if (event.key === 'Tab') setMenuAbierto(false) }} role="menu">
            <div className="border-b border-slate-100 px-3 py-2.5"><p className="truncate text-sm font-bold text-slate-900">{nombreCompleto || (esPiloto ? 'Piloto' : 'Cliente')}</p><p className="truncate text-xs text-slate-500">{usuario?.email}</p></div>
            <button className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" onClick={cerrarSesion} role="menuitem" type="button"><LogOut aria-hidden="true" size={17} /> Cerrar sesión</button>
          </div>}
        </div>
      </header>
      <main className="mx-auto max-w-[160rem] px-4 py-7 sm:px-8 lg:px-10 lg:py-9">
        {primeraCarga ? <PageLoader /> : cargandoPlan ? <PageLoader message="Cargando plan de vuelo..." /> : detalle ? <>
          <button className="mb-4 flex items-center gap-1 text-sm font-semibold text-emerald-800" onClick={() => { setDetalle(null); setPlan(null); setVersion((actual) => actual + 1) }} type="button"><ArrowLeft size={16} /> Volver a mis órdenes</button>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Orden #{detalle.numero}</h1><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ESTILOS_ESTADO[detalle.estado] || 'bg-slate-100 text-slate-700'}`}>{ESTADOS_ORDEN[detalle.estado] || detalle.estado}</span></div><p className="mt-2 text-sm text-slate-600">{detalle.lote?.campo?.nombre} · {detalle.lote?.nombre} · {detalle.aeronave?.matricula} · {formatearFecha(detalle.fechaPrevista)}</p></div>
            {esPiloto && ['PLANIFICADA', 'EN_EJECUCION'].includes(detalle.estado) && <button className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50" disabled={guardando} onClick={() => cambiarEstado(detalle)} type="button">{detalle.estado === 'PLANIFICADA' ? 'Iniciar trabajo' : 'Finalizar trabajo'}</button>}
          </div>
          <div className="mb-5 rounded-xl border border-emerald-100 bg-white p-5 text-sm leading-6 text-slate-700 shadow-sm shadow-emerald-950/5">
            <p><strong>Aplicación:</strong> {detalle.anchoAplicacionMetros} m · {detalle.litrosPorHectarea} L/ha · capacidad {detalle.capacidadUtilLitros} L</p>
            <p className="mt-1"><strong>Productos:</strong> {detalle.productos?.length ? detalle.productos.map((item) => `${item.producto?.nombre}${item.dosisPorHectarea != null ? ` (${item.dosisPorHectarea} ${item.producto?.unidadMedida?.abreviatura || ''}/ha)` : ''}`).join(', ') : 'Sin productos'}</p>
            {detalle.observaciones && <p className="mt-1"><strong>Observaciones:</strong> {detalle.observaciones}</p>}
          </div>
          {plan && <>
            {plan.desactualizado && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">El plan puede estar desactualizado. Consultá con el encargado.</p>}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
              <section className="relative z-0 h-[28rem] overflow-hidden rounded-xl border border-emerald-100 lg:h-[calc(100vh-18rem)] lg:min-h-[30rem]">{plan.lote ? <MapaPlanVuelo plan={plan} viajeSeleccionado={viaje} /> : <p className="p-4">No se puede dibujar el lote.</p>}</section>
              <aside className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5 lg:h-[calc(100vh-18rem)] lg:min-h-[30rem] lg:overflow-y-auto"><PanelPlan onSeleccionarViaje={setViaje} plan={plan} viajeSeleccionado={viaje} /></aside>
            </div>
          </>}
        </> : <>
          <div className="mb-6"><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Mis órdenes</h1><p className="mt-2 text-sm text-slate-500">{esPiloto ? 'Consultá tus vuelos asignados y actualizá su estado.' : 'Consultá tus órdenes y sus planes de vuelo.'}</p></div>
          <DataTable columns={columnas} emptyMessage="Todavía no tenés órdenes asignadas." getRowKey={(orden) => orden.id} loading={cargando} rows={ordenes} />
          <nav aria-label="Paginación" className="mt-5 flex items-center justify-end gap-1">
            <button aria-label="Página anterior" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 disabled:opacity-40" disabled={pagina === 1 || cargando} onClick={() => cambiarPagina(pagina - 1)} type="button">‹</button>
            {pagina > 3 && <><button className="h-9 min-w-9 rounded-lg text-sm text-slate-600 hover:bg-emerald-50" disabled={cargando} onClick={() => cambiarPagina(1)} type="button">1</button>{pagina > 4 && <span className="px-1 text-slate-400">…</span>}</>}
            {Array.from({ length: Math.min(3, pagina) + Number(hayMas) }, (_, i) => Math.max(1, pagina - 2) + i).map((numero) => <button aria-current={numero === pagina ? 'page' : undefined} aria-label={`Página ${numero}`} className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold ${numero === pagina ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-emerald-50'}`} disabled={cargando} key={numero} onClick={() => cambiarPagina(numero)} type="button">{numero}</button>)}
            <button aria-label="Página siguiente" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 disabled:opacity-40" disabled={!hayMas || cargando} onClick={() => cambiarPagina(pagina + 1)} type="button">›</button>
          </nav>
        </>}
      </main>
    </div>
  )
}

export default MisOrdenesPage
