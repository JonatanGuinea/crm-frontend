import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createCashMovement, updateCashMovement, getFinancialCategories } from '../../api/finances'
import { useToast } from '../../components/Toast'
import DatePicker from '../../components/DatePicker'
import { XMarkIcon } from '@heroicons/react/24/outline'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const isFuture = (dateStr) => {
  const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0)
  return new Date(dateStr + 'T00:00:00') > todayMid
}

const inputCls = 'w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40'
const labelCls = 'text-xs font-medium text-fg-muted'

export default function MovementModal({ defaultType = 'expense', movement, accounts, onClose, onSaved }) {
  const toast = useToast()
  const qc    = useQueryClient()
  const isEdit = !!movement

  const [form, setForm] = useState({
    type:        movement?.type ?? defaultType,
    accountId:   movement?.accountId ?? accounts[0]?.id ?? '',
    amount:      movement?.amount ?? '',
    description: movement?.description ?? '',
    date:        movement?.date ? movement.date.slice(0, 10) : today(),
    categoryId:  movement?.categoryId ?? '',
    reference:   movement?.reference ?? '',
    pending:     movement?.status === 'pending' ? true : false,
  })
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    setForm(p => ({ ...p, categoryId: '' }))
  }, [form.type])

  useEffect(() => {
    if (!isEdit) setForm(p => ({ ...p, pending: isFuture(p.date) }))
  }, [form.date]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: categories = [], isLoading: catsLoading } = useQuery({
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
        reference:  form.reference  || undefined,
        status:     form.pending ? 'pending' : undefined,
      }
      delete payload.pending
      if (isEdit) await updateCashMovement(movement.id, payload)
      else        await createCashMovement(payload)
      onSaved()
    } catch (err) {
      toast(err.response?.data?.error || err.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const isIncome  = form.type === 'income'
  const typeLabel = isIncome ? 'Ingreso' : 'Egreso'
  const accentVar = isIncome ? '--brand-green' : '--brand-red'
  const btnClass  = isIncome ? 'bg-success text-white hover:opacity-90' : 'bg-danger text-white hover:opacity-90'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl border border-line shadow-xl max-h-[92dvh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-fg">
              {isEdit ? `Editar ${typeLabel}` : `Nuevo ${typeLabel}`}
            </h2>
            {!isEdit && (
              <div className="flex rounded-lg overflow-hidden border border-line text-xs font-medium">
                <button
                  type="button"
                  onClick={() => set('type', 'income')}
                  className={`px-3 py-1.5 transition-colors ${isIncome ? 'bg-success text-white' : 'text-fg-muted hover:text-fg'}`}
                >
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => set('type', 'expense')}
                  className={`px-3 py-1.5 transition-colors ${!isIncome ? 'bg-danger text-white' : 'text-fg-muted hover:text-fg'}`}
                >
                  Egreso
                </button>
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-fg-muted hover:text-fg transition-colors p-1">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">

          {/* Cuenta */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Cuenta</label>
            <select value={form.accountId} onChange={e => set('accountId', e.target.value)} className={inputCls}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Monto */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Monto</label>
            <div className="flex rounded-lg border border-line overflow-hidden focus-within:ring-2 focus-within:ring-brand/40">
              <span
                className="flex items-center px-3 border-r border-line bg-raised text-sm font-semibold shrink-0"
                style={{ color: `var(${accentVar})` }}
              >
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

          {/* Categoría */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Categoría</label>
            <select
              value={form.categoryId}
              onChange={e => set('categoryId', e.target.value)}
              className={inputCls}
              disabled={catsLoading}
            >
              <option value="">{catsLoading ? 'Cargando…' : 'Sin categoría'}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Descripción</label>
            <input
              type="text"
              placeholder={isIncome ? 'Ej: Cobro cliente, venta…' : 'Ej: Compra de materiales…'}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Referencia */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>
              Referencia <span className="font-normal text-fg-muted/70">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="N° de factura, recibo…"
              value={form.reference}
              onChange={e => set('reference', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Pendiente */}
          <button
            type="button"
            onClick={() => set('pending', !form.pending)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
              form.pending
                ? 'border-warning bg-warning/5'
                : 'border-line text-fg-muted hover:bg-raised'
            }`}
          >
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${form.pending ? 'text-warning' : 'text-fg'}`}>
                  {isIncome ? 'Ingreso pendiente' : 'Egreso pendiente'}
                </p>
                {form.pending && isFuture(form.date) && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-warning/15 text-warning px-1.5 py-0.5 rounded-full">
                    Fecha futura
                  </span>
                )}
              </div>
              <p className="text-xs text-fg-muted mt-0.5">
                {form.pending
                  ? 'No afecta el saldo hasta confirmar'
                  : 'Afecta el saldo al registrar'}
              </p>
            </div>
            <div className={`w-10 h-5.5 rounded-full transition-colors relative shrink-0 ${form.pending ? 'bg-warning' : 'bg-line'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.pending ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>

          {/* Acciones */}
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
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 ${btnClass}`}
            >
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : form.pending ? 'Registrar como pendiente' : `Registrar ${typeLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
