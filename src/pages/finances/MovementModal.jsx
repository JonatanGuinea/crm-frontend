import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createCashMovement, updateCashMovement, getFinancialCategories } from '../../api/finances'
import { useToast } from '../../components/Toast'
import { XMarkIcon } from '@heroicons/react/24/outline'

const today = () => new Date().toISOString().slice(0, 10)

export default function MovementModal({ defaultType = 'expense', movement, accounts, onClose, onSaved }) {
  const toast = useToast()
  const isEdit = !!movement

  const [form, setForm] = useState({
    type:        movement?.type ?? defaultType,
    accountId:   movement?.accountId ?? accounts[0]?.id ?? '',
    amount:      movement?.amount ?? '',
    description: movement?.description ?? '',
    date:        movement?.date ? movement.date.slice(0, 10) : today(),
    categoryId:  movement?.categoryId ?? '',
    reference:   movement?.reference ?? '',
  })
  const [saving, setSaving] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ['financial-categories', form.type],
    queryFn: () => getFinancialCategories({ type: form.type }).then(r => r.data.data),
  })

  function set(field, val) { setForm(p => ({ ...p, [field]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.accountId) return toast('Seleccioná una cuenta', 'error')
    if (!form.amount || Number(form.amount) <= 0) return toast('Ingresá un monto válido', 'error')
    setSaving(true)
    try {
      const payload = {
        ...form,
        amount:     Number(form.amount),
        categoryId: form.categoryId || undefined,
        reference:  form.reference || undefined,
      }
      if (isEdit) await updateCashMovement(movement.id, payload)
      else        await createCashMovement(payload)
      onSaved()
    } catch (err) {
      toast(err.response?.data?.error || err.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const typeLabel = form.type === 'income' ? 'Ingreso' : 'Egreso'
  const accentColor = form.type === 'income' ? 'text-success' : 'text-danger'
  const btnColor = form.type === 'income' ? 'bg-success hover:opacity-90' : 'bg-danger hover:opacity-90'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl border border-line shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-fg">{isEdit ? `Editar ${typeLabel}` : `Nuevo ${typeLabel}`}</h2>
            {!isEdit && (
              <div className="flex rounded-lg overflow-hidden border border-line text-xs font-medium">
                <button
                  type="button"
                  onClick={() => set('type', 'income')}
                  className={`px-3 py-1 transition-colors ${form.type === 'income' ? 'bg-success text-white' : 'text-fg-muted hover:text-fg'}`}
                >Ingreso</button>
                <button
                  type="button"
                  onClick={() => set('type', 'expense')}
                  className={`px-3 py-1 transition-colors ${form.type === 'expense' ? 'bg-danger text-white' : 'text-fg-muted hover:text-fg'}`}
                >Egreso</button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-fg-muted hover:text-fg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {/* Cuenta */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">Cuenta</label>
            <select
              value={form.accountId}
              onChange={e => set('accountId', e.target.value)}
              className="w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Monto */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">Monto</label>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold ${accentColor}`}>$</span>
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
            {/* Fecha */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted">Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className="w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>

            {/* Categoría */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted">Categoría</label>
              <select
                value={form.categoryId}
                onChange={e => set('categoryId', e.target.value)}
                className="w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                <option value="">Sin categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">Descripción</label>
            <input
              type="text"
              placeholder="Ej: Compra de materiales"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>

          {/* Referencia */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">Referencia (opcional)</label>
            <input
              type="text"
              placeholder="N° de factura, recibo…"
              value={form.reference}
              onChange={e => set('reference', e.target.value)}
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
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50 ${btnColor}`}
            >
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : `Registrar ${typeLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
