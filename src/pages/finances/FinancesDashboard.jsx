import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getFinancesDashboard, confirmCashMovement } from '../../api/finances'
import { useToast } from '../../components/Toast'
import { fmt } from '../../utils/fmt'
import MovementModal from './MovementModal'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

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
function ChevronDownSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
}
function ClockSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
}
function WalletSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V22H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" /><path d="M20 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2v-6h-2z" /></svg>
}
function BankSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" /></svg>
}
function PhoneSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
}
function CheckCircleSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
}
function ChevronRightLinkSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
}

// ── constants ──────────────────────────────────────────────────────────────────

const ACCOUNT_ICONS = { cash: WalletSvg, bank: BankSvg, virtual: PhoneSvg }

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

const thStyle = { padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }
const tdStyle = { padding: '12px 14px', fontSize: 13 }

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ Icon, label, value, sub, iconBg, iconColor, borderColor, valueColor = C.crema }) {
  return (
    <div style={{ background: C.s2, border: `1px solid ${borderColor ?? C.linea}`, borderRadius: '0 16px 16px 0', padding: 16, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: '0 10px 10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: iconBg }}>
          <Icon style={{ width: 16, height: 16, color: iconColor }} />
        </div>
        <p style={{ fontSize: 12, fontWeight: 500, color: C.piedra, textAlign: 'right', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: valueColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={value}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: C.piedra, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>}
      </div>
    </div>
  )
}

// ── AccountSelector ───────────────────────────────────────────────────────────

function AccountSelector({ accounts, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  if (accounts.length <= 1) return null

  const selected     = accounts.find(a => a.id === value) ?? null
  const SelectedIcon = selected ? (ACCOUNT_ICONS[selected.type] ?? WalletSvg) : WalletSvg

  const triggerStyle = {
    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
    borderRadius: '0 10px 10px 0',
    border: `1px solid ${open ? C.arena : C.linea}`,
    background: open ? 'rgba(242,237,227,0.06)' : 'none',
    color: C.crema, fontSize: 13, fontWeight: 500, cursor: 'pointer',
    outline: 'none',
  }

  return (
    <div ref={ref} style={{ position: 'relative', alignSelf: 'flex-start' }} className="sm:self-auto">
      <button type="button" onClick={() => setOpen(p => !p)} style={triggerStyle}>
        <div style={{ width: 22, height: 22, borderRadius: '0 6px 6px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: selected ? 'rgba(242,237,227,0.1)' : C.s3 }}>
          <SelectedIcon style={{ width: 11, height: 11, color: C.crema }} />
        </div>
        <span style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected?.name ?? 'Todas las cuentas'}
        </span>
        <ChevronDownSvg style={{ width: 12, height: 12, color: C.piedra, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 240, borderRadius: '0 12px 12px 0', border: `1px solid ${C.linea}`, background: C.s1, boxShadow: '0 16px 40px rgba(0,0,0,0.5)', zIndex: 50, overflow: 'hidden' }}>
          <button type="button" onClick={() => { onChange(''); setOpen(false) }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, background: !value ? 'rgba(242,237,227,0.06)' : 'transparent', color: !value ? C.crema : C.piedra, border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={e => { if (value) e.currentTarget.style.background = C.s3 }}
            onMouseLeave={e => { if (value) e.currentTarget.style.background = 'transparent' }}>
            <div style={{ width: 26, height: 26, borderRadius: '0 7px 7px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: !value ? 'rgba(242,237,227,0.12)' : C.s3 }}>
              <WalletSvg style={{ width: 12, height: 12, color: !value ? C.crema : C.piedra }} />
            </div>
            <span style={{ fontWeight: 500, flex: 1 }}>Todas las cuentas</span>
            {!value && <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.crema, flexShrink: 0 }} />}
          </button>

          <div style={{ height: 1, background: C.linea, margin: '0 12px' }} />

          {accounts.map(acc => {
            const AccIcon = ACCOUNT_ICONS[acc.type] ?? WalletSvg
            const isSel   = acc.id === value
            const bal     = Number(acc.currentBalance)
            return (
              <button key={acc.id} type="button" onClick={() => { onChange(acc.id); setOpen(false) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, background: isSel ? 'rgba(242,237,227,0.06)' : 'transparent', color: isSel ? C.crema : C.piedra, border: 'none', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = C.s3 }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}>
                <div style={{ width: 26, height: 26, borderRadius: '0 7px 7px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isSel ? 'rgba(242,237,227,0.12)' : C.s3 }}>
                  <AccIcon style={{ width: 12, height: 12, color: isSel ? C.crema : C.piedra }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <p style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</p>
                  <p style={{ fontSize: 11, marginTop: 1, color: isSel ? C.arena : C.piedra }}>
                    ${Number(bal).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                {isSel && <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.crema, flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FinancesDashboard() {
  const toast = useToast()
  const qc    = useQueryClient()
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [movementModal,     setMovementModal]     = useState(null)
  const [defaultApplied,    setDefaultApplied]    = useState(false)
  const [confirmingId,      setConfirmingId]      = useState(null)
  const _now = new Date()
  const [selectedMonth, setSelectedMonth] = useState({ year: _now.getFullYear(), month: _now.getMonth() + 1 })

  function prevMonth() {
    setSelectedMonth(({ year, month }) => month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 })
  }
  function nextMonth() {
    setSelectedMonth(({ year, month }) => month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 })
  }

  const monthLabel = new Date(selectedMonth.year, selectedMonth.month - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  const { data, isLoading } = useQuery({
    queryKey: ['finances-dashboard', selectedAccountId, selectedMonth],
    queryFn: () => getFinancesDashboard({
      ...(selectedAccountId ? { accountId: selectedAccountId } : {}),
      month: selectedMonth.month,
      year:  selectedMonth.year,
    }).then(r => r.data.data),
    refetchInterval: 60_000,
  })

  useEffect(() => {
    if (!defaultApplied && data?.defaultCashAccountId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAccountId(data.defaultCashAccountId)
      setDefaultApplied(true)
    }
  }, [data?.defaultCashAccountId, defaultApplied])

  function invalidate() {
    qc.invalidateQueries(['finances-dashboard'])
    qc.invalidateQueries(['cash-movements'])
  }

  const pendingMovements = data?.pendingMovements ?? []
  const pendingLoading   = isLoading

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

  const allAccounts = data?.allAccounts ?? []
  const netMonth    = Number(data?.netMonth ?? 0)
  const netPositive = netMonth >= 0

  return (
    <div style={{ padding: '28px 24px 40px', fontFamily: 'Geist, system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BankNotesSvg style={{ width: 18, height: 18, color: C.arena }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema, margin: 0 }}>Finanzas</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <button onClick={prevMonth}
              style={{ padding: 3, borderRadius: '0 4px 4px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = C.crema}
              onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
              <ChevronLSvg style={{ width: 12, height: 12 }} />
            </button>
            <span style={{ fontSize: 12, fontWeight: 500, color: C.piedra, textTransform: 'capitalize' }}>{monthLabel}</span>
            <button onClick={nextMonth}
              style={{ padding: 3, borderRadius: '0 4px 4px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = C.crema}
              onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
              <ChevronRSvg style={{ width: 12, height: 12 }} />
            </button>
          </div>
        </div>

        <AccountSelector accounts={allAccounts} value={selectedAccountId} onChange={setSelectedAccountId} />

        <Link to="/finances/accounts"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: '0 9px 9px 0', border: `1px solid ${C.linea}`, fontSize: 13, fontWeight: 500, color: C.piedra, textDecoration: 'none', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
          onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
          <WalletSvg style={{ width: 14, height: 14 }} /> Cuentas
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          Icon={BankNotesSvg}
          label={selectedAccountId ? 'Saldo de la cuenta' : 'Saldo disponible'}
          sub={selectedAccountId ? data?.accounts?.[0]?.name : 'Cuentas activas'}
          value={fmt(data?.totalBalance)}
          iconBg="rgba(242,237,227,0.08)"
          iconColor={C.crema}
          valueColor={Number(data?.totalBalance) >= 0 ? C.crema : C.err}
        />
        <StatCard
          Icon={TrendUpSvg}
          label="Ingresos del mes"
          value={fmt(data?.incomeMonth)}
          iconBg="rgba(125,190,147,0.1)"
          iconColor={C.ok}
          borderColor="rgba(125,190,147,0.2)"
          valueColor={C.ok}
        />
        <StatCard
          Icon={TrendDownSvg}
          label="Egresos del mes"
          value={fmt(data?.expenseMonth)}
          iconBg="rgba(229,131,115,0.1)"
          iconColor={C.err}
          borderColor="rgba(229,131,115,0.2)"
          valueColor={C.err}
        />
        <StatCard
          Icon={ClockSvg}
          label="A cobrar"
          sub="Ingresos pendientes"
          value={fmt(data?.pendingIncome)}
          iconBg={Number(data?.pendingIncome) > 0 ? 'rgba(226,182,99,0.1)' : C.s3}
          iconColor={Number(data?.pendingIncome) > 0 ? C.warn : C.piedra}
          borderColor={Number(data?.pendingIncome) > 0 ? 'rgba(226,182,99,0.2)' : undefined}
          valueColor={Number(data?.pendingIncome) > 0 ? C.warn : C.piedra}
        />
        <StatCard
          Icon={ClockSvg}
          label="A pagar"
          sub="Egresos pendientes"
          value={fmt(data?.pendingExpense)}
          iconBg={Number(data?.pendingExpense) > 0 ? 'rgba(226,182,99,0.1)' : C.s3}
          iconColor={Number(data?.pendingExpense) > 0 ? C.warn : C.piedra}
          borderColor={Number(data?.pendingExpense) > 0 ? 'rgba(226,182,99,0.2)' : undefined}
          valueColor={Number(data?.pendingExpense) > 0 ? C.warn : C.piedra}
        />
      </div>

      {/* ── Resultado neto ── */}
      <div style={{ borderRadius: '0 16px 16px 0', border: `1px solid ${netPositive ? 'rgba(125,190,147,0.2)' : 'rgba(229,131,115,0.2)'}`, background: netPositive ? 'rgba(125,190,147,0.05)' : 'rgba(229,131,115,0.05)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '0 9px 9px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: netPositive ? 'rgba(125,190,147,0.12)' : 'rgba(229,131,115,0.12)' }}>
            {netPositive ? <TrendUpSvg style={{ width: 15, height: 15, color: C.ok }} /> : <TrendDownSvg style={{ width: 15, height: 15, color: C.err }} />}
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.piedra }}>Resultado neto del mes</p>
        </div>
        <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: netPositive ? C.ok : C.err, flexShrink: 0 }}>
          {netPositive ? '+' : ''}${fmt(netMonth)}
        </p>
      </div>

      {/* ── Movimientos recientes ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: C.crema, margin: 0, flexShrink: 0 }}>Movimientos de hoy</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setMovementModal('expense')} disabled={allAccounts.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', borderRadius: '0 8px 8px 0', background: 'rgba(229,131,115,0.1)', color: C.err, border: `1px solid rgba(229,131,115,0.2)`, fontSize: 12, fontWeight: 500, cursor: allAccounts.length === 0 ? 'not-allowed' : 'pointer', opacity: allAccounts.length === 0 ? 0.4 : 1 }}>
              <TrendDownSvg style={{ width: 13, height: 13 }} /> Egreso
            </button>
            <button onClick={() => setMovementModal('income')} disabled={allAccounts.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', borderRadius: '0 8px 8px 0', background: 'rgba(125,190,147,0.1)', color: C.ok, border: `1px solid rgba(125,190,147,0.2)`, fontSize: 12, fontWeight: 500, cursor: allAccounts.length === 0 ? 'not-allowed' : 'pointer', opacity: allAccounts.length === 0 ? 0.4 : 1 }}>
              <TrendUpSvg style={{ width: 13, height: 13 }} /> Ingreso
            </button>
            <Link to="/finances/movements"
              style={{ display: 'flex', alignItems: 'center', gap: 4, height: 32, padding: '0 12px', borderRadius: '0 8px 8px 0', border: `1px solid ${C.linea}`, fontSize: 12, fontWeight: 500, color: C.arena, textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.linea }}>
              Ver todos <ChevronRightLinkSvg style={{ width: 11, height: 11 }} />
            </Link>
          </div>
        </div>

        {(data?.recentMovements ?? []).length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '36px 0', border: `1px dashed ${C.linea}`, borderRadius: '0 12px 12px 0', textAlign: 'center' }}>
            <BankNotesSvg style={{ width: 32, height: 32, color: C.piedra, opacity: 0.3 }} />
            <p style={{ fontSize: 13, color: C.piedra }}>Sin movimientos hoy.</p>
          </div>
        ) : (
          <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 12px 12px 0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: C.s3, borderBottom: `1px solid ${C.linea}` }}>
                  <tr>
                    {['Fecha','Tipo','Descripción','Cuenta','Categoría','Estado','Monto'].map((h, i) => (
                      <th key={i} style={{ ...thStyle, textAlign: i === 6 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentMovements ?? []).map(m => {
                    const ts = TYPE_STYLE[m.type] ?? TYPE_STYLE.adjustment
                    const ss = STATUS_STYLE[m.status] ?? STATUS_STYLE.confirmed
                    return (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${C.linea}`, opacity: m.status === 'annulled' ? 0.5 : 1 }}>
                        <td style={{ ...tdStyle, color: C.piedra, whiteSpace: 'nowrap', fontSize: 11 }}>
                          {new Date(m.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '0 5px 5px 0', fontSize: 11, fontWeight: 500, background: ts.bg, color: ts.color }}>
                            {TYPE_LABELS[m.type]}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, maxWidth: 180 }}>
                          <p style={{ color: C.crema, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description || '—'}</p>
                          {m.reference && <p style={{ fontSize: 11, color: C.piedra, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.reference}</p>}
                        </td>
                        <td style={{ ...tdStyle, color: C.piedra }}>{m.account?.name ?? '—'}</td>
                        <td style={{ ...tdStyle, color: C.piedra }}>{m.category?.name ?? '—'}</td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 12, fontWeight: 500, ...ss }}>{STATUS_LABELS[m.status]}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap', color: amountColor(m) }}>
                          {amountSign(m)}${fmt(m.amount)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Movimientos pendientes ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: C.crema, margin: 0 }}>Movimientos pendientes</h3>
          {pendingMovements.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(226,182,99,0.12)', color: C.warn, padding: '1px 8px', borderRadius: '0 5px 5px 0' }}>
              {pendingMovements.length}
            </span>
          )}
        </div>

        {pendingLoading ? (
          <div style={{ padding: '36px 0', textAlign: 'center', fontSize: 13, color: C.piedra }}>Cargando…</div>
        ) : pendingMovements.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '36px 0', border: `1px dashed ${C.linea}`, borderRadius: '0 12px 12px 0', textAlign: 'center' }}>
            <CheckCircleSvg style={{ width: 32, height: 32, color: C.piedra, opacity: 0.3 }} />
            <p style={{ fontSize: 13, color: C.piedra }}>Sin movimientos pendientes.</p>
          </div>
        ) : (
          <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 12px 12px 0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: C.s3, borderBottom: `1px solid ${C.linea}` }}>
                  <tr>
                    {['Fecha','Tipo','Descripción','Cuenta','Categoría','Monto',''].map((h, i) => (
                      <th key={i} style={{ ...thStyle, textAlign: i === 5 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingMovements.map(m => {
                    const ts = TYPE_STYLE[m.type] ?? TYPE_STYLE.adjustment
                    return (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${C.linea}` }}>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: C.piedra, fontSize: 11, whiteSpace: 'nowrap' }}>
                              {new Date(m.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}
                            </span>
                            {isOverdue(m) && (
                              <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(229,131,115,0.1)', color: C.err, padding: '1px 5px', borderRadius: '0 3px 3px 0' }}>Atrasado</span>
                            )}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '0 5px 5px 0', fontSize: 11, fontWeight: 500, background: ts.bg, color: ts.color }}>
                            {TYPE_LABELS[m.type]}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, maxWidth: 200 }}>
                          <p style={{ color: C.crema, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description || '—'}</p>
                          {m.client && <p style={{ fontSize: 11, color: C.piedra, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.client.name}</p>}
                        </td>
                        <td style={{ ...tdStyle, color: C.piedra }}>{m.account?.name ?? '—'}</td>
                        <td style={{ ...tdStyle, color: C.piedra }}>{m.category?.name ?? '—'}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap', color: amountColor(m) }}>
                          {amountSign(m)}${fmt(m.amount)}
                        </td>
                        <td style={tdStyle}>
                          <button onClick={() => handleConfirmPending(m.id)} disabled={confirmingId === m.id}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: '0 7px 7px 0', fontSize: 12, fontWeight: 500, color: C.ok, border: `1px solid rgba(125,190,147,0.25)`, background: 'none', cursor: confirmingId === m.id ? 'not-allowed' : 'pointer', opacity: confirmingId === m.id ? 0.5 : 1 }}>
                            <CheckCircleSvg style={{ width: 13, height: 13 }} />
                            {confirmingId === m.id ? '…' : 'Confirmar'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {movementModal && (
        <MovementModal
          defaultType={movementModal}
          accounts={allAccounts}
          onClose={() => setMovementModal(null)}
          onSaved={() => { setMovementModal(null); invalidate() }}
        />
      )}
    </div>
  )
}
