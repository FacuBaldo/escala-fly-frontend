import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Archive, ArchiveRestore, ArrowLeft, Check, MapPin, PenTool, Pencil, Plus, Trash2, X } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import DeleteDialog from '../components/DeleteDialog'
import FormDialog from '../components/FormDialog'
import PageHeader from '../components/PageHeader'
import PageLoader from '../components/PageLoader'
import LoteForm from '../components/lotes/LoteForm'
import MapaLotes from '../components/lotes/MapaLotes'
import { getCampoById } from '../api/camposApi'
import { cambiarEstadoLote, createLote, deleteLote, getLotes, updateLote } from '../api/lotesApi'
import useToast from '../context/useToast'
import getErrorMessage from '../utils/getErrorMessage'
import { formatearSuperficie } from '../utils/lotes'

const MODOS = {
  VER: 'ver',
  DIBUJAR: 'dibujar',
  EDITAR_FORMA: 'editar-forma',
}

const ESTADOS = {
  TODOS: 'todos',
  ACTIVOS: 'activos',
  INACTIVOS: 'inactivos',
}

const selectClassName =
  'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'

const loteActionClassName =
  'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50'

function LotesPage() {
  const { campoId } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [campo, setCampo] = useState(null)
  const [lotes, setLotes] = useState([])
  const [estadoFiltro, setEstadoFiltro] = useState(ESTADOS.TODOS)
  const [selectedLoteId, setSelectedLoteId] = useState(null)
  const [modo, setModo] = useState(MODOS.VER)
  const [vistaVersion, setVistaVersion] = useState(0)
  const [geometriaPendiente, setGeometriaPendiente] = useState(null)
  const [editingLote, setEditingLote] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loteForma, setLoteForma] = useState(null)
  const [geometriaEditada, setGeometriaEditada] = useState(null)
  const [loteBaja, setLoteBaja] = useState(null)
  const [loteEliminar, setLoteEliminar] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isModoVer = modo === MODOS.VER

  const notificarError = useCallback(
    (requestError, fallback) => {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({ message: getErrorMessage(requestError, fallback), type: 'error' })
    },
    [showToast],
  )

  const loadLotes = async () => {
    try {
      const data = await getLotes(campoId)
      setLotes(data)
    } catch (requestError) {
      notificarError(requestError, 'No se pudieron cargar los lotes.')
    }
  }

  useEffect(() => {
    let isActive = true

    Promise.all([getCampoById(campoId), getLotes(campoId)])
      .then(([campoData, lotesData]) => {
        if (isActive) {
          setCampo(campoData)
          setLotes(lotesData)
          setVistaVersion((version) => version + 1)
        }
      })
      .catch((requestError) => {
        if (!isActive) {
          return
        }

        if (requestError.response?.status === 404) {
          showToast({ message: 'El campo no existe o no tenes acceso.', type: 'error' })
          navigate('/campos', { replace: true })
          return
        }

        notificarError(requestError, 'No se pudieron cargar los lotes.')
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [campoId, navigate, notificarError, showToast])

  const cancelarModo = useCallback(() => {
    setModo(MODOS.VER)
    setLoteForma(null)
    setGeometriaEditada(null)
  }, [])

  useEffect(() => {
    if (isModoVer) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        cancelarModo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [cancelarModo, isModoVer])

  const lotesVisibles = useMemo(() => {
    if (estadoFiltro === ESTADOS.ACTIVOS) {
      return lotes.filter((lote) => lote.activo)
    }

    if (estadoFiltro === ESTADOS.INACTIVOS) {
      return lotes.filter((lote) => !lote.activo)
    }

    return lotes
  }, [estadoFiltro, lotes])

  const superficieActiva = useMemo(
    () => lotesVisibles.filter((lote) => lote.activo).reduce((total, lote) => total + (lote.superficie || 0), 0),
    [lotesVisibles],
  )

  const handleEstadoFiltroChange = (event) => {
    setEstadoFiltro(event.target.value)
    setSelectedLoteId(null)
    setVistaVersion((version) => version + 1)
  }

  const iniciarDibujo = () => {
    setSelectedLoteId(null)
    setModo(MODOS.DIBUJAR)
  }

  const handlePoligonoDibujado = useCallback((geometria) => {
    setModo(MODOS.VER)
    setGeometriaPendiente(geometria)
    setEditingLote(null)
    setIsFormOpen(true)
  }, [])

  const handleGeometriaEditada = useCallback((geometria) => {
    setGeometriaEditada(geometria)
  }, [])

  const openEditDialog = (lote) => {
    setSelectedLoteId(lote.id)
    setEditingLote(lote)
    setGeometriaPendiente(null)
    setIsFormOpen(true)
  }

  const iniciarEdicionForma = (lote) => {
    setSelectedLoteId(lote.id)
    setLoteForma(lote)
    setGeometriaEditada(null)
    setModo(MODOS.EDITAR_FORMA)
  }

  const closeFormDialog = () => {
    if (isSaving) {
      return
    }

    setIsFormOpen(false)
    setEditingLote(null)
    setGeometriaPendiente(null)
  }

  const handleSaveForm = async (form) => {
    setIsSaving(true)
    const isEditing = Boolean(editingLote)

    try {
      const lote = isEditing
        ? await updateLote(editingLote.id, form)
        : await createLote({ ...form, campoId, geometria: geometriaPendiente })

      setIsFormOpen(false)
      setEditingLote(null)
      setGeometriaPendiente(null)
      setSelectedLoteId(lote.id)
      showToast({
        message: isEditing
          ? 'Lote actualizado correctamente.'
          : `Lote creado correctamente (${formatearSuperficie(lote.superficie)}).`,
        type: 'success',
      })
      await loadLotes()
    } catch (requestError) {
      notificarError(requestError, 'No se pudo guardar el lote.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGuardarForma = async () => {
    if (!loteForma || !geometriaEditada) {
      cancelarModo()
      return
    }

    setIsSaving(true)

    try {
      const lote = await updateLote(loteForma.id, { geometria: geometriaEditada })
      cancelarModo()
      showToast({
        message: `Forma del lote actualizada (${formatearSuperficie(lote.superficie)}).`,
        type: 'success',
      })
      await loadLotes()
    } catch (requestError) {
      notificarError(requestError, 'No se pudo actualizar la forma del lote.')
    } finally {
      setIsSaving(false)
    }
  }

  const cambiarEstado = async (lote, activo) => {
    setIsDeleting(true)

    try {
      await cambiarEstadoLote(lote.id, activo)
      setLoteBaja(null)
      showToast({
        message: activo ? 'Lote reactivado correctamente.' : 'Lote dado de baja correctamente.',
        type: 'success',
      })
      await loadLotes()
    } catch (requestError) {
      notificarError(requestError, 'No se pudo cambiar el estado del lote.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEliminar = async () => {
    if (!loteEliminar) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteLote(loteEliminar.id)
      setLoteEliminar(null)
      setSelectedLoteId(null)
      showToast({ message: 'Lote eliminado correctamente.', type: 'success' })
      await loadLotes()
    } catch (requestError) {
      notificarError(requestError, 'No se pudo eliminar el lote.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading || !campo) {
    return (
      <AppLayout>
        <PageLoader message="Cargando lotes del campo..." />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Link
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
        to="/campos"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Volver a campos
      </Link>

      <PageHeader
        action={
          <button
            className="flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!isModoVer}
            onClick={iniciarDibujo}
            type="button"
          >
            <Plus aria-hidden="true" size={18} />
            Dibujar lote
          </button>
        }
        subtitle="Dibuja, visualiza y administra los lotes georreferenciados del campo."
        title={`Lotes de ${campo.nombre}`}
      />

      {!isModoVer && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>
            {modo === MODOS.DIBUJAR
              ? 'Hace clic en el mapa para marcar los vertices del lote. Cerra el poligono haciendo clic en el primer punto.'
              : `Arrastra los vertices para modificar la forma de "${loteForma?.nombre}". Clic derecho sobre un vertice lo elimina.`}
          </p>
          <div className="flex gap-2">
            {modo === MODOS.EDITAR_FORMA && (
              <button
                className="flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSaving || !geometriaEditada}
                onClick={handleGuardarForma}
                type="button"
              >
                <Check aria-hidden="true" size={16} />
                {isSaving ? 'Guardando...' : 'Guardar forma'}
              </button>
            )}
            <button
              className="flex items-center gap-1 rounded-md border border-amber-300 bg-white px-3 py-1.5 font-bold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              onClick={cancelarModo}
              type="button"
            >
              <X aria-hidden="true" size={16} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="relative z-0 h-[28rem] overflow-hidden rounded-lg border border-emerald-100 shadow-sm shadow-emerald-950/5 lg:h-[calc(100vh-17rem)] lg:min-h-[30rem]">
          <MapaLotes
            isDibujando={modo === MODOS.DIBUJAR}
            loteEnEdicion={modo === MODOS.EDITAR_FORMA ? loteForma : null}
            lotes={lotesVisibles}
            onGeometriaEditada={handleGeometriaEditada}
            onPoligonoDibujado={handlePoligonoDibujado}
            onSelectLote={setSelectedLoteId}
            selectedLoteId={selectedLoteId}
            ubicacionCampo={campo.ubicacion}
            vistaVersion={vistaVersion}
          />
        </section>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm shadow-emerald-950/5 lg:h-[calc(100vh-17rem)] lg:min-h-[30rem]">
          <div className="border-b border-slate-100 px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-950">Lotes</h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                {lotesVisibles.length} {lotesVisibles.length === 1 ? 'lote' : 'lotes'}
              </span>
            </div>
            <select
              aria-label="Filtrar por estado"
              className={`${selectClassName} w-full`}
              disabled={!isModoVer}
              onChange={handleEstadoFiltroChange}
              value={estadoFiltro}
            >
              <option value={ESTADOS.TODOS}>Todos los estados</option>
              <option value={ESTADOS.ACTIVOS}>Activos</option>
              <option value={ESTADOS.INACTIVOS}>Dados de baja</option>
            </select>

            <p className="mt-3 text-sm text-slate-500">
              Superficie activa: <span className="font-semibold text-slate-900">{formatearSuperficie(superficieActiva)}</span>
            </p>
          </div>

          <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-3">
            {lotesVisibles.length === 0 && (
              <li className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                {lotes.length === 0
                  ? 'Este campo no tiene lotes. Busca la zona en el mapa y usa "Dibujar lote" para crear el primero.'
                  : 'No hay lotes con este estado.'}
              </li>
            )}

            {lotesVisibles.map((lote) => {
              const isSelected = lote.id === selectedLoteId

              return (
                <li
                  className={`overflow-hidden rounded-lg border bg-white shadow-sm transition ${
                    isSelected ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200 hover:border-emerald-300'
                  }`}
                  key={lote.id}
                >
                  <button
                    aria-pressed={isSelected}
                    className="w-full px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 disabled:cursor-not-allowed"
                    disabled={!isModoVer}
                    onClick={() => setSelectedLoteId(lote.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 break-words text-sm font-bold text-slate-950">{lote.nombre}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          lote.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {lote.activo ? 'Activo' : 'De baja'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-emerald-800">
                      {formatearSuperficie(lote.superficie)}
                    </p>
                    {Number.isFinite(lote.latitud) && Number.isFinite(lote.longitud) && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin aria-hidden="true" className="shrink-0 text-slate-400" size={14} />
                        <span>Lat {lote.latitud.toFixed(5)} · Lon {lote.longitud.toFixed(5)}</span>
                      </p>
                    )}
                    {lote.descripcion && (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{lote.descripcion}</p>
                    )}
                  </button>

                  {isSelected && isModoVer && (
                    <div className="flex flex-wrap gap-1 border-t border-slate-100 px-3 py-2">
                      <button
                        aria-label={`Editar datos de ${lote.nombre}`}
                        className={`${loteActionClassName} bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
                        onClick={() => openEditDialog(lote)}
                        type="button"
                      >
                        <Pencil aria-hidden="true" size={15} />
                        Datos
                      </button>
                      <button
                        aria-label={`Editar forma de ${lote.nombre}`}
                        className={`${loteActionClassName} bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
                        onClick={() => iniciarEdicionForma(lote)}
                        type="button"
                      >
                        <PenTool aria-hidden="true" size={15} />
                        Forma
                      </button>
                      {lote.activo ? (
                        <button
                          aria-label={`Dar de baja ${lote.nombre}`}
                          className={`${loteActionClassName} bg-amber-50 text-amber-800 hover:bg-amber-100`}
                          onClick={() => setLoteBaja(lote)}
                          type="button"
                        >
                          <Archive aria-hidden="true" size={15} />
                          Baja
                        </button>
                      ) : (
                        <button
                          aria-label={`Reactivar ${lote.nombre}`}
                          className={`${loteActionClassName} bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
                          disabled={isDeleting}
                          onClick={() => cambiarEstado(lote, true)}
                          type="button"
                        >
                          <ArchiveRestore aria-hidden="true" size={15} />
                          Reactivar
                        </button>
                      )}
                      <button
                        aria-label={`Eliminar ${lote.nombre}`}
                        className={`${loteActionClassName} ml-auto bg-red-50 text-red-700 hover:bg-red-100`}
                        onClick={() => setLoteEliminar(lote)}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={15} />
                        Eliminar
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </aside>
      </div>

      {isFormOpen && (
        <FormDialog
          isSaving={isSaving}
          onClose={closeFormDialog}
          title={editingLote ? 'Editar lote' : 'Nuevo lote'}
        >
          <LoteForm
            editingLote={editingLote}
            isSaving={isSaving}
            key={editingLote?.id || 'nuevo-lote'}
            nombreCampo={campo.nombre}
            onCancel={closeFormDialog}
            onSave={handleSaveForm}
          />
        </FormDialog>
      )}

      {loteBaja && (
        <DeleteDialog
          confirmLabel="Dar de baja"
          isDeleting={isDeleting}
          loadingLabel="Procesando..."
          message={
            <>
              El lote <span className="font-bold text-slate-950">{loteBaja.nombre}</span> quedara
              inactivo y no estara disponible para planificar vuelos. Podes reactivarlo cuando quieras.
            </>
          }
          onClose={() => !isDeleting && setLoteBaja(null)}
          onConfirm={() => cambiarEstado(loteBaja, false)}
          title="Dar de baja lote"
        />
      )}

      {loteEliminar && (
        <DeleteDialog
          isDeleting={isDeleting}
          message={
            <>
              Estas por eliminar permanentemente el lote{' '}
              <span className="font-bold text-slate-950">{loteEliminar.nombre}</span>. Esta accion no
              se puede deshacer.
            </>
          }
          onClose={() => !isDeleting && setLoteEliminar(null)}
          onConfirm={handleEliminar}
          title="Eliminar lote"
        />
      )}
    </AppLayout>
  )
}

export default LotesPage
