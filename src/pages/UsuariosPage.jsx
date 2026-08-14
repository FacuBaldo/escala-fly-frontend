import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import DataTable from '../components/DataTable'
import DeleteDialog from '../components/DeleteDialog'
import FormDialog from '../components/FormDialog'
import PageHeader from '../components/PageHeader'
import UsuarioForm from '../components/UsuarioForm'
import { createUsuario, deleteUsuario, getUsuarios, updateUsuario } from '../api/usuariosApi'
import useToast from '../context/useToast'
import getErrorMessage from '../utils/getErrorMessage'

function UsuariosPage() {
  const { showToast } = useToast()
  const [usuarios, setUsuarios] = useState([])
  const [editingUsuario, setEditingUsuario] = useState(null)
  const [deletingUsuario, setDeletingUsuario] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadUsuarios = async () => {
    setIsLoading(true)

    try {
      const data = await getUsuarios()
      setUsuarios(data)
    } catch (requestError) {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({
        message: getErrorMessage(requestError, 'No se pudieron cargar los usuarios.'),
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    getUsuarios()
      .then((data) => {
        if (isActive) {
          setUsuarios(data)
        }
      })
      .catch((requestError) => {
        if (isActive) {
          if (requestError.cierreSesionPorAutenticacion) {
            return
          }

          showToast({
            message: getErrorMessage(requestError, 'No se pudieron cargar los usuarios.'),
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
    const isEditing = Boolean(editingUsuario)

    try {
      if (editingUsuario) {
        await updateUsuario(editingUsuario.id, form)
      } else {
        await createUsuario(form)
      }

      setEditingUsuario(null)
      setIsDialogOpen(false)
      showToast({
        message: isEditing
          ? 'Usuario actualizado correctamente.'
          : 'Usuario creado correctamente.',
        type: 'success',
      })
      await loadUsuarios()
    } catch (requestError) {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({
        message: getErrorMessage(requestError, 'No se pudo guardar el usuario.'),
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingUsuario) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteUsuario(deletingUsuario.id)
      setDeletingUsuario(null)
      showToast({ message: 'Usuario eliminado correctamente.', type: 'success' })
      await loadUsuarios()
    } catch (requestError) {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({
        message: getErrorMessage(requestError, 'No se pudo eliminar el usuario.'),
        type: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const openCreateDialog = () => {
    setEditingUsuario(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (usuario) => {
    setEditingUsuario(usuario)
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (usuario) => {
    setDeletingUsuario(usuario)
  }

  const closeDialog = () => {
    if (isSaving) {
      return
    }

    setIsDialogOpen(false)
    setEditingUsuario(null)
  }

  const closeDeleteDialog = () => {
    if (isDeleting) {
      return
    }

    setDeletingUsuario(null)
  }

  const columns = [
    {
      key: 'name',
      header: 'Nombre',
      cellClassName: 'font-semibold text-slate-950',
      render: (usuario) => `${usuario.nombre} ${usuario.apellido}`,
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-28 text-center',
      cellClassName: 'text-center',
      render: (usuario) => (
        <div className="flex justify-center gap-2">
          <button
            aria-label={`Editar a ${usuario.nombre} ${usuario.apellido}`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100"
            onClick={() => openEditDialog(usuario)}
            title="Editar usuario"
            type="button"
          >
            <Pencil aria-hidden="true" size={17} />
          </button>
          <button
            aria-label={`Eliminar a ${usuario.nombre} ${usuario.apellido}`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-700 transition hover:bg-red-100"
            onClick={() => openDeleteDialog(usuario)}
            title="Eliminar usuario"
            type="button"
          >
            <Trash2 aria-hidden="true" size={17} />
          </button>
        </div>
      ),
    },
  ]

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
            Agregar usuario
          </button>
        }
        subtitle="Administra altas, modificaciones y bajas de usuarios."
        title="Usuarios"
      />

      <DataTable
        columns={columns}
        emptyMessage="No hay usuarios cargados."
        getRowKey={(usuario) => usuario.id}
        isLoading={isLoading}
        loadingMessage="Cargando usuarios..."
        rows={usuarios}
      />

      {isDialogOpen && (
        <FormDialog
          isSaving={isSaving}
          onClose={closeDialog}
          title={editingUsuario ? 'Editar usuario' : 'Agregar usuario'}
        >
          <UsuarioForm
            key={editingUsuario?.id || 'new-usuario'}
            editingUsuario={editingUsuario}
            isSaving={isSaving}
            onCancel={closeDialog}
            onSave={handleSave}
          />
        </FormDialog>
      )}

      {deletingUsuario && (
        <DeleteDialog
          isDeleting={isDeleting}
          message={
            <>
              Estas por eliminar a{' '}
              <span className="font-bold text-slate-950">
                {deletingUsuario.nombre} {deletingUsuario.apellido}
              </span>
              . Esta accion no se puede deshacer.
            </>
          }
          onClose={closeDeleteDialog}
          onConfirm={handleDelete}
          title="Eliminar usuario"
        />
      )}
    </AppLayout>
  )
}

export default UsuariosPage
