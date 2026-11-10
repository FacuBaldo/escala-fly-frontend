import { useState } from 'react'
import { claseCampo, claseEtiqueta } from '../compartidos/formularios/estilosFormulario'

const emptyForm = {
  nombre: '',
  marca: '',
  tipoId: '',
  unidadMedidaId: '',
  descripcion: '',
  empresaId: '',
}

const avisoCatalogoVacio = (faltante) => `${faltante} Se cargan desde Configuracion, que administra el ADMIN.`

/** El tipo y la unidad se eligen de los catalogos que administra el ADMIN en Configuracion */
function ProductoForm({
  editingProducto,
  empresas,
  isSaving,
  onCancel,
  onSave,
  showEmpresa = true,
  tipos = [],
  unidades = [],
}) {
  const [form, setForm] = useState(() =>
    editingProducto
      ? {
          nombre: editingProducto.nombre,
          marca: editingProducto.marca || '',
          tipoId: editingProducto.tipoId,
          unidadMedidaId: editingProducto.unidadMedidaId,
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
        <label className={claseEtiqueta}>
          Nombre del producto
          <input
            className={`h-11 ${claseCampo}`}
            name="nombre"
            onChange={handleChange}
            placeholder="Ej: Glifosato, Atrazina..."
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={claseEtiqueta}>
            Tipo / Categoria
            <select
              className={`h-11 ${claseCampo}`}
              name="tipoId"
              onChange={handleChange}
              required
              value={form.tipoId}
            >
              <option disabled value="">
                Selecciona un tipo
              </option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
            {tipos.length === 0 && (
              <span className="text-xs font-normal text-amber-700">{avisoCatalogoVacio('No hay tipos de producto cargados.')}</span>
            )}
          </label>

          <label className={claseEtiqueta}>
            Marca (Opcional)
            <input
              className={`h-11 ${claseCampo}`}
              name="marca"
              onChange={handleChange}
              placeholder="Ej: Syngenta, Bayer..."
              type="text"
              value={form.marca}
            />
          </label>
        </div>

        <label className={claseEtiqueta}>
          Unidad de medida
          <select
            className={`h-11 ${claseCampo}`}
            name="unidadMedidaId"
            onChange={handleChange}
            required
            value={form.unidadMedidaId}
          >
            <option disabled value="">
              Selecciona una unidad
            </option>
            {unidades.map((unidad) => (
              <option key={unidad.id} value={unidad.id}>
                {unidad.nombre} ({unidad.abreviatura})
              </option>
            ))}
          </select>
          {unidades.length === 0 ? (
            <span className="text-xs font-normal text-amber-700">{avisoCatalogoVacio('No hay unidades de medida cargadas.')}</span>
          ) : (
            <span className="text-xs font-normal text-slate-500">
              Es la unidad en la que se expresa la dosis por hectarea en las ordenes de vuelo.
            </span>
          )}
        </label>

        <label className={claseEtiqueta}>
          Descripcion (Opcional)
          <textarea
            className={`min-h-20 py-3 ${claseCampo}`}
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
