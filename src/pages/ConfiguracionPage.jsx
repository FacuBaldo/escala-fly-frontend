import { useCallback, useEffect, useState } from 'react'
import { Ruler, Tags } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import DeleteDialog from '../components/DeleteDialog'
import PageHeader from '../components/PageHeader'
import PageLoader from '../components/PageLoader'
import CatalogoEditable from '../components/configuracion/CatalogoEditable'
import {
  createTipoProducto,
  createUnidadMedida,
  deleteTipoProducto,
  deleteUnidadMedida,
  getTiposProducto,
  getUnidadesMedida,
  updateTipoProducto,
  updateUnidadMedida,
} from '../api/catalogosApi'
import useToast from '../context/useToast'
import getErrorMessage from '../utils/getErrorMessage'

// Mismos largos maximos que valida el backend
const CAMPOS_TIPO = [{ clave: 'nombre', etiqueta: 'Nombre del tipo', placeholder: 'Ej: Acaricida', largoMaximo: 40 }]

const CAMPOS_UNIDAD = [
  { clave: 'nombre', etiqueta: 'Nombre de la unidad', placeholder: 'Ej: Mililitros', largoMaximo: 40 },
  { clave: 'abreviatura', etiqueta: 'Abreviatura', placeholder: 'ml', largoMaximo: 10, anchoClase: 'w-20 shrink-0' },
]

function ConfiguracionPage() {
  const { showToast } = useToast()
  const [tipos, setTipos] = useState([])
  const [unidades, setUnidades] = useState([])
  const [aEliminar, setAEliminar] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const notificarError = useCallback(
    (requestError, fallback) => {
      if (requestError.cierreSesionPorAutenticacion) {
        return
      }

      showToast({ message: getErrorMessage(requestError, fallback), type: 'error' })
    },
    [showToast],
  )

  useEffect(() => {
    let isActive = true

    Promise.all([getTiposProducto(), getUnidadesMedida()])
      .then(([tiposData, unidadesData]) => {
        if (isActive) {
          setTipos(tiposData)
          setUnidades(unidadesData)
        }
      })
      .catch((requestError) => {
        if (isActive) {
          notificarError(requestError, 'No se pudo cargar la configuracion.')
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
  }, [notificarError])

  // Cada catalogo se describe una vez y se reutiliza para alta, edicion y baja
  const catalogos = {
    tipo: {
      api: { crear: createTipoProducto, actualizar: updateTipoProducto, eliminar: deleteTipoProducto, listar: getTiposProducto },
      setItems: setTipos,
      singular: 'Tipo de producto',
      agregado: 'agregado',
      actualizado: 'actualizado',
    },
    unidad: {
      api: { crear: createUnidadMedida, actualizar: updateUnidadMedida, eliminar: deleteUnidadMedida, listar: getUnidadesMedida },
      setItems: setUnidades,
      singular: 'Unidad de medida',
      agregado: 'agregada',
      actualizado: 'actualizada',
    },
  }

  // Nunca lanza: si la recarga falla despues de guardar, el guardado igual se hizo
  // y no tiene que informarse como error de guardado.
  const recargar = async (clave) => {
    const catalogo = catalogos[clave]

    try {
      catalogo.setItems(await catalogo.api.listar())
    } catch (requestError) {
      notificarError(requestError, 'No se pudo actualizar el listado. Recarga la pagina para ver los cambios.')
    }
  }

  const crear = (clave) => async (datos) => {
    try {
      await catalogos[clave].api.crear(datos)
      showToast({ message: `${catalogos[clave].singular} ${catalogos[clave].agregado}.`, type: 'success' })
      await recargar(clave)
      return true
    } catch (requestError) {
      notificarError(requestError, 'No se pudo agregar.')
      return false
    }
  }

  const actualizar = (clave) => async (id, datos) => {
    try {
      await catalogos[clave].api.actualizar(id, datos)
      showToast({ message: `${catalogos[clave].singular} ${catalogos[clave].actualizado}.`, type: 'success' })
      await recargar(clave)
      return true
    } catch (requestError) {
      notificarError(requestError, 'No se pudo guardar.')
      return false
    }
  }

  const handleEliminar = async () => {
    if (!aEliminar) {
      return
    }

    setIsDeleting(true)

    try {
      await catalogos[aEliminar.clave].api.eliminar(aEliminar.item.id)
      showToast({ message: `Se elimino "${aEliminar.item.nombre}".`, type: 'success' })
      await recargar(aEliminar.clave)
    } catch (requestError) {
      // 409 cuando algun producto lo empezo a usar despues de cargar la pantalla
      notificarError(requestError, 'No se pudo eliminar.')
      await recargar(aEliminar.clave)
    } finally {
      setIsDeleting(false)
      setAEliminar(null)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <PageLoader message="Cargando configuracion..." />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        subtitle="Valores que eligen todas las empresas al cargar sus productos."
        title="Configuracion"
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CatalogoEditable
          campos={CAMPOS_TIPO}
          descripcion="Categorias para clasificar los productos: herbicida, fungicida, insecticida..."
          icono={Tags}
          items={tipos}
          onActualizar={actualizar('tipo')}
          onCrear={crear('tipo')}
          onEliminar={(item) => setAEliminar({ clave: 'tipo', item })}
          titulo="Tipos de producto"
        />

        <CatalogoEditable
          campos={CAMPOS_UNIDAD}
          descripcion="La abreviatura es la que se muestra en las dosis de la orden de vuelo."
          icono={Ruler}
          items={unidades}
          onActualizar={actualizar('unidad')}
          onCrear={crear('unidad')}
          onEliminar={(item) => setAEliminar({ clave: 'unidad', item })}
          titulo="Unidades de medida"
        />
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Un valor que ya usa algun producto no se puede eliminar; primero hay que cambiarle el tipo o la unidad a esos
        productos.
      </p>

      {aEliminar && (
        <DeleteDialog
          isDeleting={isDeleting}
          message={
            <>
              Vas a eliminar <span className="font-bold text-slate-950">{aEliminar.item.nombre}</span> de{' '}
              {aEliminar.clave === 'tipo' ? 'los tipos de producto' : 'las unidades de medida'}. Esta accion no se
              puede deshacer.
            </>
          }
          onClose={() => !isDeleting && setAEliminar(null)}
          onConfirm={handleEliminar}
          title={`Eliminar ${catalogos[aEliminar.clave].singular.toLowerCase()}`}
        />
      )}
    </AppLayout>
  )
}

export default ConfiguracionPage
