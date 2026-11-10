import { claseAyuda, claseCampo, claseEtiqueta } from './estilosFormulario'

/**
 * Campo numerico que muestra su unidad dentro del recuadro y una ayuda breve
 * debajo. Las flechas del navegador se ocultan por CSS (`campo-con-unidad`)
 * porque se superponen con el texto de la unidad.
 */
function CampoConUnidad({
  ayuda,
  etiqueta,
  max,
  min,
  name,
  onChange,
  placeholder,
  required = false,
  unidad,
  value,
}) {
  return (
    <label className={claseEtiqueta}>
      {etiqueta}
      <span className="relative block">
        <input
          className={`campo-con-unidad h-11 pr-14 ${claseCampo}`}
          max={max}
          min={min}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          step="any"
          type="number"
          value={value}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
          {unidad}
        </span>
      </span>
      {ayuda && <span className={claseAyuda}>{ayuda}</span>}
    </label>
  )
}

export default CampoConUnidad
