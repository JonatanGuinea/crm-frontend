import { useState } from 'react'
import { createClient, updateClient } from '../../api/clients'
import { useToast } from '../../components/Toast'

const inputCls = "w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
const labelCls = "block text-sm font-medium text-fg-soft mb-1"

export default function ClientModal({ client, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    company: client?.company || '',
    address: client?.address || '',
    cuit: client?.cuit || '',
    notes: client?.notes || ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (client) {
        await updateClient(client.id, form)
        toast('Cliente actualizado', 'success')
      } else {
        await createClient(form)
        toast('Cliente creado', 'success')
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-surface/60 backdrop-blur-xl rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-fg mb-4">
          {client ? 'Editar cliente' : 'Nuevo cliente'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: 'name', label: 'Nombre *', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'phone', label: 'Teléfono', type: 'text' },
            { key: 'company', label: 'Empresa', type: 'text' },
          ].map(({ key, label, type, required }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input
                type={type}
                required={required}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className={inputCls}
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>CUIL / CUIT</label>
              <input
                type="text"
                value={form.cuit}
                onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))}
                placeholder="20-12345678-9"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Dirección</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Notas</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={inputCls}
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-fg-soft hover:text-fg">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
