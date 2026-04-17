import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getClients } from '../../api/clients'
import { getProjects } from '../../api/projects'
import { getQuoteById, createQuote, updateQuote } from '../../api/quotes'
import LineItemsEditor from '../../components/LineItemsEditor'

const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: 0, amount: 0 }

const ALLOWED_TRANSITIONS = {
  draft: ['sent', 'expired'],
  sent: ['approved', 'rejected', 'expired'],
  approved: [], rejected: [], expired: []
}
const STATUS_LABELS = {
  draft: 'Borrador', sent: 'Enviado', approved: 'Aprobado',
  rejected: 'Rechazado', expired: 'Vencido'
}

export default function QuoteModal({ quoteId, onClose, onSaved }) {
  const isEditing = Boolean(quoteId)

  const [form, setForm] = useState({
    title: '', clientId: '', projectId: '',
    validUntil: '', taxRate: 0, currency: 'USD', notes: '', status: ''
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

  const { data: quoteData } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: () => getQuoteById(quoteId).then(r => r.data.data),
    enabled: isEditing
  })

  useEffect(() => {
    if (quoteData) {
      setForm({
        title: quoteData.title,
        clientId: quoteData.clientId,
        projectId: quoteData.projectId || '',
        validUntil: quoteData.validUntil?.slice(0, 10) || '',
        taxRate: quoteData.taxRate,
        currency: quoteData.currency,
        notes: quoteData.notes || '',
        status: ''
      })
      setItems(quoteData.items.map(i => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        amount: i.amount
      })))
    }
  }, [quoteData])

  const subtotal = items.reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0)
  const taxAmount = subtotal * (parseFloat(form.taxRate) / 100)
  const total = subtotal + taxAmount

  const allowedStatuses = isEditing && quoteData ? ALLOWED_TRANSITIONS[quoteData.status] || [] : []

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
        validUntil: form.validUntil || undefined,
        taxRate: parseFloat(form.taxRate) || 0,
        currency: form.currency,
        notes: form.notes || undefined,
        items,
        ...(form.status ? { status: form.status } : {})
      }
      if (isEditing) {
        await updateQuote(quoteId, payload)
      } else {
        await createQuote(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
          {isEditing ? 'Editar presupuesto' : 'Nuevo presupuesto'}
          {quoteData && <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500">#{quoteData.number}</span>}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label className={labelCls}>Título *</label>
            <input type="text" required value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={inputCls} />
          </div>

          {/* Cliente / Proyecto */}
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

          {/* Vencimiento / Moneda / IVA */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Válido hasta</label>
              <input type="date" value={form.validUntil}
                onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
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

          {/* Items */}
          <div>
            <label className={labelCls}>Ítems *</label>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
              <LineItemsEditor items={items} onChange={setItems} />
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm space-y-1 text-right">
            <div className="text-gray-500 dark:text-gray-400">Subtotal: <span className="text-gray-900 dark:text-white font-medium">${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
            {form.taxRate > 0 && (
              <div className="text-gray-500 dark:text-gray-400">IVA ({form.taxRate}%): <span className="text-gray-900 dark:text-white font-medium">${taxAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
            )}
            <div className="text-base font-semibold text-gray-900 dark:text-white">Total {form.currency}: ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
          </div>

          {/* Cambio de estado (solo edición) */}
          {isEditing && allowedStatuses.length > 0 && (
            <div>
              <label className={labelCls}>Cambiar estado</label>
              <select value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className={inputCls}>
                <option value="">Sin cambio ({STATUS_LABELS[quoteData?.status]})</option>
                {allowedStatuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className={labelCls}>Notas</label>
            <textarea rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={inputCls} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
