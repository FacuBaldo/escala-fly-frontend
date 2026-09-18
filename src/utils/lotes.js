const formatearSuperficie = (superficie) => {
  if (superficie === null || superficie === undefined) {
    return 'Sin superficie'
  }

  return `${Number(superficie).toLocaleString('es-AR', { maximumFractionDigits: 2 })} ha`
}

export { formatearSuperficie }
