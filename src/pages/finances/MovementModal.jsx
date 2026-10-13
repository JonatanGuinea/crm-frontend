import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createCashMovement, updateCashMovement, getFinancialCategories } from '../../api/finances'
import { getClients } from '../../api/clients'
import { useToast } from '../../components/Toast'
import DatePicker from '../../components/DatePicker'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }
const dpClass = "h-[34px] px-3 bg-[#141415] border border-[#2C2C2F] rounded-[0_9px_9px_0] text-[13px] outline-none w-full"

function CloseSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const isFuture = (dateStr) => {
  const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0)
  return new Date(dateStr + 'T00:00:00') > todayMid
}

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
    clientId:    movement?.clientId ?? '',
    reference:   movement?.reference ?? '',
    pending:     movement?.status === 'pending' ? true : false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(p => ({ ...p, categoryId: '', clientId: '' }))
  }, [form.type])

  useEffect(() => {
    if (!isEdit) setForm(p => ({ ...p, pending: isFuture(p.date) }))
  }, [form.date]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['financial-categories', form.type],
    queryFn: () => getFinancialCategories({ type: form.type }).then(r => r.data.data),
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => getClients({ limit: 200 }).then(r => r.data.data ?? r.data),
    enabled: form.type === 'income',
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
        clientId:   form.clientId   || undefined,
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
  const accentColor = isIncome ? C.ok : C.err

  const labelStyle = { fontSize: 11, fontWeight: 500, color: C.piedra }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      className="items-end sm:items-center">
      <div style={{ width: '100%', maxWidth: 448, background: C.s1, borderRadius: '0 16px 0 0', border: `1px solid ${C.linea}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
        className="sm:rounded-[0_16px_16px_0]">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.crema }}>
              {isEdit ? `Editar ${typeLabel}` : `Nuevo ${typeLabel}`}
            </span>
            {!isEdit && (
              <div style={{ display: 'flex', overflow: 'hidden', border: `1px solid ${C.linea}`, borderRadius: '0 8px 8px 0', fontSize: 12, fontWeight: 500 }}>
                <button type="button" onClick={() => set('type', 'income')}
                  style={{ padding: '5px 10px', background: isIncome ? C.ok : 'transparent', color: isIncome ? C.bg : C.piedra, border: 'none', cursor: 'pointer' }}>
                  Ingreso
                </button>
                <button type="button" onClick={() => set('type', 'expense')}
                  style={{ padding: '5px 10px', background: !isIncome ? C.err : 'transparent', color: !isIncome ? C.bg : C.piedra, border: 'none', cursor: 'pointer' }}>
                  Egreso
                </button>
              </div>
            )}
          </div>
          <button type="button" onClick={onClose}
            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
            <CloseSvg style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

          {/* Cuenta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Cuenta</label>
            <select value={form.accountId} onChange={e => set('accountId', e.target.value)} className="du-input">
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Monto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Monto</label>
            <div style={{ display: 'flex', overflow: 'hidden', border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', borderRight: `1px solid ${C.linea}`, background: C.s2, fontSize: 13, fontWeight: 600, color: accentColor, flexShrink: 0 }}>$</span>
              <input type="number" min="0.01" step="0.01" placeholder="0.00"
                value={form.amount} onChange={e => set('amount', e.target.value)}
                style={{ flex: 1, minWidth: 0, background: C.s2, color: C.crema, fontSize: 13, padding: '0 12px', height: 36, outline: 'none', border: 'none' }}
                required />
            </div>
          </div>

          {/* Fecha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Fecha</label>
            <DatePicker value={form.date} onChange={e => set('date', e.target.value)} className={dpClass} />
          </div>

          {/* Categoría */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Categoría</label>
            <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className="du-input" disabled={catsLoading}>
              <option value="">{catsLoading ? 'Cargando…' : 'Sin categoría'}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Cliente (solo ingresos) */}
          {form.type === 'income' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>Cliente <span style={{ fontWeight: 400, color: C.piedra }}>opcional</span></label>
              <select value={form.clientId} onChange={e => set('clientId', e.target.value)} className="du-input">
                <option value="">Sin cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* Descripción */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Descripción</label>
            <input type="text" placeholder={isIncome ? 'Ej: Cobro cliente, venta…' : 'Ej: Compra de materiales…'}
              value={form.description} onChange={e => set('description', e.target.value)} className="du-input" />
          </div>

          {/* Referencia */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Referencia <span style={{ fontWeight: 400, color: C.piedra }}>opcional</span></label>
            <input type="text" placeholder="N° de factura, recibo…"
              value={form.reference} onChange={e => set('reference', e.target.value)} className="du-input" />
          </div>

          {/* Pendiente toggle */}
          <button type="button" onClick={() => set('pending', !form.pending)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '0 10px 10px 0', border: `1px solid ${form.pending ? C.warn : C.linea}`, background: form.pending ? 'rgba(226,182,99,0.06)' : 'none', cursor: 'pointer' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: form.pending ? C.warn : C.crema }}>
                  {isIncome ? 'Ingreso pendiente' : 'Egreso pendiente'}
                </span>
                {form.pending && isFuture(form.date) && (
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(226,182,99,0.15)', color: C.warn, padding: '1px 6px', borderRadius: '0 4px 4px 0' }}>Fecha futura</span>
                )}
              </div>
              <p style={{ fontSize: 11, color: C.piedra, marginTop: 2 }}>
                {form.pending ? 'No afecta el saldo hasta confirmar' : 'Afecta el saldo al registrar'}
              </p>
            </div>
            <div style={{ width: 36, height: 20, borderRadius: 10, background: form.pending ? C.warn : C.linea, position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 2, left: form.pending ? 'calc(100% - 18px)' : 2, width: 16, height: 16, borderRadius: '50%', background: C.crema, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
            </div>
          </button>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4, paddingBottom: 8 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: `1px solid ${C.linea}`, background: 'none', color: C.piedra, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: 'none', background: accentColor, color: C.bg, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : form.pending ? 'Registrar pendiente' : `Registrar ${typeLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
