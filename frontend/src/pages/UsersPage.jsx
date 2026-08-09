import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import DataTable from '../components/DataTable'
import DeleteDialog from '../components/DeleteDialog'
import FormDialog from '../components/FormDialog'
import PageHeader from '../components/PageHeader'
import UserForm from '../components/UserForm'
import { createUser, deleteUser, getUsers, updateUser } from '../api/usersApi'
import useToast from '../context/useToast'
import getErrorMessage from '../utils/getErrorMessage'

function UsersPage() {
  const { showToast } = useToast()
  const [users, setUsers] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [deletingUser, setDeletingUser] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadUsers = async () => {
    setIsLoading(true)

    try {
      const data = await getUsers()
      setUsers(data)
    } catch (requestError) {
      if (requestError.isAuthLogout) {
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

    getUsers()
      .then((data) => {
        if (isActive) {
          setUsers(data)
        }
      })
      .catch((requestError) => {
        if (isActive) {
          if (requestError.isAuthLogout) {
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
    const isEditing = Boolean(editingUser)

    try {
      if (editingUser) {
        await updateUser(editingUser.id, form)
      } else {
        await createUser(form)
      }

      setEditingUser(null)
      setIsDialogOpen(false)
      showToast({
        message: isEditing
          ? 'Usuario actualizado correctamente.'
          : 'Usuario creado correctamente.',
        type: 'success',
      })
      await loadUsers()
    } catch (requestError) {
      if (requestError.isAuthLogout) {
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
    if (!deletingUser) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteUser(deletingUser.id)
      setDeletingUser(null)
      showToast({ message: 'Usuario eliminado correctamente.', type: 'success' })
      await loadUsers()
    } catch (requestError) {
      if (requestError.isAuthLogout) {
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
    setEditingUser(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (user) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (user) => {
    setDeletingUser(user)
  }

  const closeDialog = () => {
    if (isSaving) {
      return
    }

    setIsDialogOpen(false)
    setEditingUser(null)
  }

  const closeDeleteDialog = () => {
    if (isDeleting) {
      return
    }

    setDeletingUser(null)
  }

  const columns = [
    {
      key: 'name',
      header: 'Nombre',
      cellClassName: 'font-semibold text-slate-950',
      render: (user) => `${user.firstName} ${user.lastName}`,
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
      render: (user) => (
        <div className="flex justify-center gap-2">
          <button
            aria-label={`Editar a ${user.firstName} ${user.lastName}`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100"
            onClick={() => openEditDialog(user)}
            title="Editar usuario"
            type="button"
          >
            <Pencil aria-hidden="true" size={17} />
          </button>
          <button
            aria-label={`Eliminar a ${user.firstName} ${user.lastName}`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-700 transition hover:bg-red-100"
            onClick={() => openDeleteDialog(user)}
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
        getRowKey={(user) => user.id}
        isLoading={isLoading}
        loadingMessage="Cargando usuarios..."
        rows={users}
      />

      {isDialogOpen && (
        <FormDialog
          isSaving={isSaving}
          onClose={closeDialog}
          title={editingUser ? 'Editar usuario' : 'Agregar usuario'}
        >
          <UserForm
            key={editingUser?.id || 'new-user'}
            editingUser={editingUser}
            isSaving={isSaving}
            onCancel={closeDialog}
            onSave={handleSave}
          />
        </FormDialog>
      )}

      {deletingUser && (
        <DeleteDialog
          isDeleting={isDeleting}
          message={
            <>
              Estas por eliminar a{' '}
              <span className="font-bold text-slate-950">
                {deletingUser.firstName} {deletingUser.lastName}
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

export default UsersPage
