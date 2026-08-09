import { useState } from 'react'

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
}

function UserForm({ editingUser, isSaving, onCancel, onSave }) {
  const [form, setForm] = useState(() =>
    editingUser
      ? {
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          email: editingUser.email,
          password: '',
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
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Nombre
          <input
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            name="firstName"
            onChange={handleChange}
            required
            type="text"
            value={form.firstName}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Apellido
          <input
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            name="lastName"
            onChange={handleChange}
            required
            type="text"
            value={form.lastName}
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
          Contrasena
          <input
            autoComplete="new-password"
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={form.password}
          />
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            className="rounded-md bg-emerald-700 px-4 py-2 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Guardando...' : editingUser ? 'Guardar cambios' : 'Crear usuario'}
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

export default UserForm
