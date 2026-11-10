import { useEffect, useRef, useState } from 'react'
import apiClient from '../../api/apiClient'
import { MapPin } from 'lucide-react'
import { claseAyuda, claseCampo, claseEtiqueta } from '../compartidos/formularios/estilosFormulario'

/**
 * Datos de la pista. La ubicacion se marca sobre el mapa de la pantalla antes de
 * abrir este formulario; aca llegan las coordenadas ya cargadas y se pueden
 * corregir a mano si se tiene el dato exacto (por ejemplo, de un GPS).
 */
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
  return <span className="grid gap-1"><input aria-label={`Buscar ${placeholder}`} className={`h-9 text-sm ${claseCampo}`} disabled={disabled} onChange={(e) => { setPage(1); setSearch(e.target.value) }} placeholder="Buscar..." type="search" value={search} /><select className={`h-11 ${claseCampo}`} disabled={disabled} name={name} onChange={(e) => { const item = opciones.find((opcion) => opcion.id === e.target.value) || null; setActual(item); callback.current?.(item); onChange(e, item) }} required={required} value={value}><option value="">{placeholder}</option>{elegida && !opciones.some((item) => item.id === elegida.id) && <option value={elegida.id}>{etiqueta(elegida)}</option>}{opciones.map((item) => <option key={item.id} value={item.id}>{etiqueta(item)}</option>)}</select>{hayMas && <button className="justify-self-start text-xs font-semibold text-emerald-700" disabled={disabled} onClick={() => setPage((p) => p + 1)} type="button">Cargar 20 más</button>}{error && <span className="text-xs text-red-700">{error}</span>}</span>
}

function PistaForm({ editingPista, isSaving, onCancel, onSave, showEmpresa = false, ubicacionInicial }) {
  const [form, setForm] = useState(() => ({
    nombre: editingPista?.nombre || '',
    descripcion: editingPista?.descripcion || '',
    latitud: editingPista?.latitud ?? ubicacionInicial?.latitud ?? '',
    longitud: editingPista?.longitud ?? ubicacionInicial?.longitud ?? '',
    empresaId: editingPista?.empresaId || '',
  }))

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSave({
      ...form,
      latitud: Number(form.latitud),
      longitud: Number(form.longitud),
    })
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className={claseEtiqueta}>
        Nombre de la pista
        <input
          autoFocus
          className={`h-11 ${claseCampo}`}
          name="nombre"
          onChange={handleChange}
          placeholder="Ej: Pista Quebracho"
          required
          type="text"
          value={form.nombre}
        />
      </label>

      {showEmpresa && (
        <label className={claseEtiqueta}>
          Empresa
          <SelectorRemoto disabled={Boolean(editingPista)} name="empresaId" onChange={handleChange} placeholder="Selecciona una empresa" required seleccion={editingPista ? { id: editingPista.empresaId, nombre: editingPista.empresaNombre } : null} url="/empresas" value={form.empresaId} />
          {/* El backend no mueve pistas entre empresas: sus lotes y ordenes quedarian apuntando a otra */}
          {editingPista && (
            <span className={claseAyuda}>Una pista no se puede pasar a otra empresa.</span>
          )}
        </label>
      )}

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <MapPin aria-hidden="true" className="text-emerald-700" size={16} />
          Ubicacion
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={claseEtiqueta}>
            Latitud
            <input
              className={`h-11 ${claseCampo}`}
              max={90}
              min={-90}
              name="latitud"
              onChange={handleChange}
              placeholder="-31.4278"
              required
              step="any"
              type="number"
              value={form.latitud}
            />
          </label>

          <label className={claseEtiqueta}>
            Longitud
            <input
              className={`h-11 ${claseCampo}`}
              max={180}
              min={-180}
              name="longitud"
              onChange={handleChange}
              placeholder="-62.0828"
              required
              step="any"
              type="number"
              value={form.longitud}
            />
          </label>
        </div>

        <p className={claseAyuda}>
          {editingPista
            ? 'Para cambiarla de lugar es mas comodo usar "Mover" sobre el mapa. Aca podes corregir las coordenadas a mano.'
            : 'Se completo con el punto que marcaste en el mapa. Podes corregirla a mano si tenes la coordenada exacta.'}
        </p>
      </div>

      <label className={claseEtiqueta}>
        Descripcion (Opcional)
        <textarea
          className={`min-h-20 py-2 ${claseCampo}`}
          name="descripcion"
          onChange={handleChange}
          placeholder="Ej: pista de cesped de 800 m"
          value={form.descripcion}
        />
      </label>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button
          className="rounded-md bg-emerald-700 px-4 py-2 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? 'Guardando...' : editingPista ? 'Guardar cambios' : 'Crear pista'}
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

export default PistaForm
