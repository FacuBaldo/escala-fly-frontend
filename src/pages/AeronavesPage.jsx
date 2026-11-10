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
import AeronaveForm from '../components/AeronaveForm'
import { createAeronave, deleteAeronave, getAeronaves, updateAeronave } from '../api/aeronavesApi'
import { getEmpresas } from '../api/empresasApi'
import { ROLES } from '../auth/roles'
import useAutenticacion from '../context/useAutenticacion'
import useToast from '../context/useToast'
import useFiltros from '../hooks/useFiltros'
import { coincideBusqueda, ordenarOpciones } from '../utils/filtros'
import getErrorMessage from '../utils/getErrorMessage'

const estadoLabels = {
  ACTIVA: 'Activa',
  EN_MANTENIMIENTO: 'En mantenimiento',
  INACTIVA: 'Inactiva',
}

function AeronavesPage() {
  const { usuario } = useAutenticacion()
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
  const isAdmin = usuario?.rol === ROLES.ADMIN

  const { filtros, cambiarFiltro, limpiarFiltros, hayFiltros } = useFiltros(isAdmin ? { q: '', empresa: '' } : { q: '' })

  const aeronavesVisibles = useMemo(
    () =>
      aeronaves.filter(
        (aeronave) =>
          coincideBusqueda(filtros.q, [aeronave.matricula]) &&
          (!filtros.empresa || aeronave.empresaId === filtros.empresa),
      ),
    [aeronaves, filtros],
  )

  const columns = [
    {
      key: 'matricula',
      header: 'Matricula',
      cellClassName: 'font-semibold text-slate-950',
    },
    ...(isAdmin
      ? [
          {
            key: 'empresa',
            header: 'Empresa',
            render: (aeronave) =>
              getEmpresaNombre(aeronave.empresaId) || (
                <span className="text-slate-400 italic">Sin empresa</span>
              ),
          },
        ]
      : []),
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
      render: (aeronave) => estadoLabels[aeronave.estado] || aeronave.estado,
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-28 text-center',
      cellClassName: 'text-center',
      render: (aeronave) => (
        <MenuAcciones etiqueta={aeronave.matricula} acciones={[
          { etiqueta: 'Editar', icono: Pencil, onClick: () => openEditDialog(aeronave) },
          { etiqueta: 'Eliminar', icono: Trash2, onClick: () => openDeleteDialog(aeronave), peligrosa: true },
        ]} />
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

      <BarraFiltros hayFiltros={hayFiltros} onLimpiar={limpiarFiltros}>
        <BuscadorFiltro
          etiqueta="Buscar aeronaves"
          onChange={(valor) => cambiarFiltro('q', valor)}
          placeholder="Buscar por matrícula"
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
        emptyMessage={
          <SinResultados hayFiltros={hayFiltros} mensajeVacio="No hay aeronaves cargadas." onLimpiar={limpiarFiltros} />
        }
        getRowKey={(aeronave) => aeronave.id}
        rows={aeronavesVisibles}
      />

      {isDialogOpen && (
        <FormDialog
          isSaving={isSaving}
          maxWidth="max-w-2xl"
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
            showEmpresa={isAdmin}
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
