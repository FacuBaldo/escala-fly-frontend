import { useState } from 'react'
import { claseCampo, claseEtiqueta } from '../compartidos/formularios/estilosFormulario'

const emptyForm = {
  nombre: '',
  email: '',
  telefono: '',
}

function EmpresaForm({ editingEmpresa, isSaving, onCancel, onSave }) {
  const [form, setForm] = useState(() =>
    editingEmpresa
      ? {
          nombre: editingEmpresa.nombre,
          email: editingEmpresa.email || '',
          telefono: editingEmpresa.telefono || '',
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
          Nombre de la empresa
          <input
            className={`h-11 ${claseCampo}`}
            name="nombre"
            onChange={handleChange}
            required
            type="text"
            value={form.nombre}
          />
        </label>

        <label className={claseEtiqueta}>
          Correo electronico (Opcional)
          <input
            autoComplete="email"
            className={`h-11 ${claseCampo}`}
            name="email"
            onChange={handleChange}
            type="email"
            value={form.email}
          />
        </label>

        <label className={claseEtiqueta}>
          Telefono (Opcional)
          <input
            className={`h-11 ${claseCampo}`}
            name="telefono"
            onChange={handleChange}
            type="text"
            value={form.telefono}
          />
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            className="rounded-md bg-emerald-700 px-4 py-2 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Guardando...' : editingEmpresa ? 'Guardar cambios' : 'Crear empresa'}
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

export default EmpresaForm
