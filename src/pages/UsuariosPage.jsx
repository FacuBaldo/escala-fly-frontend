import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import DataTable from '../components/DataTable'
import MenuAcciones from '../components/MenuAcciones'
import DeleteDialog from '../components/DeleteDialog'
import FormDialog from '../components/FormDialog'
import PageHeader from '../components/PageHeader'
import PageLoader from '../components/PageLoader'
import BarraFiltros from '../components/filtros/BarraFiltros'
import BuscadorFiltro from '../components/filtros/BuscadorFiltro'
import FiltroSelect from '../components/filtros/FiltroSelect'
import SinResultados from '../components/filtros/SinResultados'
import UsuarioForm from '../components/UsuarioForm'
import { getEmpresas } from '../api/empresasApi'
import { createUsuario, deleteUsuario, getUsuarios, updateUsuario } from '../api/usuariosApi'
import { ROLES } from '../auth/roles'
import useAutenticacion from '../context/useAutenticacion'
import useToast from '../context/useToast'
import useFiltros from '../hooks/useFiltros'
import { coincideBusqueda, ordenarOpciones } from '../utils/filtros'
import getErrorMessage from '../utils/getErrorMessage'

const ROLES_GESTIONABLES_POR_ENCARGADO = [ROLES.PILOTO, ROLES.CLIENTE]

function UsuariosPage() {
  const { usuario } = useAutenticacion()
  const { showToast } = useToast()
  const [usuarios, setUsuarios] = useState([])
  const [empresas, setEmpresas] = useState([])
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

    Promise.allSettled([getUsuarios(), getEmpresas()])
      .then(([usuariosRes, empresasRes]) => {
        if (!isActive) {
          return
        }

        if (usuariosRes.status === 'fulfilled') {
          setUsuarios(usuariosRes.value)
        } else if (!usuariosRes.reason?.cierreSesionPorAutenticacion) {
          showToast({
            message: getErrorMessage(usuariosRes.reason, 'No se pudieron cargar los usuarios.'),
            type: 'error',
          })
        }

        if (empresasRes.status === 'fulfilled') {
          setEmpresas(empresasRes.value)
        } else if (!empresasRes.reason?.cierreSesionPorAutenticacion) {
          showToast({
            message: getErrorMessage(empresasRes.reason, 'No se pudieron cargar las empresas.'),
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

  const getEmpresaNombre = (empresaId) =>
    empresas.find((empresa) => empresa.id === empresaId)?.nombre

  const getRolLabel = (rol) =>
    ({ ADMIN: 'Admin', ENCARGADO: 'Encargado', PILOTO: 'Piloto', CLIENTE: 'Cliente' })[rol] || rol
  const isAdmin = usuario?.rol === ROLES.ADMIN

  const { filtros, cambiarFiltro, limpiarFiltros, hayFiltros } = useFiltros(isAdmin ? { q: '', empresa: '' } : { q: '' })

  const usuariosVisibles = useMemo(
    () =>
      usuarios.filter(
        (usuarioItem) =>
          coincideBusqueda(filtros.q, [`${usuarioItem.nombre} ${usuarioItem.apellido}`]) &&
          (!filtros.empresa || usuarioItem.empresaId === filtros.empresa),
      ),
    [filtros, usuarios],
  )

  const usuarioSesionId = usuario?.id

  // Mismas reglas que el backend: un ENCARGADO gestiona pilotos y clientes y edita su propio perfil;
  // nadie puede eliminar su propio usuario.
  const puedeEditar = (usuarioItem) =>
    isAdmin || usuarioItem.id === usuarioSesionId || ROLES_GESTIONABLES_POR_ENCARGADO.includes(usuarioItem.rol)
  const puedeEliminar = (usuarioItem) =>
    usuarioItem.id !== usuarioSesionId &&
    (isAdmin || ROLES_GESTIONABLES_POR_ENCARGADO.includes(usuarioItem.rol))

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
      key: 'rol',
      header: 'Rol',
      render: (usuarioItem) => getRolLabel(usuarioItem.rol),
    },
    ...(isAdmin
      ? [
          {
            key: 'empresa',
            header: 'Empresa',
            render: (usuarioItem) =>
              usuarioItem.rol === ROLES.ADMIN
                ? '-'
                : getEmpresaNombre(usuarioItem.empresaId) || 'Sin empresa',
          },
        ]
      : []),
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-28 text-center',
      cellClassName: 'text-center',
      render: (usuario) => (
        <MenuAcciones etiqueta={`${usuario.nombre} ${usuario.apellido}`} acciones={[
          puedeEditar(usuario) && { etiqueta: 'Editar', icono: Pencil, onClick: () => openEditDialog(usuario) },
          puedeEliminar(usuario) && { etiqueta: 'Eliminar', icono: Trash2, onClick: () => openDeleteDialog(usuario), peligrosa: true },
        ]} />
      ),
    },
  ]

  if (isLoading) {
    return (
      <AppLayout>
        <PageLoader message="Cargando usuarios..." />
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
            Agregar usuario
          </button>
        }
        subtitle="Administra altas, modificaciones y bajas de usuarios."
        title="Usuarios"
      />

      <BarraFiltros hayFiltros={hayFiltros} onLimpiar={limpiarFiltros}>
        <BuscadorFiltro
          etiqueta="Buscar usuarios"
          onChange={(valor) => cambiarFiltro('q', valor)}
          placeholder="Buscar por nombre"
          valor={filtros.q}
        />
        {isAdmin && (
          <FiltroSelect
            etiqueta="Filtrar por empresa"
            onChange={(valor) => cambiarFiltro('empresa', valor)}
            opciones={ordenarOpciones(empresas.map((empresa) => ({ valor: empresa.id, etiqueta: empresa.nombre })))}
            todos="Todas las empresas"
            valor={filtros.empresa}
          />
        )}
      </BarraFiltros>

      <DataTable
        columns={columns}
        emptyMessage={<SinResultados hayFiltros={hayFiltros} mensajeVacio="No hay usuarios cargados." onLimpiar={limpiarFiltros} />}
        getRowKey={(usuario) => usuario.id}
        rows={usuariosVisibles}
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
            empresas={empresas}
            isAdmin={isAdmin}
            isPropioUsuario={editingUsuario?.id === usuarioSesionId}
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
