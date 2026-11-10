import { useState } from 'react'
import { claseCampo, claseEtiqueta } from '../compartidos/formularios/estilosFormulario'

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

const LONGITUD_MINIMA_CONTRASENA = 8

function UsuarioForm({ editingUsuario, empresas, isAdmin, isPropioUsuario = false, isSaving, onCancel, onSave }) {
  // El backend no permite cambiar el propio rol; un ENCARGADO solo asigna pilotos y clientes
  const rolesAsignables = isAdmin ? ['ADMIN', 'ENCARGADO', 'PILOTO', 'CLIENTE'] : ['PILOTO', 'CLIENTE']
  const rolesDisponibles =
    editingUsuario && !rolesAsignables.includes(editingUsuario.rol)
      ? [editingUsuario.rol, ...rolesAsignables]
      : rolesAsignables
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
        <label className={claseEtiqueta}>
          Nombre
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
          Apellido
          <input
            className={`h-11 ${claseCampo}`}
            name="apellido"
            onChange={handleChange}
            required
            type="text"
            value={form.apellido}
          />
        </label>

        <label className={claseEtiqueta}>
          Correo electronico
          <input
            autoComplete="email"
            className={`h-11 ${claseCampo}`}
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={form.email}
          />
        </label>

        <label className={claseEtiqueta}>
          Rol
          <select
            className={`h-11 ${claseCampo}`}
            disabled={isPropioUsuario}
            name="rol"
            onChange={handleChange}
            required
            title={isPropioUsuario ? 'No podes cambiar tu propio rol' : undefined}
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
          <label className={claseEtiqueta}>
            Empresa
            <select
              className={`h-11 ${claseCampo}`}
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

        <label className={claseEtiqueta}>
          {editingUsuario ? 'Nueva contrasena' : 'Contrasena'}
          <input
            autoComplete="new-password"
            className={`h-11 ${claseCampo}`}
            minLength={LONGITUD_MINIMA_CONTRASENA}
            name="contrasena"
            onChange={handleChange}
            required={!editingUsuario}
            type="password"
            value={form.contrasena}
          />
          <span className="text-xs font-normal text-slate-500">
            {editingUsuario
              ? `Dejala vacia para mantener la contrasena actual. Minimo ${LONGITUD_MINIMA_CONTRASENA} caracteres.`
              : `Minimo ${LONGITUD_MINIMA_CONTRASENA} caracteres.`}
          </span>
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
