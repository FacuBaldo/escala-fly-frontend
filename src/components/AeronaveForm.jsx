import { useState } from 'react'

const emptyForm = {
  matricula: '',
  modelo: '',
  fabricante: '',
  estado: 'ACTIVA',
  observaciones: '',
  empresaId: '',
}

const estadoOptions = [
  { value: 'ACTIVA', label: 'Activa' },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'INACTIVA', label: 'Inactiva' },
]

function AeronaveForm({ editingAeronave, empresas, isSaving, onCancel, onSave }) {
  const [form, setForm] = useState(() =>
    editingAeronave
      ? {
          matricula: editingAeronave.matricula,
          modelo: editingAeronave.modelo,
          fabricante: editingAeronave.fabricante || '',
          estado: editingAeronave.estado,
          observaciones: editingAeronave.observaciones || '',
          empresaId: editingAeronave.empresaId,
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
        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Matricula
            <input
              className="h-11 rounded-md border border-slate-200 bg-white px-3 uppercase text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              name="matricula"
              onChange={handleChange}
              required
              type="text"
              value={form.matricula}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Estado
            <select
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              name="estado"
              onChange={handleChange}
              value={form.estado}
            >
              {estadoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Empresa
          <select
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Modelo
          <input
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            name="modelo"
            onChange={handleChange}
            placeholder="Ej: Air Tractor AT-502"
            required
            type="text"
            value={form.modelo}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Fabricante (Opcional)
          <input
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            name="fabricante"
            onChange={handleChange}
            type="text"
            value={form.fabricante}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Observaciones (Opcional)
          <textarea
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            name="observaciones"
            onChange={handleChange}
            rows={2}
            value={form.observaciones}
          />
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            className="rounded-md bg-emerald-700 px-4 py-2 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Guardando...' : editingAeronave ? 'Guardar cambios' : 'Crear aeronave'}
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

export default AeronaveForm
