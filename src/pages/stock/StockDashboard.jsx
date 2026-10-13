import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getStockDashboard, getStockHistory } from '../../api/stock'
import StockMovementModal from './StockMovementModal'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

function CubeSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
}
function XCircleSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
}
function WarnSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
}
function ClockSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
}
function ArrowDownSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
}
function ArrowUpSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
}
function CartSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
}
function WrenchSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
}
function BeakerSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v11l3.5 5.5A1 1 0 0 1 17.64 21H6.36a1 1 0 0 1-.86-1.5L9 14V3z" /><line x1="9" y1="3" x2="15" y2="3" /></svg>
}

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

function StatCard({ Icon, label, value, sub, accentColor = C.crema, cardBg = C.s1, borderColor = C.linea, to }) {
  const content = (
    <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: '0 16px 16px 0', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}
      className={to ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: C.piedra }}>{label}</p>
        <Icon style={{ width: 16, height: 16, color: accentColor, opacity: 0.7 }} />
      </div>
      <div>
        <p style={{ fontSize: 28, fontWeight: 700, color: accentColor }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: C.piedra, marginTop: 4 }}>{sub}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to} style={{ display: 'block', height: '100%' }}>{content}</Link> : content
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
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }} className="md:p-8">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CubeSvg style={{ width: 18, height: 18, color: C.arena }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema, margin: 0 }}>Stock</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 2, background: C.s2, borderRadius: '0 10px 10px 0', padding: 3 }}>
            <button onClick={() => setTab('dashboard')}
              style={{ padding: '6px 12px', borderRadius: '0 8px 8px 0', background: tab === 'dashboard' ? C.s3 : 'transparent', color: tab === 'dashboard' ? C.crema : C.piedra, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              Inventario
            </button>
            <button onClick={() => setTab('history')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: '0 8px 8px 0', background: tab === 'history' ? C.s3 : 'transparent', color: tab === 'history' ? C.crema : C.piedra, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              <ClockSvg style={{ width: 14, height: 14 }} />
              Historial
            </button>
          </div>
          <button onClick={() => setModal('in')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: '0 10px 10px 0', background: 'rgba(125,190,147,0.12)', color: C.ok, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <ArrowDownSvg style={{ width: 16, height: 16 }} />
            Ingreso
          </button>
          <button onClick={() => setModal('out')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: '0 10px 10px 0', background: 'rgba(229,131,115,0.12)', color: C.err, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <ArrowUpSvg style={{ width: 16, height: 16 }} />
            Egreso
          </button>
        </div>
      </div>

      {/* ── Historial ── */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 672 }}>
          {historyData.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
              <ClockSvg style={{ width: 40, height: 40, color: C.piedra, opacity: 0.3 }} />
              <p style={{ fontSize: 14, color: C.piedra }}>Sin movimientos registrados.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {historyData.slice(0, historyVisible).map((entry, i) => {
                const initials = entry.createdBy?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'
                const date = new Date(entry.createdAt)
                const dateStr = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
                const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                const shown = historyData.slice(0, historyVisible)
                const qty = Number(entry.quantity).toLocaleString('es-AR')
                const unit = entry.product?.unit ?? ''
                return (
                  <div key={entry.id} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(242,237,227,0.08)', color: C.arena, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {initials}
                      </div>
                      {i < shown.length - 1 && <div style={{ width: 1, flex: 1, background: C.linea, marginTop: 3, marginBottom: 3, minHeight: 14 }} />}
                    </div>
                    <div style={{ paddingBottom: 16, flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '2px 6px' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.crema }}>{entry.createdBy?.name ?? 'Sistema'}</span>
                        <span style={{ fontSize: 14, color: C.piedra }}>{STOCK_ACTION_LABEL[entry.type] ?? 'registró un movimiento de'}</span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: entry.direction === 'IN' ? C.ok : C.err }}>
                          {entry.direction === 'IN' ? '+' : '−'}{qty} {unit}
                        </span>
                      </div>
                      <Link to={`/stock/products/${entry.product?.id}`} style={{ fontSize: 12, color: C.arena }} className="hover:underline">
                        {entry.product?.name}
                      </Link>
                      {(entry.reason || entry.client?.name) && (
                        <p style={{ fontSize: 12, color: C.piedra, marginTop: 2, opacity: 0.8 }}>
                          {[entry.reason, entry.client?.name].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <p style={{ fontSize: 11, color: C.piedra, marginTop: 2, opacity: 0.7 }}>{dateStr} · {timeStr}</p>
                    </div>
                  </div>
                )
              })}
              {historyData.length > historyVisible && (
                <button onClick={() => setHistoryVisible(v => v + 25)}
                  style={{ marginTop: 8, fontSize: 12, color: C.piedra, padding: '8px 0', border: `1px dashed ${C.linea}`, borderRadius: '0 12px 12px 0', background: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.crema}
                  onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: C.piedra, fontSize: 14 }}>Cargando…</div>
          ) : !data ? null : (
            <>
              {/* Stats fila 1: totales y alertas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard Icon={CubeSvg} label="Total productos" value={data.totalProducts}
                  sub={`${data.activeProducts} activos`}
                  accentColor={C.crema} to="/stock/products" />
                <StatCard Icon={XCircleSvg} label="Sin stock"
                  value={data.outOfStock}
                  accentColor={data.outOfStock > 0 ? C.err : C.crema}
                  cardBg={data.outOfStock > 0 ? 'rgba(229,131,115,0.06)' : C.s1}
                  borderColor={data.outOfStock > 0 ? 'rgba(229,131,115,0.3)' : C.linea}
                  to={data.outOfStock > 0 ? '/stock/products?outOfStock=true' : undefined} />
                <StatCard Icon={WarnSvg} label="Stock bajo"
                  value={data.lowStock}
                  accentColor={data.lowStock > 0 ? C.warn : C.crema}
                  cardBg={data.lowStock > 0 ? 'rgba(226,182,99,0.06)' : C.s1}
                  borderColor={data.lowStock > 0 ? 'rgba(226,182,99,0.3)' : C.linea}
                  to={data.lowStock > 0 ? '/stock/products?lowStock=true' : undefined} />
              </div>

              {/* Stats fila 2: por tipo de inventario */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard Icon={CartSvg} label="Productos para venta"
                  value={data.productsByType?.sale ?? 0}
                  sub={data.valueByType?.sale ? `$${Number(data.valueByType.sale).toLocaleString('es-AR', { maximumFractionDigits: 0 })} en stock` : 'Sin valorización'}
                  accentColor={C.info} to="/stock/products?inventoryType=sale" />
                <StatCard Icon={WrenchSvg} label="Stock interno"
                  value={data.productsByType?.internal ?? 0}
                  sub={data.valueByType?.internal ? `$${Number(data.valueByType.internal).toLocaleString('es-AR', { maximumFractionDigits: 0 })} en stock` : 'Sin valorización'}
                  accentColor={C.warn} to="/stock/products?inventoryType=internal" />
                <StatCard Icon={BeakerSvg} label="Materias primas"
                  value={data.productsByType?.raw_material ?? 0}
                  sub={data.valueByType?.raw_material ? `$${Number(data.valueByType.raw_material).toLocaleString('es-AR', { maximumFractionDigits: 0 })} en stock` : 'Sin valorización'}
                  accentColor={C.ok} to="/stock/products?inventoryType=raw_material" />
              </div>

              {/* Últimos movimientos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: C.crema, margin: 0 }}>Últimos movimientos</h2>

                {data.recentMovements.length === 0 ? (
                  <p style={{ fontSize: 14, color: C.piedra, padding: '16px 0', textAlign: 'center', border: `1px dashed ${C.linea}`, borderRadius: '0 12px 12px 0' }}>Sin movimientos aún.</p>
                ) : (
                  <>
                    {/* Desktop */}
                    <div className="hidden md:block" style={{ overflow: 'hidden', borderRadius: '0 16px 16px 0', border: `1px solid ${C.linea}` }}>
                      <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${C.linea}`, background: 'rgba(38,38,42,0.6)' }}>
                            <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</th>
                            <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Producto</th>
                            <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motivo</th>
                            <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                            <th style={{ textAlign: 'right', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cantidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.recentMovements.map((m, i) => (
                            <tr key={m.id} style={{ borderBottom: `1px solid ${C.linea}` }}
                              className="hover:bg-[rgba(38,38,42,0.4)] last:border-0 transition-colors">
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: m.direction === 'IN' ? 'rgba(125,190,147,0.12)' : 'rgba(229,131,115,0.12)' }}>
                                  {m.direction === 'IN'
                                    ? <ArrowDownSvg style={{ width: 14, height: 14, color: C.ok }} />
                                    : <ArrowUpSvg style={{ width: 14, height: 14, color: C.err }} />
                                  }
                                </div>
                              </td>
                              <td style={{ padding: '12px 14px', fontWeight: 500, color: C.crema }}>{m.product?.name}</td>
                              <td style={{ padding: '12px 14px', color: C.piedra }}>{MOVEMENT_LABELS[m.type] ?? m.type}</td>
                              <td style={{ padding: '12px 14px', color: C.piedra, fontSize: 12 }}>{fmtDateTime(m.createdAt)}</td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: m.direction === 'IN' ? C.ok : C.err }}>
                                {m.direction === 'IN' ? '+' : '−'}{Number(m.quantity).toLocaleString('es-AR')}
                                <span style={{ fontSize: 12, color: C.piedra, fontWeight: 400, marginLeft: 4 }}>{m.product?.unit}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile */}
                    <div className="flex flex-col gap-3 md:hidden">
                      {data.recentMovements.map(m => (
                        <div key={m.id} style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 12px 12px 0', padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: m.direction === 'IN' ? 'rgba(125,190,147,0.12)' : 'rgba(229,131,115,0.12)' }}>
                            {m.direction === 'IN'
                              ? <ArrowDownSvg style={{ width: 14, height: 14, color: C.ok }} />
                              : <ArrowUpSvg style={{ width: 14, height: 14, color: C.err }} />
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 500, color: C.crema, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.product?.name}</p>
                            <p style={{ fontSize: 12, color: C.piedra }}>{MOVEMENT_LABELS[m.type] ?? m.type} · {fmtDateTime(m.createdAt)}</p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: m.direction === 'IN' ? C.ok : C.err }}>
                              {m.direction === 'IN' ? '+' : '−'}{Number(m.quantity).toLocaleString('es-AR')}
                            </p>
                            <p style={{ fontSize: 12, color: C.piedra }}>{m.product?.unit}</p>
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
