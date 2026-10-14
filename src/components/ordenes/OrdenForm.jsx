import { useState } from 'react'
import { AlertTriangle, Droplets, Package, Plane, StickyNote } from 'lucide-react'
import SelectorProductosMezcla from './SelectorProductosMezcla'
import CampoConUnidad from '../formulario/CampoConUnidad'
import SeccionFormulario from '../formulario/SeccionFormulario'
import { claseAyuda, claseCampo, claseEtiqueta } from '../formulario/estilosFormulario'
import { formatearSuperficie } from '../../utils/lotes'

const soloFecha = (valor) => (valor ? String(valor).slice(0, 10) : '')

function OrdenForm({ aeronaves, editingOrden, isSaving, lotes, onCancel, onSave, productos }) {
  const [form, setForm] = useState(() => ({
    loteId: editingOrden?.loteId || '',
    aeronaveId: editingOrden?.aeronaveId || '',
    anchoAplicacionMetros: editingOrden?.anchoAplicacionMetros ?? '',
    litrosPorHectarea: editingOrden?.litrosPorHectarea ?? '',
    capacidadUtilLitros: editingOrden?.capacidadUtilLitros ?? '',
    fechaPrevista: soloFecha(editingOrden?.fechaPrevista),
    observaciones: editingOrden?.observaciones || '',
  }))

  const [filasMezcla, setFilasMezcla] = useState(() =>
    (editingOrden?.productos || []).map((item) => ({
      productoId: item.productoId,
      dosisPorHectarea: item.dosisPorHectarea ?? '',
    })),
  )

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  // Al elegir aeronave se precargan sus valores de fabrica, si los tiene
  const handleAeronaveChange = (event) => {
    const aeronaveId = event.target.value
    const aeronave = aeronaves.find((item) => item.id === aeronaveId)

    setForm((currentForm) => ({
      ...currentForm,
      aeronaveId,
      anchoAplicacionMetros: aeronave?.anchoAplicacionMetros ?? currentForm.anchoAplicacionMetros,
      capacidadUtilLitros: aeronave?.capacidadUtilLitros ?? currentForm.capacidadUtilLitros,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    await onSave({
      ...form,
      anchoAplicacionMetros: Number(form.anchoAplicacionMetros),
      litrosPorHectarea: Number(form.litrosPorHectarea),
      capacidadUtilLitros: Number(form.capacidadUtilLitros),
      fechaPrevista: form.fechaPrevista || null,
      productos: filasMezcla
        .filter((fila) => fila.productoId)
        .map((fila) => ({
          productoId: fila.productoId,
          dosisPorHectarea: fila.dosisPorHectarea === '' ? null : Number(fila.dosisPorHectarea),
        })),
    })
  }

  const loteElegido = lotes.find((lote) => lote.id === form.loteId)
  const faltanPistas = loteElegido && (!loteElegido.pistaPrincipalId || !loteElegido.pistaCargaId)
  const puedeGuardar = !faltanPistas && form.loteId && form.aeronaveId

  const caldoTotal =
    loteElegido && Number(form.litrosPorHectarea) > 0
      ? Number(form.litrosPorHectarea) * Number(loteElegido.superficie || 0)
      : null

  const viajesMinimos =
    caldoTotal > 0 && Number(form.capacidadUtilLitros) > 0
      ? Math.ceil(caldoTotal / Number(form.capacidadUtilLitros))
      : null

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <SeccionFormulario
        descripcion="Sobre que lote se aplica y con que avion."
        icono={Plane}
        titulo="Lote y aeronave"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={claseEtiqueta}>
            Lote
            <select
              className={`h-11 ${claseCampo}`}
              disabled={Boolean(editingOrden)}
              name="loteId"
              onChange={handleChange}
              required
              value={form.loteId}
            >
              <option disabled value="">
                Selecciona un lote
              </option>
              {lotes.map((lote) => (
                <option key={lote.id} value={lote.id}>
                  {lote.campoNombre ? `${lote.campoNombre} · ` : ''}
                  {lote.nombre} ({formatearSuperficie(lote.superficie)})
                </option>
              ))}
            </select>
            {editingOrden && (
              <span className={claseAyuda}>
                El lote no se puede cambiar en una orden existente.
              </span>
            )}
          </label>

          <label className={claseEtiqueta}>
            Aeronave
            <select
              className={`h-11 ${claseCampo}`}
              name="aeronaveId"
              onChange={handleAeronaveChange}
              required
              value={form.aeronaveId}
            >
              <option disabled value="">
                Selecciona una aeronave
              </option>
              {aeronaves.map((aeronave) => (
                <option key={aeronave.id} value={aeronave.id}>
                  {aeronave.matricula} · {aeronave.modelo}
                </option>
              ))}
            </select>
            <span className={claseAyuda}>
              Completa sola el ancho y la capacidad de abajo.
            </span>
          </label>
        </div>

        {faltanPistas && (
          <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-900">
            <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
            <span>
              Este lote todavia no tiene pistas asignadas. Configura la pista principal y la de carga
              editando el lote para poder generar la ruta.
            </span>
          </p>
        )}
      </SeccionFormulario>

      <SeccionFormulario
        descripcion="Con estos tres datos se calcula la ruta y la cantidad de viajes."
        icono={Droplets}
        titulo="Parametros de vuelo"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <CampoConUnidad
            ayuda="Franja que moja el avion en cada pasada."
            etiqueta="Ancho de aplicacion"
            max={100}
            min={1}
            name="anchoAplicacionMetros"
            onChange={handleChange}
            placeholder="25"
            required
            unidad="m"
            value={form.anchoAplicacionMetros}
          />

          <CampoConUnidad
            ayuda="Litros de caldo que se aplican por hectarea."
            etiqueta="Caldo por hectarea"
            max={500}
            min={1}
            name="litrosPorHectarea"
            onChange={handleChange}
            placeholder="20"
            required
            unidad="L/ha"
            value={form.litrosPorHectarea}
          />

          <CampoConUnidad
            ayuda="Cuanto caldo entra en la tolva del avion."
            etiqueta="Capacidad de la tolva"
            max={20000}
            min={1}
            name="capacidadUtilLitros"
            onChange={handleChange}
            placeholder="1500"
            required
            unidad="L"
            value={form.capacidadUtilLitros}
          />
        </div>

        {caldoTotal > 0 && (
          <dl className="grid grid-cols-2 gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
                Caldo total estimado
              </dt>
              <dd className="text-lg font-bold text-emerald-950">
                {caldoTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })} L
              </dd>
            </div>
            {viajesMinimos && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
                  Viajes como minimo
                </dt>
                <dd className="text-lg font-bold text-emerald-950">{viajesMinimos}</dd>
              </div>
            )}
          </dl>
        )}
      </SeccionFormulario>

      <SeccionFormulario
        descripcion="Opcional: que agroquimicos lleva la mezcla y en que dosis."
        icono={Package}
        titulo="Productos"
      >
        <SelectorProductosMezcla
          filas={filasMezcla}
          onChange={setFilasMezcla}
          productos={productos}
          superficieHa={Number(loteElegido?.superficie || 0)}
        />
      </SeccionFormulario>

      <SeccionFormulario descripcion="Opcional." icono={StickyNote} titulo="Fecha y observaciones">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={claseEtiqueta}>
            Fecha prevista
            <input
              className={`h-11 ${claseCampo}`}
              name="fechaPrevista"
              onChange={handleChange}
              type="date"
              value={form.fechaPrevista}
            />
          </label>

          <label className={claseEtiqueta}>
            Observaciones
            <input
              className={`h-11 ${claseCampo}`}
              name="observaciones"
              onChange={handleChange}
              placeholder="Ej: aplicar a la manana"
              type="text"
              value={form.observaciones}
            />
          </label>
        </div>
      </SeccionFormulario>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button
          className="rounded-md bg-emerald-700 px-4 py-2 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSaving || !puedeGuardar}
          type="submit"
        >
          {isSaving ? 'Generando ruta...' : editingOrden ? 'Guardar y regenerar ruta' : 'Generar ruta'}
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

export default OrdenForm
