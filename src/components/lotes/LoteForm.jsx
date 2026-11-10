import { useState } from 'react'
import { claseCampo, claseEtiqueta } from '../compartidos/formularios/estilosFormulario'

function LoteForm({ editingLote, isSaving, nombreCampo, onCancel, onSave, pistas = [] }) {
  const [form, setForm] = useState(() => ({
    nombre: editingLote?.nombre || '',
    descripcion: editingLote?.descripcion || '',
    pistaPrincipalId: editingLote?.pistaPrincipalId || '',
    pistaCargaId: editingLote?.pistaCargaId || '',
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

    // Las pistas son opcionales: si no se eligen, viajan como null
    await onSave({
      ...form,
      pistaPrincipalId: form.pistaPrincipalId || null,
      pistaCargaId: form.pistaCargaId || null,
    })
  }

  const pistasActivas = pistas.filter((pista) => pista.activo || pista.id === form.pistaPrincipalId || pista.id === form.pistaCargaId)

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className={claseEtiqueta}>
        Nombre del lote
        <input
          autoFocus
          className={`h-11 ${claseCampo}`}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={claseEtiqueta}>
          Pista principal
          <select
            className={`h-11 ${claseCampo}`}
            name="pistaPrincipalId"
            onChange={handleChange}
            value={form.pistaPrincipalId}
          >
            <option value="">Sin asignar</option>
            {pistasActivas.map((pista) => (
              <option key={pista.id} value={pista.id}>
                {pista.nombre}
                {pista.activo ? '' : ' (de baja)'}
              </option>
            ))}
          </select>
        </label>

        <label className={claseEtiqueta}>
          Pista de carga
          <select
            className={`h-11 ${claseCampo}`}
            name="pistaCargaId"
            onChange={handleChange}
            value={form.pistaCargaId}
          >
            <option value="">Sin asignar</option>
            {pistasActivas.map((pista) => (
              <option key={pista.id} value={pista.id}>
                {pista.nombre}
                {pista.activo ? '' : ' (de baja)'}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
        El avion despega y aterriza en la pista principal, y recarga caldo en la de carga. Pueden ser
        la misma. Hacen falta las dos para poder generar la ruta de vuelo del lote.
      </p>

      <label className={claseEtiqueta}>
        Descripcion (Opcional)
        <textarea
          className={`min-h-24 py-2 ${claseCampo}`}
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
