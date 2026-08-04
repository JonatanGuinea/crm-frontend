import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCashMovements, getCashAccounts, confirmCashMovement, annulCashMovement, deleteCashMovement
} from '../../api/finances'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import MovementModal from './MovementModal'
import TransferModal from './TransferModal'
import {
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowsRightLeftIcon,
  ChevronLeftIcon, FunnelIcon, CheckCircleIcon, XCircleIcon,
  TrashIcon, PencilIcon,
} from '@heroicons/react/24/outline'

const TYPE_LABELS = {
  income: 'Ingreso', expense: 'Egreso',
  transfer_out: 'Transf. salida', transfer_in: 'Transf. entrada',
  adjustment: 'Ajuste',
}
const TYPE_COLORS = {
  income: 'text-success bg-success-subtle/20',
  expense: 'text-danger bg-danger-subtle/20',
  transfer_out: 'text-warning bg-warning-subtle/20',
  transfer_in: 'text-info bg-info-subtle/20',
  adjustment: 'text-fg-muted bg-raised',
}
const STATUS_COLORS = {
  confirmed: 'text-success',
  pending:   'text-warning',
  annulled:  'text-fg-muted line-through',
}
const STATUS_LABELS = { confirmed: 'Confirmado', pending: 'Pendiente', annulled: 'Anulado' }

const fmt = (n) => Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function MovementsPage() {
  const toast   = useToast()
  const confirm = useConfirm()
  const qc      = useQueryClient()

  const [movementModal, setMovementModal] = useState(null)
  const [editTarget,    setEditTarget]    = useState(null)
  const [transferModal, setTransferModal] = useState(false)
  const [showFilters,   setShowFilters]   = useState(false)

  const [filters, setFilters] = useState({
    accountId:  '',
    type:       '',
    status:     '',
    from:       '',
    to:         '',
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ['cash-accounts'],
    queryFn: () => getCashAccounts().then(r => r.data.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['cash-movements', filters],
    queryFn: () => getCashMovements({ ...filters, limit: 100 }).then(r => r.data.data),
  })

  const movements = data?.movements ?? []

  function setFilter(k, v) { setFilters(p => ({ ...p, [k]: v })) }
  function clearFilters()  { setFilters({ accountId: '', type: '', status: '', from: '', to: '' }) }

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
      `¿Anular "${m.description || TYPE_LABELS[m.type]}"? Se creará un movimiento inverso para revertir el saldo.`,
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

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link to="/finances" className="text-fg-muted hover:text-fg transition-colors">
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-fg">Movimientos</h1>
            <p className="text-xs text-fg-muted mt-0.5">{movements.length} registros</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(p => !p)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${hasActiveFilters ? 'border-brand text-brand bg-brand-subtle/10' : 'border-line text-fg-muted hover:text-fg hover:bg-raised'}`}
          >
            <FunnelIcon className="w-4 h-4" />
            Filtros{hasActiveFilters && ` (${Object.values(filters).filter(Boolean).length})`}
          </button>
          <button
            onClick={() => setTransferModal(true)}
            disabled={accounts.length < 2}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-line text-sm font-medium text-fg-muted hover:text-fg hover:bg-raised transition-colors disabled:opacity-40"
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
            Transferir
          </button>
          <button
            onClick={() => setMovementModal('expense')}
            disabled={accounts.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            <ArrowTrendingDownIcon className="w-4 h-4" />
            Egreso
          </button>
          <button
            onClick={() => setMovementModal('income')}
            disabled={accounts.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            <ArrowTrendingUpIcon className="w-4 h-4" />
            Ingreso
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="flex flex-col gap-3 p-4 bg-surface border border-line rounded-xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <select
              value={filters.accountId}
              onChange={e => setFilter('accountId', e.target.value)}
              className="rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              <option value="">Todas las cuentas</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select
              value={filters.type}
              onChange={e => setFilter('type', e.target.value)}
              className="rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              <option value="">Todos los tipos</option>
              <option value="income">Ingreso</option>
              <option value="expense">Egreso</option>
              <option value="transfer_out">Transf. salida</option>
              <option value="transfer_in">Transf. entrada</option>
            </select>
            <select
              value={filters.status}
              onChange={e => setFilter('status', e.target.value)}
              className="rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              <option value="">Todos los estados</option>
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendiente</option>
              <option value="annulled">Anulado</option>
            </select>
            <input
              type="date"
              value={filters.from}
              onChange={e => setFilter('from', e.target.value)}
              className="rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="Desde"
            />
            <input
              type="date"
              value={filters.to}
              onChange={e => setFilter('to', e.target.value)}
              className="rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="Hasta"
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
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-fg-muted font-medium">
              <th className="text-left pb-3 pr-4">Fecha</th>
              <th className="text-left pb-3 pr-4">Tipo</th>
              <th className="text-left pb-3 pr-4">Descripción</th>
              <th className="text-left pb-3 pr-4">Cuenta</th>
              <th className="text-left pb-3 pr-4">Categoría</th>
              <th className="text-left pb-3 pr-4">Estado</th>
              <th className="text-right pb-3 pr-4">Monto</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading ? (
              <tr><td colSpan={8} className="py-12 text-center text-fg-muted text-sm">Cargando…</td></tr>
            ) : movements.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-fg-muted text-sm">Sin movimientos{hasActiveFilters ? ' con esos filtros' : ' aún'}.</td></tr>
            ) : movements.map(m => (
              <tr key={m.id} className={`group hover:bg-raised/50 transition-colors ${m.status === 'annulled' ? 'opacity-50' : ''}`}>
                <td className="py-3 pr-4 text-fg-muted whitespace-nowrap">
                  {new Date(m.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}
                </td>
                <td className="py-3 pr-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[m.type]}`}>
                    {TYPE_LABELS[m.type]}
                  </span>
                </td>
                <td className="py-3 pr-4 text-fg max-w-xs">
                  <p className="truncate">{m.description || '—'}</p>
                  {m.reference && <p className="text-xs text-fg-muted truncate">{m.reference}</p>}
                </td>
                <td className="py-3 pr-4 text-fg-muted">{m.account?.name ?? '—'}</td>
                <td className="py-3 pr-4 text-fg-muted">{m.category?.name ?? '—'}</td>
                <td className="py-3 pr-4">
                  <span className={`text-xs font-medium ${STATUS_COLORS[m.status]}`}>
                    {STATUS_LABELS[m.status]}
                  </span>
                </td>
                <td className={`py-3 pr-4 font-semibold text-right whitespace-nowrap ${m.type === 'income' || m.type === 'transfer_in' ? 'text-success' : 'text-danger'}`}>
                  {m.type === 'income' || m.type === 'transfer_in' ? '+' : '−'}${fmt(m.amount)}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    {m.status === 'pending' && (
                      <>
                        <button onClick={() => { setEditTarget(m); setMovementModal(m.type) }} className="p-1.5 text-fg-muted hover:text-fg rounded-lg hover:bg-raised transition-colors" title="Editar">
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleConfirm(m.id)} className="p-1.5 text-success hover:text-success rounded-lg hover:bg-success-subtle/20 transition-colors" title="Confirmar">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(m)} className="p-1.5 text-danger hover:text-danger rounded-lg hover:bg-danger-subtle/20 transition-colors" title="Eliminar">
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

      {/* Cards móvil */}
      <div className="flex flex-col gap-2 md:hidden">
        {isLoading ? (
          <p className="py-12 text-center text-fg-muted text-sm">Cargando…</p>
        ) : movements.length === 0 ? (
          <p className="py-12 text-center text-fg-muted text-sm">Sin movimientos{hasActiveFilters ? ' con esos filtros' : ' aún'}.</p>
        ) : movements.map(m => (
          <div key={m.id} className={`bg-surface border border-line rounded-xl px-4 py-3 flex flex-col gap-2 ${m.status === 'annulled' ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fg truncate">{m.description || TYPE_LABELS[m.type]}</p>
                <p className="text-xs text-fg-muted">
                  {m.account?.name} · {new Date(m.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className={`text-sm font-bold ${m.type === 'income' || m.type === 'transfer_in' ? 'text-success' : 'text-danger'}`}>
                  {m.type === 'income' || m.type === 'transfer_in' ? '+' : '−'}${fmt(m.amount)}
                </p>
                <span className={`text-xs font-medium ${STATUS_COLORS[m.status]}`}>{STATUS_LABELS[m.status]}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[m.type]}`}>
                  {TYPE_LABELS[m.type]}
                </span>
                {m.category && <span className="text-xs text-fg-muted">{m.category.name}</span>}
              </div>
              <div className="flex items-center gap-1">
                {m.status === 'pending' && (
                  <>
                    <button onClick={() => handleConfirm(m.id)} className="p-1.5 text-success rounded-lg hover:bg-success-subtle/20 transition-colors">
                      <CheckCircleIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(m)} className="p-1.5 text-danger rounded-lg hover:bg-danger-subtle/20 transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
                {m.status === 'confirmed' && !m.type.startsWith('transfer') && (
                  <button onClick={() => handleAnnul(m)} className="p-1.5 text-fg-muted rounded-lg hover:bg-raised transition-colors">
                    <XCircleIcon className="w-4 h-4" />
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
      {transferModal && (
        <TransferModal
          accounts={accounts}
          onClose={() => setTransferModal(false)}
          onSaved={() => { setTransferModal(false); invalidate() }}
        />
      )}
    </div>
  )
}
