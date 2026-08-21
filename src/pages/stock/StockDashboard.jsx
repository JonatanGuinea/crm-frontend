import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getStockDashboard, getStockHistory } from '../../api/stock'
import StockMovementModal from './StockMovementModal'
import {
  CubeIcon, ExclamationTriangleIcon, XCircleIcon,
  ArrowDownTrayIcon, ArrowUpTrayIcon, ClockIcon,
  ShoppingCartIcon, WrenchScrewdriverIcon, BeakerIcon,
} from '@heroicons/react/24/outline'

const MOVEMENT_LABELS = {
  initial: 'Carga inicial', purchase: 'Compra', sale: 'Venta',
  adjustment_in: 'Ajuste +', adjustment_out: 'Ajuste −',
  return_in: 'Dev. recibida', return_out: 'Dev. enviada',
  production_in: 'Producción', production_out: 'Consumo',
  transfer_in: 'Transf. entrada', transfer_out: 'Transf. salida',
  correction: 'Corrección',
  internal_consumption: 'Consumo interno',
}

const STOCK_ACTION_LABEL = {
  initial:              'cargó stock inicial de',
  purchase:             'registró una compra de',
  sale:                 'registró una venta de',
  adjustment_in:        'realizó un ajuste + de',
  adjustment_out:       'realizó un ajuste − de',
  return_in:            'registró una devolución recibida de',
  return_out:           'registró una devolución enviada de',
  production_in:        'registró producción de',
  production_out:       'registró consumo de',
  internal_consumption: 'registró consumo interno de',
  correction:           'realizó una corrección de',
  transfer_in:          'registró entrada de transferencia de',
  transfer_out:         'registró salida de transferencia de',
}

function fmtDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function StatCard({ icon: CardIcon, label, value, sub, color = 'text-fg', bg = 'bg-surface', border = 'border-line', to }) {
  const content = (
    <div className={`h-full rounded-xl border p-5 flex flex-col gap-3 ${bg} ${border} ${to ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-fg-muted">{label}</p>
        <CardIcon className={`w-4 h-4 ${color} opacity-70`} />
      </div>
      <div>
        <p className={`text-2xl sm:text-3xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-fg-muted mt-1">{sub}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to} className="block h-full">{content}</Link> : content
}

export default function StockDashboard() {
  const [modal, setModal] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [historyVisible, setHistoryVisible] = useState(25)

  const { data, isLoading } = useQuery({
    queryKey: ['stock-dashboard'],
    queryFn: () => getStockDashboard().then(r => r.data.data),
    refetchInterval: 60_000,
  })

  const { data: historyData = [] } = useQuery({
    queryKey: ['stock-history'],
    queryFn: () => getStockHistory().then(r => r.data.data),
    enabled: tab === 'history',
  })

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">Stock</h1>
          <p className="text-sm text-fg-muted mt-0.5">Resumen del inventario</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tab switcher */}
          <div className="flex items-center gap-0.5 bg-raised rounded-lg border border-line overflow-hidden">
            <button
              onClick={() => setTab('dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'dashboard' ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'}`}
            >
              Inventario
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'history' ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'}`}
            >
              <ClockIcon className="w-4 h-4" />
              Historial
            </button>
          </div>
          <button
            onClick={() => setModal('in')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Ingreso
          </button>
          <button
            onClick={() => setModal('out')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            Egreso
          </button>
        </div>
      </div>

      {/* ── Historial ── */}
      {tab === 'history' && (
        <div className="flex flex-col gap-4 max-w-2xl">
          {historyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-fg-muted">
              <ClockIcon className="w-10 h-10 opacity-30" />
              <p className="text-sm">Sin movimientos registrados.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {historyData.slice(0, historyVisible).map((entry, i) => {
                const initials = entry.createdBy?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'
                const date = new Date(entry.createdAt)
                const dateStr = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
                const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                const shown = historyData.slice(0, historyVisible)
                const qty = Number(entry.quantity).toLocaleString('es-AR')
                const unit = entry.product?.unit ?? ''
                return (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-brand-subtle text-brand text-[11px] font-bold flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      {i < shown.length - 1 && <div className="w-px flex-1 bg-line mt-1 mb-1 min-h-[16px]" />}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                        <span className="text-sm font-semibold text-fg">{entry.createdBy?.name ?? 'Sistema'}</span>
                        <span className="text-sm text-fg-muted">
                          {STOCK_ACTION_LABEL[entry.type] ?? 'registró un movimiento de'}
                        </span>
                        <span className={`text-sm font-medium ${entry.direction === 'IN' ? 'text-success' : 'text-danger'}`}>
                          {entry.direction === 'IN' ? '+' : '−'}{qty} {unit}
                        </span>
                      </div>
                      <Link to={`/stock/products/${entry.product?.id}`} className="text-xs text-brand hover:underline">
                        {entry.product?.name}
                      </Link>
                      {(entry.reason || entry.client?.name) && (
                        <p className="text-xs text-fg-muted/80 mt-0.5">
                          {[entry.reason, entry.client?.name].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <p className="text-[11px] text-fg-muted/70 mt-0.5">{dateStr} · {timeStr}</p>
                    </div>
                  </div>
                )
              })}
              {historyData.length > historyVisible && (
                <button
                  onClick={() => setHistoryVisible(v => v + 25)}
                  className="mt-2 text-xs text-fg-muted hover:text-fg text-center py-2 border border-dashed border-line rounded-xl transition-colors"
                >
                  Mostrar más ({historyData.length - historyVisible} restante{historyData.length - historyVisible !== 1 ? 's' : ''})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Dashboard ── */}
      {tab === 'dashboard' && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-fg-muted text-sm">Cargando…</div>
          ) : !data ? null : (
            <>
              {/* Stats — fila 1: totales y alertas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={CubeIcon}
                  label="Total productos"
                  value={data.totalProducts}
                  sub={`${data.activeProducts} activos`}
                  to="/stock/products"
                />
                <StatCard
                  icon={XCircleIcon}
                  label="Sin stock"
                  value={data.outOfStock}
                  color={data.outOfStock > 0 ? 'text-danger' : 'text-fg'}
                  bg={data.outOfStock > 0 ? 'bg-danger-subtle/10' : 'bg-surface'}
                  border={data.outOfStock > 0 ? 'border-danger/30' : 'border-line'}
                  to={data.outOfStock > 0 ? '/stock/products?outOfStock=true' : undefined}
                />
                <StatCard
                  icon={ExclamationTriangleIcon}
                  label="Stock bajo"
                  value={data.lowStock}
                  color={data.lowStock > 0 ? 'text-warning' : 'text-fg'}
                  bg={data.lowStock > 0 ? 'bg-warning-subtle/10' : 'bg-surface'}
                  border={data.lowStock > 0 ? 'border-warning/30' : 'border-line'}
                  to={data.lowStock > 0 ? '/stock/products?lowStock=true' : undefined}
                />
              </div>

              {/* Stats — fila 2: por tipo de inventario */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                  icon={ShoppingCartIcon}
                  label="Productos para venta"
                  value={data.productsByType?.sale ?? 0}
                  sub={data.valueByType?.sale ? `$${Number(data.valueByType.sale).toLocaleString('es-AR', { maximumFractionDigits: 0 })} en stock` : 'Sin valorización'}
                  color="text-brand"
                  to="/stock/products?inventoryType=sale"
                />
                <StatCard
                  icon={WrenchScrewdriverIcon}
                  label="Stock interno"
                  value={data.productsByType?.internal ?? 0}
                  sub={data.valueByType?.internal ? `$${Number(data.valueByType.internal).toLocaleString('es-AR', { maximumFractionDigits: 0 })} en stock` : 'Sin valorización'}
                  color="text-warning"
                  to="/stock/products?inventoryType=internal"
                />
                <StatCard
                  icon={BeakerIcon}
                  label="Materias primas"
                  value={data.productsByType?.raw_material ?? 0}
                  sub={data.valueByType?.raw_material ? `$${Number(data.valueByType.raw_material).toLocaleString('es-AR', { maximumFractionDigits: 0 })} en stock` : 'Sin valorización'}
                  color="text-success"
                  to="/stock/products?inventoryType=raw_material"
                />
              </div>

              {/* Últimos movimientos */}
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-fg">Últimos movimientos</h2>

                {data.recentMovements.length === 0 ? (
                  <p className="text-sm text-fg-muted py-4 text-center border border-dashed border-line rounded-xl">Sin movimientos aún.</p>
                ) : (
                  <>
                    {/* Desktop */}
                    <div className="hidden md:block overflow-hidden rounded-2xl border border-line">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-line bg-raised/60">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Tipo</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Producto</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Motivo</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Fecha</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Cantidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.recentMovements.map((m, i) => (
                            <tr key={m.id} className={`border-b border-line last:border-0 hover:bg-raised/40 transition-colors ${i % 2 === 0 ? '' : 'bg-raised/20'}`}>
                              <td className="px-4 py-3">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${m.direction === 'IN' ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
                                  {m.direction === 'IN'
                                    ? <ArrowDownTrayIcon className="w-3.5 h-3.5 text-success" />
                                    : <ArrowUpTrayIcon className="w-3.5 h-3.5 text-danger" />
                                  }
                                </div>
                              </td>
                              <td className="px-4 py-3 font-medium text-fg">{m.product?.name}</td>
                              <td className="px-4 py-3 text-fg-muted">{MOVEMENT_LABELS[m.type] ?? m.type}</td>
                              <td className="px-4 py-3 text-fg-muted text-xs">{fmtDateTime(m.createdAt)}</td>
                              <td className={`px-4 py-3 text-right font-semibold ${m.direction === 'IN' ? 'text-success' : 'text-danger'}`}>
                                {m.direction === 'IN' ? '+' : '−'}{Number(m.quantity).toLocaleString('es-AR')}
                                <span className="text-xs text-fg-muted font-normal ml-1">{m.product?.unit}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile */}
                    <div className="flex flex-col gap-3 md:hidden">
                      {data.recentMovements.map(m => (
                        <div key={m.id} className="bg-surface border border-line rounded-xl p-4 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.direction === 'IN' ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
                            {m.direction === 'IN'
                              ? <ArrowDownTrayIcon className="w-3.5 h-3.5 text-success" />
                              : <ArrowUpTrayIcon className="w-3.5 h-3.5 text-danger" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-fg truncate">{m.product?.name}</p>
                            <p className="text-xs text-fg-muted">{MOVEMENT_LABELS[m.type] ?? m.type} · {fmtDateTime(m.createdAt)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-semibold ${m.direction === 'IN' ? 'text-success' : 'text-danger'}`}>
                              {m.direction === 'IN' ? '+' : '−'}{Number(m.quantity).toLocaleString('es-AR')}
                            </p>
                            <p className="text-xs text-fg-muted">{m.product?.unit}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}

      {modal && (
        <StockMovementModal mode={modal} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
