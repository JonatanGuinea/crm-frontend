import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function LineItemsEditor({ items, onChange, products = [] }) {
  const [openInfo, setOpenInfo] = useState(null) // { idx, el }
  const [dropdownPos, setDropdownPos] = useState(null) // { top, left, width }

  function computePos(el) {
    const rect = el.getBoundingClientRect()
    setDropdownPos({ top: rect.bottom + 2, left: rect.left, width: Math.max(rect.width, 260) })
  }

  useEffect(() => {
    if (!openInfo?.el) return
    computePos(openInfo.el)

    const onScroll = () => computePos(openInfo.el)

    // Attach to all scrollable ancestors
    const ancestors = []
    let node = openInfo.el.parentElement
    while (node) {
      const { overflowY, overflow } = window.getComputedStyle(node)
      if (['auto', 'scroll'].includes(overflowY) || ['auto', 'scroll'].includes(overflow)) {
        ancestors.push(node)
      }
      node = node.parentElement
    }
    ancestors.forEach(a => a.addEventListener('scroll', onScroll))
    window.addEventListener('resize', onScroll)

    return () => {
      ancestors.forEach(a => a.removeEventListener('scroll', onScroll))
      window.removeEventListener('resize', onScroll)
    }
  }, [openInfo?.el])

  function handleFocus(e, idx) {
    const el = e.currentTarget
    setOpenInfo({ idx, el })
    computePos(el)
  }

  function handleBlur() {
    setTimeout(() => setOpenInfo(null), 150)
  }

  function update(index, field, value) {
    const updated = items.map((item, i) => {
      if (i !== index) return item
      const next = { ...item, [field]: value }
      next.amount = parseFloat(next.quantity || 0) * parseFloat(next.unitPrice || 0)
      return next
    })
    onChange(updated)
  }

  function selectProduct(index, product) {
    const price = product.salePrice ?? product.costPrice ?? 0
    const updated = items.map((item, i) => {
      if (i !== index) return item
      const next = { ...item, description: product.name, unitPrice: Number(price) }
      next.amount = parseFloat(next.quantity || 0) * parseFloat(next.unitPrice || 0)
      return next
    })
    onChange(updated)
    setOpenInfo(null)
  }

  function add() {
    onChange([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }])
  }

  function remove(index) {
    onChange(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0)

  const inputCls = "w-full px-2 py-1.5 border border-line-soft rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand bg-surface text-fg"

  const openIdx = openInfo?.idx ?? null
  const suggestions = openIdx !== null && products.length > 0
    ? products.filter(p => {
        const query = items[openIdx]?.description?.toLowerCase() ?? ''
        return query === '' ? true : p.name.toLowerCase().includes(query)
      }).slice(0, 20)
    : []

  return (
    <div>
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
                  onFocus={e => handleFocus(e, i)}
                  onBlur={handleBlur}
                  className={inputCls}
                  autoComplete="off"
                />
              </td>
              <td className="py-1.5 pr-2">
                <input
                  type="number"
                  min="1"
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

      {openInfo && suggestions.length > 0 && dropdownPos && createPortal(
        <ul
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
          }}
          className="bg-surface border border-line rounded-lg shadow-xl overflow-y-auto max-h-56"
        >
          {suggestions.map(p => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={() => selectProduct(openIdx, p)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-raised transition-colors gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-fg font-medium truncate">{p.name}</p>
                  {p.sku && <p className="text-xs text-fg-muted">{p.sku}</p>}
                </div>
                <div className="shrink-0 text-right">
                  {(p.salePrice != null || p.costPrice != null)
                    ? <p className="text-sm font-semibold text-brand">${Number(p.salePrice ?? p.costPrice).toLocaleString('es-AR')}</p>
                    : <p className="text-xs text-fg-muted">Sin precio</p>
                  }
                  <p className="text-xs text-fg-muted">Stock: {parseInt(p.stock) || 0}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  )
}
