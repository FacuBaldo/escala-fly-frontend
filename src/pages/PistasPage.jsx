import { useCallback, useEffect, useState } from 'react'
import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import DataTable from '../components/DataTable'
import DeleteDialog from '../components/DeleteDialog'
import FormDialog from '../components/FormDialog'
import PageHeader from '../components/PageHeader'
import PageLoader from '../components/PageLoader'
import PistaForm from '../components/pistas/PistaForm'
import { cambiarEstadoPista, createPista, deletePista, getPistas, updatePista } from '../api/pistasApi'
import { getEmpresas } from '../api/empresasApi'
import { ROLES } from '../auth/roles'
import useAutenticacion from '../context/useAutenticacion'
import useToast from '../context/useToast'
import getErrorMessage from '../utils/getErrorMessage'

const iconButtonClassName =
  'flex h-9 w-9 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-50'

function PistasPage() {
  const { usuario } = useAutenticacion()
  const { showToast } = useToast()
  const [pistas, setPistas] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [editingPista, setEditingPista] = useState(null)
  const [pistaBaja, setPistaBaja] = useState(null)
  const [deletingPista, setDeletingPista] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isAdmin = usuario?.rol === ROLES.ADMIN

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

  const handleSave = async (form) => {
    setIsSaving(true)
    const isEditing = Boolean(editingPista)

    try {
      if (isEditing) {
        await updatePista(editingPista.id, form)
      } else {
        await createPista(form)
      }

      setIsDialogOpen(false)
      setEditingPista(null)
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

  const handleDelete = async () => {
    if (!deletingPista) {
      return
    }

    setIsDeleting(true)

    try {
      await deletePista(deletingPista.id)
      setDeletingPista(null)
      showToast({ message: 'Pista eliminada correctamente.', type: 'success' })
      await loadPistas()
    } catch (requestError) {
      // El backend responde 409 cuando la pista esta asignada a algun lote
      notificarError(requestError, 'No se pudo eliminar la pista.')
      setDeletingPista(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const openCreateDialog = () => {
    setEditingPista(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (pista) => {
    setEditingPista(pista)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    if (isSaving) {
      return
    }

    setIsDialogOpen(false)
    setEditingPista(null)
  }

  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      cellClassName: 'font-semibold text-slate-950',
    },
    ...(isAdmin
      ? [
          {
            key: 'empresaNombre',
            header: 'Empresa',
            render: (pista) => pista.empresaNombre || <span className="text-slate-400 italic">Sin empresa</span>,
          },
        ]
      : []),
    {
      key: 'ubicacion',
      header: 'Ubicacion',
      render: (pista) => (
        <span className="font-mono text-xs text-slate-600">
          {Number(pista.latitud).toFixed(5)}, {Number(pista.longitud).toFixed(5)}
        </span>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripcion',
      render: (pista) => pista.descripcion || <span className="text-slate-400 italic">Sin descripcion</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (pista) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            pista.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {pista.activo ? 'Activa' : 'De baja'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-36 text-center',
      cellClassName: 'text-center',
      render: (pista) => (
        <div className="flex justify-center gap-2">
          <button
            aria-label={`Editar ${pista.nombre}`}
            className={`${iconButtonClassName} bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
            onClick={() => openEditDialog(pista)}
            title="Editar pista"
            type="button"
          >
            <Pencil aria-hidden="true" size={17} />
          </button>
          {pista.activo ? (
            <button
              aria-label={`Dar de baja ${pista.nombre}`}
              className={`${iconButtonClassName} bg-amber-50 text-amber-800 hover:bg-amber-100`}
              onClick={() => setPistaBaja(pista)}
              title="Dar de baja"
              type="button"
            >
              <Archive aria-hidden="true" size={17} />
            </button>
          ) : (
            <button
              aria-label={`Reactivar ${pista.nombre}`}
              className={`${iconButtonClassName} bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
              disabled={isDeleting}
              onClick={() => cambiarEstado(pista, true)}
              title="Reactivar"
              type="button"
            >
              <ArchiveRestore aria-hidden="true" size={17} />
            </button>
          )}
          <button
            aria-label={`Eliminar ${pista.nombre}`}
            className={`${iconButtonClassName} bg-red-50 text-red-700 hover:bg-red-100`}
            onClick={() => setDeletingPista(pista)}
            title="Eliminar pista"
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
        <PageLoader message="Cargando pistas..." />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        action={
          <button
            className="flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isAdmin && empresas.length === 0}
            onClick={openCreateDialog}
            type="button"
          >
            <Plus aria-hidden="true" size={18} />
            Agregar pista
          </button>
        }
        subtitle="Pistas de despegue y de carga desde donde operan las aeronaves."
        title="Pistas"
      />

      <DataTable
        columns={columns}
        emptyMessage="No hay pistas cargadas. Agrega la primera para poder planificar vuelos."
        getRowKey={(pista) => pista.id}
        rows={pistas}
      />

      {isDialogOpen && (
        <FormDialog
          isSaving={isSaving}
          onClose={closeDialog}
          title={editingPista ? 'Editar pista' : 'Agregar pista'}
        >
          <PistaForm
            editingPista={editingPista}
            empresas={empresas}
            isSaving={isSaving}
            key={editingPista?.id || 'nueva-pista'}
            onCancel={closeDialog}
            onSave={handleSave}
            showEmpresa={isAdmin}
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

      {deletingPista && (
        <DeleteDialog
          isDeleting={isDeleting}
          message={
            <>
              Estas por eliminar la pista{' '}
              <span className="font-bold text-slate-950">{deletingPista.nombre}</span>. Si algun lote
              la tiene asignada, el sistema no va a permitir eliminarla y conviene darla de baja. Esta
              accion no se puede deshacer.
            </>
          }
          onClose={() => !isDeleting && setDeletingPista(null)}
          onConfirm={handleDelete}
          title="Eliminar pista"
        />
      )}
    </AppLayout>
  )
}

export default PistasPage
