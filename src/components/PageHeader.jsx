function PageHeader({ action, subtitle, title }) {
  return (
    <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
      </div>

      {action}
    </section>
  )
}

export default PageHeader
