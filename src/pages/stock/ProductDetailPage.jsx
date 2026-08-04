import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProduct, getProductMovements } from '../../api/stock'
import StockMovementModal from './StockMovementModal'
import {
  ArrowLeftIcon, ArrowDownTrayIcon, ArrowUpTrayIcon,
  AdjustmentsHorizontalIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

const MOVEMENT_LABELS = {
  initial:        'Carga inicial',
  purchase:       'Compra',
  sale:           'Venta',
  adjustment_in:  'Ajuste +',
  adjustment_out: 'Ajuste −',
  return_in:      'Devolución recibida',
  return_out:     'Devolución enviada',
  production_in:  'Producción',
  production_out: 'Consumo',
  transfer_in:    'Transferencia entrada',
  transfer_out:   'Transferencia salida',
  correction:     'Corrección',
}

function fmtDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const [modal, setModal] = useState(null)
  const [page, setPage]   = useState(1)
  const LIMIT = 25

  const { data: productData, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id).then(r => r.data.data),
  })

  const { data: movData, isLoading: loadingMov } = useQuery({
    queryKey: ['product-movements', id, page],
    queryFn: () => getProductMovements(id, { page, limit: LIMIT }).then(r => r.data.data),
    enabled: Boolean(id),
  })

  const product   = productData
  const movements = movData?.movements ?? []
  const total     = movData?.total ?? 0
  const pages     = Math.ceil(total / LIMIT)

  if (loadingProduct) return <div className="flex items-center justify-center py-20 text-fg-muted text-sm">Cargando…</div>
  if (!product) return <div className="flex items-center justify-center py-20 text-fg-muted text-sm">Producto no encontrado.</div>

  const stock = Number(product.stock)
  const min   = Number(product.minStock)
  const isOut = stock <= 0
  const isLow = !isOut && min > 0 && stock <= min

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      {/* Back */}
      <Link to="/stock/products" className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors w-fit">
        <ArrowLeftIcon className="w-4 h-4" />
        Volver a productos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-xs text-fg-muted">{product.sku}</p>
          <h1 className="text-2xl font-bold text-fg mt-0.5">{product.name}</h1>
          {product.description && <p className="text-sm text-fg-muted mt-1">{product.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModal('in')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success-subtle text-success text-sm font-medium hover:opacity-80 transition-opacity">
            <ArrowDownTrayIcon className="w-4 h-4" />
            Ingresar
          </button>
          <button onClick={() => setModal('out')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-danger-subtle text-danger text-sm font-medium hover:opacity-80 transition-opacity">
            <ArrowUpTrayIcon className="w-4 h-4" />
            Egresar
          </button>
          <button onClick={() => setModal('adj')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-warning-subtle text-warning text-sm font-medium hover:opacity-80 transition-opacity">
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            Ajustar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`rounded-xl border p-4 ${isOut ? 'border-danger/30 bg-danger-subtle/10' : isLow ? 'border-warning/30 bg-warning-subtle/10' : 'border-line bg-surface'}`}>
          <p className="text-xs text-fg-muted">Stock actual</p>
          <div className="flex items-end gap-1.5 mt-1">
            {(isOut || isLow) && <ExclamationTriangleIcon className={`w-4 h-4 mb-0.5 ${isOut ? 'text-danger' : 'text-warning'}`} />}
            <p className={`text-2xl font-bold ${isOut ? 'text-danger' : isLow ? 'text-warning' : 'text-fg'}`}>
              {stock.toLocaleString('es-AR')}
            </p>
            <p className="text-sm text-fg-muted mb-0.5">{product.unit}</p>
          </div>
          {isOut && <p className="text-xs text-danger mt-1 font-medium">Sin stock</p>}
          {isLow && <p className="text-xs text-warning mt-1 font-medium">Stock bajo (mín: {min})</p>}
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs text-fg-muted">Precio de costo</p>
          <p className="text-2xl font-bold text-fg mt-1">
            {product.costPrice ? `$${Number(product.costPrice).toLocaleString('es-AR')}` : '—'}
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs text-fg-muted">Precio de venta</p>
          <p className="text-2xl font-bold text-fg mt-1">
            {product.salePrice ? `$${Number(product.salePrice).toLocaleString('es-AR')}` : '—'}
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs text-fg-muted">Valor en stock</p>
          <p className="text-2xl font-bold text-fg mt-1">
            {product.costPrice
              ? `$${(stock * Number(product.costPrice)).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
              : '—'}
          </p>
        </div>
      </div>

      {/* Kardex */}
      <div>
        <h2 className="text-base font-semibold text-fg mb-3">Kardex — {total} movimiento{total !== 1 ? 's' : ''}</h2>

        {loadingMov ? (
          <div className="flex items-center justify-center py-12 text-fg-muted text-sm">Cargando…</div>
        ) : movements.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-fg-muted text-sm border border-dashed border-line rounded-2xl">
            Sin movimientos registrados.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-raised/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Tipo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Cantidad</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Stock anterior</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Stock nuevo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Referencia</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m, i) => (
                  <tr key={m.id} className={`border-b border-line last:border-0 hover:bg-raised/40 transition-colors ${i % 2 === 0 ? '' : 'bg-raised/20'}`}>
                    <td className="px-4 py-3 text-xs text-fg-muted whitespace-nowrap">{fmtDateTime(m.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        m.direction === 'IN' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                      }`}>
                        {MOVEMENT_LABELS[m.type] ?? m.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${m.direction === 'IN' ? 'text-success' : 'text-danger'}`}>
                      {m.direction === 'IN' ? '+' : '−'}{Number(m.quantity).toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-right text-fg-muted">{Number(m.previousStock).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3 text-right font-medium text-fg">{Number(m.currentStock).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3 text-xs text-fg-muted">
                      <div>{m.reference ?? '—'}</div>
                      {m.reason && <div className="text-fg-muted/70 mt-0.5">{m.reason}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted">{m.createdBy?.name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-line text-sm text-fg-muted hover:text-fg hover:bg-raised transition-colors disabled:opacity-40">Anterior</button>
            <span className="text-sm text-fg-muted">{page} / {pages}</span>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-line text-sm text-fg-muted hover:text-fg hover:bg-raised transition-colors disabled:opacity-40">Siguiente</button>
          </div>
        )}
      </div>

      {modal && (
        <StockMovementModal
          product={product}
          mode={modal === 'adj' ? 'adjustment' : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
