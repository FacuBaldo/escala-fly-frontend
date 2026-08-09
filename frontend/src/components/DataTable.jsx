function DataTable({ columns, emptyMessage, getRowKey, isLoading, loadingMessage, rows }) {
  return (
    <section className="min-w-0 rounded-lg border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-950/5">
      <div className="overflow-x-auto">
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
            {isLoading && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={columns.length}>
                  {loadingMessage}
                </td>
              </tr>
            )}

            {!isLoading && rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!isLoading &&
              rows.map((row) => (
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
