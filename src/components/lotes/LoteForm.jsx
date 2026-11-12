import { useEffect, useRef, useState } from 'react'
import { claseCampo, claseEtiqueta } from '../compartidos/formularios/estilosFormulario'
import apiClient from '../../api/apiClient'
import SelectorConBusqueda from '../compartidos/formularios/SelectorConBusqueda'

function SelectorRemoto({ url, value, onChange, name, placeholder, seleccion, empresaId, activo, disabled = false, required = false, etiqueta = (item) => item.nombre, onSeleccionado }) {
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

function LoteForm({ editingLote, empresaId, isSaving, nombreCampo, onCancel, onSave }) {
  const [form, setForm] = useState(() => ({
    nombre: editingLote?.nombre || '',
    descripcion: editingLote?.descripcion || '',
    pistaPrincipalId: editingLote?.pistaPrincipalId || '',
    pistaCargaId: editingLote?.pistaCargaId || '',
  }))

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    // Las pistas son opcionales: si no se eligen, viajan como null
    await onSave({
      ...form,
      pistaPrincipalId: form.pistaPrincipalId || null,
      pistaCargaId: form.pistaCargaId || null,
    })
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className={claseEtiqueta}>
        Nombre del lote
        <input
          autoFocus
          className={`h-11 ${claseCampo}`}
          name="nombre"
          onChange={handleChange}
          required
          type="text"
          value={form.nombre}
        />
      </label>

      <p className="text-sm text-slate-600">
        Campo: <span className="font-semibold text-slate-950">{nombreCampo}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={claseEtiqueta}>
          Pista principal
          <SelectorRemoto activo empresaId={empresaId} etiqueta={(pista) => `${pista.nombre}${pista.activo ? '' : ' (de baja)'}`} name="pistaPrincipalId" onChange={handleChange} placeholder="Sin asignar" url="/pistas" value={form.pistaPrincipalId} />
        </label>

        <label className={claseEtiqueta}>
          Pista de carga
          <SelectorRemoto activo empresaId={empresaId} etiqueta={(pista) => `${pista.nombre}${pista.activo ? '' : ' (de baja)'}`} name="pistaCargaId" onChange={handleChange} placeholder="Sin asignar" url="/pistas" value={form.pistaCargaId} />
        </label>
      </div>

      <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
        El avion despega y aterriza en la pista principal, y recarga caldo en la de carga. Pueden ser
        la misma. Hacen falta las dos para poder generar la ruta de vuelo del lote.
      </p>

      <label className={claseEtiqueta}>
        Descripcion (Opcional)
        <textarea
          className={`min-h-24 py-2 ${claseCampo}`}
          name="descripcion"
          onChange={handleChange}
          value={form.descripcion}
        />
      </label>

      {!editingLote && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          La superficie en hectareas se calcula automaticamente a partir del poligono dibujado.
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          className="rounded-md bg-emerald-700 px-4 py-2 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? 'Guardando...' : editingLote ? 'Guardar cambios' : 'Crear lote'}
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
  )
}

export default LoteForm
