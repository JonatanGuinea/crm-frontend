import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getFinancesDashboard, seedFinancialCategories, getCashAccounts } from '../../api/finances'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'
import MovementModal from './MovementModal'
import TransferModal from './TransferModal'
import {
  BanknotesIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  ArrowsRightLeftIcon, ChevronRightIcon, BuildingLibraryIcon,
  CreditCardIcon, DevicePhoneMobileIcon, WalletIcon,
} from '@heroicons/react/24/outline'

const fmt = (n) => Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ACCOUNT_ICONS = {
  cash:    WalletIcon,
  bank:    BuildingLibraryIcon,
  virtual: DevicePhoneMobileIcon,
}

const TYPE_LABELS = {
  income: 'Ingreso', expense: 'Egreso',
  transfer_out: 'Transferencia salida', transfer_in: 'Transferencia entrada',
  adjustment: 'Ajuste',
}
const TYPE_COLORS = {
  income: 'text-success', expense: 'text-danger',
  transfer_out: 'text-warning', transfer_in: 'text-info',
  adjustment: 'text-fg-muted',
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-fg', bg = 'bg-surface', border = 'border-line' }) {
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-3 ${bg} ${border}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-fg-muted">{label}</p>
        <Icon className={`w-4 h-4 ${color} opacity-70`} />
      </div>
      <div>
        <p className={`text-2xl sm:text-3xl font-bold ${color}`}>${value}</p>
        {sub && <p className="text-xs text-fg-muted mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default function FinancesDashboard() {
  const toast = useToast()
  const qc = useQueryClient()
  const { user } = useAuth()
  const [movementModal, setMovementModal] = useState(null)
  const [transferModal, setTransferModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['finances-dashboard'],
    queryFn: () => getFinancesDashboard().then(r => r.data.data),
    refetchInterval: 60_000,
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ['cash-accounts'],
    queryFn: () => getCashAccounts().then(r => r.data.data),
  })

  async function handleSeed() {
    try {
      await seedFinancialCategories()
      toast('Categorías inicializadas', 'success')
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error')
    }
  }

  if (isLoading) return <div className="flex items-center justify-center py-20 text-fg-muted text-sm">Cargando…</div>

  const noAccounts = accounts.length === 0

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">Finanzas</h1>
          <p className="text-sm text-fg-muted mt-0.5">Resumen financiero del mes</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {noAccounts && (
            <Link to="/finances/accounts" className="px-4 py-2 rounded-lg border border-warning text-warning text-sm font-medium hover:bg-warning-subtle transition-colors">
              Crear primera cuenta
            </Link>
          )}
          <button
            onClick={() => setMovementModal('expense')}
            disabled={noAccounts}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <ArrowTrendingDownIcon className="w-4 h-4" />
            Egreso
          </button>
          <button
            onClick={() => setMovementModal('income')}
            disabled={noAccounts}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <ArrowTrendingUpIcon className="w-4 h-4" />
            Ingreso
          </button>
          <button
            onClick={() => setTransferModal(true)}
            disabled={accounts.length < 2}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line bg-surface text-sm font-medium text-fg-soft hover:bg-raised hover:text-fg transition-colors disabled:opacity-40"
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
            Transferir
          </button>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={BanknotesIcon}
          label="Saldo total disponible"
          value={fmt(data?.totalBalance)}
          sub="Suma de cuentas activas"
          color={Number(data?.totalBalance) >= 0 ? 'text-fg' : 'text-danger'}
        />
        <StatCard
          icon={ArrowTrendingUpIcon}
          label="Ingresos del mes"
          value={fmt(data?.incomeMonth)}
          color="text-success"
          bg="bg-success-subtle/10"
          border="border-success/20"
        />
        <StatCard
          icon={ArrowTrendingDownIcon}
          label="Egresos del mes"
          value={fmt(data?.expenseMonth)}
          color="text-danger"
          bg="bg-danger-subtle/10"
          border="border-danger/20"
        />
      </div>

      {/* Resultado del mes */}
      {data?.netMonth !== undefined && (
        <div className={`rounded-xl border px-5 py-4 flex items-center justify-between ${Number(data.netMonth) >= 0 ? 'bg-success-subtle/10 border-success/20' : 'bg-danger-subtle/10 border-danger/20'}`}>
          <p className="text-sm font-medium text-fg-muted">Resultado neto del mes</p>
          <p className={`text-xl font-bold ${Number(data.netMonth) >= 0 ? 'text-success' : 'text-danger'}`}>
            {Number(data.netMonth) >= 0 ? '+' : ''}${fmt(data.netMonth)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saldo por cuenta */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">Saldo por cuenta</h2>
            <Link to="/finances/accounts" className="text-xs text-fg-muted hover:text-fg flex items-center gap-0.5 transition-colors">
              Gestionar <ChevronRightIcon className="w-3 h-3" />
            </Link>
          </div>
          {(data?.accounts ?? []).length === 0 ? (
            <div className="py-8 text-center border border-dashed border-line rounded-xl text-sm text-fg-muted">
              Sin cuentas creadas aún.{' '}
              <Link to="/finances/accounts" className="text-brand hover:underline">Crear primera cuenta</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {(data?.accounts ?? []).map(acc => {
                const Icon = ACCOUNT_ICONS[acc.type] ?? WalletIcon
                const bal  = Number(acc.currentBalance)
                return (
                  <div key={acc.id} className="flex items-center gap-3 px-4 py-3 bg-surface border border-line rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-brand-subtle flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-fg">{acc.name}</p>
                      <p className="text-xs text-fg-muted capitalize">{acc.type} · {acc.currency}</p>
                    </div>
                    <p className={`text-sm font-bold shrink-0 ${bal >= 0 ? 'text-fg' : 'text-danger'}`}>
                      ${fmt(bal)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Últimos movimientos */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">Últimos movimientos</h2>
            <Link to="/finances/movements" className="text-xs text-fg-muted hover:text-fg flex items-center gap-0.5 transition-colors">
              Ver todos <ChevronRightIcon className="w-3 h-3" />
            </Link>
          </div>
          {(data?.recentMovements ?? []).length === 0 ? (
            <p className="py-8 text-center border border-dashed border-line rounded-xl text-sm text-fg-muted">Sin movimientos aún.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {(data?.recentMovements ?? []).map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3 bg-surface border border-line rounded-xl">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${m.type === 'income' || m.type === 'transfer_in' ? 'bg-success' : 'bg-danger'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-fg truncate">{m.description || TYPE_LABELS[m.type]}</p>
                    <p className="text-xs text-fg-muted">
                      {m.account?.name} · {new Date(m.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ${TYPE_COLORS[m.type]}`}>
                    {m.type === 'income' || m.type === 'transfer_in' ? '+' : '−'}${fmt(m.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gastos por categoría */}
      {(data?.categoryBreakdown ?? []).length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-fg">Gastos por categoría (este mes)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.categoryBreakdown.map((c, i) => {
              const max = data.categoryBreakdown[0].total
              const pct = Math.round((c.total / max) * 100)
              return (
                <div key={c.categoryId ?? i} className="flex items-center gap-3 px-4 py-3 bg-surface border border-line rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-fg truncate">{c.name}</p>
                      <p className="text-xs font-semibold text-danger shrink-0 ml-2">${fmt(c.total)}</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-raised overflow-hidden">
                      <div className="h-full rounded-full bg-danger/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Seed prompt si no hay categorías */}
      {data?.categoryBreakdown?.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8 border border-dashed border-line rounded-xl">
          <p className="text-sm text-fg-muted">No hay categorías financieras configuradas.</p>
          <button onClick={handleSeed} className="text-sm text-brand hover:underline">
            Inicializar categorías por defecto
          </button>
        </div>
      )}

      {movementModal && (
        <MovementModal
          defaultType={movementModal}
          accounts={accounts}
          onClose={() => setMovementModal(null)}
          onSaved={() => { setMovementModal(null); qc.invalidateQueries(['finances-dashboard']); qc.invalidateQueries(['cash-accounts']); qc.invalidateQueries(['cash-movements']) }}
        />
      )}
      {transferModal && (
        <TransferModal
          accounts={accounts}
          onClose={() => setTransferModal(false)}
          onSaved={() => { setTransferModal(false); qc.invalidateQueries(['finances-dashboard']); qc.invalidateQueries(['cash-accounts']); qc.invalidateQueries(['cash-movements']) }}
        />
      )}
    </div>
  )
}
