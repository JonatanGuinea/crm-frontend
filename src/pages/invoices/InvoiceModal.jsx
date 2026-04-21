import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getClients } from '../../api/clients'
import { getProjects } from '../../api/projects'
import { getInvoiceById, createInvoice, updateInvoice } from '../../api/invoices'
import LineItemsEditor from '../../components/LineItemsEditor'

const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: 0, amount: 0 }

const ALLOWED_TRANSITIONS = {
  draft: ['sent', 'cancelled'],
  sent: ['paid', 'overdue', 'cancelled'],
  paid: [], overdue: ['paid', 'cancelled'], cancelled: []
}
const STATUS_LABELS = {
  draft: 'Borrador', sent: 'Enviada', paid: 'Pagada',
  overdue: 'Vencida', cancelled: 'Cancelada'
}

const inputCls = "w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
const labelCls = "block text-sm font-medium text-fg-soft mb-1"

export default function InvoiceModal({ invoiceId, onClose, onSaved }) {
  const isEditing = Boolean(invoiceId)

  const [form, setForm] = useState({
    title: '', clientId: '', projectId: '',
    dueDate: '', taxRate: 0, currency: 'USD', notes: '', status: ''
  })
  const [items, setItems] = useState([EMPTY_ITEM])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => getClients({ limit: 100 }).then(r => r.data.data)
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects-all'],
    queryFn: () => getProjects({ limit: 100 }).then(r => r.data.data)
  })

  const { data: invoiceData } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoiceById(invoiceId).then(r => r.data.data),
    enabled: isEditing
  })

  useEffect(() => {
    if (invoiceData) {
      setForm({
        title: invoiceData.title,
        clientId: invoiceData.clientId,
        projectId: invoiceData.projectId || '',
        dueDate: invoiceData.dueDate?.slice(0, 10) || '',
        taxRate: invoiceData.taxRate,
        currency: invoiceData.currency,
        notes: invoiceData.notes || '',
        status: ''
      })
      setItems(invoiceData.items.map(i => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        amount: i.amount
      })))
    }
  }, [invoiceData])

  const subtotal = items.reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0)
  const taxAmount = subtotal * (parseFloat(form.taxRate) / 100)
  const total = subtotal + taxAmount

  const allowedStatuses = isEditing && invoiceData ? ALLOWED_TRANSITIONS[invoiceData.status] || [] : []

  async function handleSubmit(e) {
    e.preventDefault()
    if (items.some(i => !i.description.trim())) {
      setError('Todos los ítems deben tener descripción')
      return
    }
    setError('')
    setLoading(true)
    try {
      const payload = {
        title: form.title,
        clientId: form.clientId,
        projectId: form.projectId || undefined,
        dueDate: form.dueDate || undefined,
        taxRate: parseFloat(form.taxRate) || 0,
        currency: form.currency,
        notes: form.notes || undefined,
        items,
        ...(form.status ? { status: form.status } : {})
      }
      if (isEditing) {
        await updateInvoice(invoiceId, payload)
      } else {
        await createInvoice(payload)
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
      <div className="bg-surface rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-fg mb-5">
          {isEditing ? 'Editar factura' : 'Nueva factura'}
          {invoiceData && <span className="ml-2 text-sm font-normal text-fg-muted">#{invoiceData.number}</span>}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Título *</label>
            <input type="text" required value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Cliente *</label>
              <select required value={form.clientId}
                onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                className={inputCls}>
                <option value="">Seleccionar...</option>
                {clientsData?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Proyecto</label>
              <select value={form.projectId}
                onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                className={inputCls}>
                <option value="">Sin proyecto</option>
                {projectsData?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Fecha de vencimiento</label>
              <input type="date" value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Moneda</label>
              <select value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                className={inputCls}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>IVA (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={form.taxRate}
                onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))}
                className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Ítems *</label>
            <div className="border border-line rounded-lg p-3 bg-raised">
              <LineItemsEditor items={items} onChange={setItems} />
            </div>
          </div>

          <div className="bg-raised rounded-lg p-3 text-sm space-y-1 text-right">
            <div className="text-fg-soft">Subtotal: <span className="text-fg font-medium">${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
            {form.taxRate > 0 && (
              <div className="text-fg-soft">IVA ({form.taxRate}%): <span className="text-fg font-medium">${taxAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
            )}
            <div className="text-base font-semibold text-fg">Total {form.currency}: ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
          </div>

          {isEditing && allowedStatuses.length > 0 && (
            <div>
              <label className={labelCls}>Cambiar estado</label>
              <select value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className={inputCls}>
                <option value="">Sin cambio ({STATUS_LABELS[invoiceData?.status]})</option>
                {allowedStatuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className={labelCls}>Notas</label>
            <textarea rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={inputCls} />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-fg-soft hover:text-fg">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
