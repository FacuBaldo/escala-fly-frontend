const ESTADOS_ORDEN = {
  PENDIENTE: 'Pendiente',
  PLANIFICADA: 'Planificada',
  EN_EJECUCION: 'En ejecucion',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
}

const ESTILOS_ESTADO = {
  PENDIENTE: 'bg-slate-100 text-slate-700',
  PLANIFICADA: 'bg-emerald-100 text-emerald-800',
  EN_EJECUCION: 'bg-sky-100 text-sky-800',
  FINALIZADA: 'bg-slate-200 text-slate-700',
  CANCELADA: 'bg-red-100 text-red-700',
}

// Patrones de trabajo sobre el lote (relevamiento, modulo 6)
const PATRONES_VUELO = {
  AUTOMATICO: {
    nombre: 'Automatico',
    descripcion: 'Calcula los dos patrones y elige el que menos vuela.',
  },
  IDA_Y_VUELTA: {
    nombre: 'Ida y vuelta',
    descripcion: 'Pasadas una al lado de la otra. Cada vuelta es un giro en pera.',
  },
  REDONDO: {
    nombre: 'Redondo',
    descripcion: 'Trabaja en circuito salteando pasadas, con giros abiertos hacia el mismo lado.',
  },
}

const nombrePatron = (patron) => PATRONES_VUELO[patron]?.nombre || patron

// Radio de giro que se propone si la aeronave no tiene uno cargado
const RADIO_GIRO_POR_DEFECTO = 200

// Un color por viaje, para distinguirlos cuando se ven todos juntos en el mapa
const COLORES_VIAJE = ['#2563eb', '#ea580c', '#9333ea', '#0d9488', '#dc2626', '#ca8a04', '#4f46e5', '#db2777']

const colorDeViaje = (numero) => COLORES_VIAJE[(numero - 1) % COLORES_VIAJE.length]

const formatearNumero = (valor, decimales = 2) =>
  Number(valor || 0).toLocaleString('es-AR', { maximumFractionDigits: decimales })

const formatearLitros = (litros) => `${formatearNumero(litros, 0)} L`

/** Muestra metros hasta 1 km y kilometros a partir de ahi */
const formatearDistancia = (metros) => {
  const valor = Number(metros || 0)

  if (valor < 1000) {
    return `${formatearNumero(valor, 0)} m`
  }

  return `${formatearNumero(valor / 1000, 1)} km`
}

const formatearFecha = (fecha) => {
  if (!fecha) return 'Sin fecha'

  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export {
  COLORES_VIAJE,
  ESTADOS_ORDEN,
  PATRONES_VUELO,
  RADIO_GIRO_POR_DEFECTO,
  ESTILOS_ESTADO,
  colorDeViaje,
  formatearDistancia,
  formatearFecha,
  formatearLitros,
  formatearNumero,
  nombrePatron,
}
