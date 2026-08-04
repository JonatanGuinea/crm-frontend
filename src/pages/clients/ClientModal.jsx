import { useState } from 'react'
import { createClient, updateClient } from '../../api/clients'
import { useToast } from '../../components/Toast'
import ProvinceSelect from '../../components/ProvinceSelect'
import PhoneInput, { PHONE_COUNTRIES, formatPhoneNumber } from '../../components/PhoneInput'

const inputCls = "w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
const labelCls = "block text-sm font-medium text-fg-soft mb-1"

function parseExistingPhone(phone) {
  if (!phone) return { code: 'AR', number: '' }
  for (const c of PHONE_COUNTRIES) {
    if (phone.startsWith(c.dial + ' ')) {
      return { code: c.code, number: phone.slice(c.dial.length + 1) }
    }
  }
  return { code: 'AR', number: phone }
}

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

  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const dialCode = PHONE_COUNTRIES.find(c => c.code === phoneCountry)?.dial || ''
      const fullPhone = phoneNumber.trim() ? `${dialCode} ${phoneNumber.trim()}` : ''

      const data = {
        ...form,
        phone: fullPhone || undefined,
        website: form.website && !/^https?:\/\//i.test(form.website) ? `https://${form.website}` : form.website
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-surface/60 backdrop-blur-xl rounded-xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-line">
          <h3 className="text-lg font-semibold text-fg">
            {client ? 'Editar cliente' : 'Nuevo cliente'}
          </h3>
        </div>

        {/* Scrollable body */}
        <form id="client-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {[
            { key: 'name',    label: 'Nombre *',  type: 'text',  required: true },
            { key: 'company', label: 'Empresa',   type: 'text' },
            { key: 'email',   label: 'Email',     type: 'email' },
            { key: 'website', label: 'Sitio web', type: 'text', placeholder: 'ejemplo.com' },
          ].map(({ key, label, type, required, placeholder }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
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

          {/* Teléfono con código de área */}
          <div>
            <label className={labelCls}>Teléfono</label>
            <PhoneInput
              countryCode={phoneCountry}
              phoneNumber={phoneNumber}
              onChangeCountry={setPhoneCountry}
              onChangeNumber={setPhoneNumber}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>CUIL / CUIT</label>
              <input type="text" value={form.cuit}
                onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))}
                placeholder="20-12345678-9" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Dirección</label>
              <input type="text" value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Provincia</label>
            <ProvinceSelect
              value={form.province}
              onChange={v => setForm(f => ({ ...f, province: v }))}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Ciudad</label>
              <input type="text" value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className={inputCls} placeholder="Ej: Rosario" />
            </div>
            <div>
              <label className={labelCls}>Código postal</label>
              <input type="text" value={form.postalCode}
                onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                className={inputCls} placeholder="Ej: 2000" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Notas</label>
            <textarea rows={3} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={inputCls} />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
        </form>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-line flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-fg-soft hover:text-fg">
            Cancelar
          </button>
          <button type="submit" form="client-form" disabled={loading} className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

      </div>
    </div>
  )
}
