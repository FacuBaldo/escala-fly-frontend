import { useEffect, useId, useRef, useState } from 'react'

function SelectorConBusqueda({ value, seleccion, opciones, etiqueta, placeholder, disabled, required, busqueda, onBuscar, onSeleccionar, hayMas, onCargarMas, error }) {
  const id = useId()
  const inputRef = useRef(null)
  const [abierto, setAbierto] = useState(false)
  const [indice, setIndice] = useState(-1)

  useEffect(() => {
    inputRef.current?.setCustomValidity(required && !value ? 'Selecciona una opción de la lista.' : '')
  }, [required, value])

  const elegir = (item) => {
    onSeleccionar(item)
    setAbierto(false)
    setIndice(-1)
    onBuscar('')
  }

  return (
    <span className="relative block min-w-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setAbierto(false) }}>
      <input
        aria-activedescendant={abierto && indice >= 0 ? `${id}-opcion-${indice}` : undefined}
        aria-autocomplete="list"
        aria-controls={`${id}-lista`}
        aria-expanded={abierto}
        aria-label={placeholder}
        aria-required={required}
        autoComplete="off"
        className="h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
        disabled={disabled}
        onChange={(event) => { onBuscar(event.target.value); setIndice(-1); setAbierto(true) }}
        onFocus={() => { onBuscar(''); setIndice(-1); setAbierto(true) }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && abierto) { event.preventDefault(); event.stopPropagation(); setAbierto(false); event.currentTarget.blur() }
          if (event.key === 'ArrowDown') { event.preventDefault(); setAbierto(true); setIndice((actual) => Math.min(actual + 1, opciones.length - 1)) }
          if (event.key === 'ArrowUp') { event.preventDefault(); setIndice((actual) => Math.max(actual - 1, 0)) }
          if (event.key === 'Enter' && abierto && indice >= 0 && opciones[indice]) { event.preventDefault(); elegir(opciones[indice]) }
          else if (event.key === 'Enter' && abierto && busqueda) event.preventDefault()
        }}
        placeholder={placeholder}
        ref={inputRef}
        role="combobox"
        value={abierto ? busqueda : seleccion ? etiqueta(seleccion) : ''}
      />
      {abierto && <span className="absolute z-50 mt-1 block max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
        {!required && <button className="block w-full rounded px-3 py-2 text-left text-sm text-slate-600 hover:bg-emerald-50" onClick={() => elegir(null)} type="button">{placeholder}</button>}
        <span id={`${id}-lista`} role="listbox">{opciones.map((item, index) => <button aria-selected={item.id === value} className={`block w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-emerald-50 ${indice === index ? 'bg-emerald-50' : ''}`} id={`${id}-opcion-${index}`} key={item.id} onClick={() => elegir(item)} onMouseEnter={() => setIndice(index)} role="option" type="button">{etiqueta(item)}</button>)}</span>
        {hayMas && <button className="block w-full px-3 py-2 text-left text-xs font-semibold text-emerald-700" onClick={onCargarMas} type="button">Cargar 20 más</button>}
        {error && <span className="block px-3 py-2 text-xs text-red-700" role="alert">{error}</span>}
      </span>}
    </span>
  )
}

export default SelectorConBusqueda
