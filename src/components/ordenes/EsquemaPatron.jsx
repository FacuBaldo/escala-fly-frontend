/** Esquema didáctico: los números indican el orden de ejecución, no la ubicación de la franja. */
function EsquemaPatron({ patron }) {
  if (patron === 'AUTOMATICO') {
    return <div className="grid grid-cols-3 gap-1" aria-label="Elige entre ida y vuelta, redondo y espiral según la forma del lote">
      <EsquemaPatron patron="IDA_Y_VUELTA" />
      <EsquemaPatron patron="REDONDO" />
      <EsquemaPatron patron="ESPIRAL" />
    </div>
  }

  if (patron === 'ESPIRAL') {
    // Vueltas cada vez más chicas: cada una arranca donde terminó la anterior
    const puntos = []
    for (let k = 0; k < 4; k++) {
      const m = 8 + k * 9
      puntos.push([14 + m, 6 + m * 0.5], [154 - m, 6 + m * 0.5], [154 - m, 84 - m * 0.5], [14 + m, 84 - m * 0.5])
    }
    puntos.push([14 + 44, 6 + 22])
    return (
      <svg className="h-24 w-full" viewBox="0 0 168 90" role="img" aria-label="Vueltas desde el borde hacia el centro">
        <polyline fill="none" points={puntos.map((p) => p.join(',')).join(' ')} stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={puntos[0][0]} cy={puntos[0][1]} fill="#2563eb" r="3" />
        <text fontSize="10" fill="#334155" x={puntos[0][0] - 10} y={puntos[0][1] + 4}>1</text>
      </svg>
    )
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
