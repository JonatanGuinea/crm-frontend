import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProduct, getProductMovements } from '../../api/stock'
import StockMovementModal from './StockMovementModal'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

function ArrowLeftSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
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
function WarnSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
}

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
  transfer_in:          'Transferencia entrada',
  transfer_out:         'Transferencia salida',
  correction:           'Corrección',
  internal_consumption: 'Consumo interno',
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

  if (loadingProduct) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: C.piedra, fontSize: 14 }}>Cargando…</div>
  if (!product) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: C.piedra, fontSize: 14 }}>Producto no encontrado.</div>

  const stock = Number(product.stock)
  const min   = Number(product.minStock)
  const isOut = stock <= 0
  const isLow = !isOut && min > 0 && stock <= min

  const thStyle = { textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em' }
  const tdStyle = { padding: '12px 14px' }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }} className="md:p-8">

      {/* Back */}
      <Link to="/stock/products"
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: C.piedra, width: 'fit-content' }}
        onMouseEnter={e => e.currentTarget.style.color = C.crema}
        onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
        <ArrowLeftSvg style={{ width: 16, height: 16 }} />
        Volver a productos
      </Link>

      {/* Header */}
      <div>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 12, color: C.piedra }}>{product.sku}</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.crema, marginTop: 2 }}>{product.name}</h1>
          {product.description && <p style={{ fontSize: 14, color: C.piedra, marginTop: 4 }}>{product.description}</p>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setModal('in')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: '0 9px 9px 0', background: 'rgba(125,190,147,0.12)', color: C.ok, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
            <ArrowDownSvg style={{ width: 16, height: 16 }} />
            Ingresar
          </button>
          <button onClick={() => setModal('out')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: '0 9px 9px 0', background: 'rgba(229,131,115,0.12)', color: C.err, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
            <ArrowUpSvg style={{ width: 16, height: 16 }} />
            Egresar
          </button>
          <button onClick={() => setModal('adj')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: '0 9px 9px 0', background: 'rgba(226,182,99,0.12)', color: C.warn, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
            <AdjustSvg style={{ width: 16, height: 16 }} />
            Ajustar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div style={{ borderRadius: '0 16px 16px 0', border: `1px solid ${isOut ? 'rgba(229,131,115,0.3)' : isLow ? 'rgba(226,182,99,0.3)' : C.linea}`, background: isOut ? 'rgba(229,131,115,0.06)' : isLow ? 'rgba(226,182,99,0.06)' : C.s1, padding: 16 }}>
          <p style={{ fontSize: 12, color: C.piedra }}>Stock actual</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginTop: 4 }}>
            {(isOut || isLow) && <WarnSvg style={{ width: 16, height: 16, color: isOut ? C.err : C.warn, marginBottom: 2, flexShrink: 0 }} />}
            <p style={{ fontSize: 24, fontWeight: 700, color: isOut ? C.err : isLow ? C.warn : C.crema }}>
              {stock.toLocaleString('es-AR')}
            </p>
            <p style={{ fontSize: 14, color: C.piedra, marginBottom: 2 }}>{product.unit}</p>
          </div>
          {isOut && <p style={{ fontSize: 12, color: C.err, marginTop: 4, fontWeight: 500 }}>Sin stock</p>}
          {isLow && <p style={{ fontSize: 12, color: C.warn, marginTop: 4, fontWeight: 500 }}>Stock bajo (mín: {min})</p>}
        </div>

        <div style={{ borderRadius: '0 16px 16px 0', border: `1px solid ${C.linea}`, background: C.s1, padding: 16 }}>
          <p style={{ fontSize: 12, color: C.piedra }}>Precio de costo</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: C.crema, marginTop: 4 }}>
            {product.costPrice ? `$${Number(product.costPrice).toLocaleString('es-AR')}` : '—'}
          </p>
        </div>

        <div style={{ borderRadius: '0 16px 16px 0', border: `1px solid ${C.linea}`, background: C.s1, padding: 16 }}>
          <p style={{ fontSize: 12, color: C.piedra }}>Precio de venta</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: C.crema, marginTop: 4 }}>
            {product.salePrice ? `$${Number(product.salePrice).toLocaleString('es-AR')}` : '—'}
          </p>
        </div>

        <div style={{ borderRadius: '0 16px 16px 0', border: `1px solid ${C.linea}`, background: C.s1, padding: 16 }}>
          <p style={{ fontSize: 12, color: C.piedra }}>Valor en stock</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: C.crema, marginTop: 4 }}>
            {product.costPrice
              ? `$${(stock * Number(product.costPrice)).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
              : '—'}
          </p>
        </div>
      </div>

      {/* Kardex */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: C.crema, marginBottom: 12 }}>
          Kardex — {total} movimiento{total !== 1 ? 's' : ''}
        </h2>

        {loadingMov ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: C.piedra, fontSize: 14 }}>Cargando…</div>
        ) : movements.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: C.piedra, fontSize: 14, border: `1px dashed ${C.linea}`, borderRadius: '0 16px 16px 0' }}>
            Sin movimientos registrados.
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="flex flex-col gap-2 md:hidden">
              {movements.map(m => (
                <div key={m.id} style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 12px 12px 0', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: m.direction === 'IN' ? 'rgba(125,190,147,0.12)' : 'rgba(229,131,115,0.12)', color: m.direction === 'IN' ? C.ok : C.err }}>
                      {MOVEMENT_LABELS[m.type] ?? m.type}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: m.direction === 'IN' ? C.ok : C.err }}>
                      {m.direction === 'IN' ? '+' : '−'}{Number(m.quantity).toLocaleString('es-AR')} {product.unit}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.piedra }}>
                    <span>{Number(m.previousStock).toLocaleString('es-AR')}</span>
                    <span>→</span>
                    <span style={{ fontWeight: 500, color: C.crema }}>{Number(m.currentStock).toLocaleString('es-AR')} {product.unit}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: C.piedra }}>
                    <span>{fmtDateTime(m.createdAt)}</span>
                    {(m.reference || m.reason) && (
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 8, textAlign: 'right', maxWidth: '55%' }}>{m.reference || m.reason}</span>
                    )}
                  </div>
                  {m.createdBy?.name && (
                    <p style={{ fontSize: 12, color: C.piedra, opacity: 0.7 }}>{m.createdBy.name}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block" style={{ overflow: 'hidden', borderRadius: '0 16px 16px 0', border: `1px solid ${C.linea}` }}>
              <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.linea}`, background: 'rgba(38,38,42,0.6)' }}>
                    <th style={thStyle}>Fecha</th>
                    <th style={thStyle}>Tipo</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Cantidad</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Stock anterior</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Stock nuevo</th>
                    <th style={thStyle}>Referencia</th>
                    <th style={thStyle}>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m, i) => (
                    <tr key={m.id} style={{ borderBottom: `1px solid ${C.linea}`, background: i % 2 !== 0 ? 'rgba(30,30,32,0.3)' : 'transparent' }}
                      className="hover:bg-[rgba(38,38,42,0.4)] last:border-0 transition-colors">
                      <td style={{ ...tdStyle, fontSize: 12, color: C.piedra, whiteSpace: 'nowrap' }}>{fmtDateTime(m.createdAt)}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: m.direction === 'IN' ? 'rgba(125,190,147,0.12)' : 'rgba(229,131,115,0.12)', color: m.direction === 'IN' ? C.ok : C.err }}>
                          {MOVEMENT_LABELS[m.type] ?? m.type}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: m.direction === 'IN' ? C.ok : C.err }}>
                        {m.direction === 'IN' ? '+' : '−'}{Number(m.quantity).toLocaleString('es-AR')}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: C.piedra }}>{Number(m.previousStock).toLocaleString('es-AR')}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500, color: C.crema }}>{Number(m.currentStock).toLocaleString('es-AR')}</td>
                      <td style={{ ...tdStyle, fontSize: 12, color: C.piedra }}>
                        <div>{m.reference ?? '—'}</div>
                        {m.reason && <div style={{ opacity: 0.7, marginTop: 2 }}>{m.reason}</div>}
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12, color: C.piedra }}>{m.createdBy?.name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Paginación */}
        {pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: '6px 12px', borderRadius: '0 9px 9px 0', border: `1px solid ${C.linea}`, background: 'none', fontSize: 14, color: C.piedra, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
              Anterior
            </button>
            <span style={{ fontSize: 14, color: C.piedra }}>{page} / {pages}</span>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
              style={{ padding: '6px 12px', borderRadius: '0 9px 9px 0', border: `1px solid ${C.linea}`, background: 'none', fontSize: 14, color: C.piedra, cursor: page === pages ? 'not-allowed' : 'pointer', opacity: page === pages ? 0.4 : 1 }}>
              Siguiente
            </button>
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
