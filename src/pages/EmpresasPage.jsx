import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import DataTable from '../components/DataTable'
import DeleteDialog from '../components/DeleteDialog'
import FormDialog from '../components/FormDialog'
import PageHeader from '../components/PageHeader'
import PageLoader from '../components/PageLoader'
import EmpresaForm from '../components/EmpresaForm'
import { createEmpresa, deleteEmpresa, getEmpresas, updateEmpresa } from '../api/empresasApi'
import useToast from '../context/useToast'
import getErrorMessage from '../utils/getErrorMessage'

function EmpresasPage() {
  const { showToast } = useToast()
  const [empresas, setEmpresas] = useState([])
  const [editingEmpresa, setEditingEmpresa] = useState(null)
  const [deletingEmpresa, setDeletingEmpresa] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadEmpresas = async () => {
    setIsLoading(true)

    try {
      const data = await getEmpresas()
      setEmpresas(data)
    } catch (requestError) {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({
        message: getErrorMessage(requestError, 'No se pudieron cargar las empresas.'),
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    getEmpresas()
      .then((data) => {
        if (isActive) {
          setEmpresas(data)
        }
      })
      .catch((requestError) => {
        if (isActive) {
          if (requestError.cierreSesionPorAutenticacion) {
            return
          }

          showToast({
            message: getErrorMessage(requestError, 'No se pudieron cargar las empresas.'),
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
    const isEditing = Boolean(editingEmpresa)

    try {
      if (editingEmpresa) {
        await updateEmpresa(editingEmpresa.id, form)
      } else {
        await createEmpresa(form)
      }

      setEditingEmpresa(null)
      setIsDialogOpen(false)
      showToast({
        message: isEditing
          ? 'Empresa actualizada correctamente.'
          : 'Empresa creada correctamente.',
        type: 'success',
      })
      await loadEmpresas()
    } catch (requestError) {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({
        message: getErrorMessage(requestError, 'No se pudo guardar la empresa.'),
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingEmpresa) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteEmpresa(deletingEmpresa.id)
      setDeletingEmpresa(null)
      showToast({ message: 'Empresa eliminada correctamente.', type: 'success' })
      await loadEmpresas()
    } catch (requestError) {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({
        message: getErrorMessage(requestError, 'No se pudo eliminar la empresa.'),
        type: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const openCreateDialog = () => {
    setEditingEmpresa(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (empresa) => {
    setEditingEmpresa(empresa)
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (empresa) => {
    setDeletingEmpresa(empresa)
  }

  const closeDialog = () => {
    if (isSaving) {
      return
    }

    setIsDialogOpen(false)
    setEditingEmpresa(null)
  }

  const closeDeleteDialog = () => {
    if (isDeleting) {
      return
    }

    setDeletingEmpresa(null)
  }

  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      cellClassName: 'font-semibold text-slate-950',
    },
    {
      key: 'email',
      header: 'Email',
      render: (empresa) => empresa.email || <span className="text-slate-400 italic">No especificado</span>,
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      render: (empresa) => empresa.telefono || <span className="text-slate-400 italic">No especificado</span>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-28 text-center',
      cellClassName: 'text-center',
      render: (empresa) => (
        <div className="flex justify-center gap-2">
          <button
            aria-label={`Editar a ${empresa.nombre}`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100"
            onClick={() => openEditDialog(empresa)}
            title="Editar empresa"
            type="button"
          >
            <Pencil aria-hidden="true" size={17} />
          </button>
          <button
            aria-label={`Eliminar a ${empresa.nombre}`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-700 transition hover:bg-red-100"
            onClick={() => openDeleteDialog(empresa)}
            title="Eliminar empresa"
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
        <PageLoader message="Cargando empresas..." />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        action={
          <button
            className="flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800"
            onClick={openCreateDialog}
            type="button"
          >
            <Plus aria-hidden="true" size={18} />
            Agregar empresa
          </button>
        }
        subtitle="Administra altas, modificaciones y bajas de empresas."
        title="Empresas"
      />

      <DataTable
        columns={columns}
        emptyMessage="No hay empresas cargadas."
        getRowKey={(empresa) => empresa.id}
        rows={empresas}
      />

      {isDialogOpen && (
        <FormDialog
          isSaving={isSaving}
          onClose={closeDialog}
          title={editingEmpresa ? 'Editar empresa' : 'Agregar empresa'}
        >
          <EmpresaForm
            key={editingEmpresa?.id || 'new-empresa'}
            editingEmpresa={editingEmpresa}
            isSaving={isSaving}
            onCancel={closeDialog}
            onSave={handleSave}
          />
        </FormDialog>
      )}

      {deletingEmpresa && (
        <DeleteDialog
          isDeleting={isDeleting}
          message={
            <>
              Estas por eliminar a la empresa{' '}
              <span className="font-bold text-slate-950">
                {deletingEmpresa.nombre}
              </span>
              . Esta accion no se puede deshacer.
            </>
          }
          onClose={closeDeleteDialog}
          onConfirm={handleDelete}
          title="Eliminar empresa"
        />
      )}
    </AppLayout>
  )
}

export default EmpresasPage
