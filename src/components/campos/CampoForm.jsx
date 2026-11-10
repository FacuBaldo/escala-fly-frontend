import { useState } from 'react'
import { claseCampo, claseEtiqueta } from '../compartidos/formularios/estilosFormulario'

const emptyForm = {
  nombre: '',
  ubicacion: '',
  empresaId: '',
}

function CampoForm({ editingCampo, empresas, isSaving, onCancel, onSave, showEmpresa = true }) {
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
