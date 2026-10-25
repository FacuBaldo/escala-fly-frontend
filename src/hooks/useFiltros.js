import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Filtros de una pantalla guardados en la direccion (?q=...&estado=...), asi
 * sobreviven a recargar, el boton "atras" vuelve al listado filtrado y el link
 * se puede compartir ya filtrado.
 *
 * Los cambios reemplazan la entrada del historial en vez de agregar una: si no,
 * cada letra escrita en el buscador seria un paso mas para el boton "atras".
 *
 * @param {Record<string, string>} claves - Filtros de la pantalla, con su valor vacio
 *   por defecto. Ejemplo: { q: '', estado: '' }
 * @returns {{
 *   filtros: Record<string, string>,
 *   cambiarFiltro: (clave: string, valor: string) => void,
 *   limpiarFiltros: () => void,
 *   hayFiltros: boolean
 * }}
 */
function useFiltros(claves) {
  const [searchParams, setSearchParams] = useSearchParams()
  const nombres = Object.keys(claves).join(',')

  const filtros = useMemo(() => {
    const valores = {}
    for (const clave of nombres.split(',')) {
      valores[clave] = searchParams.get(clave) ?? ''
    }
    return valores
  }, [nombres, searchParams])

  const cambiarFiltro = useCallback(
    (clave, valor) => {
      setSearchParams(
        (actuales) => {
          const siguientes = new URLSearchParams(actuales)
          if (valor) {
            siguientes.set(clave, valor)
          } else {
            siguientes.delete(clave)
          }
          return siguientes
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const limpiarFiltros = useCallback(() => {
    setSearchParams(
      (actuales) => {
        const siguientes = new URLSearchParams(actuales)
        for (const clave of nombres.split(',')) {
          siguientes.delete(clave)
        }
        return siguientes
      },
      { replace: true },
    )
  }, [nombres, setSearchParams])

  const hayFiltros = Object.values(filtros).some(Boolean)

  return { filtros, cambiarFiltro, limpiarFiltros, hayFiltros }
}

export default useFiltros
