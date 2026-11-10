function PageLoader({ message = 'Cargando...' }) {
  return (
    <section className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          aria-hidden="true"
          className="h-11 w-11 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700"
        />
        <p className="text-sm font-bold text-slate-600">{message}</p>
      </div>
    </section>
  )
}

export default PageLoader
