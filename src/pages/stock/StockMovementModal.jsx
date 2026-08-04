import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { stockIn, stockOut, stockAdjustment } from '../../api/stock'
import { useToast } from '../../components/Toast'
import { XMarkIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'

const IN_TYPES = [
  { value: 'purchase',       label: 'Compra a proveedor' },
  { value: 'return_in',      label: 'Devolución de cliente' },
  { value: 'production_in',  label: 'Producción / ensamblado' },
  { value: 'transfer_in',    label: 'Transferencia recibida' },
  { value: 'adjustment_in',  label: 'Ajuste positivo' },
]

const OUT_TYPES = [
  { value: 'sale',           label: 'Venta' },
  { value: 'return_out',     label: 'Devolución a proveedor' },
  { value: 'production_out', label: 'Consumo en producción' },
  { value: 'transfer_out',   label: 'Transferencia enviada' },
  { value: 'adjustment_out', label: 'Ajuste negativo' },
]

// mode: 'in' | 'out' | 'adjustment'
export default function StockMovementModal({ product, mode = 'in', onClose }) {
  const qc    = useQueryClient()
  const toast = useToast()

  const [form, setForm] = useState({
    type:        mode === 'in' ? 'purchase' : mode === 'out' ? 'sale' : '',
    quantity:    '',
    targetStock: '',
    unitCost:    '',
    reason:      '',
    reference:   '',
  })

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  const mutation = useMutation({
    mutationFn: (data) => {
      if (mode === 'adjustment') return stockAdjustment(data)
      if (mode === 'in')  return stockIn(data)
      return stockOut(data)
    },
    onSuccess: () => {
      qc.invalidateQueries(['products'])
      qc.invalidateQueries(['product', product.id])
      qc.invalidateQueries(['product-movements', product.id])
      qc.invalidateQueries(['stock-dashboard'])
      qc.invalidateQueries(['stock-movements'])
      toast(
        mode === 'in' ? 'Stock ingresado' : mode === 'out' ? 'Stock egresado' : 'Stock ajustado',
        'success'
      )
      onClose()
    },
    onError: (err) => toast(err.response?.data?.message ?? 'Error en la operación', 'error'),
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (mode === 'adjustment') {
      mutation.mutate({
        productId:   product.id,
        targetStock: Number(form.targetStock),
        reason:      form.reason.trim() || undefined,
        reference:   form.reference.trim() || undefined,
      })
    } else {
      mutation.mutate({
        productId: product.id,
        type:      form.type,
        quantity:  Number(form.quantity),
        unitCost:  form.unitCost !== '' ? Number(form.unitCost) : undefined,
        reason:    form.reason.trim() || undefined,
        reference: form.reference.trim() || undefined,
      })
    }
  }

  const titles = { in: 'Ingreso de stock', out: 'Egreso de stock', adjustment: 'Ajuste de inventario' }
  const icons  = {
    in:         <ArrowDownTrayIcon className="w-4 h-4 text-success" />,
    out:        <ArrowUpTrayIcon className="w-4 h-4 text-danger" />,
    adjustment: <AdjustmentsHorizontalIcon className="w-4 h-4 text-warning" />,
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors placeholder:text-fg-muted'
  const labelCls = 'block text-xs font-medium text-fg-muted mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface border border-line rounded-2xl shadow-xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="flex items-center gap-2">
            {icons[mode]}
            <h2 className="text-base font-semibold text-fg">{titles[mode]}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-raised text-fg-muted hover:text-fg transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Producto */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between rounded-xl bg-raised border border-line px-4 py-3">
            <div>
              <p className="text-xs text-fg-muted">{product.sku}</p>
              <p className="text-sm font-semibold text-fg">{product.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-fg-muted">Stock actual</p>
              <p className="text-lg font-bold text-fg">{Number(product.stock).toLocaleString('es-AR')} <span className="text-xs text-fg-muted font-normal">{product.unit}</span></p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-4">
          {mode !== 'adjustment' && (
            <div>
              <label className={labelCls}>Tipo de movimiento *</label>
              <select className={inputCls} value={form.type} onChange={set('type')} required>
                {(mode === 'in' ? IN_TYPES : OUT_TYPES).map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          )}

          {mode === 'adjustment' ? (
            <div>
              <label className={labelCls}>Nuevo stock total *</label>
              <input
                className={inputCls}
                type="number" min="0" step="0.01"
                placeholder={`Stock actual: ${Number(product.stock)}`}
                value={form.targetStock}
                onChange={set('targetStock')}
                required
              />
              <p className="text-xs text-fg-muted mt-1">
                {form.targetStock !== '' && Number(form.targetStock) !== Number(product.stock) && (
                  <>
                    Diferencia:{' '}
                    <span className={Number(form.targetStock) > Number(product.stock) ? 'text-success font-medium' : 'text-danger font-medium'}>
                      {Number(form.targetStock) > Number(product.stock) ? '+' : ''}
                      {(Number(form.targetStock) - Number(product.stock)).toFixed(2)} {product.unit}
                    </span>
                  </>
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Cantidad *</label>
                <input
                  className={inputCls}
                  type="number" min="0.01" step="0.01"
                  placeholder="0"
                  value={form.quantity}
                  onChange={set('quantity')}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Costo unitario</label>
                <input
                  className={inputCls}
                  type="number" min="0" step="0.01"
                  placeholder="0.00"
                  value={form.unitCost}
                  onChange={set('unitCost')}
                />
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Referencia (nro. factura, OC, etc.)</label>
            <input className={inputCls} placeholder="Opcional" value={form.reference} onChange={set('reference')} />
          </div>

          <div>
            <label className={labelCls}>Motivo / observaciones</label>
            <textarea className={inputCls} rows={2} placeholder="Opcional" value={form.reason} onChange={set('reason')} />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-line text-sm text-fg-muted hover:text-fg hover:bg-raised transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className={`px-4 py-2 rounded-lg text-white text-sm font-semibold transition-opacity disabled:opacity-60 ${
              mode === 'out' ? 'bg-danger hover:opacity-90' : mode === 'adjustment' ? 'bg-warning hover:opacity-90' : 'bg-success hover:opacity-90'
            }`}
          >
            {mutation.isPending ? 'Procesando…' : titles[mode]}
          </button>
        </div>
      </div>
    </div>
  )
}
