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
import AeronaveForm from '../components/aeronaves/AeronaveForm'
import { createAeronave, deleteAeronave, getAeronaves, updateAeronave } from '../api/aeronavesApi'
import { getEmpresaById, getEmpresas } from '../api/empresasApi'
import { ROLES } from '../auth/roles'
import useAutenticacion from '../context/useAutenticacion'
import useToast from '../context/useToast'
import useFiltros from '../hooks/useFiltros'
import { ordenarOpciones } from '../utils/filtros'
import getErrorMessage from '../utils/getErrorMessage'
import SelectorEmpresa from '../components/compartidos/formularios/SelectorEmpresa'

const estadoLabels = {
  ACTIVA: 'Activa',
  EN_MANTENIMIENTO: 'En mantenimiento',
  INACTIVA: 'Inactiva',
}

export function FiltroEmpresa({ valor, onChange, disabled = false }) {
  const [opciones, setOpciones] = useState([])
  const [seleccion, setSeleccion] = useState(null)
  const [page, setPage] = useState(1)
  const [hayMas, setHayMas] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let vigente = true
    const timer = setTimeout(() => getEmpresas({ page, limit: 20 }).then((r) => {
      if (vigente) { setOpciones((previas) => page === 1 ? r.data : [...previas, ...r.data.filter((item) => !previas.some((previo) => previo.id === item.id))]); setHayMas(r.pagination.hasNextPage); setError('') }
    }).catch(() => { if (vigente) setError('No se pudieron cargar las empresas.') }), 250)
    return () => { vigente = false; clearTimeout(timer) }
  }, [page])
  useEffect(() => {
    if (!valor) return undefined
    let vigente = true
    getEmpresaById(valor).then((empresa) => { if (vigente) setSeleccion(empresa) }).catch(() => {})
    return () => { vigente = false }
  }, [valor])
  return (
    <div className="grid min-w-0 gap-1">
      <select aria-label="Filtrar por empresa" className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700 outline-none transition hover:border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50" disabled={disabled} value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todas las empresas</option>
        {seleccion?.id === valor && !opciones.some((item) => item.id === valor) && <option value={seleccion.id}>{seleccion.nombre}</option>}
        {opciones.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
      </select>
      {hayMas && <button className="justify-self-start text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50" disabled={disabled} onClick={() => setPage((p) => p + 1)} type="button">Cargar 20 más</button>}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  )
}

function AeronavesPage() {
  const { usuario } = useAutenticacion()
  const { showToast } = useToast()
  const isAdmin = usuario?.rol === ROLES.ADMIN
  const { filtros, cambiarFiltro, limpiarFiltros, hayFiltros } = useFiltros(isAdmin ? { q: '', empresa: '' } : { q: '' })
  const [datosListado, setDatosListado] = useState([])
  const [paginaListado, setPaginaListado] = useState({ clave: '', pagina: 1 })
  const [haySiguiente, setHaySiguiente] = useState(false)
  const [cargandoListado, setCargandoListado] = useState(true)
  const [primeraCarga, setPrimeraCarga] = useState(true)
  const [versionListado, setVersionListado] = useState(0)
  const claveListado = JSON.stringify([filtros.q, filtros.empresa])
  const pagina = paginaListado.clave === claveListado ? paginaListado.pagina : 1
  const listado = { data: datosListado, page: pagina, hasNextPage: haySiguiente, loading: cargandoListado, recargar: () => setVersionListado((v) => v + 1), setPage: (cambio) => { const siguiente = typeof cambio === 'function' ? cambio(pagina) : cambio; if (siguiente !== pagina) { setCargandoListado(true); setPaginaListado({ clave: claveListado, pagina: siguiente }) } } }
  useEffect(() => {
    let vigente = true
    const timer = setTimeout(() => {
      setCargandoListado(true)
      getAeronaves({ page: pagina, limit: 20, search: filtros.q, empresaId: filtros.empresa || undefined })
        .then((respuesta) => {
          if (!vigente) return
          if (!respuesta.data.length && pagina > 1) { setPaginaListado({ clave: claveListado, pagina: pagina - 1 }); return }
          setDatosListado(respuesta.data)
          setHaySiguiente(respuesta.pagination.hasNextPage)
        })
        .catch((error) => { if (vigente && !error.cierreSesionPorAutenticacion) showToast({ message: getErrorMessage(error, 'No se pudo cargar el listado.'), type: 'error' }) })
        .finally(() => { if (vigente) { setCargandoListado(false); setPrimeraCarga(false) } })
    }, 300)
    return () => { vigente = false; clearTimeout(timer) }
  }, [pagina, claveListado, filtros.q, filtros.empresa, versionListado, showToast])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [pagina, claveListado])
  const [empresas, setEmpresas] = useState([])
  const [editingAeronave, setEditingAeronave] = useState(null)
  const [deletingAeronave, setDeletingAeronave] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadAeronaves = async () => {
    listado.recargar()
  }

  useEffect(() => {
    let isActive = true

    Promise.all([getEmpresas({ page: 1, limit: 20 }).then((respuesta) => respuesta.data)])
      .then(([empresasData]) => {
        if (isActive) {
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
  const aeronavesVisibles = listado.data

  const columns = [
    ...(isAdmin
      ? [
          {
            key: 'empresa',
            header: 'Empresa',
            render: (aeronave) =>
              aeronave.empresa?.nombre || getEmpresaNombre(aeronave.empresaId) || (
                <span className="text-slate-400 italic">Sin empresa</span>
              ),
          },
        ]
      : []),
    {
      key: 'matricula',
      header: 'Matricula',
      mobileCellClassName: 'font-normal',
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

  if (isLoading || primeraCarga) {
    return (
      <AppLayout>
        <PageLoader />
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

      <BarraFiltros hayFiltros={hayFiltros} onLimpiar={() => { setCargandoListado(true); setPaginaListado({ clave: '', pagina: 1 }); limpiarFiltros() }}>
        <BuscadorFiltro
          etiqueta="Buscar aeronaves"
          onChange={(valor) => { setCargandoListado(true); setPaginaListado({ clave: '', pagina: 1 }); cambiarFiltro('q', valor) }}
          placeholder="Buscar por matrícula"
          valor={filtros.q}
        />
        {isAdmin && (
          <SelectorEmpresa
            url="/empresas"
            etiqueta="Filtrar por empresa"
            onChange={(valor) => { setCargandoListado(true); setPaginaListado({ clave: '', pagina: 1 }); cambiarFiltro('empresa', valor) }}
            opciones={ordenarOpciones(empresas.map((empresa) => ({ valor: empresa.id, etiqueta: empresa.nombre })))}
            todos="Todas las empresas"
            valor={filtros.empresa}
          />
        )}
      </BarraFiltros>

      <DataTable
        loading={listado.loading}
        columns={columns}
        emptyMessage={
          listado.loading ? 'Cargando...' : <SinResultados hayFiltros={hayFiltros} mensajeVacio="No hay aeronaves cargadas." onLimpiar={() => { setCargandoListado(true); setPaginaListado({ clave: '', pagina: 1 }); limpiarFiltros() }} />
        }
        getRowKey={(aeronave) => aeronave.id}
        rows={aeronavesVisibles}
      />
      <nav aria-label="Paginación" className="mt-4 flex items-center justify-end gap-1">
        <button aria-label="Página anterior" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 disabled:opacity-40" disabled={listado.page === 1 || listado.loading} onClick={() => listado.setPage(listado.page - 1)} type="button">‹</button>
        {listado.page > 3 && <><button className="h-9 min-w-9 rounded-lg text-sm text-slate-600 hover:bg-emerald-50" disabled={listado.loading} onClick={() => listado.setPage(1)} type="button">1</button>{listado.page > 4 && <span className="px-1 text-slate-400">…</span>}</>}
        {Array.from({ length: Math.min(3, listado.page) + Number(listado.hasNextPage) }, (_, i) => Math.max(1, listado.page - 2) + i).map((numero) => <button aria-current={numero === listado.page ? 'page' : undefined} aria-label={`Página ${numero}`} className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold ${numero === listado.page ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-emerald-50'}`} disabled={listado.loading} key={numero} onClick={() => listado.setPage(numero)} type="button">{numero}</button>)}
        <button aria-label="Página siguiente" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 disabled:opacity-40" disabled={!listado.hasNextPage || listado.loading} onClick={() => listado.setPage(listado.page + 1)} type="button">›</button>
      </nav>

      {isDialogOpen && (
        <BaseDialog
          isBusy={isSaving}
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
        </BaseDialog>
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
