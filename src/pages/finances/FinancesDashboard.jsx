import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getFinancesDashboard, confirmCashMovement } from '../../api/finances'
import { useToast } from '../../components/Toast'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }
const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"
const fmt    = (n) => Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtKPI = (n) => Number(n ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })

// ── inline SVGs ────────────────────────────────────────────────────────────────

function BankNotesSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
}
function TrendUpSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
}
function TrendDownSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>
}
function ChevronLSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
}
function ChevronRSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
}
function CheckCircleSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
}
function PlusSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}
function ChevronRightSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
}

// ── constants ──────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  income: 'Ingreso', expense: 'Egreso',
  transfer_out: 'Transf. salida', transfer_in: 'Transf. entrada', adjustment: 'Ajuste',
}
const STATUS_STYLE = {
  confirmed: { color: C.ok },
  pending:   { color: C.warn },
  annulled:  { color: C.piedra },
}
const STATUS_LABELS = { confirmed: 'Confirmado', pending: 'Pendiente', annulled: 'Anulado' }

function amountColor(m) {
  if (m.status === 'pending')  return C.warn
  if (m.status === 'annulled') return C.piedra
  return (m.type === 'income' || m.type === 'transfer_in') ? C.ok : C.err
}
const amountSign = (m) => (m.type === 'income' || m.type === 'transfer_in') ? '+' : '−'
const isOverdue  = (m) => m.status === 'pending' && m.date?.slice(0, 10) < new Date().toISOString().slice(0, 10)

const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }
const tdStyle = { padding: '10px 14px', fontSize: 13 }

// ── KpiCard ───────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, valueColor = C.crema }) {
  return (
    <div style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.piedra }}>{label}</p>
      <p style={{ fontFamily: CIFRAS, fontSize: 34, fontWeight: 700, color: valueColor, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: C.piedra, marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FinancesDashboard() {
  const toast = useToast()
  const qc    = useQueryClient()
  const { selectedMonth } = useOutletContext()
  const [confirmingId, setConfirmingId] = useState(null)
  const [movFilter,    setMovFilter]    = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['finances-dashboard', selectedMonth],
    queryFn: () => getFinancesDashboard({ month: selectedMonth.month, year: selectedMonth.year }).then(r => r.data.data),
    refetchInterval: 60_000,
  })

  function invalidate() {
    qc.invalidateQueries(['finances-dashboard'])
    qc.invalidateQueries(['cash-movements'])
  }

  async function handleConfirmPending(id) {
    setConfirmingId(id)
    try {
      await confirmCashMovement(id)
      toast('Movimiento confirmado', 'success')
      invalidate()
    } catch (err) {
      toast(err.response?.data?.error || err.message || 'Error al confirmar', 'error')
    } finally {
      setConfirmingId(null)
    }
  }

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', fontSize: 13, color: C.piedra }}>Cargando…</div>
  )

  const allAccounts      = data?.allAccounts ?? []
  const pendingMovements = data?.pendingMovements ?? []
  const netMonth         = Number(data?.netMonth ?? 0)
  const netPositive      = netMonth >= 0

  const pendingIncomeCount  = pendingMovements.filter(m => m.type === 'income'  || m.type === 'transfer_in').length
  const pendingExpenseCount = pendingMovements.filter(m => m.type === 'expense' || m.type === 'transfer_out').length
  const accountNames        = allAccounts.slice(0, 3).map(a => a.name).join(' · ')

  const allMovements = data?.recentMovements ?? []
  const filteredMovements = allMovements.filter(m => {
    if (movFilter === 'income')  return m.type === 'income'  || m.type === 'transfer_in'
    if (movFilter === 'expense') return m.type === 'expense' || m.type === 'transfer_out'
    return true
  })

  return (
    <div className="px-4 pt-4 pb-10 md:px-6 md:pt-5" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Resultado neto del mes"
          value={`${netPositive ? '+' : ''}$${fmtKPI(netMonth)}`}
          sub="Ingresos menos egresos"
          valueColor={netPositive ? C.ok : C.err}
        />
        <KpiCard
          label="A cobrar"
          value={`$${fmtKPI(data?.pendingIncome)}`}
          sub={pendingIncomeCount > 0
            ? `${pendingIncomeCount} ingreso${pendingIncomeCount !== 1 ? 's' : ''} pendiente${pendingIncomeCount !== 1 ? 's' : ''}`
            : 'Sin pendientes'}
          valueColor={Number(data?.pendingIncome) > 0 ? C.warn : C.crema}
        />
        <KpiCard
          label="A pagar"
          value={`$${fmtKPI(data?.pendingExpense)}`}
          sub={pendingExpenseCount > 0
            ? `${pendingExpenseCount} egreso${pendingExpenseCount !== 1 ? 's' : ''} programado${pendingExpenseCount !== 1 ? 's' : ''}`
            : 'Sin pendientes'}
          valueColor={Number(data?.pendingExpense) > 0 ? C.warn : C.crema}
        />
        <KpiCard
          label="Saldo en caja"
          value={`$${fmtKPI(data?.totalBalance)}`}
          sub={accountNames || 'Sin cuentas'}
          valueColor={Number(data?.totalBalance) >= 0 ? C.crema : C.err}
        />
      </div>

      {/* ── Main 2-col layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">

        {/* Últimos movimientos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: C.crema, margin: 0 }}>Últimos movimientos</h3>
            <div style={{ display: 'flex', gap: 3, padding: 3, background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0' }}>
              {[{ id: 'all', label: 'Todos' }, { id: 'income', label: 'Ingresos' }, { id: 'expense', label: 'Egresos' }].map(({ id, label }) => (
                <button key={id} onClick={() => setMovFilter(id)}
                  style={{ padding: '4px 10px', borderRadius: '0 6px 6px 0', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: movFilter === id ? C.s3 : 'transparent', color: movFilter === id ? C.crema : C.piedra }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {allMovements.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 0', border: `1px dashed ${C.linea}`, borderRadius: '0 12px 12px 0' }}>
              <BankNotesSvg style={{ width: 28, height: 28, color: C.piedra, opacity: 0.3 }} />
              <p style={{ fontSize: 13, color: C.piedra }}>Sin movimientos en este período.</p>
            </div>
          ) : (
            <div style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 12px 12px 0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ borderBottom: `1px solid ${C.linea}`, background: C.s2 }}>
                    <tr>
                      <th style={thStyle}>Fecha</th>
                      <th style={thStyle}>Descripción</th>
                      <th style={{ ...thStyle }} className="hidden sm:table-cell">Cuenta</th>
                      <th style={thStyle}>Estado</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                      <th style={{ width: 32 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovements.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: C.piedra, padding: '28px 14px' }}>
                          Sin {movFilter === 'income' ? 'ingresos' : 'egresos'} en este período.
                        </td>
                      </tr>
                    ) : filteredMovements.map(m => {
                      const ss = STATUS_STYLE[m.status] ?? STATUS_STYLE.confirmed
                      return (
                        <tr key={m.id}
                          style={{ borderBottom: `1px solid ${C.linea}`, opacity: m.status === 'annulled' ? 0.5 : 1 }}
                          className="group hover:bg-[rgba(38,38,42,0.5)] last:border-0 transition-colors">
                          <td style={{ ...tdStyle, color: C.piedra, whiteSpace: 'nowrap', fontSize: 12 }}>
                            {new Date(m.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: '2-digit' })}
                            {isOverdue(m) && (
                              <span style={{ display: 'block', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: C.err, marginTop: 2 }}>Atrasado</span>
                            )}
                          </td>
                          <td style={{ ...tdStyle, maxWidth: 200 }}>
                            <p style={{ color: C.crema, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.description || TYPE_LABELS[m.type]}
                            </p>
                            {(m.client?.name || m.reference) && (
                              <p style={{ fontSize: 11, color: C.piedra, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {m.client?.name || m.reference}
                              </p>
                            )}
                          </td>
                          <td style={{ ...tdStyle, color: C.piedra }} className="hidden sm:table-cell">
                            {m.account?.name ?? '—'}
                          </td>
                          <td style={tdStyle}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: ss.color, whiteSpace: 'nowrap' }}>
                              <span style={{ width: 6, height: 6, borderRadius: 1, background: ss.color, flexShrink: 0 }} />
                              {STATUS_LABELS[m.status]}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap', color: amountColor(m) }}>
                            {amountSign(m)} ${fmt(m.amount)}
                          </td>
                          <td style={{ ...tdStyle, padding: '10px 10px 10px 0' }}>
                            {m.status === 'pending' && (
                              <button onClick={() => handleConfirmPending(m.id)} disabled={confirmingId === m.id}
                                title="Confirmar"
                                style={{ padding: 5, borderRadius: '0 5px 5px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex', opacity: confirmingId === m.id ? 0.5 : 1 }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onMouseEnter={e => e.currentTarget.style.color = C.ok}
                                onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                                <CheckCircleSvg style={{ width: 14, height: 14 }} />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Movimientos pendientes */}
          {pendingMovements.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: C.crema, margin: 0 }}>Movimientos pendientes</h3>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.warn, background: `${C.warn}18`, border: `1px solid ${C.warn}44`, borderRadius: '0 6px 6px 0', padding: '2px 8px' }}>
                  {pendingMovements.length}
                </span>
              </div>

              <div style={{ background: C.s1, border: `1px solid ${C.warn}44`, borderRadius: '0 12px 12px 0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ borderBottom: `1px solid ${C.linea}`, background: C.s2 }}>
                      <tr>
                        <th style={thStyle}>Fecha</th>
                        <th style={thStyle}>Descripción</th>
                        <th style={{ ...thStyle }} className="hidden sm:table-cell">Cuenta</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingMovements.map(m => (
                        <tr key={m.id}
                          style={{ borderBottom: `1px solid ${C.linea}` }}
                          className="hover:bg-[rgba(38,38,42,0.5)] last:border-0 transition-colors">
                          <td style={{ ...tdStyle, color: C.piedra, whiteSpace: 'nowrap', fontSize: 12 }}>
                            {new Date(m.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: '2-digit' })}
                            {isOverdue(m) && (
                              <span style={{ display: 'block', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: C.err, marginTop: 2 }}>Atrasado</span>
                            )}
                          </td>
                          <td style={{ ...tdStyle, maxWidth: 200 }}>
                            <p style={{ color: C.crema, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.description || TYPE_LABELS[m.type]}
                            </p>
                            {(m.client?.name || m.reference) && (
                              <p style={{ fontSize: 11, color: C.piedra, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {m.client?.name || m.reference}
                              </p>
                            )}
                          </td>
                          <td style={{ ...tdStyle, color: C.piedra }} className="hidden sm:table-cell">
                            {m.account?.name ?? '—'}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap', color: (m.type === 'income' || m.type === 'transfer_in') ? C.ok : C.err }}>
                            {amountSign(m)} ${fmt(m.amount)}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', padding: '10px 14px' }}>
                            <button onClick={() => handleConfirmPending(m.id)} disabled={confirmingId === m.id}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', background: 'none', border: `1px solid ${C.linea}`, borderRadius: '0 7px 7px 0', fontSize: 12, fontWeight: 500, color: C.piedra, cursor: confirmingId === m.id ? 'not-allowed' : 'pointer', opacity: confirmingId === m.id ? 0.5 : 1 }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = C.ok; e.currentTarget.style.color = C.ok }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.piedra }}>
                              <CheckCircleSvg style={{ width: 12, height: 12 }} />
                              Confirmar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <Link to="/finances/movements"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.piedra, textDecoration: 'none', alignSelf: 'flex-end' }}
            onMouseEnter={e => e.currentTarget.style.color = C.arena}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
            Ver todos los movimientos <ChevronRightSvg style={{ width: 11, height: 11 }} />
          </Link>
        </div>

        {/* Cuentas */}
        <div style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'hidden', alignSelf: 'start' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.linea}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: C.crema, margin: 0 }}>Cuentas</h3>
          </div>

          {allAccounts.length === 0 ? (
            <p style={{ padding: '24px 20px', fontSize: 13, color: C.piedra, textAlign: 'center' }}>Sin cuentas creadas.</p>
          ) : allAccounts.map(acc => (
            <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 20px', borderBottom: `1px solid ${C.linea}` }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.crema, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</p>
                {acc.description && <p style={{ fontSize: 11, color: C.piedra, marginTop: 2 }}>{acc.description}</p>}
              </div>
              <p style={{ fontFamily: CIFRAS, fontSize: 17, fontWeight: 700, color: Number(acc.currentBalance) >= 0 ? C.crema : C.err, flexShrink: 0 }}>
                $ {Number(acc.currentBalance ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
              </p>
            </div>
          ))}

          <div style={{ padding: '12px 20px' }}>
            <Link to="/finances/accounts"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: C.piedra, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = C.arena}
              onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
              <PlusSvg style={{ width: 11, height: 11 }} />
              Nueva cuenta
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
