import { useCallback, useEffect, useState } from 'react'
import { Ruler, Tags } from 'lucide-react'
import AppLayout from '../components/compartidos/layout/AppLayout'
import DeleteDialog from '../components/compartidos/dialogos/DeleteDialog'
import PageHeader from '../components/compartidos/layout/PageHeader'
import PageLoader from '../components/compartidos/feedback/PageLoader'
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
  const [datosTipos, setDatosTipos] = useState([])
  const [paginaTipos, setPaginaTipos] = useState(1)
  const [siguienteTipos, setSiguienteTipos] = useState(false)
  const [cargandoTipos, setCargandoTipos] = useState(true)
  const [primeraCargaTipos, setPrimeraCargaTipos] = useState(true)
  const [versionTipos, setVersionTipos] = useState(0)
  const [datosUnidades, setDatosUnidades] = useState([])
  const [paginaUnidades, setPaginaUnidades] = useState(1)
  const [siguienteUnidades, setSiguienteUnidades] = useState(false)
  const [cargandoUnidades, setCargandoUnidades] = useState(true)
  const [primeraCargaUnidades, setPrimeraCargaUnidades] = useState(true)
  const [versionUnidades, setVersionUnidades] = useState(0)
  const tipos = { data: datosTipos, page: paginaTipos, setPage: (cambio) => { setCargandoTipos(true); setPaginaTipos(cambio) }, hasNextPage: siguienteTipos, loading: cargandoTipos, recargar: () => { setCargandoTipos(true); setVersionTipos((v) => v + 1) } }
  const unidades = { data: datosUnidades, page: paginaUnidades, setPage: (cambio) => { setCargandoUnidades(true); setPaginaUnidades(cambio) }, hasNextPage: siguienteUnidades, loading: cargandoUnidades, recargar: () => { setCargandoUnidades(true); setVersionUnidades((v) => v + 1) } }
  useEffect(() => {
    let vigente = true
    getTiposProducto({ page: paginaTipos, limit: 20 }).then((respuesta) => {
      if (!vigente) return
      if (!respuesta.data.length && paginaTipos > 1) { setPaginaTipos((pagina) => pagina - 1); return }
      setDatosTipos(respuesta.data)
      setSiguienteTipos(respuesta.pagination.hasNextPage)
    }).catch((error) => { if (vigente && !error.cierreSesionPorAutenticacion) showToast({ message: getErrorMessage(error, 'No se pudieron cargar los tipos.'), type: 'error' }) })
      .finally(() => { if (vigente) { setCargandoTipos(false); setPrimeraCargaTipos(false) } })
    return () => { vigente = false }
  }, [paginaTipos, versionTipos, showToast])
  useEffect(() => {
    let vigente = true
    getUnidadesMedida({ page: paginaUnidades, limit: 20 }).then((respuesta) => {
      if (!vigente) return
      if (!respuesta.data.length && paginaUnidades > 1) { setPaginaUnidades((pagina) => pagina - 1); return }
      setDatosUnidades(respuesta.data)
      setSiguienteUnidades(respuesta.pagination.hasNextPage)
    }).catch((error) => { if (vigente && !error.cierreSesionPorAutenticacion) showToast({ message: getErrorMessage(error, 'No se pudieron cargar las unidades.'), type: 'error' }) })
      .finally(() => { if (vigente) { setCargandoUnidades(false); setPrimeraCargaUnidades(false) } })
    return () => { vigente = false }
  }, [paginaUnidades, versionUnidades, showToast])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [paginaTipos, paginaUnidades])
  const [aEliminar, setAEliminar] = useState(null)
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

  // Cada catalogo se describe una vez y se reutiliza para alta, edicion y baja
  const catalogos = {
    tipo: {
      api: { crear: createTipoProducto, actualizar: updateTipoProducto, eliminar: deleteTipoProducto },
      listado: tipos,
      singular: 'Tipo de producto',
      agregado: 'agregado',
      actualizado: 'actualizado',
    },
    unidad: {
      api: { crear: createUnidadMedida, actualizar: updateUnidadMedida, eliminar: deleteUnidadMedida },
      listado: unidades,
      singular: 'Unidad de medida',
      agregado: 'agregada',
      actualizado: 'actualizada',
    },
  }

  // Nunca lanza: si la recarga falla despues de guardar, el guardado igual se hizo
  // y no tiene que informarse como error de guardado.
  const recargar = async (clave) => {
    const catalogo = catalogos[clave]

    catalogo.listado.recargar()
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

  if (primeraCargaTipos || primeraCargaUnidades) {
    return <AppLayout><PageLoader /></AppLayout>
  }

  return (
    <AppLayout>
      <PageHeader
        subtitle="Valores que eligen todas las empresas al cargar sus productos."
        title="Configuracion"
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div><CatalogoEditable
          campos={CAMPOS_TIPO}
          descripcion="Categorias para clasificar los productos: herbicida, fungicida, insecticida..."
          icono={Tags}
          isLoading={tipos.loading}
          items={tipos.data}
          onActualizar={actualizar('tipo')}
          onCrear={crear('tipo')}
          onEliminar={(item) => setAEliminar({ clave: 'tipo', item })}
          titulo="Tipos de producto"
        /><nav aria-label="Paginación de tipos" className="mt-4 flex items-center justify-end gap-1">
          <button aria-label="Página anterior" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 disabled:opacity-40" disabled={tipos.page === 1 || tipos.loading} onClick={() => tipos.setPage(tipos.page - 1)} type="button">‹</button>
          {tipos.page > 3 && <><button className="h-9 min-w-9 rounded-lg text-sm text-slate-600 hover:bg-emerald-50" disabled={tipos.loading} onClick={() => tipos.setPage(1)} type="button">1</button>{tipos.page > 4 && <span className="px-1 text-slate-400">…</span>}</>}
          {Array.from({ length: Math.min(3, tipos.page) + Number(tipos.hasNextPage) }, (_, i) => Math.max(1, tipos.page - 2) + i).map((numero) => <button aria-current={numero === tipos.page ? 'page' : undefined} aria-label={`Página ${numero}`} className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold ${numero === tipos.page ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-emerald-50'}`} disabled={tipos.loading || numero === tipos.page} key={numero} onClick={() => tipos.setPage(numero)} type="button">{numero}</button>)}
          <button aria-label="Página siguiente" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 disabled:opacity-40" disabled={!tipos.hasNextPage || tipos.loading} onClick={() => tipos.setPage(tipos.page + 1)} type="button">›</button>
        </nav></div>

        <div><CatalogoEditable
          campos={CAMPOS_UNIDAD}
          descripcion="La abreviatura es la que se muestra en las dosis de la orden de vuelo."
          icono={Ruler}
          isLoading={unidades.loading}
          items={unidades.data}
          onActualizar={actualizar('unidad')}
          onCrear={crear('unidad')}
          onEliminar={(item) => setAEliminar({ clave: 'unidad', item })}
          titulo="Unidades de medida"
        /><nav aria-label="Paginación de unidades" className="mt-4 flex items-center justify-end gap-1">
          <button aria-label="Página anterior" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 disabled:opacity-40" disabled={unidades.page === 1 || unidades.loading} onClick={() => unidades.setPage(unidades.page - 1)} type="button">‹</button>
          {unidades.page > 3 && <><button className="h-9 min-w-9 rounded-lg text-sm text-slate-600 hover:bg-emerald-50" disabled={unidades.loading} onClick={() => unidades.setPage(1)} type="button">1</button>{unidades.page > 4 && <span className="px-1 text-slate-400">…</span>}</>}
          {Array.from({ length: Math.min(3, unidades.page) + Number(unidades.hasNextPage) }, (_, i) => Math.max(1, unidades.page - 2) + i).map((numero) => <button aria-current={numero === unidades.page ? 'page' : undefined} aria-label={`Página ${numero}`} className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold ${numero === unidades.page ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-emerald-50'}`} disabled={unidades.loading || numero === unidades.page} key={numero} onClick={() => unidades.setPage(numero)} type="button">{numero}</button>)}
          <button aria-label="Página siguiente" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 disabled:opacity-40" disabled={!unidades.hasNextPage || unidades.loading} onClick={() => unidades.setPage(unidades.page + 1)} type="button">›</button>
        </nav></div>
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
