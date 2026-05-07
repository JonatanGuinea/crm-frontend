import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircleIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline'
import { getInstallments, createInstallments, payInstallment, deleteInstallments } from '../api/installments'

const fmt = (n) => Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d) => new Date(d).toLocaleDateString('es-AR')

export default function InstallmentsPanel({ entityType, entityId, entityStatus, canWrite, currency }) {
  const qc = useQueryClient()
  const queryKey = ['installments', entityType, entityId]
  const entityParam = entityType === 'invoice' ? { invoiceId: entityId } : { quoteId: entityId }

  const [showForm, setShowForm] = useState(false)
  const [count, setCount] = useState(2)
  const [firstDueDate, setFirstDueDate] = useState('')
  const [formError, setFormError] = useState('')

  const { data: installments = [] } = useQuery({
    queryKey,
    queryFn: () => getInstallments(entityParam).then(r => r.data.data)
  })

  const createMut = useMutation({
    mutationFn: (data) => createInstallments(data),
    onSuccess: () => {
      qc.invalidateQueries(queryKey)
      qc.invalidateQueries([entityType, entityId])
      qc.invalidateQueries([entityType === 'invoice' ? 'invoices' : 'quotes'])
      setShowForm(false)
      setFormError('')
    },
    onError: (err) => setFormError(err.response?.data?.error || 'Error al crear el plan')
  })

  const payMut = useMutation({
    mutationFn: payInstallment,
    onSuccess: () => {
      qc.invalidateQueries(queryKey)
      qc.invalidateQueries([entityType, entityId])
      qc.invalidateQueries([entityType === 'invoice' ? 'invoices' : 'quotes'])
    }
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteInstallments(entityParam),
    onSuccess: () => {
      qc.invalidateQueries(queryKey)
      qc.invalidateQueries([entityType, entityId])
      qc.invalidateQueries([entityType === 'invoice' ? 'invoices' : 'quotes'])
    }
  })

  function handleCreate(e) {
    e.preventDefault()
    setFormError('')
    if (!firstDueDate) return setFormError('Seleccioná la fecha del primer vencimiento')
    createMut.mutate({ ...entityParam, count: parseInt(count), firstDueDate })
  }

  const canConfigure = canWrite && !['paid', 'cancelled', 'rejected', 'expired'].includes(entityStatus)
  const paidCount = installments.filter(i => i.status === 'paid').length
  const totalInstallments = installments.length

  const inputCls = "w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
  const labelCls = "block text-sm font-medium text-fg-soft mb-1"

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">Cuotas</h3>
          {totalInstallments > 0 && (
            <p className="text-xs text-fg-muted mt-0.5">{paidCount} de {totalInstallments} pagadas</p>
          )}
        </div>
        {canConfigure && (
          <div className="flex items-center gap-2">
            {totalInstallments > 0 && (
              <button
                onClick={() => { if (confirm('¿Eliminar el plan de cuotas?')) deleteMut.mutate() }}
                disabled={deleteMut.isPending}
                className="p-1.5 rounded-md text-fg-muted hover:text-danger hover:bg-danger-subtle transition-colors"
                title="Eliminar plan"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowForm(v => !v)}
              className="text-xs px-3 py-1.5 rounded-md bg-brand text-white hover:bg-brand-hover transition-colors"
            >
              {totalInstallments > 0 ? 'Reconfigurar' : 'Configurar cuotas'}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 p-4 bg-raised rounded-lg border border-line space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Número de cuotas</label>
              <input
                type="number"
                min="2"
                max="60"
                step="1"
                value={count}
                onChange={e => setCount(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Vencimiento 1ª cuota</label>
              <input
                type="date"
                value={firstDueDate}
                onChange={e => setFirstDueDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          {formError && <p className="text-xs text-danger">{formError}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError('') }}
              className="px-3 py-1.5 text-sm text-fg-soft hover:text-fg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMut.isPending}
              className="px-4 py-1.5 text-sm bg-brand text-white rounded-md hover:bg-brand-hover disabled:opacity-50"
            >
              {createMut.isPending ? 'Guardando...' : 'Crear plan'}
            </button>
          </div>
        </form>
      )}

      {totalInstallments === 0 && !showForm && (
        <p className="text-sm text-fg-muted text-center py-3">Sin plan de cuotas</p>
      )}

      {totalInstallments > 0 && (
        <ul className="space-y-2">
          {installments.map((inst) => {
            const isPaid = inst.status === 'paid'
            const isOverdue = !isPaid && new Date(inst.dueDate) < new Date()
            return (
              <li
                key={inst.id}
                className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm border ${
                  isPaid ? 'border-brand/20 bg-brand-subtle' : isOverdue ? 'border-danger/20 bg-danger-subtle' : 'border-line bg-raised'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isPaid
                    ? <CheckCircleIcon className="w-4 h-4 text-brand shrink-0" />
                    : <ClockIcon className={`w-4 h-4 shrink-0 ${isOverdue ? 'text-danger' : 'text-fg-muted'}`} />
                  }
                  <span className={`font-medium ${isPaid ? 'text-brand' : isOverdue ? 'text-danger' : 'text-fg'}`}>
                    Cuota {inst.number}
                  </span>
                  <span className={`text-xs ${isPaid ? 'text-brand' : isOverdue ? 'text-danger' : 'text-fg-muted'}`}>
                    · {fmtDate(inst.dueDate)}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`font-semibold ${isPaid ? 'text-brand' : isOverdue ? 'text-danger' : 'text-fg'}`}>
                    {currency} ${fmt(inst.amount)}
                  </span>
                  {!isPaid && canWrite && (
                    <button
                      onClick={() => payMut.mutate(inst.id)}
                      disabled={payMut.isPending}
                      className="text-xs px-2.5 py-1 rounded-md bg-brand text-white hover:bg-brand-hover disabled:opacity-50 transition-colors"
                    >
                      Cobrar
                    </button>
                  )}
                  {isPaid && inst.paidAt && (
                    <span className="text-xs text-brand">
                      Cobrada {fmtDate(inst.paidAt)}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
