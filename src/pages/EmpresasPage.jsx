import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import AppLayout from '../components/compartidos/layout/AppLayout'
import DataTable from '../components/compartidos/tablas/DataTable'
import MenuAcciones from '../components/compartidos/tablas/MenuAcciones'
import DeleteDialog from '../components/compartidos/dialogos/DeleteDialog'
import BaseDialog from '../components/compartidos/dialogos/BaseDialog'
import PageHeader from '../components/compartidos/layout/PageHeader'
import PageLoader from '../components/compartidos/feedback/PageLoader'
import BarraFiltros from '../components/compartidos/filtros/BarraFiltros'
import BuscadorFiltro from '../components/compartidos/filtros/BuscadorFiltro'
import SinResultados from '../components/compartidos/feedback/SinResultados'
import EmpresaForm from '../components/empresas/EmpresaForm'
import { createEmpresa, deleteEmpresa, getEmpresas, updateEmpresa } from '../api/empresasApi'
import { ROLES } from '../auth/roles'
import useAutenticacion from '../context/useAutenticacion'
import useToast from '../context/useToast'
import useFiltros from '../hooks/useFiltros'
import getErrorMessage from '../utils/getErrorMessage'

function EmpresasPage() {
  const { usuario } = useAutenticacion()
  const { showToast } = useToast()
  const [empresas, setEmpresas] = useState([])
  const { filtros, cambiarFiltro, limpiarFiltros, hayFiltros } = useFiltros({ q: '' })
  const [editingEmpresa, setEditingEmpresa] = useState(null)
  const [deletingEmpresa, setDeletingEmpresa] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [version, setVersion] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    let isActive = true
    const timer = setTimeout(() => {
      setIsUpdating(true)
      getEmpresas({ page, limit: 20, search: filtros.q })
      .then((result) => {
        if (isActive) {
          if (result.data.length === 0 && page > 1) {
            setPage((actual) => actual - 1)
          } else {
            setEmpresas(result.data)
            setHasNextPage(result.pagination.hasNextPage)
          }
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
          setIsUpdating(false)
        }
      })
    }, 300)

    return () => {
      isActive = false
      clearTimeout(timer)
    }
  }, [filtros.q, page, showToast, version])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [filtros.q, page])

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
      setVersion((actual) => actual + 1)
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
      const { eliminados } = await deleteEmpresa(deletingEmpresa.id)
      setDeletingEmpresa(null)
      showToast({
        message: eliminados
          ? `Empresa eliminada junto con ${eliminados.usuarios} usuarios, ${eliminados.campos} campos, ${eliminados.lotes} lotes, ${eliminados.productos} productos y ${eliminados.aeronaves} aeronaves.`
          : 'Empresa eliminada correctamente.',
        type: 'success',
      })
      setVersion((actual) => actual + 1)
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
        <MenuAcciones etiqueta={empresa.nombre} acciones={[
          { etiqueta: 'Editar', icono: Pencil, onClick: () => openEditDialog(empresa) },
          usuario?.rol === ROLES.ADMIN && { etiqueta: 'Eliminar', icono: Trash2, onClick: () => openDeleteDialog(empresa), peligrosa: true },
        ]} />
      ),
    },
  ]

  if (isLoading) {
    return (
      <AppLayout>
        <PageLoader />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        action={usuario?.rol === ROLES.ADMIN ? (
          <button
            className="flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800"
            onClick={openCreateDialog}
            type="button"
          >
            <Plus aria-hidden="true" size={18} />
            Agregar empresa
          </button>
        ) : null}
        subtitle="Administra altas, modificaciones y bajas de empresas."
        title="Empresas"
      />

      <BarraFiltros hayFiltros={hayFiltros} onLimpiar={() => { setIsUpdating(true); setPage(1); limpiarFiltros() }}>
        <BuscadorFiltro
          etiqueta="Buscar empresas"
          onChange={(valor) => { setIsUpdating(true); setPage(1); cambiarFiltro('q', valor) }}
          placeholder="Buscar por nombre"
          valor={filtros.q}
        />
      </BarraFiltros>

      <DataTable
        loading={isUpdating}
        columns={columns}
        emptyMessage={<SinResultados hayFiltros={hayFiltros} mensajeVacio="No hay empresas cargadas." onLimpiar={() => { setIsUpdating(true); setPage(1); limpiarFiltros() }} />}
        getRowKey={(empresa) => empresa.id}
        rows={empresas}
      />
      <nav aria-label="Paginación" className="mt-4 flex items-center justify-end gap-1">
        <button aria-label="Página anterior" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 disabled:opacity-40" disabled={page === 1 || isUpdating} onClick={() => { setIsUpdating(true); setPage(page - 1) }} type="button">‹</button>
        {page > 3 && <><button className="h-9 min-w-9 rounded-lg text-sm text-slate-600 hover:bg-emerald-50" disabled={isUpdating} onClick={() => { setIsUpdating(true); setPage(1) }} type="button">1</button>{page > 4 && <span className="px-1 text-slate-400">…</span>}</>}
        {Array.from({ length: Math.min(3, page) + Number(hasNextPage) }, (_, i) => Math.max(1, page - 2) + i).map((numero) => <button aria-current={numero === page ? 'page' : undefined} aria-label={`Página ${numero}`} className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold ${numero === page ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-emerald-50'}`} disabled={isUpdating || numero === page} key={numero} onClick={() => { setIsUpdating(true); setPage(numero) }} type="button">{numero}</button>)}
        <button aria-label="Página siguiente" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 disabled:opacity-40" disabled={!hasNextPage || isUpdating} onClick={() => { setIsUpdating(true); setPage(page + 1) }} type="button">›</button>
      </nav>

      {isDialogOpen && (
        <BaseDialog
          isBusy={isSaving}
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
        </BaseDialog>
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
              . Tambien se eliminaran todos sus datos asociados:{' '}
              <span className="font-semibold text-red-700">
                usuarios, campos y lotes, productos y aeronaves
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
