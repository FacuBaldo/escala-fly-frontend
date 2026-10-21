import { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, ArchiveRestore, Check, MapPin, Move, Pencil, Plus, Trash2, X } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import DeleteDialog from '../components/DeleteDialog'
import FormDialog from '../components/FormDialog'
import PageHeader from '../components/PageHeader'
import PageLoader from '../components/PageLoader'
import MapaPistas from '../components/pistas/MapaPistas'
import BuscadorFiltro from '../components/filtros/BuscadorFiltro'
import FiltroSelect from '../components/filtros/FiltroSelect'
import PistaForm from '../components/pistas/PistaForm'
import { cambiarEstadoPista, createPista, deletePista, getPistas, updatePista } from '../api/pistasApi'
import { getEmpresas } from '../api/empresasApi'
import { ROLES } from '../auth/roles'
import useAutenticacion from '../context/useAutenticacion'
import useToast from '../context/useToast'
import useFiltros from '../hooks/useFiltros'
import { coincideBusqueda, ordenarOpciones } from '../utils/filtros'
import getErrorMessage from '../utils/getErrorMessage'

const MODOS = {
  VER: 'ver',
  MARCAR: 'marcar',
  MOVER: 'mover',
}

// Valores del filtro de estado en la direccion (?estado=activas); vacio es "todas"
const ESTADOS = {
  ACTIVAS: 'activas',
  INACTIVAS: 'inactivas',
}

const OPCIONES_ESTADO = [
  { valor: ESTADOS.ACTIVAS, etiqueta: 'Activas' },
  { valor: ESTADOS.INACTIVAS, etiqueta: 'Dadas de baja' },
]

const pistaActionClassName =
  'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50'

const redondear = (valor) => Number(valor.toFixed(6))

function PistasPage() {
  const { usuario } = useAutenticacion()
  const { showToast } = useToast()
  const [pistas, setPistas] = useState([])
  const [empresas, setEmpresas] = useState([])
  const { filtros, cambiarFiltro, limpiarFiltros, hayFiltros } = useFiltros({ q: '', estado: '', empresa: '' })
  const [selectedPistaId, setSelectedPistaId] = useState(null)
  const [modo, setModo] = useState(MODOS.VER)
  const [vistaVersion, setVistaVersion] = useState(0)
  const [ubicacionPendiente, setUbicacionPendiente] = useState(null)
  const [pistaMover, setPistaMover] = useState(null)
  const [ubicacionEditada, setUbicacionEditada] = useState(null)
  const [editingPista, setEditingPista] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pistaBaja, setPistaBaja] = useState(null)
  const [pistaEliminar, setPistaEliminar] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isAdmin = usuario?.rol === ROLES.ADMIN
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

  const loadPistas = async () => {
    try {
      const data = await getPistas()
      setPistas(data)
    } catch (requestError) {
      notificarError(requestError, 'No se pudieron cargar las pistas.')
    }
  }

  useEffect(() => {
    let isActive = true

    Promise.all([getPistas(), getEmpresas()])
      .then(([pistasData, empresasData]) => {
        if (isActive) {
          setPistas(pistasData)
          setEmpresas(empresasData)
          setVistaVersion((version) => version + 1)
        }
      })
      .catch((requestError) => {
        if (isActive) {
          notificarError(requestError, 'No se pudieron cargar las pistas.')
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
    setPistaMover(null)
    setUbicacionEditada(null)
  }, [])

  // Esc cancela el modo marcar o mover, igual que en lotes
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

  const pistasVisibles = useMemo(
    () =>
      pistas.filter(
        (pista) =>
          coincideBusqueda(filtros.q, [pista.nombre, pista.descripcion]) &&
          (filtros.estado !== ESTADOS.ACTIVAS || pista.activo) &&
          (filtros.estado !== ESTADOS.INACTIVAS || !pista.activo) &&
          (!filtros.empresa || pista.empresaId === filtros.empresa),
      ),
    [filtros, pistas],
  )

  // Cambiar estado o empresa reencuadra el mapa; la busqueda no, para que no salte con cada letra
  const handleFiltroQueReencuadra = (clave) => (valor) => {
    cambiarFiltro(clave, valor)
    setSelectedPistaId(null)
    setVistaVersion((version) => version + 1)
  }

  const iniciarMarcado = () => {
    setSelectedPistaId(null)
    setModo(MODOS.MARCAR)
  }

  const handleUbicacionMarcada = useCallback((latitud, longitud) => {
    setModo(MODOS.VER)
    setUbicacionPendiente({ latitud: redondear(latitud), longitud: redondear(longitud) })
    setEditingPista(null)
    setIsFormOpen(true)
  }, [])

  const handleUbicacionEditada = useCallback((latitud, longitud) => {
    setUbicacionEditada({ latitud: redondear(latitud), longitud: redondear(longitud) })
  }, [])

  const openEditDialog = (pista) => {
    setSelectedPistaId(pista.id)
    setEditingPista(pista)
    setUbicacionPendiente(null)
    setIsFormOpen(true)
  }

  const iniciarMovimiento = (pista) => {
    setSelectedPistaId(pista.id)
    setPistaMover(pista)
    setUbicacionEditada(null)
    setModo(MODOS.MOVER)
  }

  const closeFormDialog = () => {
    if (isSaving) {
      return
    }

    setIsFormOpen(false)
    setEditingPista(null)
    setUbicacionPendiente(null)
  }

  const handleSaveForm = async (form) => {
    setIsSaving(true)
    const isEditing = Boolean(editingPista)

    try {
      const pista = isEditing ? await updatePista(editingPista.id, form) : await createPista(form)

      setIsFormOpen(false)
      setEditingPista(null)
      setUbicacionPendiente(null)
      setSelectedPistaId(pista.id)

      // Una pista nueva tiene que quedar a la vista aunque los filtros la escondieran
      if (!isEditing && hayFiltros) {
        limpiarFiltros()
      }
      showToast({
        message: isEditing ? 'Pista actualizada correctamente.' : 'Pista creada correctamente.',
        type: 'success',
      })
      await loadPistas()
    } catch (requestError) {
      notificarError(requestError, 'No se pudo guardar la pista.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGuardarUbicacion = async () => {
    if (!pistaMover || !ubicacionEditada) {
      cancelarModo()
      return
    }

    setIsSaving(true)

    try {
      await updatePista(pistaMover.id, ubicacionEditada)
      cancelarModo()
      showToast({ message: `Ubicacion de "${pistaMover.nombre}" actualizada.`, type: 'success' })
      await loadPistas()
    } catch (requestError) {
      notificarError(requestError, 'No se pudo actualizar la ubicacion de la pista.')
    } finally {
      setIsSaving(false)
    }
  }

  const cambiarEstado = async (pista, activo) => {
    setIsDeleting(true)

    try {
      await cambiarEstadoPista(pista.id, activo)
      setPistaBaja(null)
      showToast({
        message: activo ? 'Pista reactivada correctamente.' : 'Pista dada de baja correctamente.',
        type: 'success',
      })
      await loadPistas()
    } catch (requestError) {
      notificarError(requestError, 'No se pudo cambiar el estado de la pista.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEliminar = async () => {
    if (!pistaEliminar) {
      return
    }

    setIsDeleting(true)

    try {
      await deletePista(pistaEliminar.id)
      setPistaEliminar(null)
      setSelectedPistaId(null)
      showToast({ message: 'Pista eliminada correctamente.', type: 'success' })
      await loadPistas()
    } catch (requestError) {
      // El backend responde 409 cuando la pista esta asignada a algun lote
      notificarError(requestError, 'No se pudo eliminar la pista.')
      setPistaEliminar(null)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <PageLoader message="Cargando pistas..." />
      </AppLayout>
    )
  }

  const cantidadActivas = pistasVisibles.filter((pista) => pista.activo).length

  return (
    <AppLayout>
      <PageHeader
        action={
          <button
            className="flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!isModoVer || (isAdmin && empresas.length === 0)}
            onClick={iniciarMarcado}
            title={isAdmin && empresas.length === 0 ? 'Primero crea una empresa' : undefined}
            type="button"
          >
            <Plus aria-hidden="true" size={18} />
            Marcar pista
          </button>
        }
        subtitle="Pistas de despegue y de carga desde donde operan las aeronaves."
        title="Pistas"
      />

      {!isModoVer && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>
            {modo === MODOS.MARCAR
              ? 'Hace clic en el mapa donde esta la pista. Si no encontras la zona, usa el buscador del mapa.'
              : `Arrastra el marcador de "${pistaMover?.nombre}" hasta su nueva ubicacion.`}
          </p>
          <div className="flex gap-2">
            {modo === MODOS.MOVER && (
              <button
                className="flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSaving || !ubicacionEditada}
                onClick={handleGuardarUbicacion}
                type="button"
              >
                <Check aria-hidden="true" size={16} />
                {isSaving ? 'Guardando...' : 'Guardar ubicacion'}
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
          <MapaPistas
            isMarcando={modo === MODOS.MARCAR}
            onSelectPista={setSelectedPistaId}
            onUbicacionEditada={handleUbicacionEditada}
            onUbicacionMarcada={handleUbicacionMarcada}
            pistaEnEdicion={modo === MODOS.MOVER ? pistaMover : null}
            pistas={pistasVisibles}
            selectedPistaId={selectedPistaId}
            vistaVersion={vistaVersion}
          />
        </section>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm shadow-emerald-950/5 lg:h-[calc(100vh-17rem)] lg:min-h-[30rem]">
          <div className="border-b border-slate-100 px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-950">Pistas</h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                {pistasVisibles.length} {pistasVisibles.length === 1 ? 'pista' : 'pistas'}
              </span>
            </div>
            <div className="grid gap-2">
              <BuscadorFiltro
                disabled={!isModoVer}
                etiqueta="Buscar pistas"
                onChange={(valor) => cambiarFiltro('q', valor)}
                placeholder="Buscar por nombre"
                valor={filtros.q}
              />
              <FiltroSelect
                className="w-full"
                disabled={!isModoVer}
                etiqueta="Filtrar por estado"
                onChange={handleFiltroQueReencuadra('estado')}
                opciones={OPCIONES_ESTADO}
                todos="Todos los estados"
                valor={filtros.estado}
              />
              {isAdmin && (
                <FiltroSelect
                  className="w-full"
                  disabled={!isModoVer}
                  etiqueta="Filtrar por empresa"
                  onChange={handleFiltroQueReencuadra('empresa')}
                  opciones={ordenarOpciones(empresas.map((empresa) => ({ valor: empresa.id, etiqueta: empresa.nombre })))}
                  todos="Todas las empresas"
                  valor={filtros.empresa}
                />
              )}
            </div>

            <p className="mt-3 text-sm text-slate-500">
              Activas: <span className="font-semibold text-slate-900">{cantidadActivas}</span>
            </p>
          </div>

          <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-3">
            {pistasVisibles.length === 0 && (
              <li className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                {pistas.length === 0 ? (
                  'Todavia no hay pistas. Busca la zona en el mapa y usa "Marcar pista" para cargar la primera.'
                ) : (
                  <>
                    No hay pistas con estos filtros.{' '}
                    <button className="font-bold text-emerald-800 hover:underline" onClick={limpiarFiltros} type="button">
                      Limpiar filtros
                    </button>
                  </>
                )}
              </li>
            )}

            {pistasVisibles.map((pista) => {
              const isSelected = pista.id === selectedPistaId

              return (
                <li
                  className={`overflow-hidden rounded-lg border bg-white shadow-sm transition ${
                    isSelected ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200 hover:border-emerald-300'
                  }`}
                  key={pista.id}
                >
                  <button
                    aria-pressed={isSelected}
                    className="w-full px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 disabled:cursor-not-allowed"
                    disabled={!isModoVer}
                    onClick={() => setSelectedPistaId(pista.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 break-words text-sm font-bold text-slate-950">{pista.nombre}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          pista.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {pista.activo ? 'Activa' : 'De baja'}
                      </span>
                    </div>
                    {isAdmin && pista.empresaNombre && (
                      <p className="mt-1 text-xs font-semibold text-emerald-800">{pista.empresaNombre}</p>
                    )}
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin aria-hidden="true" className="shrink-0 text-slate-400" size={14} />
                      <span>
                        Lat {Number(pista.latitud).toFixed(5)} · Lon {Number(pista.longitud).toFixed(5)}
                      </span>
                    </p>
                    {pista.descripcion && (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{pista.descripcion}</p>
                    )}
                  </button>

                  {isSelected && isModoVer && (
                    <div className="flex flex-wrap gap-1 border-t border-slate-100 px-3 py-2">
                      <button
                        aria-label={`Editar datos de ${pista.nombre}`}
                        className={`${pistaActionClassName} bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
                        onClick={() => openEditDialog(pista)}
                        type="button"
                      >
                        <Pencil aria-hidden="true" size={15} />
                        Datos
                      </button>
                      <button
                        aria-label={`Mover ${pista.nombre}`}
                        className={`${pistaActionClassName} bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
                        onClick={() => iniciarMovimiento(pista)}
                        type="button"
                      >
                        <Move aria-hidden="true" size={15} />
                        Mover
                      </button>
                      {pista.activo ? (
                        <button
                          aria-label={`Dar de baja ${pista.nombre}`}
                          className={`${pistaActionClassName} bg-amber-50 text-amber-800 hover:bg-amber-100`}
                          onClick={() => setPistaBaja(pista)}
                          type="button"
                        >
                          <Archive aria-hidden="true" size={15} />
                          Baja
                        </button>
                      ) : (
                        <button
                          aria-label={`Reactivar ${pista.nombre}`}
                          className={`${pistaActionClassName} bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
                          disabled={isDeleting}
                          onClick={() => cambiarEstado(pista, true)}
                          type="button"
                        >
                          <ArchiveRestore aria-hidden="true" size={15} />
                          Reactivar
                        </button>
                      )}
                      <button
                        aria-label={`Eliminar ${pista.nombre}`}
                        className={`${pistaActionClassName} ml-auto bg-red-50 text-red-700 hover:bg-red-100`}
                        onClick={() => setPistaEliminar(pista)}
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
          title={editingPista ? 'Editar pista' : 'Nueva pista'}
        >
          <PistaForm
            editingPista={editingPista}
            empresas={empresas}
            isSaving={isSaving}
            key={editingPista?.id || 'nueva-pista'}
            onCancel={closeFormDialog}
            onSave={handleSaveForm}
            showEmpresa={isAdmin}
            ubicacionInicial={ubicacionPendiente}
          />
        </FormDialog>
      )}

      {pistaBaja && (
        <DeleteDialog
          confirmLabel="Dar de baja"
          isDeleting={isDeleting}
          loadingLabel="Procesando..."
          message={
            <>
              La pista <span className="font-bold text-slate-950">{pistaBaja.nombre}</span> quedara
              inactiva y no se podra usar para planificar nuevos vuelos. Podes reactivarla cuando quieras.
            </>
          }
          onClose={() => !isDeleting && setPistaBaja(null)}
          onConfirm={() => cambiarEstado(pistaBaja, false)}
          title="Dar de baja pista"
        />
      )}

      {pistaEliminar && (
        <DeleteDialog
          isDeleting={isDeleting}
          message={
            <>
              Estas por eliminar la pista{' '}
              <span className="font-bold text-slate-950">{pistaEliminar.nombre}</span>. Si algun lote
              la tiene asignada, el sistema no va a permitir eliminarla y conviene darla de baja. Esta
              accion no se puede deshacer.
            </>
          }
          onClose={() => !isDeleting && setPistaEliminar(null)}
          onConfirm={handleEliminar}
          title="Eliminar pista"
        />
      )}
    </AppLayout>
  )
}

export default PistasPage
