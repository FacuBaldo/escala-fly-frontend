import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, Map, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import AppLayout from '../components/compartidos/layout/AppLayout'
import DataTable from '../components/compartidos/tablas/DataTable'
import MenuAcciones from '../components/compartidos/tablas/MenuAcciones'
import DeleteDialog from '../components/compartidos/dialogos/DeleteDialog'
import BaseDialog from '../components/compartidos/dialogos/BaseDialog'
import PageHeader from '../components/compartidos/layout/PageHeader'
import PageLoader from '../components/compartidos/feedback/PageLoader'
import OrdenForm from '../components/ordenes/OrdenForm'
import MapaPlanVuelo from '../components/ordenes/MapaPlanVuelo'
import PanelPlan from '../components/ordenes/PanelPlan'
import BarraFiltros from '../components/compartidos/filtros/BarraFiltros'
import BuscadorFiltro from '../components/compartidos/filtros/BuscadorFiltro'
import SinResultados from '../components/compartidos/feedback/SinResultados'
import { asignarClienteOrden, cambiarEstadoOrden, createOrden, deleteOrden, getOrdenes, getPlanDeOrden, regenerarPlan, updateOrden } from '../api/ordenesApi'
import { getEmpresaById, getEmpresas } from '../api/empresasApi'
import { ROLES } from '../auth/roles'
import useAutenticacion from '../context/useAutenticacion'
import useToast from '../context/useToast'
import useFiltros from '../hooks/useFiltros'
import { ordenarOpciones } from '../utils/filtros'
import getErrorMessage from '../utils/getErrorMessage'
import SelectorEmpresa from '../components/compartidos/formularios/SelectorEmpresa'
import { formatearSuperficie } from '../utils/lotes'
import { ESTADOS_ORDEN, formatearFecha } from '../utils/ordenes'

export function FiltroEmpresa({ valor, onChange, disabled = false }) {
  const [opciones, setOpciones] = useState([])
  const [seleccion, setSeleccion] = useState(null)
  const [page, setPage] = useState(1)
  const [hayMas, setHayMas] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let vigente = true
    const timer = setTimeout(() => getEmpresas({ page, limit: 20 }).then((r) => {
      if (vigente) { setOpciones((previas) => page === 1 ? r.data : [...previas, ...r.data.filter((item) => !previas.some((previo) => previo.id === item.id))]); setHayMas(r.pagination.hasNextPage); setError('') }
    }).catch(() => { if (vigente) setError('No se pudieron cargar las empresas.') }), 250)
    return () => { vigente = false; clearTimeout(timer) }
  }, [page])
  useEffect(() => {
    if (!valor) return undefined
    let vigente = true
    getEmpresaById(valor).then((empresa) => { if (vigente) setSeleccion(empresa) }).catch(() => {})
    return () => { vigente = false }
  }, [valor])
  return (
    <div className="grid min-w-0 gap-1">
      <select aria-label="Filtrar por empresa" className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700 outline-none transition hover:border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50" disabled={disabled} value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todas las empresas</option>
        {seleccion?.id === valor && !opciones.some((item) => item.id === valor) && <option value={seleccion.id}>{seleccion.nombre}</option>}
        {opciones.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
      </select>
      {hayMas && <button className="justify-self-start text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50" disabled={disabled} onClick={() => setPage((p) => p + 1)} type="button">Cargar 20 más</button>}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  )
}

function OrdenesPage() {
  const { usuario } = useAutenticacion()
  const isAdmin = usuario?.rol === ROLES.ADMIN
  const { showToast } = useToast()
  const [empresas, setEmpresas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOrden, setEditingOrden] = useState(null)
  const [ordenEliminar, setOrdenEliminar] = useState(null)

  // Vista de detalle: orden + plan con geometrias
  const [ordenDetalle, setOrdenDetalle] = useState(null)
  const [plan, setPlan] = useState(null)
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null)
  const [isCargandoPlan, setIsCargandoPlan] = useState(false)
  const [isRegenerando, setIsRegenerando] = useState(false)

  const notificarError = useCallback(
    (requestError, fallback) => {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({ message: getErrorMessage(requestError, fallback), type: 'error' })
    },
    [showToast],
  )

  const { filtros, cambiarFiltro, limpiarFiltros, hayFiltros } = useFiltros(isAdmin ? { q: '', empresa: '' } : { q: '' })

  const [datosListado, setDatosListado] = useState([])
  const [paginaListado, setPaginaListado] = useState({ clave: '', pagina: 1 })
  const [haySiguiente, setHaySiguiente] = useState(false)
  const [cargandoListado, setCargandoListado] = useState(true)
  const [primeraCarga, setPrimeraCarga] = useState(true)
  const [versionListado, setVersionListado] = useState(0)
  const claveListado = JSON.stringify([filtros.q, filtros.empresa])
  const pagina = paginaListado.clave === claveListado ? paginaListado.pagina : 1
  const listado = { data: datosListado, page: pagina, hasNextPage: haySiguiente, loading: cargandoListado, recargar: () => setVersionListado((v) => v + 1), setPage: (cambio) => { const siguiente = typeof cambio === 'function' ? cambio(pagina) : cambio; if (siguiente !== pagina) { setCargandoListado(true); setPaginaListado({ clave: claveListado, pagina: siguiente }) } } }
  useEffect(() => {
    let vigente = true
    const timer = setTimeout(() => {
      setCargandoListado(true)
      getOrdenes({ page: pagina, limit: 20, search: filtros.q, empresaId: filtros.empresa || undefined })
        .then((respuesta) => {
          if (!vigente) return
          if (!respuesta.data.length && pagina > 1) { setPaginaListado({ clave: claveListado, pagina: pagina - 1 }); return }
          setDatosListado(respuesta.data)
          setHaySiguiente(respuesta.pagination.hasNextPage)
        })
        .catch((error) => { if (vigente && !error.cierreSesionPorAutenticacion) showToast({ message: getErrorMessage(error, 'No se pudo cargar el listado.'), type: 'error' }) })
        .finally(() => { if (vigente) { setCargandoListado(false); setPrimeraCarga(false) } })
    }, 300)
    return () => { vigente = false; clearTimeout(timer) }
  }, [pagina, claveListado, filtros.q, filtros.empresa, versionListado, showToast])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [pagina, claveListado])
  const ordenesVisibles = listado.data

  const loadOrdenes = async () => {
    listado.recargar()
  }

  useEffect(() => {
    let isActive = true

    Promise.all([isAdmin ? getEmpresas({ page: 1, limit: 20 }).then((respuesta) => respuesta.data) : Promise.resolve([])])
      .then(([empresasData]) => {
        if (isActive) {
          setEmpresas(empresasData)
        }
      })
      .catch((requestError) => {
        if (isActive) {
          notificarError(requestError, 'No se pudieron cargar las ordenes.')
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [isAdmin, notificarError])

  const abrirPlan = async (orden) => {
    setOrdenDetalle(orden)
    setViajeSeleccionado(null)
    setPlan(null)
    setIsCargandoPlan(true)

    try {
      const data = await getPlanDeOrden(orden.id)
      setPlan(data)
      setViajeSeleccionado(data.viajes[0]?.numero ?? null)
    } catch (requestError) {
      notificarError(requestError, 'No se pudo cargar el plan de vuelo.')
      setOrdenDetalle(null)
    } finally {
      setIsCargandoPlan(false)
    }
  }

  const handleRegenerar = async () => {
    if (!ordenDetalle) {
      return
    }

    setIsRegenerando(true)

    try {
      await regenerarPlan(ordenDetalle.id)
      const data = await getPlanDeOrden(ordenDetalle.id)
      setPlan(data)
      setViajeSeleccionado(data.viajes[0]?.numero ?? null)
      showToast({ message: 'Ruta regenerada con los datos actuales del lote.', type: 'success' })
      await loadOrdenes()
    } catch (requestError) {
      notificarError(requestError, 'No se pudo regenerar la ruta.')
    } finally {
      setIsRegenerando(false)
    }
  }

  const handleSave = async (form) => {
    setIsSaving(true)
    const isEditing = Boolean(editingOrden)
    const ordenCerrada = isEditing && ['FINALIZADA', 'CANCELADA'].includes(editingOrden.estado)

    try {
      const orden = ordenCerrada ? await asignarClienteOrden(editingOrden.id, form.clienteId) : isEditing ? await updateOrden(editingOrden.id, form) : await createOrden(form)

      setIsDialogOpen(false)
      setEditingOrden(null)
      showToast({
        message: ordenCerrada ? 'Cliente asignado correctamente.' : isEditing
          ? `Orden actualizada y ruta regenerada (${orden.planVuelo?.cantidadViajes} viajes).`
          : `Ruta generada en ${orden.planVuelo?.cantidadViajes} viaje(s).`,
        type: 'success',
      })
      await loadOrdenes()
      if (!ordenCerrada) await abrirPlan(orden)
    } catch (requestError) {
      notificarError(requestError, 'No se pudo generar la ruta.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEliminar = async () => {
    if (!ordenEliminar) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteOrden(ordenEliminar.id)

      if (ordenDetalle?.id === ordenEliminar.id) {
        setOrdenDetalle(null)
        setPlan(null)
      }

      setOrdenEliminar(null)
      showToast({ message: 'Orden eliminada correctamente.', type: 'success' })
      await loadOrdenes()
    } catch (requestError) {
      notificarError(requestError, 'No se pudo eliminar la orden.')
      setOrdenEliminar(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelar = async (orden) => {
    if (!window.confirm(`¿Cancelar la orden #${orden.numero}?`)) return
    try {
      await cambiarEstadoOrden(orden.id, 'CANCELADA')
      showToast({ message: 'Orden cancelada.', type: 'success' })
      await loadOrdenes()
    } catch (error) {
      notificarError(error, 'No se pudo cancelar la orden.')
    }
  }


  const columns = [
    {
      key: 'numero',
      header: 'Orden',
      cellClassName: 'font-semibold text-slate-950',
      render: (orden) => `#${orden.numero}`,
    },
    {
      key: 'empresa',
      header: 'Empresa',
      render: (orden) => orden.empresa?.nombre || <span className="text-slate-400 italic">Sin empresa</span>,
    },
    {
      key: 'fechaPrevista',
      header: 'Fecha',
      render: (orden) => <span className="text-xs text-slate-600">{formatearFecha(orden.fechaPrevista)}</span>,
    },
    {
      key: 'lote',
      header: 'Lote',
      render: (orden) => (
        <span>
          {orden.lote?.campo?.nombre ? `${orden.lote.campo.nombre} · ` : ''}
          {orden.lote?.nombre}
          <span className="block text-xs text-slate-500">{formatearSuperficie(orden.lote?.superficie)}</span>
        </span>
      ),
    },
    {
      key: 'piloto',
      header: 'Piloto',
      render: (orden) => orden.piloto ? `${orden.piloto.nombre} ${orden.piloto.apellido}` : 'Sin asignar',
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (orden) => orden.cliente ? `${orden.cliente.nombre} ${orden.cliente.apellido}` : 'Sin asignar',
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (orden) => ESTADOS_ORDEN[orden.estado] || orden.estado,
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-36 text-center',
      cellClassName: 'text-center',
      render: (orden) => (
        <MenuAcciones etiqueta={`orden #${orden.numero}`} acciones={[
          { etiqueta: 'Ver ruta', icono: Map, onClick: () => abrirPlan(orden) },
          { etiqueta: 'Editar', icono: Pencil, onClick: () => { setEditingOrden(orden); setIsDialogOpen(true) } },
          ...(!['FINALIZADA', 'CANCELADA'].includes(orden.estado) ? [{ etiqueta: 'Cancelar orden', icono: AlertTriangle, onClick: () => handleCancelar(orden), peligrosa: true }] : []),
          { etiqueta: 'Eliminar', icono: Trash2, onClick: () => setOrdenEliminar(orden), peligrosa: true },
        ]} />
      ),
    },
  ]

  if (isLoading || primeraCarga) {
    return (
      <AppLayout>
        <PageLoader />
      </AppLayout>
    )
  }

  // ---------- Vista de detalle con el mapa del plan ----------
  if (ordenDetalle) {
    return (
      <AppLayout>
        <button
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
          onClick={() => {
            setOrdenDetalle(null)
            setPlan(null)
          }}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Volver a ordenes
        </button>

        <PageHeader
          action={
            <button
              className="flex h-10 items-center gap-2 rounded-md border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isRegenerando || isCargandoPlan}
              onClick={handleRegenerar}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              {isRegenerando ? 'Regenerando...' : 'Regenerar ruta'}
            </button>
          }
          subtitle={`${ordenDetalle.lote?.nombre || ''} · ${ordenDetalle.aeronave?.matricula || ''} · ${
            ordenDetalle.anchoAplicacionMetros
          } m de ancho · ${ordenDetalle.litrosPorHectarea} L/ha · giros de ${ordenDetalle.radioGiroMetros} m`}
          title={`Ruta de la orden #${ordenDetalle.numero}`}
        />

        {isCargandoPlan && <PageLoader message="Calculando vista del plan..." />}

        {!isCargandoPlan && plan && (
          <>
            {plan.desactualizado && (
              <p className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
                <span>
                  {plan.motivoDesactualizado === 'MODELO_ANTERIOR'
                    ? 'Esta ruta se calculo antes de que se tuviera en cuenta el radio de giro del avion, asi que sus distancias quedan cortas. Usa'
                    : 'El lote o sus pistas se modificaron despues de generar esta ruta. Usa'}
                  <span className="font-bold"> Regenerar ruta </span>
                  para actualizarla.
                </span>
              </p>
            )}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
              <section className="relative z-0 h-[28rem] overflow-hidden rounded-lg border border-emerald-100 shadow-sm shadow-emerald-950/5 lg:h-[calc(100vh-18rem)] lg:min-h-[30rem]">
                {plan.lote ? (
                  <MapaPlanVuelo plan={plan} viajeSeleccionado={viajeSeleccionado} />
                ) : (
                  <p className="flex h-full items-center justify-center bg-slate-50 px-6 text-center text-sm text-slate-500">
                    No se puede dibujar el mapa: el lote de esta orden fue dado de baja o perdio sus
                    pistas asignadas. Los datos del plan siguen disponibles en el panel.
                  </p>
                )}
              </section>

              <aside className="overflow-y-auto rounded-lg border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5 lg:h-[calc(100vh-18rem)] lg:min-h-[30rem]">
                <PanelPlan
                  onSeleccionarViaje={setViajeSeleccionado}
                  plan={plan}
                  viajeSeleccionado={viajeSeleccionado}
                />
              </aside>
            </div>
          </>
        )}
      </AppLayout>
    )
  }

  // ---------- Listado de ordenes ----------
  return (
    <AppLayout>
      <PageHeader
        action={
          <button
            className="flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={() => {
              setEditingOrden(null)
              setIsDialogOpen(true)
            }}
            type="button"
          >
            <Plus aria-hidden="true" size={18} />
            Nueva orden
          </button>
        }
        subtitle="Genera la ruta de vuelo de cada lote y revisa los viajes calculados."
        title="Ordenes de vuelo"
      />

      <BarraFiltros hayFiltros={hayFiltros} onLimpiar={() => { setCargandoListado(true); setPaginaListado({ clave: '', pagina: 1 }); limpiarFiltros() }}>
        <BuscadorFiltro
          etiqueta="Buscar ordenes"
          onChange={(valor) => { setCargandoListado(true); setPaginaListado({ clave: '', pagina: 1 }); cambiarFiltro('q', valor) }}
          placeholder="Buscar por número de orden"
          valor={filtros.q}
        />
        {isAdmin && (
          <SelectorEmpresa
            url="/empresas"
            etiqueta="Filtrar por empresa"
            onChange={(valor) => { setCargandoListado(true); setPaginaListado({ clave: '', pagina: 1 }); cambiarFiltro('empresa', valor) }}
            opciones={ordenarOpciones(empresas.map((empresa) => ({ valor: empresa.id, etiqueta: empresa.nombre })))}
            todos="Todas las empresas"
            valor={filtros.empresa}
          />
        )}
      </BarraFiltros>

      <DataTable
        loading={listado.loading}
        columns={columns}
        emptyMessage={
          listado.loading ? 'Cargando...' : <SinResultados
            hayFiltros={hayFiltros}
            mensajeVacio="No hay ordenes de vuelo. Crea la primera para generar una ruta."
            onLimpiar={() => { setCargandoListado(true); setPaginaListado({ clave: '', pagina: 1 }); limpiarFiltros() }}
          />
        }
        getRowKey={(orden) => orden.id}
        rows={ordenesVisibles}
      />
      <nav aria-label="Paginación" className="mt-4 flex items-center justify-end gap-1">
        <button aria-label="Página anterior" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 disabled:opacity-40" disabled={listado.page === 1 || listado.loading} onClick={() => listado.setPage(listado.page - 1)} type="button">‹</button>
        {listado.page > 3 && <><button className="h-9 min-w-9 rounded-lg text-sm text-slate-600 hover:bg-emerald-50" disabled={listado.loading} onClick={() => listado.setPage(1)} type="button">1</button>{listado.page > 4 && <span className="px-1 text-slate-400">…</span>}</>}
        {Array.from({ length: Math.min(3, listado.page) + Number(listado.hasNextPage) }, (_, i) => Math.max(1, listado.page - 2) + i).map((numero) => <button aria-current={numero === listado.page ? 'page' : undefined} aria-label={`Página ${numero}`} className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold ${numero === listado.page ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-emerald-50'}`} disabled={listado.loading} key={numero} onClick={() => listado.setPage(numero)} type="button">{numero}</button>)}
        <button aria-label="Página siguiente" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 disabled:opacity-40" disabled={!listado.hasNextPage || listado.loading} onClick={() => listado.setPage(listado.page + 1)} type="button">›</button>
      </nav>

      {isDialogOpen && (
        <BaseDialog
          isBusy={isSaving}
          maxWidth="max-w-3xl"
          onClose={() => {
            if (!isSaving) {
              setIsDialogOpen(false)
              setEditingOrden(null)
            }
          }}
          title={editingOrden ? `Editar orden #${editingOrden.numero}` : 'Nueva orden de vuelo'}
        >
          <OrdenForm
            editingOrden={editingOrden}
            empresaSesionId={usuario?.empresaId}
            isAdmin={isAdmin}
            isSaving={isSaving}
            key={editingOrden?.id || 'nueva-orden'}
            onCancel={() => {
              setIsDialogOpen(false)
              setEditingOrden(null)
            }}
            onSave={handleSave}
          />
        </BaseDialog>
      )}


      {ordenEliminar && (
        <DeleteDialog
          isDeleting={isDeleting}
          message={
            <>
              Estas por eliminar la orden{' '}
              <span className="font-bold text-slate-950">#{ordenEliminar.numero}</span> y su ruta de
              vuelo con todos los viajes calculados. Esta accion no se puede deshacer.
            </>
          }
          onClose={() => !isDeleting && setOrdenEliminar(null)}
          onConfirm={handleEliminar}
          title="Eliminar orden"
        />
      )}
    </AppLayout>
  )
}

export default OrdenesPage
