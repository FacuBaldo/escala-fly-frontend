import { useEffect, useId, useRef, useState } from 'react'
import { getEmpresaById, getEmpresas } from '../../../api/empresasApi'

function SelectorEmpresa({ value = '', valor, onChange, name, placeholder = 'Todas las empresas', seleccion, disabled = false, required = false }) {
  const id = useId()
  const inputRef = useRef(null)
  const elegido = valor ?? value
  const [empresa, setEmpresa] = useState(seleccion || null)
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [opciones, setOpciones] = useState([])
  const [page, setPage] = useState(1)
  const [hayMas, setHayMas] = useState(false)
  const [error, setError] = useState('')
  const [indice, setIndice] = useState(-1)

  useEffect(() => {
    inputRef.current?.setCustomValidity(required && !elegido ? 'Selecciona una empresa de la lista.' : '')
  }, [required, elegido])

  useEffect(() => {
    if (!elegido || seleccion?.id === elegido || empresa?.id === elegido) return undefined
    let vigente = true
    getEmpresaById(elegido).then((resultado) => { if (vigente) setEmpresa(resultado) }).catch(() => {})
    return () => { vigente = false }
  }, [elegido, seleccion, empresa])

  useEffect(() => {
    if (!abierto || disabled) return undefined
    let vigente = true
    const timer = setTimeout(() => {
      getEmpresas({ page, limit: 20, search: busqueda }).then((resultado) => {
        if (!vigente) return
        setOpciones((previas) => page === 1 ? resultado.data : [...previas, ...resultado.data.filter((item) => !previas.some((previo) => previo.id === item.id))])
        setHayMas(resultado.pagination.hasNextPage)
        setError('')
      }).catch(() => { if (vigente) setError('No se pudieron cargar las empresas.') })
    }, 250)
    return () => { vigente = false; clearTimeout(timer) }
  }, [abierto, busqueda, page, disabled])

  const cambiar = (item) => {
    setEmpresa(item)
    setAbierto(false)
    setBusqueda('')
    setPage(1)
    setIndice(-1)
    const nuevoValor = item?.id || ''
    if (valor !== undefined) onChange(nuevoValor)
    else onChange({ target: { name, value: nuevoValor } }, item)
  }

  const nombre = (seleccion?.id === elegido ? seleccion : empresa?.id === elegido ? empresa : null)?.nombre || ''

  return (
    <span className="relative block min-w-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setAbierto(false) }}>
      <input
        aria-label={valor !== undefined ? 'Filtrar por empresa' : placeholder}
        aria-autocomplete="list"
        aria-controls={`${id}-lista`}
        aria-expanded={abierto}
        aria-activedescendant={abierto && indice >= 0 ? `${id}-opcion-${indice}` : undefined}
        autoComplete="off"
        className="h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
        disabled={disabled}
        onChange={(event) => { setBusqueda(event.target.value); setPage(1); setOpciones([]); setHayMas(false); setIndice(-1); setAbierto(true) }}
        onFocus={() => { setBusqueda(''); setPage(1); setOpciones([]); setHayMas(false); setIndice(-1); setAbierto(true) }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && abierto) { event.preventDefault(); event.stopPropagation(); setAbierto(false); event.currentTarget.blur() }
          if (event.key === 'ArrowDown') { event.preventDefault(); setAbierto(true); setIndice((actual) => Math.min(actual + 1, opciones.length - 1)) }
          if (event.key === 'ArrowUp') { event.preventDefault(); setIndice((actual) => Math.max(actual - 1, 0)) }
          if (event.key === 'Enter' && abierto && indice >= 0 && opciones[indice]) { event.preventDefault(); cambiar(opciones[indice]) }
          else if (event.key === 'Enter' && abierto && busqueda) event.preventDefault()
        }}
        placeholder={placeholder}
        ref={inputRef}
        aria-required={required}
        role="combobox"
        value={abierto ? busqueda : nombre}
      />
      {abierto && (
        <span className="absolute z-50 mt-1 block max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {!required && <button className="block w-full rounded px-3 py-2 text-left text-sm text-slate-600 hover:bg-emerald-50" onClick={() => cambiar(null)} type="button">{placeholder}</button>}
          <span id={`${id}-lista`} role="listbox">
            {opciones.map((item, index) => (
              <button aria-selected={item.id === elegido} className={`block w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-emerald-50 ${indice === index ? 'bg-emerald-50' : ''}`} id={`${id}-opcion-${index}`} key={item.id} onClick={() => cambiar(item)} onMouseEnter={() => setIndice(index)} role="option" type="button">{item.nombre}</button>
            ))}
          </span>
          {hayMas && <button className="block w-full px-3 py-2 text-left text-xs font-semibold text-emerald-700" onClick={() => setPage((actual) => actual + 1)} type="button">Cargar 20 más</button>}
          {error && <span className="block px-3 py-2 text-xs text-red-700" role="alert">{error}</span>}
        </span>
      )}
    </span>
  )
}

export default SelectorEmpresa
