import { Plus, Trash2 } from 'lucide-react'

const inputClassName =
  'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'

/**
 * Filas dinamicas de productos con su dosis por hectarea.
 * La mezcla es opcional: una orden puede generarse solo con los parametros de vuelo.
 */
function SelectorProductosMezcla({ filas, productos, onChange, superficieHa }) {
  const actualizarFila = (indice, campo, valor) => {
    onChange(filas.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)))
  }

  const agregarFila = () => onChange([...filas, { productoId: '', dosisPorHectarea: '' }])

  const quitarFila = (indice) => onChange(filas.filter((_, i) => i !== indice))

  const productoPorId = (id) => productos.find((producto) => producto.id === id)

  return (
    <div className="grid gap-2">
      <div className="flex justify-end">
        <button
          className="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={productos.length === 0}
          onClick={agregarFila}
          title={productos.length === 0 ? 'Primero carga productos' : 'Agregar producto a la mezcla'}
          type="button"
        >
          <Plus aria-hidden="true" size={14} />
          Agregar producto
        </button>
      </div>

      {filas.length === 0 && (
        <p className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-500">
          Sin productos cargados. Podes agregar los agroquimicos con su dosis por hectarea.
        </p>
      )}

      {filas.map((fila, indice) => {
        const producto = productoPorId(fila.productoId)
        const dosis = Number(fila.dosisPorHectarea)
        const totalProducto = Number.isFinite(dosis) && superficieHa ? dosis * superficieHa : null

        return (
          <div className="grid grid-cols-[minmax(0,1fr)_7rem_2.25rem] items-center gap-2" key={indice}>
            <select
              aria-label={`Producto ${indice + 1}`}
              className={inputClassName}
              onChange={(event) => actualizarFila(indice, 'productoId', event.target.value)}
              required
              value={fila.productoId}
            >
              <option disabled value="">
                Selecciona un producto
              </option>
              {productos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>

            <input
              aria-label={`Dosis del producto ${indice + 1}`}
              className={inputClassName}
              min={0}
              onChange={(event) => actualizarFila(indice, 'dosisPorHectarea', event.target.value)}
              placeholder="Dosis/ha"
              step="any"
              type="number"
              value={fila.dosisPorHectarea}
            />

            <button
              aria-label={`Quitar producto ${indice + 1}`}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-700 transition hover:bg-red-100"
              onClick={() => quitarFila(indice)}
              title="Quitar"
              type="button"
            >
              <Trash2 aria-hidden="true" size={16} />
            </button>

            {totalProducto > 0 && (
              <p className="col-span-3 -mt-1 text-xs text-slate-500">
                {producto?.nombre}: {totalProducto.toLocaleString('es-AR', { maximumFractionDigits: 2 })}{' '}
                {producto?.unidadMedida || ''} para todo el lote
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default SelectorProductosMezcla
