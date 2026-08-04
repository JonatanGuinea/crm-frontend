import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { stockIn, stockOut, stockAdjustment, getProducts } from '../../api/stock'
import { useToast } from '../../components/Toast'
import {
  XMarkIcon, ArrowDownTrayIcon, ArrowUpTrayIcon,
  AdjustmentsHorizontalIcon, MagnifyingGlassIcon, ChevronLeftIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

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

const titles = { in: 'Ingreso de stock', out: 'Egreso de stock', adjustment: 'Ajuste de inventario' }
const icons  = {
  in:         <ArrowDownTrayIcon className="w-4 h-4 text-success" />,
  out:        <ArrowUpTrayIcon className="w-4 h-4 text-danger" />,
  adjustment: <AdjustmentsHorizontalIcon className="w-4 h-4 text-warning" />,
}

const inputCls = 'w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors placeholder:text-fg-muted'
const labelCls = 'block text-xs font-medium text-fg-muted mb-1'

// ── Paso 1: seleccionar producto ──────────────────────────────────────────────
function ProductPicker({ mode, onSelect, onClose }) {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['products', { limit: 200 }],
    queryFn: () => getProducts({ limit: 200 }).then(r => r.data.data),
    staleTime: 30_000,
  })

  const all = data?.items ?? []
  const filtered = search.trim()
    ? all.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      )
    : all

  function stockState(p) {
    const s = Number(p.stock), m = Number(p.minStock)
    if (s <= 0)           return 'out'
    if (m > 0 && s <= m)  return 'low'
    return 'ok'
  }

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
        <div className="flex items-center gap-2">
          {icons[mode]}
          <h2 className="text-base font-semibold text-fg">{titles[mode]}</h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-raised text-fg-muted hover:text-fg transition-colors">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Buscador */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <p className="text-xs text-fg-muted mb-2 font-medium">Seleccioná un producto</p>
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU…"
            className="pl-9 pr-3 py-2 w-full rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors placeholder:text-fg-muted"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-1.5 min-h-0">
        {isLoading ? (
          <p className="text-sm text-fg-muted text-center py-8">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-fg-muted text-center py-8">
            {search ? 'Sin resultados.' : 'No hay productos activos.'}
          </p>
        ) : filtered.map(p => {
          const state = stockState(p)
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-line hover:border-brand/40 hover:bg-brand-subtle/10 text-left transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fg truncate">{p.name}</p>
                <p className="text-xs text-fg-muted font-mono">{p.sku}</p>
              </div>
              <div className="text-right shrink-0 flex items-center gap-1.5">
                {state === 'out' && <ExclamationTriangleIcon className="w-3.5 h-3.5 text-danger shrink-0" />}
                {state === 'low' && <ExclamationTriangleIcon className="w-3.5 h-3.5 text-warning shrink-0" />}
                <div>
                  <p className={`text-sm font-semibold ${state === 'out' ? 'text-danger' : state === 'low' ? 'text-warning' : 'text-fg'}`}>
                    {Number(p.stock).toLocaleString('es-AR')}
                  </p>
                  <p className="text-xs text-fg-muted">{p.unit}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Paso 2: formulario de movimiento ─────────────────────────────────────────
function MovementForm({ product, mode, onBack, onClose }) {
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
    onError: (err) => toast(err.response?.data?.error ?? err.response?.data?.message ?? 'Error en la operación', 'error'),
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

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-xl w-full max-w-md flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-line">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="p-1 rounded-md hover:bg-raised text-fg-muted hover:text-fg transition-colors mr-1">
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          )}
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
            <p className="text-lg font-bold text-fg">
              {Number(product.stock).toLocaleString('es-AR')}
              <span className="text-xs text-fg-muted font-normal ml-1">{product.unit}</span>
            </p>
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
            {form.targetStock !== '' && Number(form.targetStock) !== Number(product.stock) && (
              <p className="text-xs text-fg-muted mt-1">
                Diferencia:{' '}
                <span className={Number(form.targetStock) > Number(product.stock) ? 'text-success font-medium' : 'text-danger font-medium'}>
                  {Number(form.targetStock) > Number(product.stock) ? '+' : ''}
                  {(Number(form.targetStock) - Number(product.stock)).toFixed(2)} {product.unit}
                </span>
              </p>
            )}
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
  )
}

// ── Modal principal ───────────────────────────────────────────────────────────
// product: si se pasa, saltea el selector y va directo al formulario
export default function StockMovementModal({ product: initialProduct = null, mode = 'in', onClose }) {
  const [product, setProduct] = useState(initialProduct)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      {!product
        ? <ProductPicker mode={mode} onSelect={setProduct} onClose={onClose} />
        : <MovementForm
            product={product}
            mode={mode}
            onBack={initialProduct ? null : () => setProduct(null)}
            onClose={onClose}
          />
      }
    </div>
  )
}
