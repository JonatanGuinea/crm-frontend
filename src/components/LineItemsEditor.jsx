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

  const inputCls = "w-full px-2 py-1.5 border border-line-soft rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand bg-surface text-fg"

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-fg-muted uppercase tracking-wide">
              <th className="text-left pb-2 pr-2 font-medium">Descripción</th>
              <th className="text-right pb-2 pr-2 font-medium w-20">Cant.</th>
              <th className="text-right pb-2 pr-2 font-medium w-28">P. unitario</th>
              <th className="text-right pb-2 font-medium w-28">Subtotal</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item, i) => (
              <tr key={i}>
                <td className="py-1.5 pr-2">
                  <input
                    type="text"
                    required
                    placeholder="Descripción del ítem"
                    value={item.description}
                    onChange={e => update(i, 'description', e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="number"
                    min="0.01"
                    step="1"
                    required
                    value={item.quantity}
                    onChange={e => update(i, 'quantity', e.target.value)}
                    className={`${inputCls} text-right`}
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={item.unitPrice}
                    onChange={e => update(i, 'unitPrice', e.target.value)}
                    className={`${inputCls} text-right`}
                  />
                </td>
                <td className="py-1.5 text-right text-fg font-medium">
                  ${(parseFloat(item.amount) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-1.5 pl-2">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-fg-muted hover:text-danger text-lg leading-none"
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
        className="mt-2 text-sm text-brand hover:underline"
      >
        + Agregar ítem
      </button>

      <div className="mt-3 text-right text-sm text-fg-soft">
        Subtotal: <span className="font-medium text-fg">
          ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  )
}
