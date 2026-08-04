import { useState } from 'react'
import { createTransfer } from '../../api/finances'
import { useToast } from '../../components/Toast'
import { XMarkIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'

const today = () => new Date().toISOString().slice(0, 10)

export default function TransferModal({ accounts, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    fromAccountId: accounts[0]?.id ?? '',
    toAccountId:   accounts[1]?.id ?? '',
    amount:        '',
    description:   '',
    date:          today(),
  })
  const [saving, setSaving] = useState(false)

  function set(field, val) { setForm(p => ({ ...p, [field]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.fromAccountId === form.toAccountId) return toast('Las cuentas deben ser distintas', 'error')
    if (!form.amount || Number(form.amount) <= 0) return toast('Ingresá un monto válido', 'error')
    setSaving(true)
    try {
      await createTransfer({ ...form, amount: Number(form.amount) })
      onSaved()
    } catch (err) {
      toast(err.response?.data?.error || err.message || 'Error al transferir', 'error')
    } finally {
      setSaving(false)
    }
  }

  const activeAccounts = accounts.filter(a => a.status !== 'inactive')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl border border-line shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line">
          <div className="flex items-center gap-2">
            <ArrowsRightLeftIcon className="w-5 h-5 text-fg-muted" />
            <h2 className="text-base font-semibold text-fg">Transferencia entre cuentas</h2>
          </div>
          <button onClick={onClose} className="text-fg-muted hover:text-fg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted">Desde</label>
              <select
                value={form.fromAccountId}
                onChange={e => set('fromAccountId', e.target.value)}
                className="w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                {activeAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted">Hacia</label>
              <select
                value={form.toAccountId}
                onChange={e => set('toAccountId', e.target.value)}
                className="w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                {activeAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-fg-muted">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                className="w-full rounded-lg border border-line bg-raised text-fg text-sm pl-7 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted">Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className="w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted">Descripción (opcional)</label>
              <input
                type="text"
                placeholder="Ej: Pase a banco"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className="w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
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
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Transfiriendo…' : 'Transferir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
