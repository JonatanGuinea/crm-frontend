import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { stockIn, stockOut, stockAdjustment, getProducts } from '../../api/stock'
import { useToast } from '../../components/Toast'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

function CloseSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}
function ArrowDownSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
}
function ArrowUpSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
}
function AdjustSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>
}
function SearchSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
}
function ChevronLSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
}
function WarnSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
}

const IN_TYPES = [
  { value: 'purchase',       label: 'Compra a proveedor' },
  { value: 'return_in',      label: 'Devolución de cliente' },
  { value: 'production_in',  label: 'Producción / ensamblado' },
  { value: 'transfer_in',    label: 'Transferencia recibida' },
  { value: 'adjustment_in',  label: 'Ajuste positivo' },
]

const OUT_TYPES = [
  { value: 'sale',                 label: 'Venta' },
  { value: 'internal_consumption', label: 'Consumo interno' },
  { value: 'return_out',           label: 'Devolución a proveedor' },
  { value: 'production_out',       label: 'Consumo en producción' },
  { value: 'transfer_out',         label: 'Transferencia enviada' },
  { value: 'adjustment_out',       label: 'Ajuste negativo' },
]

const INVENTORY_TYPE_BADGES = {
  sale:         { label: 'Para venta',    bg: 'rgba(142,177,222,0.12)', color: C.info },
  internal:     { label: 'Interno',       bg: 'rgba(226,182,99,0.12)',  color: C.warn },
  raw_material: { label: 'Materia prima', bg: 'rgba(125,190,147,0.12)', color: C.ok },
}

const titles = { in: 'Ingreso de stock', out: 'Egreso de stock', adjustment: 'Ajuste de inventario' }
const modeIconColor = { in: C.ok, out: C.err, adjustment: C.warn }

function ModeIcon({ mode, style }) {
  if (mode === 'in')         return <ArrowDownSvg style={{ ...style, color: C.ok }} />
  if (mode === 'out')        return <ArrowUpSvg style={{ ...style, color: C.err }} />
  return <AdjustSvg style={{ ...style, color: C.warn }} />
}

const labelStyle = { fontSize: 11, fontWeight: 500, color: C.piedra, display: 'block', marginBottom: 4 }

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
    if (s <= 0)          return 'out'
    if (m > 0 && s <= m) return 'low'
    return 'ok'
  }

  return (
    <div style={{ width: '100%', maxWidth: 448, background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 0 0', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '92dvh' }}
      className="sm:rounded-[0_16px_16px_0] sm:max-h-[85vh]">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ModeIcon mode={mode} style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: C.crema }}>{titles[mode]}</span>
        </div>
        <button onClick={onClose}
          style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
          onMouseEnter={e => e.currentTarget.style.color = C.crema}
          onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
          <CloseSvg style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Buscador */}
      <div style={{ padding: '16px 16px 8px', flexShrink: 0 }}>
        <p style={{ fontSize: 12, color: C.piedra, marginBottom: 8, fontWeight: 500 }}>Seleccioná un producto</p>
        <div style={{ position: 'relative' }}>
          <SearchSvg style={{ width: 16, height: 16, color: C.piedra, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU…"
            style={{ paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, width: '100%', background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', fontSize: 13, color: C.crema, outline: 'none' }}
            className="placeholder:text-[#8C877E]" />
        </div>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
        {isLoading ? (
          <p style={{ fontSize: 14, color: C.piedra, textAlign: 'center', padding: '32px 0' }}>Cargando…</p>
        ) : filtered.length === 0 ? (
          <p style={{ fontSize: 14, color: C.piedra, textAlign: 'center', padding: '32px 0' }}>
            {search ? 'Sin resultados.' : 'No hay productos activos.'}
          </p>
        ) : filtered.map(p => {
          const state = stockState(p)
          const badge = INVENTORY_TYPE_BADGES[p.inventoryType]
          return (
            <button key={p.id} onClick={() => onSelect(p)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: '0 12px 12px 0', border: `1px solid ${C.linea}`, background: 'none', textAlign: 'left', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(185,180,170,0.3)'; e.currentTarget.style.background = 'rgba(185,180,170,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.background = 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: C.crema, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <p style={{ fontSize: 12, color: C.piedra, fontFamily: 'monospace' }}>{p.sku}</p>
                  {badge && (
                    <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 100, fontWeight: 500, background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                {state === 'out' && <WarnSvg style={{ width: 14, height: 14, color: C.err, flexShrink: 0 }} />}
                {state === 'low' && <WarnSvg style={{ width: 14, height: 14, color: C.warn, flexShrink: 0 }} />}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: state === 'out' ? C.err : state === 'low' ? C.warn : C.crema }}>
                    {Number(p.stock).toLocaleString('es-AR')}
                  </p>
                  <p style={{ fontSize: 12, color: C.piedra }}>{p.unit}</p>
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

  const defaultOutType = mode === 'out'
    ? (product.inventoryType === 'sale' ? 'sale' : 'internal_consumption')
    : ''
  const [form, setForm] = useState({
    type:        mode === 'in' ? 'purchase' : defaultOutType,
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

  const submitBg = mode === 'out' ? C.err : mode === 'adjustment' ? C.warn : C.ok
  const badge = INVENTORY_TYPE_BADGES[product.inventoryType]

  return (
    <div style={{ width: '100%', maxWidth: 448, background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 0 0', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '92dvh' }}
      className="sm:rounded-[0_16px_16px_0] sm:max-h-[85vh]">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onBack && (
            <button onClick={onBack}
              style={{ padding: 4, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, marginRight: 4 }}
              onMouseEnter={e => { e.currentTarget.style.background = C.s2; e.currentTarget.style.color = C.crema }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.piedra }}>
              <ChevronLSvg style={{ width: 16, height: 16 }} />
            </button>
          )}
          <ModeIcon mode={mode} style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: C.crema }}>{titles[mode]}</span>
        </div>
        <button onClick={onClose}
          style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
          onMouseEnter={e => e.currentTarget.style.color = C.crema}
          onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
          <CloseSvg style={{ width: 18, height: 18 }} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {/* Producto info */}
        <div style={{ padding: '16px 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0 12px 12px 0', background: C.s2, border: `1px solid ${C.linea}`, padding: '12px 16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <p style={{ fontSize: 12, color: C.piedra, fontFamily: 'monospace' }}>{product.sku}</p>
                {badge && (
                  <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 100, fontWeight: 500, background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.crema, marginTop: 2 }}>{product.name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: C.piedra }}>Stock actual</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: C.crema }}>
                {Number(product.stock).toLocaleString('es-AR')}
                <span style={{ fontSize: 12, color: C.piedra, fontWeight: 400, marginLeft: 4 }}>{product.unit}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '8px 20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode !== 'adjustment' && (
            <div>
              <label style={labelStyle}>Tipo de movimiento *</label>
              <select className="du-input" value={form.type} onChange={set('type')} required>
                {(mode === 'in' ? IN_TYPES : OUT_TYPES).map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          )}

          {mode === 'adjustment' ? (
            <div>
              <label style={labelStyle}>Nuevo stock total *</label>
              <input className="du-input"
                type="number" min="0" step="0.01"
                placeholder={`Stock actual: ${Number(product.stock)}`}
                value={form.targetStock}
                onChange={set('targetStock')}
                required />
              {form.targetStock !== '' && Number(form.targetStock) !== Number(product.stock) && (
                <p style={{ fontSize: 12, color: C.piedra, marginTop: 4 }}>
                  Diferencia:{' '}
                  <span style={{ fontWeight: 500, color: Number(form.targetStock) > Number(product.stock) ? C.ok : C.err }}>
                    {Number(form.targetStock) > Number(product.stock) ? '+' : ''}
                    {(Number(form.targetStock) - Number(product.stock)).toFixed(2)} {product.unit}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Cantidad *</label>
                <input className="du-input"
                  type="number" min="0.01" step="0.01"
                  placeholder="0"
                  value={form.quantity}
                  onChange={set('quantity')}
                  required />
              </div>
              <div>
                <label style={labelStyle}>Costo unitario</label>
                <input className="du-input"
                  type="number" min="0" step="0.01"
                  placeholder="0.00"
                  value={form.unitCost}
                  onChange={set('unitCost')} />
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Referencia (nro. factura, OC, etc.)</label>
            <input className="du-input" placeholder="Opcional" value={form.reference} onChange={set('reference')} />
          </div>

          <div>
            <label style={labelStyle}>Motivo / observaciones</label>
            <textarea className="du-input" rows={2} placeholder="Opcional" value={form.reason} onChange={set('reason')} />
          </div>
        </form>
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.linea}`, display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
        <button type="button" onClick={onClose}
          style={{ padding: '10px 16px', borderRadius: '0 10px 10px 0', border: `1px solid ${C.linea}`, background: 'none', color: C.piedra, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
          onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
          Cancelar
        </button>
        <button onClick={handleSubmit} disabled={mutation.isPending}
          style={{ padding: '10px 16px', borderRadius: '0 10px 10px 0', border: 'none', background: submitBg, color: C.bg, fontSize: 13, fontWeight: 600, cursor: mutation.isPending ? 'not-allowed' : 'pointer', opacity: mutation.isPending ? 0.5 : 1 }}>
          {mutation.isPending ? 'Procesando…' : titles[mode]}
        </button>
      </div>
    </div>
  )
}

// ── Modal principal ───────────────────────────────────────────────────────────
export default function StockMovementModal({ product: initialProduct = null, mode = 'in', onClose }) {
  const [product, setProduct] = useState(initialProduct)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      className="sm:items-center">
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
