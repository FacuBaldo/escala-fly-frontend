/** Esquema didáctico: los números indican el orden de ejecución, no la ubicación de la franja. */
function EsquemaPatron({ patron }) {
  if (patron === 'AUTOMATICO') {
    return <div className="grid grid-cols-2 gap-1" aria-label="Compara ida y vuelta con pasadas salteadas">
      <EsquemaPatron patron="IDA_Y_VUELTA" />
      <EsquemaPatron patron="REDONDO" />
    </div>
  }

  const orden = patron === 'REDONDO' ? [0, 4, 1, 5, 2, 6, 3, 7] : [0, 1, 2, 3, 4, 5, 6, 7]
  return (
    <svg className="h-24 w-full" viewBox="0 0 168 90" role="img" aria-label={patron === 'REDONDO' ? 'Franjas salteadas con giros abiertos' : 'Franjas vecinas recorridas en ida y vuelta'}>
      {orden.slice(1).map((franja, i) => {
        const arriba = i % 2 === 0
        const y = arriba ? 26 : 60
        const curva = arriba ? 8 : 78
        return <path key={`giro-${i}`} d={`M ${16 + orden[i] * 19} ${y} C ${16 + orden[i] * 19} ${curva}, ${16 + franja * 19} ${curva}, ${16 + franja * 19} ${y}`} fill="none" stroke="#d97706" strokeWidth="1.5" opacity="0.7" />
      })}
      {orden.map((franja, i) => {
        const x = 16 + franja * 19
        const arriba = i % 2 === 0
        return <g key={franja}>
          <line x1={x} x2={x} y1="26" y2="60" stroke="#2563eb" strokeWidth="2.5" />
          <path d={arriba ? `M ${x - 4} 45 L ${x} 39 L ${x + 4} 45` : `M ${x - 4} 39 L ${x} 45 L ${x + 4} 39`} fill="none" stroke="#2563eb" strokeWidth="2" />
          <text x={x} y="88" textAnchor="middle" fontSize="10" fill="#334155">{i + 1}</text>
        </g>
      })}
    </svg>
  )
}

export default EsquemaPatron
