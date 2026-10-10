import { useState } from 'react'
import { createClient, updateClient } from '../../api/clients'
import { useToast } from '../../components/Toast'
import ProvinceSelect from '../../components/ProvinceSelect'
import PhoneInput, { PHONE_COUNTRIES, formatPhoneNumber } from '../../components/PhoneInput'

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
  err:   '#E58373',
}

const card = {
  background: C.s2,
  border: `1px solid ${C.linea}`,
  borderRadius: '0 16px 16px 0',
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 500, color: C.arena, marginBottom: 6,
}

// Tailwind arbitrary-value className para inputs — evita repetir inline styles
const inputCls = [
  'w-full',
  'h-[42px]',
  'bg-[#0B0B0C]',
  'border',
  'border-[#2C2C2F]',
  'rounded-[0_10px_10px_0]',
  'text-[#F2EDE3]',
  'text-[13px]',
  'px-[14px]',
  'outline-none',
  'focus:border-[#B9B4AA]',
  'placeholder:text-[#8C877E]',
  'box-border',
].join(' ')

const textareaCls = [
  'w-full',
  '!h-auto',
  'bg-[#0B0B0C]',
  'border',
  'border-[#2C2C2F]',
  'rounded-[0_10px_10px_0]',
  'text-[#F2EDE3]',
  'text-[13px]',
  'px-[14px]',
  'py-[10px]',
  'outline-none',
  'focus:border-[#B9B4AA]',
  'placeholder:text-[#8C877E]',
  'resize-none',
  'box-border',
].join(' ')

// ── helpers ───────────────────────────────────────────────────────────────────

function parseExistingPhone(phone) {
  if (!phone) return { code: 'AR', number: '' }
  for (const c of PHONE_COUNTRIES) {
    if (phone.startsWith(c.dial + ' ')) {
      return { code: c.code, number: phone.slice(c.dial.length + 1) }
    }
  }
  return { code: 'AR', number: phone }
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ClientModal({ client, onClose, onSaved }) {
  const toast = useToast()

  const parsedPhone = parseExistingPhone(client?.phone)

  const [form, setForm] = useState({
    name:       client?.name       || '',
    company:    client?.company    || '',
    email:      client?.email      || '',
    website:    client?.website    || '',
    cuit:       client?.cuit       || '',
    address:    client?.address    || '',
    province:   client?.province   || '',
    city:       client?.city       || '',
    postalCode: client?.postalCode || '',
    notes:      client?.notes      || '',
  })
  const [phoneCountry, setPhoneCountry] = useState(parsedPhone.code)
  const [phoneNumber, setPhoneNumber]   = useState(formatPhoneNumber(parsedPhone.number))
  const [error, setError]    = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const dialCode  = PHONE_COUNTRIES.find(c => c.code === phoneCountry)?.dial || ''
      const fullPhone = phoneNumber.trim() ? `${dialCode} ${phoneNumber.trim()}` : ''

      const data = {
        ...form,
        phone: fullPhone || undefined,
        website: form.website && !/^https?:\/\//i.test(form.website)
          ? `https://${form.website}`
          : form.website,
      }
      if (client) {
        await updateClient(client.id, data)
        toast('Cliente actualizado', 'success')
      } else {
        await createClient(data)
        toast('Cliente creado', 'success')
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '0 16px',
      fontFamily: 'Geist, system-ui, sans-serif',
    }}>
      <div style={{ ...card, width: '100%', maxWidth: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', background: C.linea, flexShrink: 0,
          borderRadius: '0 16px 0 0',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: C.crema }}>
            {client ? 'Editar cliente' : 'Nuevo cliente'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              fontSize: 20, color: C.arena, background: 'none', border: 'none',
              cursor: 'pointer', lineHeight: 1, padding: '2px 4px',
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.arena}
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <form
          id="client-form"
          onSubmit={handleSubmit}
          style={{
            flex: 1, overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}
        >
          {[
            { key: 'name',    label: 'Nombre *',  type: 'text',  required: true },
            { key: 'company', label: 'Empresa',   type: 'text' },
            { key: 'email',   label: 'Email',     type: 'email' },
            { key: 'website', label: 'Sitio web', type: 'text',  placeholder: 'ejemplo.com' },
          ].map(({ key, label, type, required, placeholder }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input
                type={type}
                required={required}
                placeholder={placeholder}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className={inputCls}
              />
            </div>
          ))}

          {/* Teléfono */}
          <div>
            <label style={labelStyle}>Teléfono</label>
            <PhoneInput
              label={null}
              countryCode={phoneCountry}
              phoneNumber={phoneNumber}
              onChangeCountry={setPhoneCountry}
              onChangeNumber={setPhoneNumber}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>CUIL / CUIT</label>
              <input
                type="text"
                value={form.cuit}
                onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))}
                placeholder="20-12345678-9"
                className={inputCls}
              />
            </div>
            <div>
              <label style={labelStyle}>Dirección</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Provincia</label>
            <ProvinceSelect
              value={form.province}
              onChange={v => setForm(f => ({ ...f, province: v }))}
              className={[
                'w-full', 'h-[42px]',
                'bg-[#0B0B0C]', 'border', 'border-[#2C2C2F]',
                'rounded-[0_10px_10px_0]', 'text-[#F2EDE3]', 'text-[13px]',
                'px-[14px]', 'outline-none', 'focus:border-[#B9B4AA]',
                'appearance-none', 'box-border',
              ].join(' ')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Ej: Rosario"
                className={inputCls}
              />
            </div>
            <div>
              <label style={labelStyle}>Código postal</label>
              <input
                type="text"
                value={form.postalCode}
                onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                placeholder="Ej: 2000"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notas</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={textareaCls}
            />
          </div>

          {error && <p style={{ fontSize: 12, color: C.err }}>{error}</p>}
        </form>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
          padding: '14px 24px', borderTop: `1px solid ${C.linea}`, flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: '0 8px 8px 0',
              background: 'none', border: `1px solid ${C.linea}`,
              color: C.piedra, fontSize: 13, cursor: 'pointer',
              transition: 'color 0.12s, border-color 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
            onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="client-form"
            disabled={loading}
            style={{
              padding: '8px 20px', borderRadius: '0 10px 10px 0',
              background: C.crema, color: C.bg,
              fontSize: 13, fontWeight: 600, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.12s, background 0.12s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#E8E3D9' }}
            onMouseLeave={e => { e.currentTarget.style.background = C.crema }}
          >
            {loading ? 'Guardando...' : (client ? 'Guardar cambios' : 'Crear cliente')}
          </button>
        </div>

      </div>
    </div>
  )
}
