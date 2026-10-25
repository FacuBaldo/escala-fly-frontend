import { useState } from 'react'
import { Droplets, Plane, StickyNote } from 'lucide-react'
import CampoConUnidad from './formulario/CampoConUnidad'
import SeccionFormulario from './formulario/SeccionFormulario'
import { claseAyuda, claseCampo, claseEtiqueta } from './formulario/estilosFormulario'

const emptyForm = {
  matricula: '',
  modelo: '',
  fabricante: '',
  estado: 'ACTIVA',
  capacidadUtilLitros: '',
  anchoAplicacionMetros: '',
  radioGiroMetros: '',
  observaciones: '',
  empresaId: '',
}

const estadoOptions = [
  { value: 'ACTIVA', label: 'Activa' },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'INACTIVA', label: 'Inactiva' },
]

function AeronaveForm({ editingAeronave, empresas, isSaving, onCancel, onSave, showEmpresa = true }) {
  const [form, setForm] = useState(() =>
    editingAeronave
      ? {
          matricula: editingAeronave.matricula,
          modelo: editingAeronave.modelo,
          fabricante: editingAeronave.fabricante || '',
          estado: editingAeronave.estado,
          capacidadUtilLitros: editingAeronave.capacidadUtilLitros ?? '',
          anchoAplicacionMetros: editingAeronave.anchoAplicacionMetros ?? '',
          radioGiroMetros: editingAeronave.radioGiroMetros ?? '',
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

    // Los campos numericos opcionales viajan como numero o como null
    await onSave({
      ...form,
      capacidadUtilLitros: form.capacidadUtilLitros === '' ? null : Number(form.capacidadUtilLitros),
      anchoAplicacionMetros: form.anchoAplicacionMetros === '' ? null : Number(form.anchoAplicacionMetros),
      radioGiroMetros: form.radioGiroMetros === '' ? null : Number(form.radioGiroMetros),
    })
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <SeccionFormulario
        descripcion="Como se identifica el avion y a que empresa pertenece."
        icono={Plane}
        titulo="Identificacion"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={claseEtiqueta}>
            Matricula
            <input
              className={`h-11 uppercase ${claseCampo}`}
              name="matricula"
              onChange={handleChange}
              placeholder="Ej: LV-ABC"
              required
              type="text"
              value={form.matricula}
            />
          </label>

          <label className={claseEtiqueta}>
            Estado
            <select
              className={`h-11 ${claseCampo}`}
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

          <label className={claseEtiqueta}>
            Modelo
            <input
              className={`h-11 ${claseCampo}`}
              name="modelo"
              onChange={handleChange}
              placeholder="Ej: Air Tractor AT-502"
              required
              type="text"
              value={form.modelo}
            />
          </label>

          <label className={claseEtiqueta}>
            Fabricante (Opcional)
            <input
              className={`h-11 ${claseCampo}`}
              name="fabricante"
              onChange={handleChange}
              placeholder="Ej: Air Tractor"
              type="text"
              value={form.fabricante}
            />
          </label>
        </div>

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
      </SeccionFormulario>

      <SeccionFormulario
        descripcion="Opcional: se usan para completar sola la orden de vuelo cuando se elige esta aeronave."
        icono={Droplets}
        titulo="Datos de aplicacion"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <CampoConUnidad
            ayuda="Litros que carga la tolva por vuelo."
            etiqueta="Capacidad util de caldo"
            min={1}
            name="capacidadUtilLitros"
            onChange={handleChange}
            placeholder="1500"
            unidad="L"
            value={form.capacidadUtilLitros}
          />

          <CampoConUnidad
            ayuda="Ancho que cubre cada pasada."
            etiqueta="Ancho de aplicacion"
            max={100}
            min={1}
            name="anchoAplicacionMetros"
            onChange={handleChange}
            placeholder="25"
            unidad="m"
            value={form.anchoAplicacionMetros}
          />

          <CampoConUnidad
            ayuda="Con el que vira al final de cada pasada. Suele estar entre 150 y 300 m."
            etiqueta="Radio de giro"
            max={1000}
            min={30}
            name="radioGiroMetros"
            onChange={handleChange}
            placeholder="200"
            unidad="m"
            value={form.radioGiroMetros}
          />
        </div>
      </SeccionFormulario>

      <SeccionFormulario descripcion="Opcional." icono={StickyNote} titulo="Observaciones">
        <label className={claseEtiqueta}>
          <span className="sr-only">Observaciones</span>
          <textarea
            className={`py-2 ${claseCampo}`}
            name="observaciones"
            onChange={handleChange}
            placeholder="Ej: habilitada para vuelo nocturno"
            rows={2}
            value={form.observaciones}
          />
          <span className={claseAyuda}>Cualquier dato de la aeronave que convenga recordar.</span>
        </label>
      </SeccionFormulario>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
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
  )
}

export default AeronaveForm
