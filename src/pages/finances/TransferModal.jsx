import { useState } from 'react'
import { createTransfer } from '../../api/finances'
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
function TransferSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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

  const labelStyle = { fontSize: 11, fontWeight: 500, color: C.piedra }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      className="sm:items-center">
      <div style={{ width: '100%', maxWidth: 448, background: C.s1, borderRadius: '0 16px 0 0', border: `1px solid ${C.linea}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
        className="sm:rounded-[0_16px_16px_0]">

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TransferSvg style={{ width: 16, height: 16, color: C.arena }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: C.crema }}>Transferencia entre cuentas</span>
          </div>
          <button onClick={onClose}
            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
            <CloseSvg style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Desde</label>
            <select value={form.fromAccountId} onChange={e => set('fromAccountId', e.target.value)} className="du-input">
              {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Hacia</label>
            <select value={form.toAccountId} onChange={e => set('toAccountId', e.target.value)} className="du-input">
              {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Monto</label>
            <div style={{ display: 'flex', overflow: 'hidden', border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', borderRight: `1px solid ${C.linea}`, background: C.s2, fontSize: 13, fontWeight: 600, color: C.piedra, flexShrink: 0 }}>$</span>
              <input type="number" min="0.01" step="0.01" placeholder="0.00"
                value={form.amount} onChange={e => set('amount', e.target.value)}
                style={{ flex: 1, minWidth: 0, background: C.s2, color: C.crema, fontSize: 13, padding: '0 12px', height: 36, outline: 'none', border: 'none' }}
                required />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Fecha</label>
            <DatePicker value={form.date} onChange={e => set('date', e.target.value)} className={dpClass} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Descripción <span style={{ fontWeight: 400, color: C.piedra }}>opcional</span></label>
            <input type="text" placeholder="Ej: Pase a banco"
              value={form.description} onChange={e => set('description', e.target.value)} className="du-input" />
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4, paddingBottom: 8 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: `1px solid ${C.linea}`, background: 'none', color: C.piedra, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Transfiriendo…' : 'Transferir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
