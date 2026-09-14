import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import DataTable from '../components/DataTable'
import DeleteDialog from '../components/DeleteDialog'
import FormDialog from '../components/FormDialog'
import PageHeader from '../components/PageHeader'
import PageLoader from '../components/PageLoader'
import CampoForm from '../components/CampoForm'
import { createCampo, deleteCampo, getCampos, updateCampo } from '../api/camposApi'
import { getEmpresas } from '../api/empresasApi'
import { ROLES } from '../auth/roles'
import useAutenticacion from '../context/useAutenticacion'
import useToast from '../context/useToast'
import getErrorMessage from '../utils/getErrorMessage'

function CamposPage() {
  const { usuario } = useAutenticacion()
  const { showToast } = useToast()
  const [campos, setCampos] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [editingCampo, setEditingCampo] = useState(null)
  const [deletingCampo, setDeletingCampo] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadCampos = async () => {
    setIsLoading(true)

    try {
      const data = await getCampos()
      setCampos(data)
    } catch (requestError) {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({
        message: getErrorMessage(requestError, 'No se pudieron cargar los campos.'),
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    Promise.all([getCampos(), getEmpresas()])
      .then(([camposData, empresasData]) => {
        if (isActive) {
          setCampos(camposData)
          setEmpresas(empresasData)
        }
      })
      .catch((requestError) => {
        if (isActive) {
          if (requestError.cierreSesionPorAutenticacion) {
            return
          }

          showToast({
            message: getErrorMessage(requestError, 'No se pudieron cargar los campos.'),
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
    const isEditing = Boolean(editingCampo)

    try {
      if (editingCampo) {
        await updateCampo(editingCampo.id, form)
      } else {
        await createCampo(form)
      }

      setEditingCampo(null)
      setIsDialogOpen(false)
      showToast({
        message: isEditing ? 'Campo actualizado correctamente.' : 'Campo creado correctamente.',
        type: 'success',
      })
      await loadCampos()
    } catch (requestError) {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({
        message: getErrorMessage(requestError, 'No se pudo guardar el campo.'),
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCampo) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteCampo(deletingCampo.id)
      setDeletingCampo(null)
      showToast({ message: 'Campo eliminado correctamente.', type: 'success' })
      await loadCampos()
    } catch (requestError) {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({
        message: getErrorMessage(requestError, 'No se pudo eliminar el campo.'),
        type: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const openCreateDialog = () => {
    setEditingCampo(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (campo) => {
    setEditingCampo(campo)
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (campo) => {
    setDeletingCampo(campo)
  }

  const closeDialog = () => {
    if (isSaving) {
      return
    }

    setIsDialogOpen(false)
    setEditingCampo(null)
  }

  const closeDeleteDialog = () => {
    if (isDeleting) {
      return
    }

    setDeletingCampo(null)
  }

  const getEmpresaNombre = (empresaId) =>
    empresas.find((empresa) => empresa.id === empresaId)?.nombre
  const isAdmin = usuario?.rol === ROLES.ADMIN

  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      cellClassName: 'font-semibold text-slate-950',
      render: (campo) => (
        <Link className="transition hover:text-emerald-800 hover:underline" to={`/campos/${campo.id}/lotes`}>
          {campo.nombre}
        </Link>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: 'empresa',
            header: 'Empresa',
            render: (campo) =>
              getEmpresaNombre(campo.empresaId) || (
                <span className="text-slate-400 italic">Sin empresa</span>
              ),
          },
        ]
      : []),
    {
      key: 'ubicacion',
      header: 'Ubicacion',
      render: (campo) => campo.ubicacion || <span className="text-slate-400 italic">No especificada</span>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-40 text-center',
      cellClassName: 'text-center',
      render: (campo) => (
        <div className="flex justify-center gap-2">
          <Link
            aria-label={`Ver lotes de ${campo.nombre}`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-700 text-white transition hover:bg-emerald-800"
            title="Ver y crear lotes"
            to={`/campos/${campo.id}/lotes`}
          >
            <Layers aria-hidden="true" size={17} />
          </Link>
          <button
            aria-label={`Editar ${campo.nombre}`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100"
            onClick={() => openEditDialog(campo)}
            title="Editar campo"
            type="button"
          >
            <Pencil aria-hidden="true" size={17} />
          </button>
          <button
            aria-label={`Eliminar ${campo.nombre}`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-700 transition hover:bg-red-100"
            onClick={() => openDeleteDialog(campo)}
            title="Eliminar campo"
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
        <PageLoader message="Cargando campos..." />
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
            Agregar campo
          </button>
        }
        subtitle="Administra altas, modificaciones y bajas de campos agricolas por empresa."
        title="Campos"
      />

      <DataTable
        columns={columns}
        emptyMessage="No hay campos cargados."
        getRowKey={(campo) => campo.id}
        rows={campos}
      />

      {isDialogOpen && (
        <FormDialog
          isSaving={isSaving}
          onClose={closeDialog}
          title={editingCampo ? 'Editar campo' : 'Agregar campo'}
        >
          <CampoForm
            key={editingCampo?.id || 'new-campo'}
            editingCampo={editingCampo}
            empresas={empresas}
            isSaving={isSaving}
            onCancel={closeDialog}
            onSave={handleSave}
            showEmpresa={isAdmin}
          />
        </FormDialog>
      )}

      {deletingCampo && (
        <DeleteDialog
          isDeleting={isDeleting}
          message={
            <>
              Estas por eliminar el campo{' '}
              <span className="font-bold text-slate-950">{deletingCampo.nombre}</span>. Esta
              accion no se puede deshacer.
            </>
          }
          onClose={closeDeleteDialog}
          onConfirm={handleDelete}
          title="Eliminar campo"
        />
      )}
    </AppLayout>
  )
}

export default CamposPage
