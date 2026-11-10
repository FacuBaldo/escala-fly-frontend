import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import AppLayout from '../components/compartidos/layout/AppLayout'
import DataTable from '../components/compartidos/tablas/DataTable'
import MenuAcciones from '../components/compartidos/tablas/MenuAcciones'
import DeleteDialog from '../components/compartidos/dialogos/DeleteDialog'
import BaseDialog from '../components/compartidos/dialogos/BaseDialog'
import PageHeader from '../components/compartidos/layout/PageHeader'
import PageLoader from '../components/compartidos/feedback/PageLoader'
import ProductoForm from '../components/productos/ProductoForm'
import BarraFiltros from '../components/compartidos/filtros/BarraFiltros'
import BuscadorFiltro from '../components/compartidos/filtros/BuscadorFiltro'
import FiltroSelect from '../components/compartidos/filtros/FiltroSelect'
import SinResultados from '../components/compartidos/feedback/SinResultados'
import { createProducto, deleteProducto, getProductos, updateProducto } from '../api/productosApi'
import { getTiposProducto, getUnidadesMedida } from '../api/catalogosApi'
import { getEmpresas } from '../api/empresasApi'
import { ROLES } from '../auth/roles'
import useAutenticacion from '../context/useAutenticacion'
import useToast from '../context/useToast'
import useFiltros from '../hooks/useFiltros'
import { coincideBusqueda, ordenarOpciones } from '../utils/filtros'
import getErrorMessage from '../utils/getErrorMessage'

function ProductosPage() {
  const { usuario } = useAutenticacion()
  const { showToast } = useToast()
  const [productos, setProductos] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [tipos, setTipos] = useState([])
  const [unidades, setUnidades] = useState([])
  const [editingProducto, setEditingProducto] = useState(null)
  const [deletingProducto, setDeletingProducto] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadProductos = async () => {
    setIsLoading(true)

    try {
      const data = await getProductos()
      setProductos(data)
    } catch (requestError) {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({
        message: getErrorMessage(requestError, 'No se pudieron cargar los productos.'),
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    Promise.allSettled([getProductos(), getEmpresas(), getTiposProducto(), getUnidadesMedida()])
      .then(([productosRes, empresasRes, tiposRes, unidadesRes]) => {
        if (!isActive) {
          return
        }

        if (productosRes.status === 'fulfilled') {
          setProductos(productosRes.value)
        } else if (!productosRes.reason?.cierreSesionPorAutenticacion) {
          showToast({
            message: getErrorMessage(productosRes.reason, 'No se pudieron cargar los productos.'),
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

        // Tipos y unidades salen de los catalogos de Configuracion
        if (tiposRes.status === 'fulfilled' && unidadesRes.status === 'fulfilled') {
          setTipos(tiposRes.value)
          setUnidades(unidadesRes.value)
        } else {
          const motivo = tiposRes.reason || unidadesRes.reason
          if (!motivo?.cierreSesionPorAutenticacion) {
            showToast({
              message: getErrorMessage(motivo, 'No se pudieron cargar los tipos y unidades de medida.'),
              type: 'error',
            })
          }
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
    const isEditing = Boolean(editingProducto)

    try {
      if (editingProducto) {
        await updateProducto(editingProducto.id, form)
      } else {
        await createProducto(form)
      }

      setEditingProducto(null)
      setIsDialogOpen(false)
      showToast({
        message: isEditing ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.',
        type: 'success',
      })
      await loadProductos()
    } catch (requestError) {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({
        message: getErrorMessage(requestError, 'No se pudo guardar el producto.'),
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingProducto) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteProducto(deletingProducto.id)
      setDeletingProducto(null)
      showToast({ message: 'Producto eliminado correctamente.', type: 'success' })
      await loadProductos()
    } catch (requestError) {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({
        message: getErrorMessage(requestError, 'No se pudo eliminar el producto.'),
        type: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const openCreateDialog = () => {
    setEditingProducto(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (producto) => {
    setEditingProducto(producto)
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (producto) => {
    setDeletingProducto(producto)
  }

  const closeDialog = () => {
    if (isSaving) {
      return
    }

    setIsDialogOpen(false)
    setEditingProducto(null)
  }

  const closeDeleteDialog = () => {
    if (isDeleting) {
      return
    }

    setDeletingProducto(null)
  }

  const getEmpresaNombre = (empresaId) =>
    empresas.find((empresa) => empresa.id === empresaId)?.nombre

  const isAdmin = usuario?.rol === ROLES.ADMIN

  const { filtros, cambiarFiltro, limpiarFiltros, hayFiltros } = useFiltros(isAdmin ? { q: '', empresa: '' } : { q: '' })

  const productosVisibles = useMemo(
    () =>
      productos.filter(
        (producto) =>
          coincideBusqueda(filtros.q, [producto.nombre]) &&
          (!filtros.empresa || producto.empresaId === filtros.empresa),
      ),
    [filtros, productos],
  )

  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      cellClassName: 'font-semibold text-slate-950',
    },
    {
      key: 'tipo',
      header: 'Tipo / Categoria',
      render: (producto) => producto.tipo?.nombre,
    },
    {
      key: 'marca',
      header: 'Marca',
      render: (producto) => producto.marca || <span className="text-slate-400 italic">Sin marca</span>,
    },
    {
      key: 'unidadMedida',
      header: 'Unidad de medida',
      render: (producto) => (
        <span className="text-sm text-slate-700">
          {producto.unidadMedida?.nombre}{' '}
          <span className="font-mono text-xs text-slate-500">({producto.unidadMedida?.abreviatura})</span>
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: 'empresa',
            header: 'Empresa',
            render: (producto) =>
              getEmpresaNombre(producto.empresaId) || (
                <span className="text-slate-400 italic">Sin empresa</span>
              ),
          },
        ]
      : []),
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-28 text-center',
      cellClassName: 'text-center',
      render: (producto) => (
        <MenuAcciones etiqueta={producto.nombre} acciones={[
          { etiqueta: 'Editar', icono: Pencil, onClick: () => openEditDialog(producto) },
          { etiqueta: 'Eliminar', icono: Trash2, onClick: () => openDeleteDialog(producto), peligrosa: true },
        ]} />
      ),
    },
  ]

  if (isLoading) {
    return (
      <AppLayout>
        <PageLoader message="Cargando productos..." />
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
            Agregar producto
          </button>
        }
        subtitle="Administra altas, modificaciones y bajas de productos agrícolas por empresa."
        title="Productos"
      />

      <BarraFiltros hayFiltros={hayFiltros} onLimpiar={limpiarFiltros}>
        <BuscadorFiltro
          etiqueta="Buscar productos"
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
        emptyMessage={
          <SinResultados hayFiltros={hayFiltros} mensajeVacio="No hay productos cargados." onLimpiar={limpiarFiltros} />
        }
        getRowKey={(producto) => producto.id}
        rows={productosVisibles}
      />

      {isDialogOpen && (
        <BaseDialog
          isBusy={isSaving}
          onClose={closeDialog}
          title={editingProducto ? 'Editar producto' : 'Agregar producto'}
        >
          <ProductoForm
            key={editingProducto?.id || 'new-producto'}
            editingProducto={editingProducto}
            empresas={empresas}
            isSaving={isSaving}
            onCancel={closeDialog}
            onSave={handleSave}
            showEmpresa={isAdmin}
            tipos={tipos}
            unidades={unidades}
          />
        </BaseDialog>
      )}

      {deletingProducto && (
        <DeleteDialog
          isDeleting={isDeleting}
          message={
            <>
              Estas por eliminar el producto{' '}
              <span className="font-bold text-slate-950">{deletingProducto.nombre}</span>. Esta
              accion no se puede deshacer.
            </>
          }
          onClose={closeDeleteDialog}
          onConfirm={handleDelete}
          title="Eliminar producto"
        />
      )}
    </AppLayout>
  )
}

export default ProductosPage
