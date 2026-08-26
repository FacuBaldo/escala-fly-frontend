import { useState } from 'react'

const emptyForm = {
  nombre: '',
  apellido: '',
  email: '',
  contrasena: '',
  rol: 'CLIENTE',
  empresaId: '',
}

const rolLabels = {
  ADMIN: 'Admin',
  ENCARGADO: 'Encargado',
  PILOTO: 'Piloto',
  CLIENTE: 'Cliente',
}

function UsuarioForm({ editingUsuario, empresas, isAdmin, isSaving, onCancel, onSave }) {
  const rolesDisponibles = isAdmin ? ['ADMIN', 'ENCARGADO', 'PILOTO', 'CLIENTE'] : ['ENCARGADO', 'PILOTO', 'CLIENTE']
  const [form, setForm] = useState(() =>
    editingUsuario
      ? {
          nombre: editingUsuario.nombre,
          apellido: editingUsuario.apellido,
          email: editingUsuario.email,
          contrasena: '',
          rol: editingUsuario.rol,
          empresaId: editingUsuario.empresaId || '',
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

  const requiresEmpresa = form.rol !== 'ADMIN'

  return (
    <div>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Nombre
          <input
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            name="nombre"
            onChange={handleChange}
            required
            type="text"
            value={form.nombre}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Apellido
          <input
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            name="apellido"
            onChange={handleChange}
            required
            type="text"
            value={form.apellido}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Correo electronico
          <input
            autoComplete="email"
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={form.email}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Rol
          <select
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            name="rol"
            onChange={handleChange}
            required
            value={form.rol}
          >
            {rolesDisponibles.map((rol) => (
              <option key={rol} value={rol}>
                {rolLabels[rol]}
              </option>
            ))}
          </select>
        </label>

        {isAdmin && requiresEmpresa && (
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Empresa
            <select
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              name="empresaId"
              onChange={handleChange}
              required
              value={form.empresaId}
            >
              <option value="">Selecciona una empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          {editingUsuario ? 'Nueva contrasena' : 'Contrasena'}
          <input
            autoComplete="new-password"
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            name="contrasena"
            onChange={handleChange}
            required={!editingUsuario}
            type="password"
            value={form.contrasena}
          />
          {editingUsuario && (
            <span className="text-xs font-normal text-slate-500">Dejala vacia para mantener la contrasena actual.</span>
          )}
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            className="rounded-md bg-emerald-700 px-4 py-2 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Guardando...' : editingUsuario ? 'Guardar cambios' : 'Crear usuario'}
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

export default UsuarioForm
