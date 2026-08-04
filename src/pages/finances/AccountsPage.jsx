import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCashAccounts, createCashAccount, updateCashAccount, deleteCashAccount, setDefaultCashAccount } from '../../api/finances'
import TransferModal from './TransferModal'
import { getOrganizations } from '../../api/organizations'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { useAuth } from '../../context/AuthContext'
import {
  ChevronLeftIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon,
  WalletIcon, BuildingLibraryIcon, DevicePhoneMobileIcon, ArrowsRightLeftIcon, StarIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

const fmt = (n) => Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ACCOUNT_TYPE_ICONS  = { cash: WalletIcon, bank: BuildingLibraryIcon, virtual: DevicePhoneMobileIcon }
const ACCOUNT_TYPE_LABELS = { cash: 'Efectivo', bank: 'Cuenta bancaria', virtual: 'Billetera virtual' }

const inputCls = 'w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40'
const labelCls = 'text-xs font-medium text-fg-muted'

function AccountModal({ account, currency, onClose, onSaved }) {
  const toast  = useToast()
  const isEdit = !!account
  const [form, setForm] = useState({
    name:           account?.name ?? '',
    type:           account?.type ?? 'cash',
    currency,
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
      <div className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl border border-line shadow-xl max-h-[92dvh] flex flex-col">

        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line shrink-0">
          <h2 className="text-base font-semibold text-fg">{isEdit ? 'Editar cuenta' : 'Nueva cuenta'}</h2>
          <button onClick={onClose} className="text-fg-muted hover:text-fg transition-colors p-1">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">

          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Nombre</label>
            <input
              type="text"
              placeholder="Ej: Caja principal, Cuenta Santander…"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className={inputCls}
              required
              autoFocus
            />
          </div>

          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Tipo de cuenta</label>
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

          {/* Saldo inicial (solo creación) */}
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Saldo inicial</label>
              <div className="flex rounded-lg border border-line overflow-hidden focus-within:ring-2 focus-within:ring-brand/40">
                <span className="flex items-center px-3 bg-raised border-r border-line text-xs font-medium text-fg-muted shrink-0">
                  {currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={form.initialBalance}
                  onChange={e => set('initialBalance', e.target.value)}
                  className="flex-1 min-w-0 bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Estado (solo edición) */}
          {isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Estado</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
            </div>
          )}

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Descripción <span className="font-normal text-fg-muted/70">(opcional)</span></label>
            <input
              type="text"
              placeholder="Ej: Cuenta para gastos corrientes"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className={inputCls}
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
  const { user } = useAuth()
  const [modal,         setModal]         = useState(null)
  const [transferModal, setTransferModal] = useState(false)

  const { data: orgData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations().then(r => r.data.data?.find(o => o.id === user?.organizationId)),
  })
  const orgCurrency  = orgData?.defaultCurrency      ?? 'ARS'
  const defaultAccId = orgData?.defaultCashAccountId ?? null

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['cash-accounts'],
    queryFn: () => getCashAccounts().then(r => r.data.data),
  })

  function invalidate() {
    qc.invalidateQueries(['cash-accounts'])
    qc.invalidateQueries(['finances-dashboard'])
    qc.invalidateQueries(['organizations'])
  }

  async function handleSetDefault(acc) {
    try {
      await setDefaultCashAccount(acc.id)
      toast(`"${acc.name}" es ahora la cuenta predeterminada`, 'success')
      invalidate()
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error')
    }
  }

  async function handleDelete(acc) {
    const ok = await confirm(
      `¿Eliminar "${acc.name}"? Solo se puede si no tiene movimientos asociados.`,
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
    <div className="p-4 md:p-8 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/finances" className="text-fg-muted hover:text-fg transition-colors shrink-0">
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-fg">Cuentas</h1>
            <p className="text-xs text-fg-muted mt-0.5">{accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} configurada{accounts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setTransferModal(true)}
            disabled={accounts.length < 2}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-surface text-sm font-medium text-fg-muted hover:bg-raised hover:text-fg transition-colors disabled:opacity-40"
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Transferir</span>
          </button>
          <button
            onClick={() => setModal({ create: true })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva cuenta</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>
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
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90"
          >
            Crear primera cuenta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const Icon       = ACCOUNT_TYPE_ICONS[acc.type] ?? WalletIcon
            const bal        = Number(acc.currentBalance)
            const isInactive = acc.status === 'inactive'
            return (
              <div
                key={acc.id}
                className={`bg-surface border border-line rounded-2xl p-5 flex flex-col gap-5 ${isInactive ? 'opacity-60' : ''}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isInactive ? 'bg-raised' : 'bg-brand-subtle'}`}>
                      <Icon className={`w-5 h-5 ${isInactive ? 'text-fg-muted' : 'text-brand'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-fg truncate">{acc.name}</p>
                      <p className="text-xs text-fg-muted capitalize">{ACCOUNT_TYPE_LABELS[acc.type]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {defaultAccId === acc.id
                      ? <span className="flex items-center gap-1 text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                          <StarSolidIcon className="w-3 h-3 text-warning" /> Predeterminada
                        </span>
                      : <button
                          onClick={() => handleSetDefault(acc)}
                          title="Establecer como predeterminada"
                          className="text-fg-muted hover:text-warning transition-colors p-0.5"
                        >
                          <StarIcon className="w-4 h-4" />
                        </button>
                    }
                    {isInactive && (
                      <span className="text-xs font-medium text-fg-muted bg-raised px-2 py-0.5 rounded-full">Inactiva</span>
                    )}
                  </div>
                </div>

                {/* Saldo */}
                <div className="px-4 py-3 rounded-xl bg-raised/60 border border-line/50">
                  <p className="text-xs text-fg-muted mb-1">Saldo actual</p>
                  <p className={`text-2xl font-bold tracking-tight ${bal >= 0 ? 'text-fg' : 'text-danger'}`}>
                    ${fmt(bal)}
                  </p>
                  {Number(acc.initialBalance) !== 0 && (
                    <p className="text-xs text-fg-muted mt-1">Inicial: ${fmt(acc.initialBalance)}</p>
                  )}
                </div>

                {acc.description && (
                  <p className="text-xs text-fg-muted -mt-2">{acc.description}</p>
                )}

                {/* Acciones */}
                <div className="flex items-center gap-2 pt-1 border-t border-line">
                  <button
                    onClick={() => setModal({ edit: acc })}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-fg-muted border border-line hover:text-fg hover:bg-raised transition-colors"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(acc)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-danger border border-danger/20 hover:bg-danger-subtle/20 transition-colors ml-auto"
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
          currency={orgCurrency}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); invalidate() }}
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
