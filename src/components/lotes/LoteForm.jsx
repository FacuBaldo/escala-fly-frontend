import { useState } from 'react'

const inputClassName =
  'rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'

function LoteForm({ editingLote, isSaving, nombreCampo, onCancel, onSave }) {
  const [form, setForm] = useState(() => ({
    nombre: editingLote?.nombre || '',
    descripcion: editingLote?.descripcion || '',
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
    await onSave(form)
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Nombre del lote
        <input
          autoFocus
          className={`h-11 ${inputClassName}`}
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

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Descripcion (Opcional)
        <textarea
          className={`min-h-24 py-2 ${inputClassName}`}
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
