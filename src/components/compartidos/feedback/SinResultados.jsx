/**
 * Mensaje para una lista vacia. Distingue "no hay nada cargado" de "los filtros
 * no dejaron nada", y en ese caso ofrece limpiarlos.
 */
function SinResultados({ hayFiltros, mensajeVacio, onLimpiar }) {
  if (!hayFiltros) {
    return mensajeVacio
  }

  return (
    <>
      No hay resultados con estos filtros.{' '}
      <button className="font-bold text-emerald-800 underline-offset-2 hover:underline" onClick={onLimpiar} type="button">
        Limpiar filtros
      </button>
    </>
  )
}

export default SinResultados
