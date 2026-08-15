import { useState } from 'react'
import { createTransfer } from '../../api/finances'
import { useToast } from '../../components/Toast'
import DatePicker from '../../components/DatePicker'
import { XMarkIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const inputCls = 'w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40'
const labelCls = 'text-xs font-medium text-fg-muted'

export default function TransferModal({ accounts, onClose, onSaved }) {
  const toast = useToast()

  const activeAccounts = accounts.filter(a => a.status !== 'inactive')

  const [form, setForm] = useState({
    fromAccountId: activeAccounts[0]?.id ?? '',
    toAccountId:   activeAccounts[1]?.id ?? '',
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl border border-line shadow-xl max-h-[92dvh] flex flex-col">

        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line shrink-0">
          <div className="flex items-center gap-2">
            <ArrowsRightLeftIcon className="w-5 h-5 text-fg-muted" />
            <h2 className="text-base font-semibold text-fg">Transferencia entre cuentas</h2>
          </div>
          <button onClick={onClose} className="text-fg-muted hover:text-fg transition-colors p-1">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">

          {/* Desde */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Desde</label>
            <select value={form.fromAccountId} onChange={e => set('fromAccountId', e.target.value)} className={inputCls}>
              {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Hacia */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Hacia</label>
            <select value={form.toAccountId} onChange={e => set('toAccountId', e.target.value)} className={inputCls}>
              {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Monto */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Monto</label>
            <div className="flex rounded-lg border border-line overflow-hidden focus-within:ring-2 focus-within:ring-brand/40">
              <span className="flex items-center px-3 border-r border-line bg-raised text-sm font-semibold text-fg-muted shrink-0">
                $
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                className="flex-1 min-w-0 bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Fecha */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Fecha</label>
            <DatePicker
              value={form.date}
              onChange={e => set('date', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Descripción <span className="font-normal text-fg-muted/70">(opcional)</span></label>
            <input
              type="text"
              placeholder="Ej: Pase a banco"
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
