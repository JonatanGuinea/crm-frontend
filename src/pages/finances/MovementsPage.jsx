import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCashMovements, getCashAccounts, confirmCashMovement, annulCashMovement, deleteCashMovement,
  getFinancesHistory,
} from '../../api/finances'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import MovementModal from './MovementModal'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

// ── inline SVGs ────────────────────────────────────────────────────────────────

function ChevronLSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
}
function ChevronRSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
}
function TrendUpSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
}
function TrendDownSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>
}
function FunnelSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
}
function CheckCircleSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
}
function XCircleSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
}
function TrashSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
}
function PencilSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function TagSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
}
function ClockSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
}
function BankSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
}

// ── constants ──────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  income: 'Ingreso', expense: 'Egreso',
  transfer_out: 'Transf. salida', transfer_in: 'Transf. entrada', adjustment: 'Ajuste',
}
const TYPE_STYLE = {
  income:       { bg: 'rgba(125,190,147,0.12)', color: C.ok },
  expense:      { bg: 'rgba(229,131,115,0.12)', color: C.err },
  transfer_out: { bg: 'rgba(226,182,99,0.12)',  color: C.warn },
  transfer_in:  { bg: 'rgba(142,177,222,0.12)', color: C.info },
  adjustment:   { bg: 'rgba(140,135,126,0.12)', color: C.piedra },
}
const STATUS_STYLE  = {
  confirmed: { color: C.ok },
  pending:   { color: C.warn },
  annulled:  { color: C.piedra, textDecoration: 'line-through' },
}
const STATUS_LABELS = { confirmed: 'Confirmado', pending: 'Pendiente', annulled: 'Anulado' }

function amountColor(m) {
  if (m.status === 'pending')  return C.warn
  if (m.status === 'annulled') return C.piedra
  return (m.type === 'income' || m.type === 'transfer_in') ? C.ok : C.err
}

const fmt = (n) => Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const isOverdue = (m) => m.status === 'pending' && m.date?.slice(0, 10) < new Date().toISOString().slice(0, 10)

function periodLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}
function periodRange(year, month) {
  return {
    from: new Date(year, month - 1, 1).toISOString().slice(0, 10),
    to:   new Date(year, month, 0).toISOString().slice(0, 10),
  }
}

const thStyle = { padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }
const tdStyle = { padding: '12px 14px', fontSize: 13 }

export default function MovementsPage() {
  const toast   = useToast()
  const confirm = useConfirm()
  const qc      = useQueryClient()

  const now = new Date()
  const [period,        setPeriod]        = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })
  const [movementModal, setMovementModal] = useState(null)
  const [editTarget,    setEditTarget]    = useState(null)
  const [showFilters,   setShowFilters]   = useState(false)
  const [tab,           setTab]           = useState('movements')
  const [historyVisible, setHistoryVisible] = useState(25)

  const [filters, setFilters] = useState({ accountId: '', type: '', status: '', reference: '' })

  function prevMonth() {
    setPeriod(p => p.month === 1 ? { year: p.year - 1, month: 12 } : { ...p, month: p.month - 1 })
  }
  function nextMonth() {
    setPeriod(p => p.month === 12 ? { year: p.year + 1, month: 1 } : { ...p, month: p.month + 1 })
  }

  const isCurrentMonth = period.year === now.getFullYear() && period.month === now.getMonth() + 1

  const { data: accounts = [] } = useQuery({
    queryKey: ['cash-accounts'],
    queryFn: () => getCashAccounts().then(r => r.data.data),
  })

  const { from, to } = periodRange(period.year, period.month)
  const { data, isLoading } = useQuery({
    queryKey: ['cash-movements', filters, period],
    queryFn: () => getCashMovements({ ...filters, from, to, limit: 200 }).then(r => r.data.data),
  })

  const { data: historyData = [] } = useQuery({
    queryKey: ['finances-history'],
    queryFn: () => getFinancesHistory().then(r => r.data.data),
    enabled: tab === 'history',
  })

  const movements = data?.items ?? []

  function setFilter(k, v) { setFilters(p => ({ ...p, [k]: v })) }
  function clearFilters()  { setFilters({ accountId: '', type: '', status: '', reference: '' }) }

  function invalidate() {
    qc.invalidateQueries(['cash-movements'])
    qc.invalidateQueries(['cash-accounts'])
    qc.invalidateQueries(['finances-dashboard'])
  }

  async function handleConfirm(id) {
    try {
      await confirmCashMovement(id)
      toast('Movimiento confirmado', 'success')
      invalidate()
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error')
    }
  }

  async function handleAnnul(m) {
    const ok = await confirm(
      `¿Anular "${m.description || TYPE_LABELS[m.type]}"? El saldo de la cuenta se revertirá automáticamente.`,
      { confirmLabel: 'Anular', danger: true }
    )
    if (!ok) return
    try {
      await annulCashMovement(m.id, { reason: 'Anulado manualmente' })
      toast('Movimiento anulado', 'success')
      invalidate()
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error')
    }
  }

  async function handleDelete(m) {
    const ok = await confirm(
      `¿Eliminar "${m.description || TYPE_LABELS[m.type]}"? Esta acción no se puede deshacer.`,
      { confirmLabel: 'Eliminar', danger: true }
    )
    if (!ok) return
    try {
      await deleteCashMovement(m.id)
      toast('Movimiento eliminado', 'success')
      invalidate()
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error')
    }
  }

  const hasActiveFilters  = Object.values(filters).some(Boolean)
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const filterSelectStyle = {
    height: 36, padding: '0 12px', background: C.s2, border: `1px solid ${C.linea}`,
    borderRadius: '0 9px 9px 0', color: C.crema, fontSize: 13, outline: 'none',
  }

  return (
    <div className="px-4 pt-4 pb-10 md:px-6 md:pt-5" style={{ fontFamily: 'Geist, system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setTab(tab === 'history' ? 'movements' : 'history')}
            style={{ height: 34, padding: '0 14px', background: tab === 'history' ? C.s2 : 'none', border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', color: C.piedra, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.12s, border-color 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
            onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
          >
            {tab === 'history' ? 'Ver movimientos' : 'Historial'}
          </button>

          {/* Navegador de mes */}
          {tab !== 'history' && (
            <div style={{ display: 'flex', alignItems: 'center', background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 10px 10px 0', padding: '2px 4px' }}>
              <button onClick={prevMonth}
                style={{ padding: 5, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex' }}
                onMouseEnter={e => e.currentTarget.style.color = C.crema}
                onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                <ChevronLSvg style={{ width: 14, height: 14 }} />
              </button>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.crema, textTransform: 'capitalize', padding: '0 8px', minWidth: 130, textAlign: 'center' }}>
                {periodLabel(period.year, period.month)}
              </span>
              <button onClick={nextMonth} disabled={isCurrentMonth}
                style={{ padding: 5, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: isCurrentMonth ? 'not-allowed' : 'pointer', color: isCurrentMonth ? C.linea : C.piedra, display: 'flex' }}
                onMouseEnter={e => { if (!isCurrentMonth) e.currentTarget.style.color = C.crema }}
                onMouseLeave={e => { if (!isCurrentMonth) e.currentTarget.style.color = C.piedra }}>
                <ChevronRSvg style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}

          {/* Desktop actions */}
          {tab !== 'history' && (
            <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 6 }}>
              <button onClick={() => setShowFilters(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: '0 9px 9px 0', border: `1px solid ${hasActiveFilters ? C.arena : C.linea}`, background: hasActiveFilters ? 'rgba(242,237,227,0.06)' : 'none', color: hasActiveFilters ? C.crema : C.piedra, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                <FunnelSvg style={{ width: 14, height: 14 }} />
                Filtros{hasActiveFilters && ` (${activeFilterCount})`}
              </button>

              <button onClick={() => setMovementModal('expense')} disabled={accounts.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 5, height: 34, padding: '0 12px', background: 'rgba(229,131,115,0.12)', color: C.err, border: `1px solid rgba(229,131,115,0.25)`, borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 500, cursor: accounts.length === 0 ? 'not-allowed' : 'pointer', opacity: accounts.length === 0 ? 0.4 : 1 }}>
                <TrendDownSvg style={{ width: 14, height: 14 }} /> Egreso
              </button>
              
              <button onClick={() => setMovementModal('income')} disabled={accounts.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 5, height: 34, padding: '0 12px', background: 'rgba(125,190,147,0.12)', color: C.ok, border: `1px solid rgba(125,190,147,0.25)`, borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 500, cursor: accounts.length === 0 ? 'not-allowed' : 'pointer', opacity: accounts.length === 0 ? 0.4 : 1 }}>
                <TrendUpSvg style={{ width: 14, height: 14 }} /> Ingreso
              </button>
            </div>
          )}

          {/* Mobile: filtros + categorías */}
          {tab !== 'history' && (
            <div className="flex sm:hidden" style={{ alignItems: 'center', gap: 6 }}>
              <button onClick={() => setShowFilters(p => !p)}
                style={{ padding: 8, borderRadius: '0 8px 8px 0', border: `1px solid ${hasActiveFilters ? C.arena : C.linea}`, background: hasActiveFilters ? 'rgba(242,237,227,0.06)' : 'none', color: hasActiveFilters ? C.crema : C.piedra, display: 'flex', cursor: 'pointer' }}>
                <FunnelSvg style={{ width: 15, height: 15 }} />
              </button>
              <Link to="/finances/categories"
                style={{ padding: 8, borderRadius: '0 8px 8px 0', border: `1px solid ${C.linea}`, color: C.piedra, display: 'flex' }}>
                <TagSvg style={{ width: 15, height: 15 }} />
              </Link>
            </div>
          )}
      </div>

      {/* ── Historial ── */}
      {tab === 'history' && (
        <div style={{ maxWidth: 680 }}>
          {historyData.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '60px 0', color: C.piedra }}>
              <ClockSvg style={{ width: 36, height: 36, opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>Sin movimientos registrados.</p>
            </div>
          ) : (
            <>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {historyData.slice(0, historyVisible).map(entry => {
                  const isIncome   = entry.type === 'income' || entry.type === 'transfer_in'
                  const amtColor   = isIncome ? C.ok : C.err
                  const actionText = {
                    income:       'registró un ingreso',
                    expense:      'registró un egreso',
                    transfer_out: 'registró una transferencia saliente',
                    transfer_in:  'registró una transferencia entrante',
                    adjustment:   'realizó un ajuste',
                  }[entry.type] ?? 'registró un movimiento'
                  const d = new Date(entry.createdAt)
                  const dateTime = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
                                   d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <li key={entry.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.linea}`, fontSize: 13 }}>
                      <div style={{ width: 10, height: 16, flexShrink: 0, marginTop: 2, borderLeft: `2.5px solid ${C.piedra}`, borderBottom: `2.5px solid ${C.piedra}` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0 6px', rowGap: 2 }}>
                          <span style={{ fontWeight: 600, color: C.crema }}>{entry.createdBy?.name ?? 'Sistema'}</span>
                          <span style={{ color: C.arena }}>{actionText} de</span>
                          <span style={{ fontWeight: 600, color: amtColor }}>
                            {isIncome ? '+' : '−'}${fmt(entry.amount)}
                          </span>
                          {entry.status === 'annulled' && (
                            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', background: C.s3, color: C.piedra, padding: '1px 6px', borderRadius: '0 4px 4px 0' }}>Anulado</span>
                          )}
                        </div>
                        <p style={{ fontSize: 11.5, color: C.piedra, marginTop: 2 }}>
                          {[entry.account?.name, entry.client?.name, entry.description].filter(Boolean).join(' · ')}
                        </p>
                        <p style={{ fontSize: 11, color: C.piedra, opacity: 0.7, marginTop: 3 }}>{dateTime}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {historyData.length > historyVisible && (
                <button onClick={() => setHistoryVisible(v => v + 25)}
                  style={{ marginTop: 4, width: '100%', padding: '10px 0', background: 'none', border: `1px dashed ${C.linea}`, borderRadius: '0 12px 12px 0', color: C.piedra, fontSize: 12.5, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
                >
                  Mostrar más ({historyData.length - historyVisible} restante{historyData.length - historyVisible !== 1 ? 's' : ''})
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Movimientos ── */}
      {tab === 'movements' && (
        <>
          {/* Mobile FAB strip */}
          <div className="flex sm:hidden" style={{ gap: 8 }}>
            <button onClick={() => setMovementModal('expense')} disabled={accounts.length === 0}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: '0 10px 10px 0', background: 'rgba(229,131,115,0.14)', color: C.err, border: `1px solid rgba(229,131,115,0.25)`, fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: accounts.length === 0 ? 0.4 : 1 }}>
              <TrendDownSvg style={{ width: 15, height: 15 }} /> Egreso
            </button>
            <button onClick={() => setMovementModal('income')} disabled={accounts.length === 0}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: '0 10px 10px 0', background: 'rgba(125,190,147,0.14)', color: C.ok, border: `1px solid rgba(125,190,147,0.25)`, fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: accounts.length === 0 ? 0.4 : 1 }}>
              <TrendUpSvg style={{ width: 15, height: 15 }} /> Ingreso
            </button>
          </div>

          {/* Filtros */}
          {showFilters && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px', background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 12px 12px 0' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <select value={filters.accountId} onChange={e => setFilter('accountId', e.target.value)} style={filterSelectStyle}>
                  <option value="">Todas las cuentas</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select value={filters.type} onChange={e => setFilter('type', e.target.value)} style={filterSelectStyle}>
                  <option value="">Todos los tipos</option>
                  <option value="income">Ingreso</option><option value="expense">Egreso</option>
                  <option value="transfer_out">Transf. salida</option><option value="transfer_in">Transf. entrada</option>
                </select>
                <select value={filters.status} onChange={e => setFilter('status', e.target.value)} style={filterSelectStyle}>
                  <option value="">Todos los estados</option>
                  <option value="confirmed">Confirmado</option><option value="pending">Pendiente</option><option value="annulled">Anulado</option>
                </select>
                <input type="text" placeholder="Referencia (N° factura…)"
                  value={filters.reference} onChange={e => setFilter('reference', e.target.value)}
                  style={{ ...filterSelectStyle, appearance: 'auto' }} />
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters}
                  style={{ alignSelf: 'flex-end', fontSize: 12, color: C.piedra, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.arena}
                  onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          {/* Tabla desktop */}
          <div className="hidden md:block" style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 12px 12px 0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: C.s3, borderBottom: `1px solid ${C.linea}` }}>
                  <tr>
                    {['Fecha','Tipo','Descripción','Cliente','Cuenta','Categoría','Estado','Monto',''].map((h, i) => (
                      <th key={i} style={{ ...thStyle, textAlign: i === 7 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={9} style={{ ...tdStyle, padding: '40px 14px', textAlign: 'center', color: C.piedra }}>Cargando…</td></tr>
                  ) : movements.length === 0 ? (
                    <tr><td colSpan={9} style={{ ...tdStyle, padding: '40px 14px', textAlign: 'center', color: C.piedra }}>
                      Sin movimientos{hasActiveFilters ? ' con esos filtros' : ''} en {periodLabel(period.year, period.month)}.
                    </td></tr>
                  ) : movements.map(m => {
                    const ts = TYPE_STYLE[m.type] ?? TYPE_STYLE.adjustment
                    const ss = STATUS_STYLE[m.status] ?? STATUS_STYLE.confirmed
                    return (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${C.linea}`, opacity: m.status === 'annulled' ? 0.5 : 1 }} className="group hover:bg-[#26262A]/50 transition-colors">
                        <td style={tdStyle}>
                          <span style={{ color: C.piedra, fontSize: 12 }}>
                            {new Date(m.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '0 5px 5px 0', fontSize: 11, fontWeight: 500, background: ts.bg, color: ts.color }}>
                            {TYPE_LABELS[m.type]}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <p style={{ color: C.crema }}>{m.description || '—'}</p>
                          {m.reference && <p style={{ fontSize: 11, color: C.piedra }}>{m.reference}</p>}
                        </td>
                        <td style={{ ...tdStyle, color: C.piedra }}>{m.client?.name ?? '—'}</td>
                        <td style={{ ...tdStyle, color: C.piedra }}>{m.account?.name ?? '—'}</td>
                        <td style={{ ...tdStyle, color: C.piedra }}>{m.category?.name ?? '—'}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, ...ss }}>{STATUS_LABELS[m.status]}</span>
                            {isOverdue(m) && (
                              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(229,131,115,0.1)', color: C.err, padding: '1px 5px', borderRadius: '0 4px 4px 0' }}>Atrasado</span>
                            )}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap', color: amountColor(m) }}>
                          {m.type === 'income' || m.type === 'transfer_in' ? '+' : '−'}${fmt(m.amount)}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {m.status === 'pending' && (
                              <>
                                <button onClick={() => { setEditTarget(m); setMovementModal(m.type) }}
                                  style={{ padding: 5, borderRadius: '0 5px 5px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex' }}
                                  onMouseEnter={e => e.currentTarget.style.color = C.crema}
                                  onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                                  <PencilSvg style={{ width: 13, height: 13 }} />
                                </button>
                                <button onClick={() => handleConfirm(m.id)}
                                  style={{ padding: 5, borderRadius: '0 5px 5px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.ok, display: 'flex' }}>
                                  <CheckCircleSvg style={{ width: 13, height: 13 }} />
                                </button>
                                <button onClick={() => handleDelete(m)}
                                  style={{ padding: 5, borderRadius: '0 5px 5px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex' }}
                                  onMouseEnter={e => e.currentTarget.style.color = C.err}
                                  onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                                  <TrashSvg style={{ width: 13, height: 13 }} />
                                </button>
                              </>
                            )}
                            {m.status === 'confirmed' && !m.type.startsWith('transfer') && (
                              <button onClick={() => handleAnnul(m)}
                                style={{ padding: 5, borderRadius: '0 5px 5px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex' }}
                                onMouseEnter={e => e.currentTarget.style.color = C.err}
                                onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                                <XCircleSvg style={{ width: 13, height: 13 }} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards móvil */}
          <div className="flex flex-col gap-2 md:hidden">
            {isLoading ? (
              <p style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: C.piedra }}>Cargando…</p>
            ) : movements.length === 0 ? (
              <p style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: C.piedra }}>
                Sin movimientos{hasActiveFilters ? ' con esos filtros' : ''} en {periodLabel(period.year, period.month)}.
              </p>
            ) : movements.map(m => {
              const ts   = TYPE_STYLE[m.type] ?? TYPE_STYLE.adjustment
              const ss   = STATUS_STYLE[m.status] ?? STATUS_STYLE.confirmed
              const dot  = (m.type === 'income' || m.type === 'transfer_in') ? C.ok : C.err
              return (
                <div key={m.id}
                  style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 12px 12px 0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, opacity: m.status === 'annulled' ? 0.5 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: C.crema }}>{m.description || TYPE_LABELS[m.type]}</p>
                      <p style={{ fontSize: 11, color: C.piedra, marginTop: 2 }}>
                        {m.account?.name} · {new Date(m.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}
                        {m.client && ` · ${m.client.name}`}
                        {m.category && ` · ${m.category.name}`}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: amountColor(m) }}>
                        {(m.type === 'income' || m.type === 'transfer_in') ? '+' : '−'}${fmt(m.amount)}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 11, fontWeight: 500, ...ss }}>{STATUS_LABELS[m.status]}</span>
                        {isOverdue(m) && (
                          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', background: 'rgba(229,131,115,0.1)', color: C.err, padding: '1px 4px', borderRadius: '0 3px 3px 0' }}>Atrasado</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${C.linea}` }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '0 5px 5px 0', fontSize: 11, fontWeight: 500, background: ts.bg, color: ts.color }}>
                      {TYPE_LABELS[m.type]}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {m.status === 'pending' && (
                        <>
                          <button onClick={() => { setEditTarget(m); setMovementModal(m.type) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: '0 7px 7px 0', fontSize: 12, fontWeight: 500, color: C.piedra, border: `1px solid ${C.linea}`, background: 'none', cursor: 'pointer' }}>
                            <PencilSvg style={{ width: 12, height: 12 }} /> Editar
                          </button>
                          <button onClick={() => handleConfirm(m.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: '0 7px 7px 0', fontSize: 12, fontWeight: 500, color: C.ok, border: `1px solid rgba(125,190,147,0.25)`, background: 'none', cursor: 'pointer' }}>
                            <CheckCircleSvg style={{ width: 12, height: 12 }} /> Confirmar
                          </button>
                          <button onClick={() => handleDelete(m)}
                            style={{ padding: 6, borderRadius: '0 6px 6px 0', color: C.err, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                            <TrashSvg style={{ width: 14, height: 14 }} />
                          </button>
                        </>
                      )}
                      {m.status === 'confirmed' && !m.type.startsWith('transfer') && (
                        <button onClick={() => handleAnnul(m)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: '0 7px 7px 0', fontSize: 12, fontWeight: 500, color: C.piedra, border: `1px solid ${C.linea}`, background: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.color = C.err; e.currentTarget.style.borderColor = 'rgba(229,131,115,0.25)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
                          <XCircleSvg style={{ width: 12, height: 12 }} /> Anular
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {movementModal && (
        <MovementModal
          defaultType={movementModal}
          movement={editTarget}
          accounts={accounts}
          onClose={() => { setMovementModal(null); setEditTarget(null) }}
          onSaved={() => { setMovementModal(null); setEditTarget(null); invalidate() }}
        />
      )}
    </div>
  )
}
