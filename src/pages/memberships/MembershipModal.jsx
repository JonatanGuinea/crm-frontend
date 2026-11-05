import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createMembership, updateMembership } from '../../api/memberships'
import { getFinancialCategories } from '../../api/finances'
import { getClients } from '../../api/clients'
import { useToast } from '../../components/Toast'
import DatePicker from '../../components/DatePicker'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }
const dpClass = "h-[34px] px-3 bg-[#141415] border border-[#2C2C2F] rounded-[0_9px_9px_0] text-[13px] outline-none w-full"

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Activa',    color: C.ok },
  { value: 'paused',    label: 'Pausada',   color: C.warn },
  { value: 'cancelled', label: 'Cancelada', color: C.err },
]

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

export default function MembershipModal({ membership, clientId, accounts, defaultAccountId, currency, onClose, onSaved }) {
  const toast  = useToast()
  const isEdit = !!membership

  const [form, setForm] = useState({
    clientId:   membership?.clientId   ?? clientId ?? '',
    name:       membership?.name       ?? '',
    amount:     membership?.amount     ?? '',
    billingDay: membership?.billingDay ?? new Date().getDate(),
    startDate:  membership?.startDate  ? membership.startDate.slice(0, 10) : today(),
    endDate:    membership?.endDate    ? membership.endDate.slice(0, 10)   : '',
    accountId:  membership?.accountId  ?? defaultAccountId ?? accounts[0]?.id ?? '',
    categoryId: membership?.categoryId ?? '',
    notes:      membership?.notes      ?? '',
    status:     membership?.status     ?? 'active',
  })
  const [saving, setSaving] = useState(false)

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => getClients({ limit: 200 }).then(r => r.data.data ?? r.data),
  })

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['financial-categories', 'income'],
    queryFn: () => getFinancialCategories({ type: 'income' }).then(r => r.data.data),
  })

  function set(field, val) { setForm(p => ({ ...p, [field]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.clientId)                           return toast('Seleccioná un cliente', 'error')
    if (!form.name.trim())                        return toast('Ingresá un nombre para la membresía', 'error')
    if (!form.amount || Number(form.amount) <= 0) return toast('Ingresá un monto válido', 'error')
    const day = Number(form.billingDay)
    if (!Number.isInteger(day) || day < 1 || day > 31) return toast('El día de cobro debe estar entre 1 y 31', 'error')
    if (!form.accountId)                          return toast('Seleccioná una cuenta', 'error')

    setSaving(true)
    try {
      const payload = {
        ...form,
        amount:     Number(form.amount),
        billingDay: day,
        endDate:    form.endDate || null,
        categoryId: form.categoryId || null,
      }
      if (!isEdit) delete payload.status
      if (isEdit) await updateMembership(membership.id, payload)
      else        await createMembership(payload)
      onSaved()
    } catch (err) {
      toast(err.response?.data?.error || err.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = { fontSize: 11, fontWeight: 500, color: C.piedra }
  const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 5 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      className="items-end sm:items-center">
      <div style={{ width: '100%', maxWidth: 480, background: C.s1, borderRadius: '0 16px 0 0', border: `1px solid ${C.linea}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
        className="sm:rounded-[0_16px_16px_0]">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}`, flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.crema }}>
            {isEdit ? 'Editar membresía' : 'Nueva membresía'}
          </span>
          <button type="button" onClick={onClose}
            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
            <CloseSvg style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

          {/* Estado (solo edición) */}
          {isEdit && (
            <div style={fieldStyle}>
              <label style={labelStyle}>Estado</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {STATUS_OPTIONS.map(o => {
                  const active = form.status === o.value
                  return (
                    <button key={o.value} type="button" onClick={() => set('status', o.value)}
                      style={{ flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 500, borderRadius: '0 8px 8px 0', cursor: 'pointer',
                        border: `1px solid ${active ? o.color : C.linea}`, background: active ? `${o.color}14` : 'none', color: active ? o.color : C.piedra }}>
                      {o.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cliente */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Cliente</label>
            <select value={form.clientId} onChange={e => set('clientId', e.target.value)} className="du-input" disabled={isEdit || !!clientId}>
              <option value="">Seleccioná un cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Nombre */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Nombre de la membresía</label>
            <input type="text" placeholder="Ej: Plan mensual, Mantenimiento web…"
              value={form.name} onChange={e => set('name', e.target.value)} className="du-input" required />
          </div>

          {/* Monto + día de cobro */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Monto mensual</label>
              <div style={{ display: 'flex', overflow: 'hidden', border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0' }}>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', borderRight: `1px solid ${C.linea}`, background: C.s2, fontSize: 13, fontWeight: 600, color: C.ok, flexShrink: 0 }}>
                  {currency === 'USD' ? 'US$' : '$'}
                </span>
                <input type="number" min="0.01" step="0.01" placeholder="0"
                  value={form.amount} onChange={e => set('amount', e.target.value)}
                  style={{ flex: 1, minWidth: 0, background: C.s2, color: C.crema, fontSize: 13, padding: '0 12px', height: 36, outline: 'none', border: 'none' }}
                  required />
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Día de cobro</label>
              <input type="number" min="1" max="31" step="1"
                value={form.billingDay} onChange={e => set('billingDay', e.target.value)} className="du-input" required />
            </div>
          </div>
          {Number(form.billingDay) > 28 && (
            <p style={{ fontSize: 11, color: C.piedra, marginTop: -8 }}>
              En los meses que no tienen el día {form.billingDay}, el cobro vence el último día del mes.
            </p>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Inicio</label>
              <DatePicker value={form.startDate} onChange={e => set('startDate', e.target.value)} className={dpClass} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Fin <span style={{ fontWeight: 400 }}>opcional</span></label>
              <DatePicker value={form.endDate} onChange={e => set('endDate', e.target.value)} className={dpClass} placeholder="Sin fecha de fin" />
            </div>
          </div>

          {/* Cuenta */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Cuenta donde se acredita</label>
            <select value={form.accountId} onChange={e => set('accountId', e.target.value)} className="du-input">
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Categoría */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Categoría <span style={{ fontWeight: 400 }}>opcional</span></label>
            <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className="du-input" disabled={catsLoading}>
              <option value="">{catsLoading ? 'Cargando…' : 'Sin categoría'}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Notas */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Notas <span style={{ fontWeight: 400 }}>opcional</span></label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
              className="w-full resize-none outline-none font-[inherit]"
              style={{ background: C.bg, border: `1px solid ${C.linea}`, borderRadius: '0 8px 8px 0', color: C.crema, fontSize: 13, padding: '6px 12px' }} />
          </div>

          {isEdit && (
            <p style={{ fontSize: 11, color: C.piedra, lineHeight: 1.5 }}>
              Al guardar se actualizan todos los cobros pendientes desde hoy. Los cobros atrasados y los ya confirmados no cambian.
            </p>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4, paddingBottom: 8 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: `1px solid ${C.linea}`, background: 'none', color: C.piedra, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear membresía'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
