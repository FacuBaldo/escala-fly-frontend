import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'

function MenuAcciones({ acciones, etiqueta }) {
  const [posicion, setPosicion] = useState(null)
  const botonRef = useRef(null)
  const menuRef = useRef(null)
  const opciones = acciones.filter(Boolean)

  useEffect(() => {
    if (!posicion) return undefined

    menuRef.current?.querySelector('button')?.focus()
    const cerrarFuera = (event) => {
      if (!menuRef.current?.contains(event.target) && !botonRef.current?.contains(event.target)) {
        setPosicion(null)
      }
    }
    const cerrarEscape = (event) => {
      if (event.key === 'Escape') {
        setPosicion(null)
        botonRef.current?.focus()
      } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        const botones = Array.from(menuRef.current?.querySelectorAll('button') || [])
        const actual = botones.indexOf(document.activeElement)
        const siguiente = event.key === 'Home' ? 0 : event.key === 'End' ? botones.length - 1
          : event.key === 'ArrowDown' ? (actual + 1) % botones.length : (actual - 1 + botones.length) % botones.length
        event.preventDefault()
        botones[siguiente]?.focus()
      } else if (event.key === 'Tab') {
        setPosicion(null)
        botonRef.current?.focus()
      }
    }
    const cerrar = () => setPosicion(null)
    document.addEventListener('pointerdown', cerrarFuera)
    document.addEventListener('keydown', cerrarEscape)
    window.addEventListener('resize', cerrar)
    window.addEventListener('scroll', cerrar, true)
    return () => {
      document.removeEventListener('pointerdown', cerrarFuera)
      document.removeEventListener('keydown', cerrarEscape)
      window.removeEventListener('resize', cerrar)
      window.removeEventListener('scroll', cerrar, true)
    }
  }, [posicion])

  if (!opciones.length) return null

  const alternar = () => {
    if (posicion) {
      setPosicion(null)
      return
    }
    const rect = botonRef.current.getBoundingClientRect()
    const altura = opciones.length * 40 + 8
    setPosicion({
      top: rect.bottom + altura + 4 <= window.innerHeight ? rect.bottom + 4 : Math.max(8, rect.top - altura - 4),
      left: Math.max(8, Math.min(rect.right - 192, window.innerWidth - 200)),
    })
  }

  return (
    <>
      <button
        aria-expanded={Boolean(posicion)}
        aria-haspopup="menu"
        aria-label={`Acciones para ${etiqueta}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        onClick={alternar}
        ref={botonRef}
        type="button"
      >
        <MoreVertical aria-hidden="true" size={20} />
      </button>
      {posicion && createPortal(
        <div className="fixed z-[1000] w-48 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-lg" ref={menuRef} role="menu" style={posicion}>
          {opciones.map(({ etiqueta: texto, icono: Icono, onClick, peligrosa }) => (
            <button
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${peligrosa ? 'text-red-700 hover:bg-red-50' : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'}`}
              key={texto}
              onClick={() => { setPosicion(null); onClick() }}
              role="menuitem"
              type="button"
            >
              <Icono aria-hidden="true" size={16} />
              {texto}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}

export default MenuAcciones
