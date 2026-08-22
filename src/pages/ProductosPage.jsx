import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import DataTable from '../components/DataTable'
import DeleteDialog from '../components/DeleteDialog'
import FormDialog from '../components/FormDialog'
import PageHeader from '../components/PageHeader'
import PageLoader from '../components/PageLoader'
import ProductoForm, { TIPOS_PRODUCTO } from '../components/ProductoForm'
import { createProducto, deleteProducto, getProductos, updateProducto } from '../api/productosApi'
import { getEmpresas } from '../api/empresasApi'
import useToast from '../context/useToast'
import getErrorMessage from '../utils/getErrorMessage'

const TIPO_BADGE_STYLES = {
  HERBICIDA: 'bg-amber-50 text-amber-800 border-amber-200',
  FUNGICIDA: 'bg-purple-50 text-purple-800 border-purple-200',
  INSECTICIDA: 'bg-rose-50 text-rose-800 border-rose-200',
  FERTILIZANTE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  COADYUVANTE: 'bg-sky-50 text-sky-800 border-sky-200',
  OTRO: 'bg-slate-100 text-slate-700 border-slate-200',
}

function ProductosPage() {
  const { showToast } = useToast()
  const [productos, setProductos] = useState([])
  const [empresas, setEmpresas] = useState([])
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

    Promise.allSettled([getProductos(), getEmpresas()])
      .then(([productosRes, empresasRes]) => {
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

  const getTipoLabel = (tipo) =>
    TIPOS_PRODUCTO.find((item) => item.value === tipo)?.label || tipo

  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      cellClassName: 'font-semibold text-slate-950',
    },
    {
      key: 'tipo',
      header: 'Tipo / Categoria',
      render: (producto) => {
        const style = TIPO_BADGE_STYLES[producto.tipo] || TIPO_BADGE_STYLES.OTRO
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
            {getTipoLabel(producto.tipo)}
          </span>
        )
      },
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
        <span className="font-mono text-sm text-slate-700">{producto.unidadMedida}</span>
      ),
    },
    {
      key: 'empresa',
      header: 'Empresa',
      render: (producto) =>
        getEmpresaNombre(producto.empresaId) || (
          <span className="text-slate-400 italic">Sin empresa</span>
        ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-28 text-center',
      cellClassName: 'text-center',
      render: (producto) => (
        <div className="flex justify-center gap-2">
          <button
            aria-label={`Editar ${producto.nombre}`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100"
            onClick={() => openEditDialog(producto)}
            title="Editar producto"
            type="button"
          >
            <Pencil aria-hidden="true" size={17} />
          </button>
          <button
            aria-label={`Eliminar ${producto.nombre}`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-700 transition hover:bg-red-100"
            onClick={() => openDeleteDialog(producto)}
            title="Eliminar producto"
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

      <DataTable
        columns={columns}
        emptyMessage="No hay productos cargados."
        getRowKey={(producto) => producto.id}
        rows={productos}
      />

      {isDialogOpen && (
        <FormDialog
          isSaving={isSaving}
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
          />
        </FormDialog>
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
