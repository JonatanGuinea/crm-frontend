import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCashAccounts, createCashAccount, updateCashAccount, deleteCashAccount } from '../../api/finances'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import {
  ChevronLeftIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon,
  WalletIcon, BuildingLibraryIcon, DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline'

const fmt = (n) => Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ACCOUNT_TYPE_ICONS = {
  cash:    WalletIcon,
  bank:    BuildingLibraryIcon,
  virtual: DevicePhoneMobileIcon,
}
const ACCOUNT_TYPE_LABELS = { cash: 'Efectivo', bank: 'Cuenta bancaria', virtual: 'Billetera virtual' }
const CURRENCIES = ['ARS', 'USD', 'EUR', 'BRL']

function AccountModal({ account, onClose, onSaved }) {
  const toast = useToast()
  const isEdit = !!account
  const [form, setForm] = useState({
    name:           account?.name ?? '',
    type:           account?.type ?? 'cash',
    currency:       account?.currency ?? 'ARS',
    initialBalance: account?.initialBalance ?? 0,
    description:    account?.description ?? '',
    status:         account?.status ?? 'active',
  })
  const [saving, setSaving] = useState(false)

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast('Ingresá un nombre', 'error')
    setSaving(true)
    try {
      const payload = { ...form, initialBalance: Number(form.initialBalance) }
      if (isEdit) await updateCashAccount(account.id, payload)
      else        await createCashAccount(payload)
      onSaved()
    } catch (err) {
      toast(err.response?.data?.error || err.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl border border-line shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line">
          <h2 className="text-base font-semibold text-fg">{isEdit ? 'Editar cuenta' : 'Nueva cuenta'}</h2>
          <button onClick={onClose} className="text-fg-muted hover:text-fg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {/* Nombre */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">Nombre</label>
            <input
              type="text"
              placeholder="Ej: Caja principal, Cuenta Santander…"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40"
              required
              autoFocus
            />
          </div>

          {/* Tipo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">Tipo de cuenta</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, label]) => {
                const Icon = ACCOUNT_TYPE_ICONS[k]
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set('type', k)}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-medium transition-colors ${
                      form.type === k
                        ? 'border-brand bg-brand-subtle/20 text-brand'
                        : 'border-line text-fg-muted hover:text-fg hover:bg-raised'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Moneda */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted">Moneda</label>
              <select
                value={form.currency}
                onChange={e => set('currency', e.target.value)}
                className="w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Saldo inicial */}
            {!isEdit && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-fg-muted">Saldo inicial</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-fg-muted">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={form.initialBalance}
                    onChange={e => set('initialBalance', e.target.value)}
                    className="w-full rounded-lg border border-line bg-raised text-fg text-sm pl-7 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              </div>
            )}

            {/* Estado (solo edición) */}
            {isEdit && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-fg-muted">Estado</label>
                <select
                  value={form.status}
                  onChange={e => set('status', e.target.value)}
                  className="w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40"
                >
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                </select>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">Descripción (opcional)</label>
            <input
              type="text"
              placeholder="Ej: Cuenta para gastos corrientes"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>

          <div className="flex gap-3 pt-1 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-line text-sm font-medium text-fg-muted hover:text-fg hover:bg-raised transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AccountsPage() {
  const toast   = useToast()
  const confirm = useConfirm()
  const qc      = useQueryClient()

  const [modal, setModal] = useState(null)

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['cash-accounts'],
    queryFn: () => getCashAccounts().then(r => r.data.data),
  })

  function invalidate() { qc.invalidateQueries(['cash-accounts']); qc.invalidateQueries(['finances-dashboard']) }

  async function handleDelete(acc) {
    const ok = await confirm(
      `¿Eliminar "${acc.name}"? Solo se puede eliminar si no tiene movimientos asociados.`,
      { confirmLabel: 'Eliminar', danger: true }
    )
    if (!ok) return
    try {
      await deleteCashAccount(acc.id)
      toast('Cuenta eliminada', 'success')
      invalidate()
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error')
    }
  }

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link to="/finances" className="text-fg-muted hover:text-fg transition-colors">
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-fg">Cuentas</h1>
            <p className="text-xs text-fg-muted mt-0.5">{accounts.length} cuentas configuradas</p>
          </div>
        </div>
        <button
          onClick={() => setModal({ create: true })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <PlusIcon className="w-4 h-4" />
          Nueva cuenta
        </button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <p className="py-16 text-center text-fg-muted text-sm">Cargando…</p>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 border border-dashed border-line rounded-xl">
          <WalletIcon className="w-10 h-10 text-fg-muted/40" />
          <div className="text-center">
            <p className="text-sm font-medium text-fg">Sin cuentas aún</p>
            <p className="text-xs text-fg-muted mt-1">Creá tu primera cuenta para empezar a registrar movimientos.</p>
          </div>
          <button
            onClick={() => setModal({ create: true })}
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:opacity-90"
          >
            Crear primera cuenta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const Icon = ACCOUNT_TYPE_ICONS[acc.type] ?? WalletIcon
            const bal  = Number(acc.currentBalance)
            const isInactive = acc.status === 'inactive'
            return (
              <div
                key={acc.id}
                className={`bg-surface border rounded-xl p-5 flex flex-col gap-4 transition-opacity ${isInactive ? 'opacity-60 border-line' : 'border-line'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isInactive ? 'bg-raised' : 'bg-brand-subtle'}`}>
                      <Icon className={`w-5 h-5 ${isInactive ? 'text-fg-muted' : 'text-brand'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-fg">{acc.name}</p>
                      <p className="text-xs text-fg-muted capitalize">{ACCOUNT_TYPE_LABELS[acc.type]} · {acc.currency}</p>
                    </div>
                  </div>
                  {isInactive && (
                    <span className="text-xs font-medium text-fg-muted bg-raised px-2 py-0.5 rounded-full">Inactiva</span>
                  )}
                </div>

                <div>
                  <p className="text-xs text-fg-muted mb-0.5">Saldo actual</p>
                  <p className={`text-2xl font-bold ${bal >= 0 ? 'text-fg' : 'text-danger'}`}>
                    ${fmt(bal)}
                  </p>
                  {Number(acc.initialBalance) !== 0 && (
                    <p className="text-xs text-fg-muted mt-0.5">Inicial: ${fmt(acc.initialBalance)}</p>
                  )}
                </div>

                {acc.description && (
                  <p className="text-xs text-fg-muted">{acc.description}</p>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-line">
                  <button
                    onClick={() => setModal({ edit: acc })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-fg-muted hover:text-fg hover:bg-raised transition-colors"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(acc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-danger hover:bg-danger-subtle/20 transition-colors ml-auto"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(modal?.create || modal?.edit) && (
        <AccountModal
          account={modal.edit}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); invalidate() }}
        />
      )}
    </div>
  )
}
