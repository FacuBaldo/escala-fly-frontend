import { useState } from 'react'
import { MapPin } from 'lucide-react'
import SelectorUbicacion from './SelectorUbicacion'

const inputClassName =
  'rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'

function PistaForm({ editingPista, empresas, isSaving, onCancel, onSave, showEmpresa = false }) {
  const [form, setForm] = useState(() => ({
    nombre: editingPista?.nombre || '',
    descripcion: editingPista?.descripcion || '',
    latitud: editingPista?.latitud ?? '',
    longitud: editingPista?.longitud ?? '',
    empresaId: editingPista?.empresaId || '',
  }))

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const seleccionarEnMapa = (lat, lng) => {
    setForm((currentForm) => ({
      ...currentForm,
      latitud: Number(lat.toFixed(6)),
      longitud: Number(lng.toFixed(6)),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSave({
      ...form,
      latitud: Number(form.latitud),
      longitud: Number(form.longitud),
    })
  }

  const latitudNumero = Number(form.latitud)
  const longitudNumero = Number(form.longitud)
  const tieneUbicacion = form.latitud !== '' && form.longitud !== '' && Number.isFinite(latitudNumero) && Number.isFinite(longitudNumero)

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Nombre de la pista
        <input
          autoFocus
          className={`h-11 ${inputClassName}`}
          name="nombre"
          onChange={handleChange}
          placeholder="Ej: Pista Quebracho"
          required
          type="text"
          value={form.nombre}
        />
      </label>

      {showEmpresa && (
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Empresa
          <select
            className={`h-11 ${inputClassName}`}
            name="empresaId"
            onChange={handleChange}
            required
            value={form.empresaId}
          >
            <option disabled value="">
              Selecciona una empresa
            </option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nombre}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="grid gap-2">
        <span className="flex items-center gap-1 text-sm font-semibold text-slate-700">
          <MapPin aria-hidden="true" size={16} />
          Ubicacion
        </span>
        <p className="text-xs text-slate-500">
          Hace clic en el mapa para marcar la pista, o busca la zona por ciudad, direccion o coordenadas.
        </p>
        <SelectorUbicacion
          latitud={tieneUbicacion ? latitudNumero : undefined}
          longitud={tieneUbicacion ? longitudNumero : undefined}
          onSeleccionar={seleccionarEnMapa}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Latitud
          <input
            className={`h-11 ${inputClassName}`}
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

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Longitud
          <input
            className={`h-11 ${inputClassName}`}
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

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Descripcion (Opcional)
        <textarea
          className={`min-h-20 py-2 ${inputClassName}`}
          name="descripcion"
          onChange={handleChange}
          placeholder="Ej: pista de cesped de 800 m"
          value={form.descripcion}
        />
      </label>

      <div className="flex flex-wrap gap-2 pt-2">
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
