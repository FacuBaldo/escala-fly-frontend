import { useState } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { claseCampo } from '../formulario/estilosFormulario'

const botonIconoClassName =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-40'

// En la fila los anchos los define cada campo, asi que se saca el w-full del estilo
// compartido: si no, le gana al ancho fijo de la abreviatura y aplasta al nombre.
const claseCampoEnFila = claseCampo.replace('w-full ', '')

const valoresVacios = (campos) => Object.fromEntries(campos.map((campo) => [campo.clave, '']))

const valoresDe = (item, campos) => Object.fromEntries(campos.map((campo) => [campo.clave, item[campo.clave]]))

const estaCompleto = (valores, campos) => campos.every((campo) => valores[campo.clave].trim() !== '')

/** Inputs de una fila (alta o edicion), en el orden de los campos */
function CamposFila({ autoFocus, campos, onChange, valores }) {
  return campos.map((campo, indice) => (
    <input
      aria-label={campo.etiqueta}
      autoFocus={autoFocus && indice === 0}
      className={`h-9 text-sm ${claseCampoEnFila} ${campo.anchoClase || 'flex-1'}`}
      key={campo.clave}
      maxLength={campo.largoMaximo}
      name={campo.clave}
      onChange={(event) => onChange({ ...valores, [campo.clave]: event.target.value })}
      placeholder={campo.placeholder}
      value={valores[campo.clave]}
    />
  ))
}

/**
 * Lista editable de un catalogo simple: agregar arriba y editar o eliminar cada
 * valor en su propia fila, sin abrir dialogos. El primer campo es el principal;
 * los demas se muestran como etiqueta al costado (por ejemplo, la abreviatura).
 *
 * `onCrear` y `onActualizar` devuelven true si se guardo, para saber si limpiar
 * la fila. Eliminar lo confirma la pantalla con su propio dialogo.
 */
function CatalogoEditable({ campos, descripcion, icono: Icono, items, onActualizar, onCrear, onEliminar, titulo }) {
  const [nuevo, setNuevo] = useState(() => valoresVacios(campos))
  const [editandoId, setEditandoId] = useState(null)
  const [edicion, setEdicion] = useState(null)
  const [isGuardando, setIsGuardando] = useState(false)

  const [principal, ...secundarios] = campos

  const handleCrear = async (event) => {
    event.preventDefault()

    if (!estaCompleto(nuevo, campos)) {
      return
    }

    setIsGuardando(true)
    const guardado = await onCrear(nuevo)
    setIsGuardando(false)

    if (guardado) {
      setNuevo(valoresVacios(campos))
    }
  }

  const empezarEdicion = (item) => {
    setEditandoId(item.id)
    setEdicion(valoresDe(item, campos))
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setEdicion(null)
  }

  const handleGuardarEdicion = async (event) => {
    event.preventDefault()

    if (!estaCompleto(edicion, campos)) {
      return
    }

    setIsGuardando(true)
    const guardado = await onActualizar(editandoId, edicion)
    setIsGuardando(false)

    if (guardado) {
      cancelarEdicion()
    }
  }

  return (
    <section className="flex min-w-0 flex-col rounded-lg border border-emerald-100 bg-white shadow-sm shadow-emerald-950/5">
      <header className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white">
          <Icono aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-950">{titulo}</h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
              {items.length}
            </span>
          </div>
          <p className="text-xs leading-5 text-slate-500">{descripcion}</p>
        </div>
      </header>

      <form className="flex gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3" onSubmit={handleCrear}>
        <CamposFila campos={campos} onChange={setNuevo} valores={nuevo} />
        <button
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-emerald-700 px-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isGuardando || !estaCompleto(nuevo, campos)}
          type="submit"
        >
          <Plus aria-hidden="true" size={16} />
          Agregar
        </button>
      </form>

      <ul className="divide-y divide-slate-100">
        {items.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-slate-500">Todavia no hay valores cargados.</li>
        )}

        {items.map((item) => {
          const enUso = item.cantidadProductos > 0

          if (item.id === editandoId) {
            return (
              <li className="bg-amber-50/60 px-5 py-2.5" key={item.id}>
                <form
                  className="flex gap-2"
                  onKeyDown={(event) => event.key === 'Escape' && cancelarEdicion()}
                  onSubmit={handleGuardarEdicion}
                >
                  <CamposFila autoFocus campos={campos} onChange={setEdicion} valores={edicion} />
                  <button
                    aria-label="Guardar cambios"
                    className={`${botonIconoClassName} bg-emerald-700 text-white hover:bg-emerald-800`}
                    disabled={isGuardando || !estaCompleto(edicion, campos)}
                    title="Guardar (Enter)"
                    type="submit"
                  >
                    <Check aria-hidden="true" size={16} />
                  </button>
                  <button
                    aria-label="Cancelar edicion"
                    className={`${botonIconoClassName} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
                    disabled={isGuardando}
                    onClick={cancelarEdicion}
                    title="Cancelar (Esc)"
                    type="button"
                  >
                    <X aria-hidden="true" size={16} />
                  </button>
                </form>
              </li>
            )
          }

          return (
            <li className="flex items-center gap-3 px-5 py-2.5" key={item.id}>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{item[principal.clave]}</span>

              {secundarios.map((campo) => (
                <span
                  className="shrink-0 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700"
                  key={campo.clave}
                  title={campo.etiqueta}
                >
                  {item[campo.clave]}
                </span>
              ))}

              <span className={`w-24 shrink-0 text-right text-xs ${enUso ? 'text-slate-600' : 'text-slate-400'}`}>
                {item.cantidadProductos === 1 ? '1 producto' : `${item.cantidadProductos ?? 0} productos`}
              </span>

              <button
                aria-label={`Editar ${item[principal.clave]}`}
                className={`${botonIconoClassName} bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
                disabled={editandoId !== null}
                onClick={() => empezarEdicion(item)}
                title="Editar"
                type="button"
              >
                <Pencil aria-hidden="true" size={15} />
              </button>
              <button
                aria-label={`Eliminar ${item[principal.clave]}`}
                className={`${botonIconoClassName} bg-red-50 text-red-700 hover:bg-red-100`}
                disabled={editandoId !== null || enUso}
                onClick={() => onEliminar(item)}
                title={enUso ? 'No se puede eliminar: hay productos que lo usan' : 'Eliminar'}
                type="button"
              >
                <Trash2 aria-hidden="true" size={15} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default CatalogoEditable
