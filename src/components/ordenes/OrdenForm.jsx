import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import SelectorProductosMezcla from './SelectorProductosMezcla'
import { formatearSuperficie } from '../../utils/lotes'

const inputClassName =
  'rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'

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

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Lote
          <select
            className={`h-11 ${inputClassName}`}
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
            <span className="text-xs font-normal text-slate-500">El lote no se puede cambiar en una orden existente.</span>
          )}
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Aeronave
          <select
            className={`h-11 ${inputClassName}`}
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
        </label>
      </div>

      {faltanPistas && (
        <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
          <span>
            Este lote todavia no tiene pistas asignadas. Configura la pista principal y la de carga
            editando el lote para poder generar la ruta.
          </span>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Ancho de aplicacion (m)
          <input
            className={`h-11 ${inputClassName}`}
            max={100}
            min={1}
            name="anchoAplicacionMetros"
            onChange={handleChange}
            placeholder="25"
            required
            step="any"
            type="number"
            value={form.anchoAplicacionMetros}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Caldo por hectarea (L/ha)
          <input
            className={`h-11 ${inputClassName}`}
            max={500}
            min={1}
            name="litrosPorHectarea"
            onChange={handleChange}
            placeholder="20"
            required
            step="any"
            type="number"
            value={form.litrosPorHectarea}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Capacidad util (L)
          <input
            className={`h-11 ${inputClassName}`}
            max={20000}
            min={1}
            name="capacidadUtilLitros"
            onChange={handleChange}
            placeholder="1500"
            required
            step="any"
            type="number"
            value={form.capacidadUtilLitros}
          />
        </label>
      </div>

      {caldoTotal > 0 && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Caldo total estimado para el lote:{' '}
          <span className="font-bold">{caldoTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })} L</span>
          {Number(form.capacidadUtilLitros) > 0 && (
            <> · minimo {Math.ceil(caldoTotal / Number(form.capacidadUtilLitros))} viaje(s)</>
          )}
        </p>
      )}

      <SelectorProductosMezcla
        filas={filasMezcla}
        onChange={setFilasMezcla}
        productos={productos}
        superficieHa={Number(loteElegido?.superficie || 0)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Fecha prevista (Opcional)
          <input
            className={`h-11 ${inputClassName}`}
            name="fechaPrevista"
            onChange={handleChange}
            type="date"
            value={form.fechaPrevista}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Observaciones (Opcional)
          <input
            className={`h-11 ${inputClassName}`}
            name="observaciones"
            onChange={handleChange}
            placeholder="Ej: aplicar a la manana"
            type="text"
            value={form.observaciones}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
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
