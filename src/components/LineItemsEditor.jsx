export default function LineItemsEditor({ items, onChange }) {
  function update(index, field, value) {
    const updated = items.map((item, i) => {
      if (i !== index) return item
      const next = { ...item, [field]: value }
      next.amount = parseFloat(next.quantity || 0) * parseFloat(next.unitPrice || 0)
      return next
    })
    onChange(updated)
  }

  function add() {
    onChange([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }])
  }

  function remove(index) {
    onChange(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0)

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left pb-2 pr-2 font-medium">Descripción</th>
              <th className="text-right pb-2 pr-2 font-medium w-20">Cant.</th>
              <th className="text-right pb-2 pr-2 font-medium w-28">P. unitario</th>
              <th className="text-right pb-2 font-medium w-28">Subtotal</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, i) => (
              <tr key={i}>
                <td className="py-1.5 pr-2">
                  <input
                    type="text"
                    required
                    placeholder="Descripción del ítem"
                    value={item.description}
                    onChange={e => update(i, 'description', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={item.quantity}
                    onChange={e => update(i, 'quantity', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={item.unitPrice}
                    onChange={e => update(i, 'unitPrice', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="py-1.5 text-right text-gray-700 font-medium">
                  ${(parseFloat(item.amount) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-1.5 pl-2">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-gray-400 hover:text-red-500 text-lg leading-none"
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-2 text-sm text-indigo-600 hover:underline"
      >
        + Agregar ítem
      </button>

      <div className="mt-3 text-right text-sm text-gray-600">
        Subtotal: <span className="font-medium text-gray-900">
          ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  )
}
