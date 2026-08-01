import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircleIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline'
import { getInstallments, createInstallments, createCustomInstallments, payInstallment, deleteInstallments } from '../api/installments'
import DatePicker from './DatePicker'
import { useConfirm } from './ConfirmDialog'

const fmt = (n) => Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d) => new Date(d).toLocaleDateString('es-AR')

const inputCls = "w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
const labelCls = "block text-sm font-medium text-fg-soft mb-1"

export default function InstallmentsPanel({ entityType, entityId, entityStatus, canWrite, currency, total = 0 }) {
  const qc = useQueryClient()
  const confirm = useConfirm()
  const queryKey = ['installments', entityType, entityId]
  const entityParam = { quoteId: entityId }

  // ── cuotas iguales ────────────────────────────────────────────────────────
  const [showForm, setShowForm]         = useState(false)
  const [count, setCount]               = useState(2)
  const [firstDueDate, setFirstDueDate] = useState('')
  const [formError, setFormError]       = useState('')

  // ── anticipo ──────────────────────────────────────────────────────────────
  const [showAnticipo, setShowAnticipo]           = useState(false)
  const [dpMode, setDpMode]                       = useState('amount')   // 'amount' | 'percent'
  const [dpAmount, setDpAmount]                   = useState('')
  const [dpPercent, setDpPercent]                 = useState('')
  const [dpDate, setDpDate]                       = useState('')
  const [remainderType, setRemainderType]         = useState('second')   // 'second' | 'installments'
  const [secondDate, setSecondDate]               = useState('')
  const [antInstallCount, setAntInstallCount]     = useState(2)
  const [antInstallFirst, setAntInstallFirst]     = useState('')
  const [anticoError, setAnticoError]             = useState('')

  const effectiveDp = dpMode === 'amount'
    ? parseFloat(dpAmount) || 0
    : parseFloat((total * (parseFloat(dpPercent) || 0) / 100).toFixed(2))

  // ── queries / mutations ───────────────────────────────────────────────────
  const { data: installments = [] } = useQuery({
    queryKey,
    queryFn: () => getInstallments(entityParam).then(r => r.data.data)
  })

  const createMut = useMutation({
    mutationFn: (data) => createInstallments(data),
    onSuccess: () => {
      qc.invalidateQueries(queryKey)
      qc.invalidateQueries([entityType, entityId])
      qc.invalidateQueries(['quotes'])
      setShowForm(false)
      setFormError('')
    },
    onError: (err) => setFormError(err.response?.data?.error || 'Error al crear el plan')
  })

  const createCustomMut = useMutation({
    mutationFn: (data) => createCustomInstallments(data),
    onSuccess: () => {
      qc.invalidateQueries(queryKey)
      qc.invalidateQueries([entityType, entityId])
      qc.invalidateQueries(['quotes'])
      setShowAnticipo(false)
      setAnticoError('')
    },
    onError: (err) => setAnticoError(err.response?.data?.error || 'Error al crear el plan')
  })

  const payMut = useMutation({
    mutationFn: payInstallment,
    onSuccess: () => {
      qc.invalidateQueries(queryKey)
      qc.invalidateQueries([entityType, entityId])
      qc.invalidateQueries(['quotes'])
    }
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteInstallments(entityParam),
    onSuccess: () => {
      qc.invalidateQueries(queryKey)
      qc.invalidateQueries([entityType, entityId])
      qc.invalidateQueries(['quotes'])
    }
  })

  // ── handlers ──────────────────────────────────────────────────────────────
  function handleCreateEqual(e) {
    e.preventDefault()
    setFormError('')
    if (!firstDueDate) return setFormError('Seleccioná la fecha del primer vencimiento')
    createMut.mutate({ ...entityParam, count: parseInt(count), firstDueDate })
  }

  function handleCreateAnticipo(e) {
    e.preventDefault()
    setAnticoError('')
    if (!effectiveDp || effectiveDp <= 0) return setAnticoError('Ingresá el monto del anticipo')
    if (!dpDate)                           return setAnticoError('Ingresá la fecha del anticipo')
    if (effectiveDp >= total)              return setAnticoError('El anticipo no puede ser igual o mayor al total')
    if (remainderType === 'second') {
      if (!secondDate) return setAnticoError('Ingresá la fecha del segundo pago')
      if (dpDate >= secondDate) return setAnticoError('El segundo pago debe ser posterior al anticipo')
    } else {
      if (!antInstallFirst) return setAnticoError('Seleccioná la fecha de la primera cuota')
      if (dpDate >= antInstallFirst) return setAnticoError('La primera cuota debe ser posterior al anticipo')
    }

    const remaining = parseFloat((total - effectiveDp).toFixed(2))
    const payments  = [{ amount: effectiveDp, dueDate: dpDate }]

    if (remainderType === 'second') {
      payments.push({ amount: remaining, dueDate: secondDate })
    } else {
      const n         = parseInt(antInstallCount)
      const perInstall = parseFloat((remaining / n).toFixed(2))
      const diff       = parseFloat((remaining - perInstall * n).toFixed(2))
      for (let i = 0; i < n; i++) {
        const d = new Date(antInstallFirst)
        d.setMonth(d.getMonth() + i)
        payments.push({
          amount:  i === n - 1 ? parseFloat((perInstall + diff).toFixed(2)) : perInstall,
          dueDate: d.toISOString().slice(0, 10)
        })
      }
    }

    createCustomMut.mutate({ quoteId: entityId, payments })
  }

  function closeAnticipo() {
    setShowAnticipo(false)
    setAnticoError('')
    setDpAmount(''); setDpPercent(''); setDpDate('')
    setSecondDate(''); setAntInstallFirst('')
  }

  // ── derived ───────────────────────────────────────────────────────────────
  const canConfigure    = canWrite && !['paid', 'cancelled', 'rejected', 'expired'].includes(entityStatus)
  const paidCount       = installments.filter(i => i.status === 'paid').length
  const totalInstall    = installments.length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">Cuotas</h3>
          {totalInstall > 0 && (
            <p className="text-xs text-fg-muted mt-0.5">{paidCount} de {totalInstall} pagadas</p>
          )}
        </div>
        {canConfigure && totalInstall > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={async () => { if (await confirm('¿Eliminar el plan de cuotas?')) deleteMut.mutate() }}
              disabled={deleteMut.isPending}
              className="p-1.5 rounded-md text-fg-muted hover:text-danger hover:bg-danger-subtle transition-colors"
              title="Eliminar plan"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowForm(v => !v); setShowAnticipo(false) }}
              className="text-xs px-3 py-1.5 rounded-md bg-brand text-white hover:bg-brand-hover transition-colors"
            >
              Reconfigurar
            </button>
          </div>
        )}
      </div>

      {/* Sin cuotas: mostrar opciones */}
      {totalInstall === 0 && !showForm && !showAnticipo && canConfigure && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowForm(true)}
            className="flex-1 py-2 text-xs font-medium rounded-md border border-line text-fg-soft hover:bg-raised transition-colors"
          >
            Cuotas iguales
          </button>
          <button
            onClick={() => setShowAnticipo(true)}
            className="flex-1 py-2 text-xs font-medium rounded-md border border-line text-fg-soft hover:bg-raised transition-colors"
          >
            Con anticipo
          </button>
        </div>
      )}

      {/* Sin cuotas y no puede configurar */}
      {totalInstall === 0 && !showForm && !showAnticipo && !canConfigure && (
        <p className="text-sm text-fg-muted text-center py-3">Sin plan de cuotas</p>
      )}

      {/* Formulario cuotas iguales */}
      {showForm && (
        <form onSubmit={handleCreateEqual} className="mb-4 p-4 bg-raised rounded-lg border border-line space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Número de cuotas</label>
              <input type="number" min="2" max="60" step="1" value={count}
                onChange={e => setCount(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Vencimiento 1ª cuota</label>
              <DatePicker value={firstDueDate}
                onChange={e => setFirstDueDate(e.target.value)} className={inputCls} />
            </div>
          </div>
          {formError && <p className="text-xs text-danger">{formError}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowForm(false); setFormError('') }}
              className="px-3 py-1.5 text-sm text-fg-soft hover:text-fg">
              Cancelar
            </button>
            <button type="submit" disabled={createMut.isPending}
              className="px-4 py-1.5 text-sm bg-brand text-white rounded-md hover:bg-brand-hover disabled:opacity-50">
              {createMut.isPending ? 'Guardando...' : 'Crear plan'}
            </button>
          </div>
        </form>
      )}

      {/* Formulario anticipo */}
      {showAnticipo && (
        <form onSubmit={handleCreateAnticipo} className="mb-4 p-4 bg-raised rounded-lg border border-line space-y-3">

          {/* Anticipo + fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls + ' mb-0'}>Anticipo</label>
                <div className="flex rounded-md overflow-hidden border border-line text-xs">
                  <button type="button" onClick={() => setDpMode('amount')}
                    className={`px-2 py-0.5 font-medium transition-colors ${dpMode === 'amount' ? 'bg-brand text-white' : 'bg-surface text-fg-soft hover:bg-raised'}`}>
                    Monto
                  </button>
                  <button type="button" onClick={() => setDpMode('percent')}
                    className={`px-2 py-0.5 font-medium transition-colors ${dpMode === 'percent' ? 'bg-brand text-white' : 'bg-surface text-fg-soft hover:bg-raised'}`}>
                    %
                  </button>
                </div>
              </div>
              {dpMode === 'amount' ? (
                <input type="number" min="0" step="0.01" value={dpAmount}
                  onChange={e => setDpAmount(e.target.value)}
                  className={inputCls} placeholder="0.00" />
              ) : (
                <div>
                  <div className="relative">
                    <input type="number" min="0" max="100" step="1" value={dpPercent}
                      onChange={e => setDpPercent(e.target.value)}
                      className={inputCls + ' pr-7'} placeholder="0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-fg-muted pointer-events-none">%</span>
                  </div>
                  {parseFloat(dpPercent) > 0 && total > 0 && (
                    <p className="text-xs text-fg-muted mt-1">
                      = {currency} {fmt(effectiveDp)}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Fecha del anticipo</label>
              <DatePicker value={dpDate} onChange={e => setDpDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Saldo restante */}
          {effectiveDp > 0 && effectiveDp < total && (
            <p className="text-xs text-fg-muted">
              Saldo restante: <span className="font-semibold text-fg">
                {currency} {fmt(total - effectiveDp)}
              </span>
            </p>
          )}

          {/* Tipo de saldo */}
          <div>
            <p className="text-xs font-medium text-fg-soft mb-2">Saldo restante</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setRemainderType('second')}
                className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${remainderType === 'second' ? 'border-brand bg-brand-subtle text-brand' : 'border-line text-fg-soft hover:bg-raised'}`}>
                Segundo pago
              </button>
              <button type="button" onClick={() => setRemainderType('installments')}
                className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${remainderType === 'installments' ? 'border-brand bg-brand-subtle text-brand' : 'border-line text-fg-soft hover:bg-raised'}`}>
                En cuotas
              </button>
            </div>
          </div>

          {remainderType === 'second' && (
            <div>
              <label className={labelCls}>Fecha del segundo pago</label>
              <DatePicker value={secondDate} onChange={e => setSecondDate(e.target.value)} className={inputCls} />
              {secondDate && dpDate && dpDate >= secondDate && (
                <p className="text-xs text-danger mt-1">Debe ser posterior al anticipo</p>
              )}
            </div>
          )}

          {remainderType === 'installments' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Número de cuotas</label>
                <input type="number" min="2" max="60" step="1" value={antInstallCount}
                  onChange={e => setAntInstallCount(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Vencimiento 1ª cuota</label>
                <DatePicker value={antInstallFirst} onChange={e => setAntInstallFirst(e.target.value)} className={inputCls} />
                {antInstallFirst && dpDate && dpDate >= antInstallFirst && (
                  <p className="text-xs text-danger mt-1">Debe ser posterior al anticipo</p>
                )}
              </div>
            </div>
          )}

          {anticoError && <p className="text-xs text-danger">{anticoError}</p>}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={closeAnticipo}
              className="px-3 py-1.5 text-sm text-fg-soft hover:text-fg">
              Cancelar
            </button>
            <button type="submit" disabled={createCustomMut.isPending}
              className="px-4 py-1.5 text-sm bg-brand text-white rounded-md hover:bg-brand-hover disabled:opacity-50">
              {createCustomMut.isPending ? 'Guardando...' : 'Crear plan'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de cuotas */}
      {totalInstall > 0 && (
        <ul className="space-y-2">
          {installments.map((inst) => {
            const isPaid    = inst.status === 'paid'
            const isOverdue = !isPaid && new Date(inst.dueDate) < new Date()
            const accent    = isPaid ? 'text-brand' : isOverdue ? 'text-danger' : 'text-fg'
            const bg        = isPaid ? 'border-brand/20 bg-brand-subtle' : isOverdue ? 'border-danger/20 bg-danger-subtle' : 'border-line bg-raised'
            return (
              <li key={inst.id} className={`rounded-lg px-3 py-2.5 border ${bg}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isPaid
                      ? <CheckCircleIcon className="w-4 h-4 text-brand shrink-0" />
                      : <ClockIcon className={`w-4 h-4 shrink-0 ${isOverdue ? 'text-danger' : 'text-fg-muted'}`} />
                    }
                    <span className={`text-sm font-medium ${accent}`}>Cuota {inst.number}</span>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${accent}`}>
                    {currency} ${fmt(inst.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1.5 pl-6">
                  <span className={`text-xs ${isPaid ? 'text-brand' : isOverdue ? 'text-danger' : 'text-fg-muted'}`}>
                    {isPaid && inst.paidAt
                      ? `Cobrada ${fmtDate(inst.paidAt)}`
                      : `Vence ${fmtDate(inst.dueDate)}`}
                  </span>
                  {!isPaid && canWrite && (
                    <button
                      onClick={() => payMut.mutate(inst.id)}
                      disabled={payMut.isPending}
                      className="text-xs px-2.5 py-1 rounded-md bg-brand text-white hover:bg-brand-hover disabled:opacity-50 transition-colors shrink-0"
                    >
                      Cobrar
                    </button>
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
