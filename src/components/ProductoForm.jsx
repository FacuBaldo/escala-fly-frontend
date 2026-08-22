import { useState } from 'react'

const TIPOS_PRODUCTO = [
  { value: 'HERBICIDA', label: 'Herbicida' },
  { value: 'FUNGICIDA', label: 'Fungicida' },
  { value: 'INSECTICIDA', label: 'Insecticida' },
  { value: 'FERTILIZANTE', label: 'Fertilizante' },
  { value: 'COADYUVANTE', label: 'Coadyuvante' },
  { value: 'OTRO', label: 'Otro' },
]

const emptyForm = {
  nombre: '',
  marca: '',
  tipo: 'HERBICIDA',
  unidadMedida: '',
  descripcion: '',
  empresaId: '',
}

function ProductoForm({ editingProducto, empresas, isSaving, onCancel, onSave }) {
  const [form, setForm] = useState(() =>
    editingProducto
      ? {
          nombre: editingProducto.nombre,
          marca: editingProducto.marca || '',
          tipo: editingProducto.tipo || 'HERBICIDA',
          unidadMedida: editingProducto.unidadMedida,
          descripcion: editingProducto.descripcion || '',
          empresaId: editingProducto.empresaId,
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
          Nombre del producto
          <input
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            name="nombre"
            onChange={handleChange}
            placeholder="Ej: Glifosato, Atrazina..."
            required
            type="text"
            value={form.nombre}
          />
        </label>

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Tipo / Categoria
            <select
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              name="tipo"
              onChange={handleChange}
              required
              value={form.tipo}
            >
              {TIPOS_PRODUCTO.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Marca (Opcional)
            <input
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              name="marca"
              onChange={handleChange}
              placeholder="Ej: Syngenta, Bayer..."
              type="text"
              value={form.marca}
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Unidad de medida
          <input
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            name="unidadMedida"
            onChange={handleChange}
            placeholder="Ej: l/ha, kg/ha, cc/ha, litros, kg..."
            required
            type="text"
            value={form.unidadMedida}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Descripcion (Opcional)
          <textarea
            className="rounded-md border border-slate-200 bg-white p-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 min-h-[80px]"
            name="descripcion"
            onChange={handleChange}
            placeholder="Notas o especificaciones adicionales..."
            value={form.descripcion}
          />
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            className="rounded-md bg-emerald-700 px-4 py-2 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Guardando...' : editingProducto ? 'Guardar cambios' : 'Crear producto'}
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

export default ProductoForm
export { TIPOS_PRODUCTO }
