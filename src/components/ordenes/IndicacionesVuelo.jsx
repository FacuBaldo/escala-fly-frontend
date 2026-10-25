import { useEffect } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import { ESTILOS_TRAMO } from '../../utils/tramosVuelo'

/** Distribuye las flechas en píxeles: conserva su tamaño y orientación al acercar el mapa. */
function IndicacionesVuelo({ tramos }) {
  const map = useMap()

  useEffect(() => {
    const capa = L.layerGroup().addTo(map)
    const dibujar = () => {
      capa.clearLayers()
      const numeradas = new Set()
      for (const tramo of tramos) {
        const puntos = tramo.posiciones.map((punto) => map.project(punto))
        const largos = puntos.slice(1).map((punto, i) => punto.distanceTo(puntos[i]))
        const total = largos.reduce((suma, largo) => suma + largo, 0)
        if (total < 28) continue
        const cantidad = Math.min(3, Math.max(1, Math.floor(total / 180)))
        for (let n = 0; n < cantidad; n++) {
          let restante = total * ((n + 0.5) / cantidad)
          let i = 0
          while (i < largos.length - 1 && restante > largos[i]) restante -= largos[i++]
          if (!largos[i]) continue
          const desde = puntos[i]
          const delta = puntos[i + 1].subtract(desde)
          const posicion = map.unproject(desde.add(delta.multiplyBy(restante / largos[i])))
          const angulo = Math.atan2(delta.y, delta.x) * 180 / Math.PI
          const color = ESTILOS_TRAMO[tramo.tipo].color
          const mostrarNumero = tramo.numeroPasada && !numeradas.has(tramo.numeroPasada) && map.getZoom() >= 14 && total > 65
          if (mostrarNumero) numeradas.add(tramo.numeroPasada)
          const icono = L.divIcon({
            className: '', iconSize: [24, 24], iconAnchor: [12, 12],
            html: `<div style="position:relative;width:24px;height:24px">` +
              `<svg width="24" height="24" viewBox="0 0 24 24" style="transform:rotate(${angulo}deg);overflow:visible"><path d="M5 5 L18 12 L5 19" fill="none" stroke="white" stroke-width="7" stroke-linejoin="round"/><path d="M5 5 L18 12 L5 19" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round"/></svg>` +
              (mostrarNumero ? `<span style="position:absolute;bottom:25px;left:2px;background:white;color:#1e3a8a;border:1px solid #2563eb;border-radius:4px;padding:0 4px;font:bold 11px/18px sans-serif">${tramo.numeroPasada}</span>` : '') + '</div>',
          })
          L.marker(posicion, { icon: icono, interactive: false, keyboard: false, zIndexOffset: 400 }).addTo(capa)
        }
      }
    }
    dibujar()
    map.on('zoomend', dibujar)
    return () => {
      map.off('zoomend', dibujar)
      capa.remove()
    }
  }, [map, tramos])

  return null
}

export default IndicacionesVuelo
