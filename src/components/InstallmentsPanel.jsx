import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInstallments, createInstallments, createCustomInstallments, payInstallment, deleteInstallments } from '../api/installments'
import DatePicker from './DatePicker'
import { useConfirm } from './ConfirmDialog'
import { fmt } from '../utils/fmt'

// ── tokens ────────────────────────────────────────────────────────────────────

const C = {
  bg:    '#0B0B0C',
  s1:    '#141415',
  s2:    '#1E1E20',
  s3:    '#26262A',
  linea: '#2C2C2F',
  crema: '#F2EDE3',
  arena: '#B9B4AA',
  piedra:'#8C877E',
  ok:    '#7DBE93',
  warn:  '#E2B663',
  err:   '#E58373',
  info:  '#8EB1DE',
}

const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"

const SECTION_TITLE = {
  fontSize: 10.5, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  color: C.arena, margin: 0,
}

const labelStyle = { fontSize: 12, fontWeight: 500, color: C.arena, marginBottom: 6, display: 'block' }

const inputStyle = {
  width: '100%', height: 36, padding: '0 12px',
  background: C.bg, border: `1px solid ${C.linea}`,
  borderRadius: '0 9px 9px 0',
  color: C.crema, fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
}

// ── utils ─────────────────────────────────────────────────────────────────────

const fmtDate = (d) => new Date(String(d).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR')

// ── icons ─────────────────────────────────────────────────────────────────────

function CheckCircleSvg({ color }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 15, height: 15, color, flexShrink: 0 }}>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  )
}

function ClockSvg({ color }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 15, height: 15, color, flexShrink: 0 }}>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
  )
}

function TrashSvg() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
}

// ── component ─────────────────────────────────────────────────────────────────

export default function InstallmentsPanel({ entityType, entityId, entityStatus, canWrite, currency, total = 0 }) {
  const qc      = useQueryClient()
  const confirm = useConfirm()
  const queryKey   = ['installments', entityType, entityId]
  const entityParam = { quoteId: entityId }

  const [showForm, setShowForm]         = useState(false)
  const [count, setCount]               = useState(2)
  const [firstDueDate, setFirstDueDate] = useState('')
  const [formError, setFormError]       = useState('')

  const [showAnticipo, setShowAnticipo]       = useState(false)
  const [dpMode, setDpMode]                   = useState('amount')
  const [dpAmount, setDpAmount]               = useState('')
  const [dpPercent, setDpPercent]             = useState('')
  const [dpDate, setDpDate]                   = useState('')
  const [remainderType, setRemainderType]     = useState('second')
  const [secondDate, setSecondDate]           = useState('')
  const [antInstallCount, setAntInstallCount] = useState(2)
  const [antInstallFirst, setAntInstallFirst] = useState('')
  const [anticoError, setAnticoError]         = useState('')

  const effectiveDp = dpMode === 'amount'
    ? parseFloat(dpAmount) || 0
    : parseFloat((total * (parseFloat(dpPercent) || 0) / 100).toFixed(2))

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
      setShowForm(false); setFormError('')
    },
    onError: (err) => setFormError(err.response?.data?.error || err.message || 'Error al crear el plan')
  })

  const createCustomMut = useMutation({
    mutationFn: (data) => createCustomInstallments(data),
    onSuccess: () => {
      qc.invalidateQueries(queryKey)
      qc.invalidateQueries([entityType, entityId])
      qc.invalidateQueries(['quotes'])
      setShowAnticipo(false); setAnticoError('')
    },
    onError: (err) => setAnticoError(err.response?.data?.error || err.message || 'Error al crear el plan')
  })

  const payMut = useMutation({
    mutationFn: payInstallment,
    onSuccess: () => {
      qc.invalidateQueries(queryKey)
      qc.invalidateQueries([entityType, entityId])
      qc.invalidateQueries(['quotes'])
      qc.invalidateQueries(['cash-movements'])
      qc.invalidateQueries(['finances-dashboard'])
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

  function handleCreateEqual(e) {
    e.preventDefault()
    setFormError('')
    if (!firstDueDate) return setFormError('Seleccioná la fecha del primer vencimiento')
    createMut.mutate({ ...entityParam, count: parseInt(count), firstDueDate })
  }

  function handleCreateAnticipo(e) {
    e.preventDefault()
    setAnticoError('')
    if (dpMode === 'percent' && (!total || total <= 0)) return setAnticoError('El presupuesto no tiene monto total. Agregá ítems con precio antes de usar el modo porcentual.')
    if (!effectiveDp || effectiveDp <= 0) return setAnticoError(dpMode === 'percent' ? 'El porcentaje ingresado da monto $0. Revisá el total del presupuesto.' : 'Ingresá el monto del anticipo')
    if (!dpDate)           return setAnticoError('Ingresá la fecha del anticipo')
    if (effectiveDp >= total) return setAnticoError('El anticipo no puede ser igual o mayor al total')
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
      const n = parseInt(antInstallCount)
      const perInstall = parseFloat((remaining / n).toFixed(2))
      const diff = parseFloat((remaining - perInstall * n).toFixed(2))
      for (let i = 0; i < n; i++) {
        const d = new Date(antInstallFirst)
        d.setMonth(d.getMonth() + i)
        payments.push({
          amount: i === n - 1 ? parseFloat((perInstall + diff).toFixed(2)) : perInstall,
          dueDate: d.toISOString().slice(0, 10)
        })
      }
    }

    createCustomMut.mutate({ quoteId: entityId, payments })
  }

  function closeAnticipo() {
    setShowAnticipo(false); setAnticoError('')
    setDpAmount(''); setDpPercent(''); setDpDate('')
    setSecondDate(''); setAntInstallFirst('')
  }

  const canConfigure = canWrite && !['paid', 'cancelled', 'rejected', 'expired'].includes(entityStatus)
  const paidCount    = installments.filter(i => i.status === 'paid').length
  const totalInstall = installments.length

  // DatePicker className (only accepts className prop)
  const dpCls = "h-[36px] w-full px-3 bg-[#0B0B0C] border border-[#2C2C2F] rounded-[0_9px_9px_0] text-[#F2EDE3] text-[13px] outline-none focus:border-[#B9B4AA] font-[inherit]"

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={SECTION_TITLE}>Cuotas</p>
          {totalInstall > 0 && (
            <p style={{ fontSize: 11, color: C.piedra, marginTop: 3 }}>{paidCount} de {totalInstall} pagadas</p>
          )}
        </div>
        {canConfigure && totalInstall > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={async () => { if (await confirm('¿Eliminar el plan de cuotas?')) deleteMut.mutate() }}
              disabled={deleteMut.isPending}
              title="Eliminar plan"
              style={{
                padding: 6, background: 'none', border: 'none',
                borderRadius: '0 6px 6px 0', cursor: 'pointer',
                color: C.piedra, transition: 'color 0.12s, background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.err; e.currentTarget.style.background = 'rgba(229,131,115,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.background = 'none' }}
            >
              <TrashSvg />
            </button>
            <button
              onClick={() => { setShowForm(v => !v); setShowAnticipo(false) }}
              style={{
                height: 28, padding: '0 10px',
                background: C.s3, color: C.arena,
                border: `1px solid ${C.linea}`, borderRadius: '0 7px 7px 0',
                fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'color 0.12s, border-color 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.linea }}
            >
              Reconfigurar
            </button>
          </div>
        )}
      </div>

      {/* Sin cuotas: opciones */}
      {totalInstall === 0 && !showForm && !showAnticipo && canConfigure && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[{ label: 'Cuotas iguales', action: () => setShowForm(true) }, { label: 'Con anticipo', action: () => setShowAnticipo(true) }].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                flex: 1, padding: '8px 0',
                background: 'none', border: `1px solid ${C.linea}`,
                borderRadius: '0 8px 8px 0',
                color: C.piedra, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'border-color 0.12s, color 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.piedra }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {totalInstall === 0 && !showForm && !showAnticipo && !canConfigure && (
        <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '12px 0' }}>Sin plan de cuotas</p>
      )}

      {/* Formulario cuotas iguales */}
      {showForm && (
        <form onSubmit={handleCreateEqual} style={{
          marginBottom: 16, padding: 14,
          background: C.s3, border: `1px solid ${C.linea}`,
          borderRadius: '0 10px 10px 0',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Número de cuotas</label>
              <input
                type="number" min="2" max="60" step="1"
                value={count} onChange={e => setCount(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Vencimiento 1ª cuota</label>
              <DatePicker value={firstDueDate} onChange={e => setFirstDueDate(e.target.value)} className={dpCls} />
            </div>
          </div>
          {formError && <p style={{ fontSize: 11, color: C.err }}>{formError}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.piedra, fontFamily: 'inherit', padding: '0 8px' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMut.isPending}
              style={{
                height: 32, padding: '0 14px',
                background: C.crema, color: C.bg,
                border: 'none', borderRadius: '0 8px 8px 0',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                opacity: createMut.isPending ? 0.5 : 1,
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (!createMut.isPending) e.currentTarget.style.background = '#E8E3D9' }}
              onMouseLeave={e => e.currentTarget.style.background = C.crema}
            >
              {createMut.isPending ? 'Guardando...' : 'Crear plan'}
            </button>
          </div>
        </form>
      )}

      {/* Formulario anticipo */}
      {showAnticipo && (
        <form onSubmit={handleCreateAnticipo} style={{
          marginBottom: 16, padding: 14,
          background: C.s3, border: `1px solid ${C.linea}`,
          borderRadius: '0 10px 10px 0',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {/* Anticipo + fecha */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Anticipo</label>
                <div style={{ display: 'flex', border: `1px solid ${C.linea}`, borderRadius: '0 6px 6px 0', overflow: 'hidden' }}>
                  {[{ val: 'amount', label: 'Monto' }, { val: 'percent', label: '%' }].map(({ val, label }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDpMode(val)}
                      style={{
                        padding: '2px 8px', fontSize: 11, fontWeight: 500,
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        background: dpMode === val ? C.crema : C.s2,
                        color: dpMode === val ? C.bg : C.piedra,
                        transition: 'background 0.12s, color 0.12s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {dpMode === 'amount' ? (
                <input
                  type="number" min="0" step="0.01"
                  value={dpAmount} onChange={e => setDpAmount(e.target.value)}
                  placeholder="0.00" style={inputStyle}
                  className="placeholder:text-[#8C877E]"
                />
              ) : (
                <div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number" min="0" max="100" step="1"
                      value={dpPercent} onChange={e => setDpPercent(e.target.value)}
                      placeholder="0"
                      style={{ ...inputStyle, paddingRight: 28 }}
                      className="placeholder:text-[#8C877E]"
                    />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C.piedra, pointerEvents: 'none' }}>%</span>
                  </div>
                  {parseFloat(dpPercent) > 0 && total > 0 && (
                    <p style={{ fontSize: 11, color: C.piedra, marginTop: 4 }}>= {fmt(effectiveDp, currency)}</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Fecha del anticipo</label>
              <DatePicker value={dpDate} onChange={e => setDpDate(e.target.value)} className={dpCls} />
            </div>
          </div>

          {effectiveDp > 0 && effectiveDp < total && (
            <p style={{ fontSize: 11, color: C.piedra }}>
              Saldo restante: <span style={{ fontWeight: 600, color: C.crema, fontFamily: CIFRAS }}>{fmt(total - effectiveDp, currency)}</span>
            </p>
          )}

          {/* Tipo de saldo */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: C.arena, marginBottom: 8 }}>Saldo restante</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ val: 'second', label: 'Segundo pago' }, { val: 'installments', label: 'En cuotas' }].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRemainderType(val)}
                  style={{
                    flex: 1, padding: '7px 0',
                    border: `1px solid ${remainderType === val ? C.arena : C.linea}`,
                    borderRadius: '0 8px 8px 0',
                    background: remainderType === val ? 'rgba(185,180,170,0.08)' : 'none',
                    color: remainderType === val ? C.crema : C.piedra,
                    fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.12s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {remainderType === 'second' && (
            <div>
              <label style={labelStyle}>Fecha del segundo pago</label>
              <DatePicker value={secondDate} onChange={e => setSecondDate(e.target.value)} className={dpCls} />
              {secondDate && dpDate && dpDate >= secondDate && (
                <p style={{ fontSize: 11, color: C.err, marginTop: 4 }}>Debe ser posterior al anticipo</p>
              )}
            </div>
          )}

          {remainderType === 'installments' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Número de cuotas</label>
                <input
                  type="number" min="2" max="60" step="1"
                  value={antInstallCount} onChange={e => setAntInstallCount(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Vencimiento 1ª cuota</label>
                <DatePicker value={antInstallFirst} onChange={e => setAntInstallFirst(e.target.value)} className={dpCls} />
                {antInstallFirst && dpDate && dpDate >= antInstallFirst && (
                  <p style={{ fontSize: 11, color: C.err, marginTop: 4 }}>Debe ser posterior al anticipo</p>
                )}
              </div>
            </div>
          )}

          {anticoError && <p style={{ fontSize: 11, color: C.err }}>{anticoError}</p>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button" onClick={closeAnticipo}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.piedra, fontFamily: 'inherit', padding: '0 8px' }}
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={createCustomMut.isPending}
              style={{
                height: 32, padding: '0 14px',
                background: C.crema, color: C.bg,
                border: 'none', borderRadius: '0 8px 8px 0',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                opacity: createCustomMut.isPending ? 0.5 : 1,
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (!createCustomMut.isPending) e.currentTarget.style.background = '#E8E3D9' }}
              onMouseLeave={e => e.currentTarget.style.background = C.crema}
            >
              {createCustomMut.isPending ? 'Guardando...' : 'Crear plan'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de cuotas */}
      {totalInstall > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {installments.map((inst) => {
            const isPaid    = inst.status === 'paid'
            const isOverdue = !isPaid && new Date(inst.dueDate.slice(0, 10) + 'T12:00:00') < new Date()
            const accent    = isPaid ? C.ok : isOverdue ? C.err : C.crema
            const bg        = isPaid
              ? { background: 'rgba(125,190,147,0.08)', border: `1px solid rgba(125,190,147,0.2)` }
              : isOverdue
              ? { background: 'rgba(229,131,115,0.08)', border: `1px solid rgba(229,131,115,0.2)` }
              : { background: C.s2, border: `1px solid ${C.linea}` }
            return (
              <div key={inst.id} style={{ ...bg, borderRadius: '0 10px 10px 0', padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    {isPaid
                      ? <CheckCircleSvg color={C.ok} />
                      : <ClockSvg color={isOverdue ? C.err : C.piedra} />
                    }
                    <span style={{ fontSize: 13, fontWeight: 500, color: accent }}>Cuota {inst.number}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: accent, fontFamily: CIFRAS, flexShrink: 0 }}>
                    {fmt(inst.amount, currency)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6, paddingLeft: 23 }}>
                  <span style={{ fontSize: 11, color: isPaid ? C.ok : isOverdue ? C.err : C.piedra }}>
                    {isPaid && inst.paidAt
                      ? `Cobrada ${fmtDate(inst.paidAt)}`
                      : `Vence ${fmtDate(inst.dueDate)}`}
                  </span>
                  {!isPaid && canWrite && (
                    <button
                      onClick={() => payMut.mutate(inst.id)}
                      disabled={payMut.isPending}
                      style={{
                        display: 'flex', alignItems: 'center',
                        padding: '4px 10px', borderRadius: '0 6px 6px 0',
                        background: C.arena, color: C.bg,
                        fontSize: 11.5, fontWeight: 600, border: 'none',
                        cursor: payMut.isPending ? 'not-allowed' : 'pointer',
                        opacity: payMut.isPending ? 0.6 : 1,
                        flexShrink: 0, transition: 'background 0.12s',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => { if (!payMut.isPending) e.currentTarget.style.background = C.crema }}
                      onMouseLeave={e => e.currentTarget.style.background = C.arena}
                    >
                      Cobrar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
