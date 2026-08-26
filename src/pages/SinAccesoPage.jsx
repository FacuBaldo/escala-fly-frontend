import AppLayout from '../components/AppLayout'

function SinAccesoPage() {
  return (
    <AppLayout>
      <section className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-700">Sin acceso</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">Tu rol todavia no tiene modulos disponibles</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Cuando se habiliten funcionalidades para tu perfil, van a aparecer en el menu lateral.
          </p>
        </div>
      </section>
    </AppLayout>
  )
}

export default SinAccesoPage
