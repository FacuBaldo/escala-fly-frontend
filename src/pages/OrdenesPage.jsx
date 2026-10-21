import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowLeft, Map, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import DataTable from '../components/DataTable'
import DeleteDialog from '../components/DeleteDialog'
import FormDialog from '../components/FormDialog'
import PageHeader from '../components/PageHeader'
import PageLoader from '../components/PageLoader'
import OrdenForm from '../components/ordenes/OrdenForm'
import MapaPlanVuelo from '../components/ordenes/MapaPlanVuelo'
import PanelPlan from '../components/ordenes/PanelPlan'
import { createOrden, deleteOrden, getOrdenes, getPlanDeOrden, regenerarPlan, updateOrden } from '../api/ordenesApi'
import { getLotes } from '../api/lotesApi'
import { getAeronaves } from '../api/aeronavesApi'
import { getProductos } from '../api/productosApi'
import useToast from '../context/useToast'
import getErrorMessage from '../utils/getErrorMessage'
import { formatearSuperficie } from '../utils/lotes'
import { ESTADOS_ORDEN, ESTILOS_ESTADO, formatearDistancia, formatearFecha, formatearLitros } from '../utils/ordenes'

const iconButtonClassName =
  'flex h-9 w-9 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-50'

const selectClassName =
  'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'

function OrdenesPage() {
  const { showToast } = useToast()
  const [ordenes, setOrdenes] = useState([])
  const [lotes, setLotes] = useState([])
  const [aeronaves, setAeronaves] = useState([])
  const [productos, setProductos] = useState([])
  const [estadoFiltro, setEstadoFiltro] = useState('')
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

  // Cada pedido del listado lleva un numero: si se cambia el filtro dos veces
  // rapido, una respuesta lenta no puede pisar a la del filtro mas nuevo.
  const ultimoPedidoRef = useRef(0)

  const loadOrdenes = async (estado = estadoFiltro) => {
    const pedido = ++ultimoPedidoRef.current

    try {
      const data = await getOrdenes(estado ? { estado } : {})

      if (pedido === ultimoPedidoRef.current) {
        setOrdenes(data)
      }
    } catch (requestError) {
      if (pedido === ultimoPedidoRef.current) {
        notificarError(requestError, 'No se pudieron cargar las ordenes.')
      }
    }
  }

  useEffect(() => {
    let isActive = true

    Promise.all([getOrdenes(), getLotes(), getAeronaves(), getProductos()])
      .then(([ordenesData, lotesData, aeronavesData, productosData]) => {
        if (isActive) {
          setOrdenes(ordenesData)
          setLotes(lotesData)
          setAeronaves(aeronavesData)
          setProductos(productosData)
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
  }, [notificarError])

  const abrirPlan = async (orden) => {
    setOrdenDetalle(orden)
    setViajeSeleccionado(null)
    setPlan(null)
    setIsCargandoPlan(true)

    try {
      const data = await getPlanDeOrden(orden.id)
      setPlan(data)
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
      setViajeSeleccionado(null)
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

    try {
      const orden = isEditing ? await updateOrden(editingOrden.id, form) : await createOrden(form)

      setIsDialogOpen(false)
      setEditingOrden(null)
      showToast({
        message: isEditing
          ? `Orden actualizada y ruta regenerada (${orden.planVuelo?.cantidadViajes} viajes).`
          : `Ruta generada en ${orden.planVuelo?.cantidadViajes} viaje(s).`,
        type: 'success',
      })
      await loadOrdenes()
      await abrirPlan(orden)
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

  const handleEstadoFiltroChange = async (event) => {
    const estado = event.target.value
    setEstadoFiltro(estado)
    await loadOrdenes(estado)
  }

  const columns = [
    {
      key: 'numero',
      header: 'Orden',
      cellClassName: 'font-semibold text-slate-950',
      render: (orden) => `#${orden.numero}`,
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
      key: 'aeronave',
      header: 'Aeronave',
      render: (orden) => (
        <span>
          {orden.aeronave?.matricula}
          <span className="block text-xs text-slate-500">{orden.aeronave?.modelo}</span>
        </span>
      ),
    },
    {
      key: 'plan',
      header: 'Ruta',
      render: (orden) =>
        orden.planVuelo ? (
          <span className="text-xs text-slate-600">
            {orden.planVuelo.cantidadViajes} viaje(s) · {formatearLitros(orden.planVuelo.caldoTotalLitros)}
            <span className="block">{formatearDistancia(orden.planVuelo.distanciaTotalMetros)}</span>
          </span>
        ) : (
          <span className="text-slate-400 italic">Sin plan</span>
        ),
    },
    {
      key: 'fechaPrevista',
      header: 'Fecha',
      render: (orden) => <span className="text-xs text-slate-600">{formatearFecha(orden.fechaPrevista)}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (orden) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ESTILOS_ESTADO[orden.estado] || ''}`}>
          {ESTADOS_ORDEN[orden.estado] || orden.estado}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-36 text-center',
      cellClassName: 'text-center',
      render: (orden) => (
        <div className="flex justify-center gap-2">
          <button
            aria-label={`Ver ruta de la orden ${orden.numero}`}
            className={`${iconButtonClassName} bg-emerald-700 text-white hover:bg-emerald-800`}
            onClick={() => abrirPlan(orden)}
            title="Ver ruta en el mapa"
            type="button"
          >
            <Map aria-hidden="true" size={17} />
          </button>
          <button
            aria-label={`Editar orden ${orden.numero}`}
            className={`${iconButtonClassName} bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
            onClick={() => {
              setEditingOrden(orden)
              setIsDialogOpen(true)
            }}
            title="Editar y regenerar ruta"
            type="button"
          >
            <Pencil aria-hidden="true" size={17} />
          </button>
          <button
            aria-label={`Eliminar orden ${orden.numero}`}
            className={`${iconButtonClassName} bg-red-50 text-red-700 hover:bg-red-100`}
            onClick={() => setOrdenEliminar(orden)}
            title="Eliminar orden"
            type="button"
          >
            <Trash2 aria-hidden="true" size={17} />
          </button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <AppLayout>
        <PageLoader message="Cargando ordenes..." />
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
            disabled={lotes.length === 0 || aeronaves.length === 0}
            onClick={() => {
              setEditingOrden(null)
              setIsDialogOpen(true)
            }}
            title={lotes.length === 0 ? 'Primero crea un lote' : undefined}
            type="button"
          >
            <Plus aria-hidden="true" size={18} />
            Nueva orden
          </button>
        }
        subtitle="Genera la ruta de vuelo de cada lote y revisa los viajes calculados."
        title="Ordenes de vuelo"
      />

      <section className="mb-4 flex flex-wrap items-center gap-3">
        <select
          aria-label="Filtrar por estado"
          className={selectClassName}
          onChange={handleEstadoFiltroChange}
          value={estadoFiltro}
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_ORDEN).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>

        <p className="text-sm text-slate-500">
          {ordenes.length} {ordenes.length === 1 ? 'orden' : 'ordenes'}
        </p>
      </section>

      <DataTable
        columns={columns}
        emptyMessage="No hay ordenes de vuelo. Crea la primera para generar una ruta."
        getRowKey={(orden) => orden.id}
        rows={ordenes}
      />

      {isDialogOpen && (
        <FormDialog
          isSaving={isSaving}
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
            aeronaves={aeronaves}
            editingOrden={editingOrden}
            isSaving={isSaving}
            key={editingOrden?.id || 'nueva-orden'}
            lotes={lotes}
            onCancel={() => {
              setIsDialogOpen(false)
              setEditingOrden(null)
            }}
            onSave={handleSave}
            productos={productos}
          />
        </FormDialog>
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
