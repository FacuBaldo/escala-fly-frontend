import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import DataTable from '../components/DataTable'
import DeleteDialog from '../components/DeleteDialog'
import FormDialog from '../components/FormDialog'
import PageHeader from '../components/PageHeader'
import PageLoader from '../components/PageLoader'
import AeronaveForm from '../components/AeronaveForm'
import { createAeronave, deleteAeronave, getAeronaves, updateAeronave } from '../api/aeronavesApi'
import { getEmpresas } from '../api/empresasApi'
import useToast from '../context/useToast'
import getErrorMessage from '../utils/getErrorMessage'

const estadoBadgeClasses = {
  ACTIVA: 'bg-emerald-50 text-emerald-800',
  EN_MANTENIMIENTO: 'bg-amber-50 text-amber-800',
  INACTIVA: 'bg-slate-100 text-slate-600',
}

const estadoLabels = {
  ACTIVA: 'Activa',
  EN_MANTENIMIENTO: 'En mantenimiento',
  INACTIVA: 'Inactiva',
}

function AeronavesPage() {
  const { showToast } = useToast()
  const [aeronaves, setAeronaves] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [editingAeronave, setEditingAeronave] = useState(null)
  const [deletingAeronave, setDeletingAeronave] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadAeronaves = async () => {
    setIsLoading(true)

    try {
      const data = await getAeronaves()
      setAeronaves(data)
    } catch (requestError) {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({
        message: getErrorMessage(requestError, 'No se pudieron cargar las aeronaves.'),
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    Promise.all([getAeronaves(), getEmpresas()])
      .then(([aeronavesData, empresasData]) => {
        if (isActive) {
          setAeronaves(aeronavesData)
          setEmpresas(empresasData)
        }
      })
      .catch((requestError) => {
        if (isActive) {
          if (requestError.cierreSesionPorAutenticacion) {
            return
          }

          showToast({
            message: getErrorMessage(requestError, 'No se pudieron cargar las aeronaves.'),
            type: 'error',
          })
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
  }, [showToast])

  const handleSave = async (form) => {
    setIsSaving(true)
    const isEditing = Boolean(editingAeronave)

    try {
      if (editingAeronave) {
        await updateAeronave(editingAeronave.id, form)
      } else {
        await createAeronave(form)
      }

      setEditingAeronave(null)
      setIsDialogOpen(false)
      showToast({
        message: isEditing ? 'Aeronave actualizada correctamente.' : 'Aeronave creada correctamente.',
        type: 'success',
      })
      await loadAeronaves()
    } catch (requestError) {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({
        message: getErrorMessage(requestError, 'No se pudo guardar la aeronave.'),
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingAeronave) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteAeronave(deletingAeronave.id)
      setDeletingAeronave(null)
      showToast({ message: 'Aeronave eliminada correctamente.', type: 'success' })
      await loadAeronaves()
    } catch (requestError) {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({
        message: getErrorMessage(requestError, 'No se pudo eliminar la aeronave.'),
        type: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const openCreateDialog = () => {
    setEditingAeronave(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (aeronave) => {
    setEditingAeronave(aeronave)
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (aeronave) => {
    setDeletingAeronave(aeronave)
  }

  const closeDialog = () => {
    if (isSaving) {
      return
    }

    setIsDialogOpen(false)
    setEditingAeronave(null)
  }

  const closeDeleteDialog = () => {
    if (isDeleting) {
      return
    }

    setDeletingAeronave(null)
  }

  const getEmpresaNombre = (empresaId) =>
    empresas.find((empresa) => empresa.id === empresaId)?.nombre

  const columns = [
    {
      key: 'matricula',
      header: 'Matricula',
      cellClassName: 'font-semibold text-slate-950',
    },
    {
      key: 'empresa',
      header: 'Empresa',
      render: (aeronave) =>
        getEmpresaNombre(aeronave.empresaId) || (
          <span className="text-slate-400 italic">Sin empresa</span>
        ),
    },
    {
      key: 'modelo',
      header: 'Modelo',
      render: (aeronave) => (
        <div>
          <div>{aeronave.modelo}</div>
          {aeronave.fabricante && (
            <div className="text-xs text-slate-400">{aeronave.fabricante}</div>
          )}
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (aeronave) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${estadoBadgeClasses[aeronave.estado]}`}
        >
          {estadoLabels[aeronave.estado]}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-28 text-center',
      cellClassName: 'text-center',
      render: (aeronave) => (
        <div className="flex justify-center gap-2">
          <button
            aria-label={`Editar ${aeronave.matricula}`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100"
            onClick={() => openEditDialog(aeronave)}
            title="Editar aeronave"
            type="button"
          >
            <Pencil aria-hidden="true" size={17} />
          </button>
          <button
            aria-label={`Eliminar ${aeronave.matricula}`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-700 transition hover:bg-red-100"
            onClick={() => openDeleteDialog(aeronave)}
            title="Eliminar aeronave"
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
        <PageLoader message="Cargando aeronaves..." />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        action={
          <button
            className="flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={empresas.length === 0}
            onClick={openCreateDialog}
            title={empresas.length === 0 ? 'Primero crea una empresa' : undefined}
            type="button"
          >
            <Plus aria-hidden="true" size={18} />
            Agregar aeronave
          </button>
        }
        subtitle="Administra altas, modificaciones y bajas de aeronaves utilizadas en las operaciones."
        title="Aeronaves"
      />

      <DataTable
        columns={columns}
        emptyMessage="No hay aeronaves cargadas."
        getRowKey={(aeronave) => aeronave.id}
        rows={aeronaves}
      />

      {isDialogOpen && (
        <FormDialog
          isSaving={isSaving}
          onClose={closeDialog}
          title={editingAeronave ? 'Editar aeronave' : 'Agregar aeronave'}
        >
          <AeronaveForm
            key={editingAeronave?.id || 'new-aeronave'}
            editingAeronave={editingAeronave}
            empresas={empresas}
            isSaving={isSaving}
            onCancel={closeDialog}
            onSave={handleSave}
          />
        </FormDialog>
      )}

      {deletingAeronave && (
        <DeleteDialog
          isDeleting={isDeleting}
          message={
            <>
              Estas por eliminar la aeronave{' '}
              <span className="font-bold text-slate-950">{deletingAeronave.matricula}</span>.
              Esta accion no se puede deshacer.
            </>
          }
          onClose={closeDeleteDialog}
          onConfirm={handleDelete}
          title="Eliminar aeronave"
        />
      )}
    </AppLayout>
  )
}

export default AeronavesPage
