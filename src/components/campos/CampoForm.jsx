import { useEffect, useRef, useState } from 'react'
import { claseCampo, claseEtiqueta } from '../compartidos/formularios/estilosFormulario'
import apiClient from '../../api/apiClient'
import SelectorEmpresa from '../compartidos/formularios/SelectorEmpresa'
import SelectorConBusqueda from '../compartidos/formularios/SelectorConBusqueda'

export function SelectorRemoto({ url, value, onChange, name, placeholder, seleccion, empresaId, activo, disabled = false, required = false, etiqueta = (item) => item.nombre, onSeleccionado }) {
  const [opciones, setOpciones] = useState([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [hayMas, setHayMas] = useState(false)
  const [error, setError] = useState('')
  const [actual, setActual] = useState(seleccion || null)
  const callback = useRef(onSeleccionado)
  useEffect(() => { callback.current = onSeleccionado }, [onSeleccionado])
  useEffect(() => {
    if (disabled) return undefined
    let vigente = true
    const timer = setTimeout(() => apiClient.get(url, { params: { page, limit: 20, search, ...(empresaId ? { empresaId } : {}), ...(activo !== undefined ? { activo } : {}) } }).then(({ data }) => {
      if (vigente) { setOpciones((previas) => page === 1 ? data.data : [...previas, ...data.data.filter((item) => !previas.some((previo) => previo.id === item.id))]); setHayMas(data.pagination.hasNextPage); setError('') }
    }).catch(() => { if (vigente) setError('No se pudieron cargar las opciones.') }), 250)
    return () => { vigente = false; clearTimeout(timer) }
  }, [url, page, search, empresaId, activo, disabled])
  useEffect(() => {
    if (!value) return undefined
    const encontrado = opciones.find((item) => item.id === value) || (seleccion?.id === value ? seleccion : null) || (actual?.id === value ? actual : null)
    if (encontrado) { callback.current?.(encontrado); return undefined }
    let vigente = true
    apiClient.get(`${url}/${encodeURIComponent(value)}`).then(({ data }) => { if (vigente) { setActual(data); callback.current?.(data) } }).catch(() => {})
    return () => { vigente = false }
  }, [url, value, opciones, seleccion, actual])
  const elegida = opciones.find((item) => item.id === value) || (seleccion?.id === value ? seleccion : null) || (actual?.id === value ? actual : null)
  return <SelectorConBusqueda busqueda={search} disabled={disabled} error={error} etiqueta={etiqueta} hayMas={hayMas} onBuscar={(texto) => { if (texto !== search) { setOpciones([]); setHayMas(false) } setPage(1); setSearch(texto) }} onCargarMas={() => setPage((p) => p + 1)} onSeleccionar={(item) => { setActual(item); callback.current?.(item); onChange({ target: { name, value: item?.id || '' } }, item) }} opciones={opciones} placeholder={placeholder} required={required} seleccion={elegida} value={value} />
}

const emptyForm = {
  nombre: '',
  ubicacion: '',
  empresaId: '',
}

function CampoForm({ editingCampo, isSaving, onCancel, onSave, showEmpresa = true }) {
  const [form, setForm] = useState(() =>
    editingCampo
      ? {
          nombre: editingCampo.nombre,
          ubicacion: editingCampo.ubicacion || '',
          empresaId: editingCampo.empresaId,
        }
      : emptyForm,
  )

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSave(form)
  }

  return (
    <div>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className={claseEtiqueta}>
          Nombre del campo
          <input
            className={`h-11 ${claseCampo}`}
            name="nombre"
            onChange={handleChange}
            required
            type="text"
            value={form.nombre}
          />
        </label>

        {showEmpresa && (
          <label className={claseEtiqueta}>
            Empresa
            <SelectorEmpresa name="empresaId" onChange={handleChange} placeholder="Selecciona una empresa" required seleccion={editingCampo?.empresa} value={form.empresaId} />
          </label>
        )}

        <label className={claseEtiqueta}>
          Ubicacion (Opcional)
          <input
            className={`h-11 ${claseCampo}`}
            name="ubicacion"
            onChange={handleChange}
            type="text"
            value={form.ubicacion}
          />
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            className="rounded-md bg-emerald-700 px-4 py-2 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Guardando...' : editingCampo ? 'Guardar cambios' : 'Crear campo'}
          </button>

          <button
            className="rounded-md border border-slate-200 bg-white px-4 py-2 font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export default CampoForm
