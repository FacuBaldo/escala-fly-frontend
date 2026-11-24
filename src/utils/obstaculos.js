import L from 'leaflet'

// Dibujos simples (SVG en línea) para reconocer cada obstáculo de un vistazo en el mapa
const SVG = {
  MOLINO: '<path d="M12 22V12M9 22h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M12 12 6 6M12 12l6-6M12 12 6 18M12 12l6 6" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="12" r="1.8" fill="#fff"/>',
  CASA: '<path d="M4 11.5 12 5l8 6.5V20H4z" fill="#fff"/><rect x="10" y="14" width="4" height="6" fill="currentColor"/>',
  GALPON: '<path d="M3 20V10c3-4 15-4 18 0v10z" fill="#fff"/><path d="M7 20v-6h10v6" stroke="currentColor" stroke-width="1.6" fill="none"/>',
  SILO: '<path d="M7 9a5 4 0 0 1 10 0v11H7z" fill="#fff"/><path d="M7 13h10M7 16.5h10" stroke="currentColor" stroke-width="1.3"/>',
  OTRO: '<path d="M12 4 21 20H3z" fill="#fff"/><path d="M12 10v5M12 17.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
}

const TIPOS_OBSTACULO = {
  MOLINO: { nombre: 'Molino', color: '#7c3aed' },
  CASA: { nombre: 'Casa', color: '#dc2626' },
  GALPON: { nombre: 'Galpón', color: '#b45309' },
  SILO: { nombre: 'Silo', color: '#0f766e' },
  CABLE: { nombre: 'Cable', color: '#e11d48' },
  OTRO: { nombre: 'Otro', color: '#475569' },
}

// Estilo de las líneas de cable: rojo y con guiones, bien visible sobre el satelital
const ESTILO_CABLE = { color: TIPOS_OBSTACULO.CABLE.color, weight: 4, dashArray: '10 6', lineCap: 'round' }

const svgDe = (tipo) => SVG[tipo] || SVG.OTRO

/** Marcador redondo con el dibujo del obstáculo */
const iconoObstaculo = (tipo) => {
  const { color } = TIPOS_OBSTACULO[tipo] || TIPOS_OBSTACULO.OTRO
  return L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html:
      `<span style="display:flex;height:30px;width:30px;align-items:center;justify-content:center;border-radius:9999px;` +
      `background:${color};color:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)">` +
      `<svg viewBox="0 0 24 24" width="20" height="20" fill="none">${svgDe(tipo)}</svg></span>`,
  })
}

/** "Molino · 12 m" o el nombre que le puso el encargado */
const describirObstaculo = (obstaculo) => {
  const tipo = TIPOS_OBSTACULO[obstaculo.tipo]?.nombre || obstaculo.tipo
  const nombre = obstaculo.nombre ? `${obstaculo.nombre} (${tipo.toLowerCase()})` : tipo
  return obstaculo.alturaMetros ? `${nombre} · ${obstaculo.alturaMetros} m de altura` : nombre
}

export { ESTILO_CABLE, TIPOS_OBSTACULO, describirObstaculo, iconoObstaculo, svgDe }
