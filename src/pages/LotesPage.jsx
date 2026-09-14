import { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, ArchiveRestore, Check, PenTool, Pencil, Plus, Trash2, X } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import DeleteDialog from '../components/DeleteDialog'
import FormDialog from '../components/FormDialog'
import PageHeader from '../components/PageHeader'
import PageLoader from '../components/PageLoader'
import LoteForm from '../components/lotes/LoteForm'
import MapaLotes from '../components/lotes/MapaLotes'
import { getCampos } from '../api/camposApi'
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

const iconButtonClassName =
  'flex h-8 w-8 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-50'

function LotesPage() {
  const { showToast } = useToast()
  const [campos, setCampos] = useState([])
  const [lotes, setLotes] = useState([])
  const [campoFiltro, setCampoFiltro] = useState('')
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

  const loadLotes = async (campoId, { ajustarVista = false } = {}) => {
    try {
      const data = await getLotes(campoId || undefined)
      setLotes(data)

      if (ajustarVista) {
        setVistaVersion((version) => version + 1)
      }
    } catch (requestError) {
      notificarError(requestError, 'No se pudieron cargar los lotes.')
    }
  }

  useEffect(() => {
    let isActive = true

    Promise.all([getCampos(), getLotes()])
      .then(([camposData, lotesData]) => {
        if (isActive) {
          setCampos(camposData)
          setLotes(lotesData)
          setVistaVersion((version) => version + 1)
        }
      })
      .catch((requestError) => {
        if (isActive) {
          notificarError(requestError, 'No se pudieron cargar los lotes.')
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

  const handleCampoFiltroChange = async (event) => {
    const campoId = event.target.value
    setCampoFiltro(campoId)
    setSelectedLoteId(null)
    await loadLotes(campoId, { ajustarVista: true })
  }

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
        : await createLote({ ...form, geometria: geometriaPendiente })

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
      await loadLotes(campoFiltro)
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
      await loadLotes(campoFiltro)
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
      await loadLotes(campoFiltro)
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
      await loadLotes(campoFiltro)
    } catch (requestError) {
      notificarError(requestError, 'No se pudo eliminar el lote.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <PageLoader message="Cargando lotes..." />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        action={
          <button
            className="flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={campos.length === 0 || !isModoVer}
            onClick={iniciarDibujo}
            title={campos.length === 0 ? 'Primero crea un campo' : undefined}
            type="button"
          >
            <Plus aria-hidden="true" size={18} />
            Dibujar lote
          </button>
        }
        subtitle="Dibuja, visualiza y administra los lotes georreferenciados de cada campo."
        title="Lotes"
      />

      <section className="mb-4 flex flex-wrap items-center gap-3">
        <select
          aria-label="Filtrar por campo"
          className={selectClassName}
          disabled={!isModoVer}
          onChange={handleCampoFiltroChange}
          value={campoFiltro}
        >
          <option value="">Todos los campos</option>
          {campos.map((campo) => (
            <option key={campo.id} value={campo.id}>
              {campo.nombre}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por estado"
          className={selectClassName}
          disabled={!isModoVer}
          onChange={handleEstadoFiltroChange}
          value={estadoFiltro}
        >
          <option value={ESTADOS.TODOS}>Todos los estados</option>
          <option value={ESTADOS.ACTIVOS}>Activos</option>
          <option value={ESTADOS.INACTIVOS}>Dados de baja</option>
        </select>

        <p className="text-sm text-slate-500">
          {lotesVisibles.length} {lotesVisibles.length === 1 ? 'lote' : 'lotes'} ·{' '}
          <span className="font-semibold text-slate-700">{formatearSuperficie(superficieActiva)}</span> activas
        </p>
      </section>

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
            vistaVersion={vistaVersion}
          />
        </section>

        <aside className="flex min-h-0 flex-col rounded-lg border border-emerald-100 bg-white shadow-sm shadow-emerald-950/5 lg:h-[calc(100vh-17rem)] lg:min-h-[30rem]">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold uppercase text-emerald-900">
            Lotes
          </h2>

          <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
            {lotesVisibles.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-500">
                No hay lotes cargados. Usa "Dibujar lote" para crear el primero.
              </li>
            )}

            {lotesVisibles.map((lote) => {
              const isSelected = lote.id === selectedLoteId

              return (
                <li
                  className={`px-4 py-3 transition ${isSelected ? 'bg-amber-50' : 'hover:bg-slate-50'}`}
                  key={lote.id}
                >
                  <button
                    className="w-full text-left disabled:cursor-not-allowed"
                    disabled={!isModoVer}
                    onClick={() => setSelectedLoteId(lote.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-950">{lote.nombre}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          lote.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {lote.activo ? 'Activo' : 'De baja'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {lote.campoNombre} · {formatearSuperficie(lote.superficie)}
                    </p>
                    {lote.descripcion && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{lote.descripcion}</p>
                    )}
                  </button>

                  {isSelected && isModoVer && (
                    <div className="mt-3 flex gap-2">
                      <button
                        aria-label={`Editar datos de ${lote.nombre}`}
                        className={`${iconButtonClassName} bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
                        onClick={() => openEditDialog(lote)}
                        title="Editar datos"
                        type="button"
                      >
                        <Pencil aria-hidden="true" size={16} />
                      </button>
                      <button
                        aria-label={`Editar forma de ${lote.nombre}`}
                        className={`${iconButtonClassName} bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
                        onClick={() => iniciarEdicionForma(lote)}
                        title="Editar forma en el mapa"
                        type="button"
                      >
                        <PenTool aria-hidden="true" size={16} />
                      </button>
                      {lote.activo ? (
                        <button
                          aria-label={`Dar de baja ${lote.nombre}`}
                          className={`${iconButtonClassName} bg-amber-50 text-amber-800 hover:bg-amber-100`}
                          onClick={() => setLoteBaja(lote)}
                          title="Dar de baja"
                          type="button"
                        >
                          <Archive aria-hidden="true" size={16} />
                        </button>
                      ) : (
                        <button
                          aria-label={`Reactivar ${lote.nombre}`}
                          className={`${iconButtonClassName} bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
                          disabled={isDeleting}
                          onClick={() => cambiarEstado(lote, true)}
                          title="Reactivar"
                          type="button"
                        >
                          <ArchiveRestore aria-hidden="true" size={16} />
                        </button>
                      )}
                      <button
                        aria-label={`Eliminar ${lote.nombre}`}
                        className={`${iconButtonClassName} bg-red-50 text-red-700 hover:bg-red-100`}
                        onClick={() => setLoteEliminar(lote)}
                        title="Eliminar permanentemente"
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={16} />
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
            campoIdInicial={campoFiltro}
            campos={campos}
            editingLote={editingLote}
            isSaving={isSaving}
            key={editingLote?.id || 'nuevo-lote'}
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
