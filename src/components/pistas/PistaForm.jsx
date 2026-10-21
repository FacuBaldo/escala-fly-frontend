import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { claseAyuda, claseCampo, claseEtiqueta } from '../formulario/estilosFormulario'

/**
 * Datos de la pista. La ubicacion se marca sobre el mapa de la pantalla antes de
 * abrir este formulario; aca llegan las coordenadas ya cargadas y se pueden
 * corregir a mano si se tiene el dato exacto (por ejemplo, de un GPS).
 */
function PistaForm({ editingPista, empresas, isSaving, onCancel, onSave, showEmpresa = false, ubicacionInicial }) {
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
          <select
            className={`h-11 ${claseCampo}`}
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
