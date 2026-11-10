function DataTable({ columns, emptyMessage, getRowKey, rows }) {
  const [primaryColumn, ...otherColumns] = columns
  const detailColumns = otherColumns.filter((column) => column.key !== 'actions')
  const actionsColumn = otherColumns.find((column) => column.key === 'actions')

  return (
    <section className="min-w-0 rounded-lg border border-emerald-100 bg-white p-3 shadow-sm shadow-emerald-950/5 md:p-5">
      <div className="md:hidden">
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">{emptyMessage}</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" key={getRowKey(row)}>
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">{primaryColumn.header}</p>
                  <div className="mt-1 break-words text-base font-bold text-slate-950">
                    {primaryColumn.render ? primaryColumn.render(row) : row[primaryColumn.key]}
                  </div>

                  {detailColumns.length > 0 && (
                    <dl className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                      {detailColumns.map((column) => (
                        <div className="grid grid-cols-[minmax(0,6rem)_minmax(0,1fr)] gap-3 text-sm" key={column.key}>
                          <dt className="text-slate-500">{column.header}</dt>
                          <dd className="min-w-0 break-words text-slate-800">
                            {column.render ? column.render(row) : row[column.key]}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>

                {actionsColumn && (
                  <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-4 py-3">
                    {actionsColumn.render ? actionsColumn.render(row) : row[actionsColumn.key]}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[520px] border-collapse">
          <thead className="bg-emerald-50">
            <tr className="text-left text-xs font-bold uppercase text-emerald-900">
              {columns.map((column, index) => (
                <th
                  className={`px-4 py-3 ${index === 0 ? 'rounded-l-md' : ''} ${
                    index === columns.length - 1 ? 'rounded-r-md' : ''
                  } ${column.className || ''}`}
                  key={column.key}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}

            {rows.map((row) => (
              <tr
                className="border-b border-slate-100 text-sm text-slate-700"
                key={getRowKey(row)}
              >
                {columns.map((column) => (
                  <td className={`px-4 py-4 ${column.cellClassName || ''}`} key={column.key}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default DataTable
