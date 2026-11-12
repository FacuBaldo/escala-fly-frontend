import { useEffect, useRef, useState } from 'react'
import apiClient from '../../api/apiClient'
import SelectorEmpresa from '../compartidos/formularios/SelectorEmpresa'
import SelectorConBusqueda from '../compartidos/formularios/SelectorConBusqueda'
import { AlertTriangle, Building2, Droplets, Package, Plane, Route, StickyNote, UserRound } from 'lucide-react'
import SelectorProductosMezcla from './SelectorProductosMezcla'
import EsquemaPatron from './EsquemaPatron'
import CampoConUnidad from '../compartidos/formularios/CampoConUnidad'
import SeccionFormulario from '../compartidos/formularios/SeccionFormulario'
import { claseAyuda, claseCampo, claseEtiqueta } from '../compartidos/formularios/estilosFormulario'
import { formatearSuperficie } from '../../utils/lotes'
import { PATRONES_VUELO, RADIO_GIRO_POR_DEFECTO } from '../../utils/ordenes'

const soloFecha = (valor) => (valor ? String(valor).slice(0, 10) : '')

function SelectorRemoto({ url, value, onChange, name, placeholder, seleccion, empresaId, activo, rol, disabled = false, required = false, etiqueta = (item) => item.nombre, onSeleccionado }) {
  const [opciones, setOpciones] = useState([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [hayMas, setHayMas] = useState(false)
  const [error, setError] = useState('')
  const [actual, setActual] = useState(seleccion || null)
  const callback = useRef(onSeleccionado)
  useEffect(() => { callback.current = onSeleccionado }, [onSeleccionado])
  useEffect(() => {
    if (disabled) return undefined
    let vigente = true
    const timer = setTimeout(() => apiClient.get(url, { params: { page, limit: 20, search, ...(empresaId ? { empresaId } : {}), ...(rol ? { rol } : {}), ...(activo !== undefined ? { activo } : {}) } }).then(({ data }) => {
      if (vigente) { setOpciones((previas) => page === 1 ? data.data : [...previas, ...data.data.filter((item) => !previas.some((previo) => previo.id === item.id))]); setHayMas(data.pagination.hasNextPage); setError('') }
    }).catch(() => { if (vigente) setError('No se pudieron cargar las opciones.') }), 250)
    return () => { vigente = false; clearTimeout(timer) }
  }, [url, page, search, empresaId, activo, rol, disabled])
  useEffect(() => {
    if (!value) return undefined
    const encontrado = opciones.find((item) => item.id === value) || (seleccion?.id === value ? seleccion : null) || (actual?.id === value ? actual : null)
    if (encontrado) { callback.current?.(encontrado); return undefined }
    let vigente = true
    apiClient.get(`${url}/${encodeURIComponent(value)}`).then(({ data }) => { if (vigente) { setActual(data); callback.current?.(data) } }).catch(() => {})
    return () => { vigente = false }
  }, [url, value, opciones, seleccion, actual])
  const elegida = opciones.find((item) => item.id === value) || (seleccion?.id === value ? seleccion : null) || (actual?.id === value ? actual : null)
  return <SelectorConBusqueda busqueda={search} disabled={disabled} error={error} etiqueta={etiqueta} hayMas={hayMas} onBuscar={(texto) => { if (texto !== search) { setOpciones([]); setHayMas(false) } setPage(1); setSearch(texto) }} onCargarMas={() => setPage((p) => p + 1)} onSeleccionar={(item) => { setActual(item); callback.current?.(item); onChange({ target: { name, value: item?.id || '' } }, item) }} opciones={opciones} placeholder={placeholder} required={required} seleccion={elegida} value={value} />
}

function OrdenForm({ editingOrden, isAdmin, isSaving, onCancel, onSave, empresaSesionId }) {
  const [empresaId, setEmpresaId] = useState(() => editingOrden?.empresaId || '')
  const [loteElegido, setLoteElegido] = useState(null)
  const [aeronaveElegida, setAeronaveElegida] = useState(null)
  const [form, setForm] = useState(() => ({
    loteId: editingOrden?.loteId || '',
    aeronaveId: editingOrden?.aeronaveId || '',
    pilotoId: editingOrden?.pilotoId || '',
    clienteId: editingOrden?.clienteId || '',
    anchoAplicacionMetros: editingOrden?.anchoAplicacionMetros ?? '',
    litrosPorHectarea: editingOrden?.litrosPorHectarea ?? '',
    capacidadUtilLitros: editingOrden?.capacidadUtilLitros ?? '',
    radioGiroMetros: editingOrden?.radioGiroMetros ?? '',
    patron: editingOrden?.patron || 'AUTOMATICO',
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

  const handleEmpresaChange = (event) => {
    setEmpresaId(event.target.value)
    setForm((currentForm) => ({
      ...currentForm,
      loteId: '',
      aeronaveId: '',
      pilotoId: '',
      clienteId: '',
      anchoAplicacionMetros: '',
      capacidadUtilLitros: '',
      radioGiroMetros: '',
    }))
    setFilasMezcla([])
    setLoteElegido(null)
    setAeronaveElegida(null)
  }

  const empresaSeleccionada = !isAdmin || Boolean(empresaId)
  const empresaRecursos = isAdmin ? empresaId : empresaSesionId

  // Al elegir aeronave se precargan sus valores de fabrica, si los tiene
  const handleAeronaveChange = (event, aeronave) => {
    const aeronaveId = event.target.value

    setForm((currentForm) => ({
      ...currentForm,
      aeronaveId,
      anchoAplicacionMetros: aeronave?.anchoAplicacionMetros ?? currentForm.anchoAplicacionMetros,
      capacidadUtilLitros: aeronave?.capacidadUtilLitros ?? currentForm.capacidadUtilLitros,
      // El radio es de cada avion: si el elegido no lo tiene se propone el habitual,
      // no el del avion que estaba elegido antes
      radioGiroMetros: aeronave?.radioGiroMetros ?? RADIO_GIRO_POR_DEFECTO,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    await onSave({
      ...form,
      anchoAplicacionMetros: Number(form.anchoAplicacionMetros),
      litrosPorHectarea: Number(form.litrosPorHectarea),
      capacidadUtilLitros: Number(form.capacidadUtilLitros),
      radioGiroMetros: Number(form.radioGiroMetros),
      fechaPrevista: form.fechaPrevista || null,
      productos: filasMezcla
        .filter((fila) => fila.productoId)
        .map((fila) => ({
          productoId: fila.productoId,
          dosisPorHectarea: fila.dosisPorHectarea === '' ? null : Number(fila.dosisPorHectarea),
        })),
    })
  }

  const faltanPistas = loteElegido && (!loteElegido.pistaPrincipalId || !loteElegido.pistaCargaId)
  const puedeGuardar = empresaSeleccionada && Boolean(form.pilotoId) && Boolean(form.clienteId) && !faltanPistas && loteElegido?.id === form.loteId && aeronaveElegida?.id === form.aeronaveId

  const caldoTotal =
    loteElegido && Number(form.litrosPorHectarea) > 0
      ? Number(form.litrosPorHectarea) * Number(loteElegido.superficie || 0)
      : null

  const viajesMinimos =
    caldoTotal > 0 && Number(form.capacidadUtilLitros) > 0
      ? Math.ceil(caldoTotal / Number(form.capacidadUtilLitros))
      : null

  if (editingOrden && ['FINALIZADA', 'CANCELADA'].includes(editingOrden.estado)) {
    return <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); onSave({ clienteId: form.clienteId }) }}>
      <p className="text-sm text-slate-600">La orden está cerrada. Podés asignar o cambiar el cliente que puede consultarla.</p>
      <label className={claseEtiqueta}>Cliente
        <SelectorRemoto empresaId={empresaRecursos} etiqueta={(cliente) => `${cliente.nombre} ${cliente.apellido}`} name="clienteId" onChange={handleChange} placeholder="Selecciona un cliente" required rol="CLIENTE" seleccion={editingOrden.cliente} url="/usuarios" value={form.clienteId} />
      </label>
      <div className="flex gap-2"><button className="rounded-md bg-emerald-700 px-4 py-2 font-bold text-white disabled:opacity-70" disabled={isSaving || !form.clienteId} type="submit">{isSaving ? 'Guardando...' : 'Guardar cliente'}</button><button className="rounded-md border border-slate-200 px-4 py-2 font-bold text-slate-600" disabled={isSaving} onClick={onCancel} type="button">Cancelar</button></div>
    </form>
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {isAdmin && (
        <SeccionFormulario descripcion="Selecciona la empresa para ver sus recursos." icono={Building2} titulo="Empresa">
          <label className={claseEtiqueta}>
            Empresa
            <SelectorEmpresa disabled={Boolean(editingOrden)} onChange={handleEmpresaChange} placeholder="Selecciona una empresa" required value={empresaId} />
            {editingOrden && <span className={claseAyuda}>La empresa no se puede cambiar en una orden existente.</span>}
          </label>
        </SeccionFormulario>
      )}
      <SeccionFormulario descripcion="El piloto podrá consultar y ejecutar esta orden." icono={Plane} titulo="Piloto asignado">
        <label className={claseEtiqueta}>
          Piloto
          <SelectorRemoto disabled={!empresaSeleccionada} empresaId={empresaRecursos} etiqueta={(piloto) => `${piloto.nombre} ${piloto.apellido}`} key={`piloto-${empresaRecursos}`} name="pilotoId" onChange={handleChange} placeholder="Selecciona un piloto" required rol="PILOTO" seleccion={editingOrden?.piloto} url="/usuarios" value={form.pilotoId} />
        </label>
      </SeccionFormulario>
      <SeccionFormulario descripcion="El cliente podrá consultar esta orden y su plan de vuelo." icono={UserRound} titulo="Cliente asignado">
        <label className={claseEtiqueta}>
          Cliente
          <SelectorRemoto disabled={!empresaSeleccionada} empresaId={empresaRecursos} etiqueta={(cliente) => `${cliente.nombre} ${cliente.apellido}`} key={`cliente-${empresaRecursos}`} name="clienteId" onChange={handleChange} placeholder="Selecciona un cliente" required rol="CLIENTE" seleccion={editingOrden?.cliente} url="/usuarios" value={form.clienteId} />
        </label>
      </SeccionFormulario>
      <SeccionFormulario
        descripcion="Sobre que lote se aplica y con que avion."
        icono={Plane}
        titulo="Lote y aeronave"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={claseEtiqueta}>
            Lote
            <SelectorRemoto disabled={!empresaSeleccionada || Boolean(editingOrden)} empresaId={empresaRecursos} etiqueta={(lote) => `${lote.campoNombre ? `${lote.campoNombre} · ` : ''}${lote.nombre} (${formatearSuperficie(lote.superficie)})`} key={`lote-${empresaRecursos}`} name="loteId" onChange={handleChange} onSeleccionado={setLoteElegido} placeholder="Selecciona un lote" required url="/lotes" value={form.loteId} />
            {editingOrden && (
              <span className={claseAyuda}>
                El lote no se puede cambiar en una orden existente.
              </span>
            )}
          </label>

          <label className={claseEtiqueta}>
            Aeronave
            <SelectorRemoto disabled={!empresaSeleccionada} empresaId={empresaRecursos} etiqueta={(aeronave) => `${aeronave.matricula} · ${aeronave.modelo}`} key={`aeronave-${empresaRecursos}`} name="aeronaveId" onChange={handleAeronaveChange} onSeleccionado={setAeronaveElegida} placeholder="Selecciona una aeronave" required url="/aeronaves" value={form.aeronaveId} />
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
        descripcion="Cómo trabaja el avión sobre el lote. Los giros usan el radio configurado de la aeronave."
        icono={Route}
        titulo="Patron y giros"
      >
        <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
          <CampoConUnidad
            ayuda="Lo trae la aeronave. Entre 150 y 300 m es lo habitual."
            etiqueta="Radio de giro"
            max={1000}
            min={30}
            name="radioGiroMetros"
            onChange={handleChange}
            placeholder={String(RADIO_GIRO_POR_DEFECTO)}
            required
            unidad="m"
            value={form.radioGiroMetros}
          />

          <fieldset className="grid content-start gap-1.5">
            <legend className="mb-1.5 text-sm font-semibold text-slate-700">Patron de trabajo</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.entries(PATRONES_VUELO).map(([valor, { nombre, subtitulo, descripcion }]) => {
                const elegido = form.patron === valor

                return (
                  <label
                    className={`flex cursor-pointer flex-col gap-1 rounded-md border px-3 py-2 transition ${
                      elegido
                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100'
                        : 'border-slate-200 bg-white hover:border-emerald-300'
                    }`}
                    key={valor}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <input
                        checked={elegido}
                        className="accent-emerald-700"
                        name="patron"
                        onChange={handleChange}
                        type="radio"
                        value={valor}
                      />
                      {nombre}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800">{subtitulo}</span>
                    <EsquemaPatron patron={valor} />
                    <span className="text-xs leading-4 text-slate-500">{descripcion}</span>
                  </label>
                )
              })}
            </div>
            <p className={claseAyuda}>Esquemas orientativos: los números indican el orden de vuelo. El salto y los giros reales dependen del lote y del radio.</p>
          </fieldset>
        </div>
      </SeccionFormulario>

      <SeccionFormulario
        descripcion="Opcional: que agroquimicos lleva la mezcla y en que dosis."
        icono={Package}
        titulo="Productos"
      >
        <SelectorProductosMezcla
          disabled={!empresaSeleccionada}
          filas={filasMezcla}
          onChange={setFilasMezcla}
          empresaId={empresaRecursos}
          key={`productos-${empresaRecursos}`}
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
