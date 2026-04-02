interface Column {
  key: string;
  label: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  title: string;
  columns: Column[];
  data: any[];
}

export default function DataTable({ title, columns, data }: TableProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-xs border border-gray-50 hover:shadow-sm hover:border-gray-100 transition-all duration-300">
      <h3 className="text-sm font-semibold text-gray-900 mb-5">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide ${column.width || ""}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                {columns.map((column) => (
                  <td
                    key={`${idx}-${column.key}`}
                    className={`py-3 px-4 text-sm text-gray-700 ${column.width || ""}`}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


