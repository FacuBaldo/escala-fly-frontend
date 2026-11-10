/**
 * Bloque con titulo dentro de un formulario largo, para que se lea por partes
 * en vez de como una lista corrida de campos.
 */
function SeccionFormulario({ children, descripcion, icono: Icono, titulo }) {
  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <header className="flex items-start gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white">
          <Icono aria-hidden="true" size={15} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-950">{titulo}</h3>
          {descripcion && <p className="text-xs leading-5 text-slate-500">{descripcion}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

export default SeccionFormulario
