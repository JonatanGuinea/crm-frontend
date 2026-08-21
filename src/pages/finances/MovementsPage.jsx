import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCashMovements, getCashAccounts, confirmCashMovement, annulCashMovement, deleteCashMovement,
} from '../../api/finances'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import MovementModal from './MovementModal'
import {
  ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  ChevronLeftIcon, ChevronRightIcon, FunnelIcon, CheckCircleIcon, XCircleIcon,
  TrashIcon, PencilIcon, TagIcon,
} from '@heroicons/react/24/outline'

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
const STATUS_COLORS  = { confirmed: 'text-success', pending: 'text-warning', annulled: 'text-fg-muted line-through' }
const STATUS_LABELS  = { confirmed: 'Confirmado', pending: 'Pendiente', annulled: 'Anulado' }

const amountColor = (m) => {
  if (m.status === 'pending')  return 'text-warning'
  if (m.status === 'annulled') return 'text-fg-muted'
  return m.type === 'income' || m.type === 'transfer_in' ? 'text-success' : 'text-danger'
}

const fmt = (n) => Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const isOverdue = (m) => m.status === 'pending' && m.date?.slice(0, 10) < new Date().toISOString().slice(0, 10)

const selectCls = 'w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40'

function periodLabel(year, month) {
  return new Date(year, month - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

function periodRange(year, month) {
  const from = new Date(year, month - 1, 1).toISOString().slice(0, 10)
  const to   = new Date(year, month, 0).toISOString().slice(0, 10)
  return { from, to }
}

export default function MovementsPage() {
  const toast   = useToast()
  const confirm = useConfirm()
  const qc      = useQueryClient()

  const now = new Date()
  const [period,       setPeriod]       = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })
  const [movementModal, setMovementModal] = useState(null)
  const [editTarget,    setEditTarget]    = useState(null)
  const [showFilters,   setShowFilters]   = useState(false)

  const [filters, setFilters] = useState({ accountId: '', type: '', status: '', reference: '' })

  function prevMonth() {
    setPeriod(p => {
      if (p.month === 1) return { year: p.year - 1, month: 12 }
      return { ...p, month: p.month - 1 }
    })
  }

  function nextMonth() {
    setPeriod(p => {
      if (p.month === 12) return { year: p.year + 1, month: 1 }
      return { ...p, month: p.month + 1 }
    })
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

  const hasActiveFilters = Object.values(filters).some(Boolean)
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="p-4 md:p-8 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/finances" className="text-fg-muted hover:text-fg transition-colors shrink-0">
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-fg">Movimientos</h1>
            <p className="text-xs text-fg-muted mt-0.5">{movements.length} registros</p>
          </div>
        </div>

        {/* Navegador de mes */}
        <div className="flex items-center gap-1 bg-raised border border-line rounded-xl px-1 py-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-surface text-fg-muted hover:text-fg transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-fg capitalize px-2 min-w-[140px] text-center">
            {periodLabel(period.year, period.month)}
          </span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg hover:bg-surface text-fg-muted hover:text-fg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowFilters(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${hasActiveFilters ? 'border-brand text-brand bg-brand-subtle/10' : 'border-line text-fg-muted hover:text-fg hover:bg-raised'}`}
          >
            <FunnelIcon className="w-4 h-4" />
            Filtros{hasActiveFilters && ` (${activeFilterCount})`}
          </button>
          <Link
            to="/finances/categories"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-sm font-medium text-fg-muted hover:text-fg hover:bg-raised transition-colors"
          >
            <TagIcon className="w-4 h-4" />
            Categorías
          </Link>
          <button
            onClick={() => setMovementModal('expense')}
            disabled={accounts.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-danger text-white text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            <ArrowTrendingDownIcon className="w-4 h-4" />
            Egreso
          </button>
          <button
            onClick={() => setMovementModal('income')}
            disabled={accounts.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success text-white text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            <ArrowTrendingUpIcon className="w-4 h-4" />
            Ingreso
          </button>
        </div>

        {/* Mobile: filtros + categorías */}
        <div className="flex sm:hidden items-center gap-2 shrink-0">
          <button
            onClick={() => setShowFilters(p => !p)}
            className={`p-2 rounded-lg border text-sm transition-colors ${hasActiveFilters ? 'border-brand text-brand bg-brand-subtle/10' : 'border-line text-fg-muted hover:bg-raised'}`}
          >
            <FunnelIcon className="w-4 h-4" />
          </button>
          <Link
            to="/finances/categories"
            className="p-2 rounded-lg border border-line text-fg-muted hover:bg-raised transition-colors"
          >
            <TagIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Mobile FAB strip */}
      <div className="flex sm:hidden gap-2">
        <button
          onClick={() => setMovementModal('expense')}
          disabled={accounts.length === 0}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-danger text-white text-sm font-medium disabled:opacity-40"
        >
          <ArrowTrendingDownIcon className="w-4 h-4" />
          Egreso
        </button>
        <button
          onClick={() => setMovementModal('income')}
          disabled={accounts.length === 0}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-success text-white text-sm font-medium disabled:opacity-40"
        >
          <ArrowTrendingUpIcon className="w-4 h-4" />
          Ingreso
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="flex flex-col gap-3 p-4 bg-surface border border-line rounded-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <select value={filters.accountId} onChange={e => setFilter('accountId', e.target.value)} className={selectCls}>
              <option value="">Todas las cuentas</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select value={filters.type} onChange={e => setFilter('type', e.target.value)} className={selectCls}>
              <option value="">Todos los tipos</option>
              <option value="income">Ingreso</option>
              <option value="expense">Egreso</option>
              <option value="transfer_out">Transf. salida</option>
              <option value="transfer_in">Transf. entrada</option>
            </select>
            <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className={selectCls}>
              <option value="">Todos los estados</option>
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendiente</option>
              <option value="annulled">Anulado</option>
            </select>
            <input
              type="text"
              placeholder="Referencia (N° factura, recibo…)"
              value={filters.reference}
              onChange={e => setFilter('reference', e.target.value)}
              className={selectCls}
            />
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="self-end text-xs text-fg-muted hover:text-fg transition-colors">
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Tabla desktop */}
      <div className="hidden md:block bg-surface/60 backdrop-blur-xl rounded-2xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-raised border-b border-line">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Descripción</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Cuenta</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Categoría</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Monto</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <tr><td colSpan={9} className="py-12 text-center text-fg-muted text-sm">Cargando…</td></tr>
              ) : movements.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-fg-muted text-sm">Sin movimientos{hasActiveFilters ? ' con esos filtros' : ''} en {periodLabel(period.year, period.month)}.</td></tr>
              ) : movements.map(m => (
                <tr key={m.id} className={`group hover:bg-raised/50 transition-colors ${m.status === 'annulled' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 text-fg-muted whitespace-nowrap text-xs">
                    {new Date(m.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[m.type]}`}>
                      {TYPE_LABELS[m.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-fg">{m.description || '—'}</p>
                    {m.reference && <p className="text-xs text-fg-muted">{m.reference}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-fg-muted">{m.client?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-fg-muted">{m.account?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-fg-muted">{m.category?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-medium ${STATUS_COLORS[m.status]}`}>{STATUS_LABELS[m.status]}</span>
                      {isOverdue(m) && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide bg-danger/10 text-danger px-1.5 py-0.5 rounded-full">
                          Atrasado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`px-4 py-3 font-semibold text-right whitespace-nowrap text-sm ${amountColor(m)}`}>
                    {m.type === 'income' || m.type === 'transfer_in' ? '+' : '−'}${fmt(m.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      {m.status === 'pending' && (
                        <>
                          <button onClick={() => { setEditTarget(m); setMovementModal(m.type) }} className="p-1.5 text-fg-muted hover:text-fg rounded-lg hover:bg-raised transition-colors" title="Editar">
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleConfirm(m.id)} className="p-1.5 text-success rounded-lg hover:bg-success-subtle/20 transition-colors" title="Confirmar">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(m)} className="p-1.5 text-danger rounded-lg hover:bg-danger-subtle/20 transition-colors" title="Eliminar">
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {m.status === 'confirmed' && !m.type.startsWith('transfer') && (
                        <button onClick={() => handleAnnul(m)} className="p-1.5 text-fg-muted hover:text-danger rounded-lg hover:bg-danger-subtle/20 transition-colors" title="Anular">
                          <XCircleIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards móvil */}
      <div className="flex flex-col gap-2 md:hidden">
        {isLoading ? (
          <p className="py-12 text-center text-fg-muted text-sm">Cargando…</p>
        ) : movements.length === 0 ? (
          <p className="py-12 text-center text-fg-muted text-sm">Sin movimientos{hasActiveFilters ? ' con esos filtros' : ''} en {periodLabel(period.year, period.month)}.</p>
        ) : movements.map(m => (
          <div
            key={m.id}
            className={`bg-surface border border-line rounded-xl p-4 flex flex-col gap-3 ${m.status === 'annulled' ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${m.type === 'income' || m.type === 'transfer_in' ? 'bg-success' : 'bg-danger'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fg">{m.description || TYPE_LABELS[m.type]}</p>
                <p className="text-xs text-fg-muted mt-0.5">
                  {m.account?.name} · {new Date(m.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}
                  {m.client && ` · ${m.client.name}`}
                  {m.category && ` · ${m.category.name}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${amountColor(m)}`}>
                  {m.type === 'income' || m.type === 'transfer_in' ? '+' : '−'}${fmt(m.amount)}
                </p>
                <div className="flex items-center gap-1 justify-end">
                  <span className={`text-xs ${STATUS_COLORS[m.status]}`}>{STATUS_LABELS[m.status]}</span>
                  {isOverdue(m) && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide bg-danger/10 text-danger px-1.5 py-0.5 rounded-full">
                      Atrasado
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-line">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[m.type]}`}>
                {TYPE_LABELS[m.type]}
              </span>
              <div className="flex items-center gap-1">
                {m.status === 'pending' && (
                  <>
                    <button
                      onClick={() => { setEditTarget(m); setMovementModal(m.type) }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-fg-muted border border-line hover:bg-raised transition-colors"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleConfirm(m.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-success border border-success/30 hover:bg-success-subtle/20 transition-colors"
                    >
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleDelete(m)}
                      className="p-1.5 rounded-lg text-danger hover:bg-danger-subtle/20 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
                {m.status === 'confirmed' && !m.type.startsWith('transfer') && (
                  <button
                    onClick={() => handleAnnul(m)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-fg-muted border border-line hover:text-danger hover:border-danger/30 hover:bg-danger-subtle/10 transition-colors"
                  >
                    <XCircleIcon className="w-3.5 h-3.5" />
                    Anular
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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
