import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getFinancesDashboard, confirmCashMovement } from '../../api/finances'
import { useToast } from '../../components/Toast'
import { fmt } from '../../utils/fmt'
import MovementModal from './MovementModal'
import {
  BanknotesIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  ChevronLeftIcon, ChevronRightIcon, BuildingLibraryIcon,
  ClockIcon, DevicePhoneMobileIcon, WalletIcon,
  ChevronDownIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline'


const ACCOUNT_ICONS = {
  cash:    WalletIcon,
  bank:    BuildingLibraryIcon,
  virtual: DevicePhoneMobileIcon,
}

const TYPE_LABELS = {
  income: 'Ingreso', expense: 'Egreso',
  transfer_out: 'Transf. salida', transfer_in: 'Transf. entrada',
  adjustment: 'Ajuste',
}
const TYPE_COLORS = {
  income:       'text-success bg-success-subtle/20',
  expense:      'text-danger bg-danger-subtle/20',
  transfer_out: 'text-warning bg-warning-subtle/20',
  transfer_in:  'text-info bg-info-subtle/20',
  adjustment:   'text-fg-muted bg-raised',
}
const STATUS_COLORS = { confirmed: 'text-success', pending: 'text-warning', annulled: 'text-fg-muted' }
const STATUS_LABELS = { confirmed: 'Confirmado', pending: 'Pendiente', annulled: 'Anulado' }

const amountColor = (m) => {
  if (m.status === 'pending')  return 'text-warning'
  if (m.status === 'annulled') return 'text-fg-muted'
  return m.type === 'income' || m.type === 'transfer_in' ? 'text-success' : 'text-danger'
}

const amountSign = (m) =>
  m.type === 'income' || m.type === 'transfer_in' ? '+' : '−'

const isOverdue = (m) => m.status === 'pending' && m.date?.slice(0, 10) < new Date().toISOString().slice(0, 10)

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor, borderColor, valueColor = 'text-fg' }) {
  return (
    <div
      className="rounded-2xl border border-line bg-surface p-4 flex flex-col gap-4 min-w-0 overflow-hidden"
      style={borderColor ? { borderColor } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
        </div>
        <p className="text-xs font-medium text-fg-muted text-right leading-tight truncate">{label}</p>
      </div>
      <div className="min-w-0">
        <p className={`text-base md:text-lg font-bold tracking-tight truncate ${valueColor}`} title={value}>{value}</p>
        {sub && <p className="text-xs text-fg-muted mt-0.5 truncate">{sub}</p>}
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

  const selected = accounts.find(a => a.id === value) ?? null
  const SelectedIcon = selected ? (ACCOUNT_ICONS[selected.type] ?? WalletIcon) : WalletIcon

  return (
    <div ref={ref} className="relative self-start sm:self-auto">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-2.5 pl-3 pr-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
          open
            ? 'border-brand/40 bg-surface/80 backdrop-blur-xl shadow-sm text-fg ring-2 ring-brand/15'
            : 'border-line/60 bg-surface/50 backdrop-blur-xl text-fg hover:border-line hover:bg-surface/80 hover:shadow-sm'
        }`}
      >
        <div className={`w-15 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
          selected ? 'bg-brand-subtle text-brand' : 'bg-raised text-fg-muted'
        }`}>
          <SelectedIcon className="w-3 h-3" />
        </div>
        <span className="max-w-[130px] truncate">{selected?.name ?? 'Todas las cuentas'}</span>
        <ChevronDownIcon className={`w-3.5 h-3.5 text-fg-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl border border-line/50 bg-surface/90 backdrop-blur-2xl shadow-2xl z-50 overflow-hidden">
          {/* All accounts */}
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
              !value ? 'bg-brand/8 text-brand' : 'text-fg hover:bg-raised/60'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              !value ? 'bg-brand-subtle' : 'bg-raised'
            }`}>
              <WalletIcon className={`w-3.5 h-3.5 ${!value ? 'text-brand' : 'text-fg-muted'}`} />
            </div>
            <span className="font-medium flex-1 text-left">Todas las cuentas</span>
            {!value && <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}
          </button>

          <div className="h-px bg-line/40 mx-3" />

          {accounts.map(acc => {
            const AccIcon = ACCOUNT_ICONS[acc.type] ?? WalletIcon
            const isSel   = acc.id === value
            const bal     = Number(acc.currentBalance)
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => { onChange(acc.id); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isSel ? 'bg-brand/8 text-brand' : 'text-fg hover:bg-raised/60'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isSel ? 'bg-brand-subtle' : 'bg-raised'
                }`}>
                  <AccIcon className={`w-3.5 h-3.5 ${isSel ? 'text-brand' : 'text-fg-muted'}`} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium truncate leading-tight">{acc.name}</p>
                  <p className={`text-xs mt-0.5 leading-tight ${isSel ? 'text-brand/70' : 'text-fg-muted'}`}>
                    ${Number(bal).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                {isSel && <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}
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
  const [selectedAccountId,  setSelectedAccountId]  = useState('')
  const [movementModal,      setMovementModal]      = useState(null)
  const [defaultApplied,     setDefaultApplied]     = useState(false)
  const [confirmingId,       setConfirmingId]       = useState(null)
  const _now = new Date()
  const [selectedMonth, setSelectedMonth] = useState({ year: _now.getFullYear(), month: _now.getMonth() + 1 })

  function prevMonth() {
    setSelectedMonth(({ year, month }) =>
      month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
    )
  }
  function nextMonth() {
    setSelectedMonth(({ year, month }) =>
      month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
    )
  }

  const monthLabel = new Date(selectedMonth.year, selectedMonth.month - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  const { data, isLoading } = useQuery({
    queryKey: ['finances-dashboard', selectedAccountId, selectedMonth],
    queryFn:  () => getFinancesDashboard({
      ...(selectedAccountId ? { accountId: selectedAccountId } : {}),
      month: selectedMonth.month,
      year:  selectedMonth.year,
    }).then(r => r.data.data),
    refetchInterval: 60_000,
  })

  // Auto-selecciona la cuenta predeterminada al primer load
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
    <div className="flex items-center justify-center py-24 text-fg-muted text-sm">Cargando…</div>
  )

  const allAccounts = data?.allAccounts ?? []
  const netMonth    = Number(data?.netMonth ?? 0)
  const netPositive = netMonth >= 0

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Título + navegador de mes */}
        <div className="shrink-0">
          <h1 className="text-xl font-semibold text-fg">Finanzas</h1>
          <div className="flex items-center gap-1 mt-0.5">
            <button
              onClick={prevMonth}
              className="text-fg-muted hover:text-fg transition-colors p-0.5 rounded"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-medium text-fg-muted capitalize">{monthLabel}</span>
            <button
              onClick={nextMonth}
              className="text-fg-muted hover:text-fg transition-colors p-0.5 rounded"
            >
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Selector de cuenta */}
        <AccountSelector
          accounts={allAccounts}
          value={selectedAccountId}
          onChange={setSelectedAccountId}
        />

        <Link
          to="/finances/accounts"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line bg-surface text-sm font-medium text-fg-muted hover:bg-raised hover:text-fg transition-colors shrink-0"
        >
          <WalletIcon className="w-4 h-4" /> Cuentas
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          icon={BanknotesIcon}
          label={selectedAccountId ? 'Saldo de la cuenta' : 'Saldo disponible'}
          sub={selectedAccountId ? data?.accounts?.[0]?.name : 'Cuentas activas'}
          value={fmt(data?.totalBalance)}
          iconBg="bg-brand-subtle"
          iconColor="text-brand"
          valueColor={Number(data?.totalBalance) >= 0 ? 'text-fg' : 'text-danger'}
        />
        <StatCard
          icon={ArrowTrendingUpIcon}
          label="Ingresos del mes"
          value={fmt(data?.incomeMonth)}
          iconBg="bg-success-subtle/30"
          iconColor="text-success"
          borderColor="var(--brand-green)"
          valueColor="text-success"
        />
        <StatCard
          icon={ArrowTrendingDownIcon}
          label="Egresos del mes"
          value={fmt(data?.expenseMonth)}
          iconBg="bg-danger-subtle/30"
          iconColor="text-danger"
          borderColor="var(--brand-red)"
          valueColor="text-danger"
        />
        <StatCard
          icon={ClockIcon}
          label="A cobrar"
          sub="Ingresos pendientes"
          value={fmt(data?.pendingIncome)}
          iconBg={Number(data?.pendingIncome) > 0 ? 'bg-warning/10' : 'bg-raised'}
          iconColor={Number(data?.pendingIncome) > 0 ? 'text-warning' : 'text-fg-muted'}
          borderColor={Number(data?.pendingIncome) > 0 ? 'var(--brand-amber)' : undefined}
          valueColor={Number(data?.pendingIncome) > 0 ? 'text-warning' : 'text-fg-muted'}
        />
        <StatCard
          icon={ClockIcon}
          label="A pagar"
          sub="Egresos pendientes"
          value={fmt(data?.pendingExpense)}
          iconBg={Number(data?.pendingExpense) > 0 ? 'bg-warning/10' : 'bg-raised'}
          iconColor={Number(data?.pendingExpense) > 0 ? 'text-warning' : 'text-fg-muted'}
          borderColor={Number(data?.pendingExpense) > 0 ? 'var(--brand-amber)' : undefined}
          valueColor={Number(data?.pendingExpense) > 0 ? 'text-warning' : 'text-fg-muted'}
        />
      </div>

      {/* ── Resultado neto ── */}
      <div className={`rounded-2xl border px-5 py-4 flex items-center justify-between gap-4 ${netPositive ? 'border-success/25 bg-success/5' : 'border-danger/25 bg-danger/5'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${netPositive ? 'bg-success/15' : 'bg-danger/15'}`}>
            {netPositive
              ? <ArrowTrendingUpIcon className="w-4 h-4 text-success" />
              : <ArrowTrendingDownIcon className="w-4 h-4 text-danger" />
            }
          </div>
          <p className="text-sm font-medium text-fg-muted">Resultado neto del mes</p>
        </div>
        <p className={`text-xl font-bold shrink-0 ${netPositive ? 'text-success' : 'text-danger'}`}>
          {netPositive ? '+' : ''}${fmt(netMonth)}
        </p>
      </div>

      {/* ── Movimientos recientes ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-fg shrink-0">Movimientos de hoy</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMovementModal('expense')}
              disabled={allAccounts.length === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-danger/10 text-danger border border-danger/20 text-xs font-medium hover:bg-danger/20 transition-colors disabled:opacity-40"
            >
              <ArrowTrendingDownIcon className="w-4 h-4" /> Egreso
            </button>
            <button
              onClick={() => setMovementModal('income')}
              disabled={allAccounts.length === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-success/10 text-success border border-success/20 text-xs font-medium hover:bg-success/20 transition-colors disabled:opacity-40"
            >
              <ArrowTrendingUpIcon className="w-4 h-4" /> Ingreso
            </button>
            <Link
              to="/finances/movements"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-brand/20 text-xs font-medium text-brand hover:text-brand/80 hover:bg-brand/5 transition-colors"
            >
              Ver todos <ChevronRightIcon className="w-3 h-3" />
            </Link>
          </div>
        </div>
        {(data?.recentMovements ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 border border-dashed border-line rounded-2xl text-center">
            <BanknotesIcon className="w-8 h-8 text-fg-muted/30" />
            <p className="text-sm text-fg-muted">Sin movimientos hoy.</p>
          </div>
        ) : (
          <div className="bg-surface/60 backdrop-blur-xl rounded-2xl border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-raised border-b border-line">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Descripción</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Cuenta</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Categoría</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Estado</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(data?.recentMovements ?? []).map(m => (
                    <tr key={m.id} className={`hover:bg-raised/50 transition-colors ${m.status === 'annulled' ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap text-xs">
                        {new Date(m.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[m.type]}`}>
                          {TYPE_LABELS[m.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-sm text-fg truncate">{m.description || '—'}</p>
                        {m.reference && <p className="text-xs text-fg-muted truncate">{m.reference}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-fg-muted">{m.account?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-fg-muted">{m.category?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${STATUS_COLORS[m.status]}`}>{STATUS_LABELS[m.status]}</span>
                      </td>
                      <td className={`px-4 py-3 font-semibold text-right whitespace-nowrap text-sm ${amountColor(m)}`}>
                        {amountSign(m)}${fmt(m.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
       
      </div>

      {/* ── Movimientos pendientes ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-fg shrink-0">
            Movimientos pendientes
            {pendingMovements.length > 0 && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-warning/15 text-warning">
                {pendingMovements.length}
              </span>
            )}
          </h2>
        </div>

        {pendingLoading ? (
          <div className="py-10 text-center text-sm text-fg-muted">Cargando…</div>
        ) : pendingMovements.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 border border-dashed border-line rounded-2xl text-center">
            <CheckCircleIcon className="w-8 h-8 text-fg-muted/30" />
            <p className="text-sm text-fg-muted">Sin movimientos pendientes.</p>
          </div>
        ) : (
          <div className="bg-surface/60 backdrop-blur-xl rounded-2xl border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-raised border-b border-line">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Descripción</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Cuenta</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Categoría</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Monto</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pendingMovements.map(m => (
                    <tr key={m.id} className="hover:bg-raised/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-fg-muted">
                            {new Date(m.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </span>
                          {isOverdue(m) && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide bg-danger/10 text-danger px-1.5 py-0.5 rounded-full">
                              Atrasado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[m.type]}`}>
                          {TYPE_LABELS[m.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-sm text-fg truncate">{m.description || '—'}</p>
                        {m.client && <p className="text-xs text-fg-muted truncate">{m.client.name}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-fg-muted">{m.account?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-fg-muted">{m.category?.name ?? '—'}</td>
                      <td className={`px-4 py-3 font-semibold text-right whitespace-nowrap text-sm ${amountColor(m)}`}>
                        {amountSign(m)}${fmt(m.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleConfirmPending(m.id)}
                          disabled={confirmingId === m.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-success border border-success/30 hover:bg-success/5 transition-colors disabled:opacity-50"
                        >
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          {confirmingId === m.id ? '…' : 'Confirmar'}
                        </button>
                      </td>
                    </tr>
                  ))}
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
