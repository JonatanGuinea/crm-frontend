import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getClients } from '../../api/clients'
import { getProjects } from '../../api/projects'
import { getQuoteById, createQuote, updateQuote } from '../../api/quotes'
import { createInstallments } from '../../api/installments'
import DatePicker from '../../components/DatePicker'
import LineItemsEditor from '../../components/LineItemsEditor'
import InstallmentsPanel from '../../components/InstallmentsPanel'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'

const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: 0, amount: 0 }

const inputCls = "w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
const labelCls = "block text-sm font-medium text-fg-soft mb-1"

export default function QuoteModal({ quoteId, onClose, onSaved, initialClientId = '', initialProjectId = '' }) {
  const isEditing = Boolean(quoteId)
  const { user } = useAuth()
  const canWrite = user?.role !== 'member'

  const [form, setForm] = useState({
    title: '', clientId: initialClientId, projectId: initialProjectId,
    validUntil: '', taxRate: 0, currency: 'USD', notes: '', status: ''
  })
  const toast = useToast()
  const [items, setItems] = useState([EMPTY_ITEM])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Installments config (only for new quotes)
  const [withInstallments, setWithInstallments] = useState(false)
  const [installCount, setInstallCount] = useState(2)
  const [installFirstDate, setInstallFirstDate] = useState('')

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

  async function handleSubmit(e) {
    e.preventDefault()
    if (items.some(i => !i.description.trim())) {
      setError('Todos los ítems deben tener descripción')
      return
    }
    if (withInstallments && !installFirstDate) {
      setError('Seleccioná la fecha del primer vencimiento')
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
        toast('Presupuesto actualizado', 'success')
      } else {
        const res = await createQuote(payload)
        const newId = res.data.data?.id
        if (newId && withInstallments) {
          await createInstallments({ quoteId: newId, count: parseInt(installCount), firstDueDate: installFirstDate })
        }
        toast('Presupuesto creado', 'success')
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-surface/60 backdrop-blur-xl rounded-t-2xl sm:rounded-xl shadow-lg w-full sm:max-w-2xl sm:mx-4 max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur-xl border-b border-line px-5 py-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-fg">
            {isEditing ? 'Editar presupuesto' : 'Nuevo presupuesto'}
            {quoteData && <span className="ml-2 text-sm font-normal text-fg-muted">#{quoteData.number}</span>}
          </h3>
          <button type="button" onClick={onClose} className="text-fg-muted hover:text-fg text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Título *</label>
            <input type="text" required value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={inputCls} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Cliente *</label>
              <select required value={form.clientId}
                onChange={e => setForm(f => ({ ...f, clientId: e.target.value, projectId: '' }))}
                className={inputCls}>
                <option value="">Seleccionar...</option>
                {clientsData?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Proyecto</label>
              <select value={form.projectId}
                onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                className={inputCls}
                disabled={!form.clientId}>
                <option value="">Sin proyecto</option>
                {projectsData?.filter(p => p.clientId === form.clientId).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Válido hasta</label>
              <DatePicker value={form.validUntil}
                onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Moneda</label>
              <select value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                className={inputCls}>
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={labelCls}>IVA (%)</label>
              <input type="number" min="0" max="100" step="1" value={form.taxRate}
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
            <div className="text-fg-soft">Subtotal: <span className="text-fg font-medium">${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            {form.taxRate > 0 && (
              <div className="text-fg-soft">IVA ({form.taxRate}%): <span className="text-fg font-medium">${taxAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            )}
            <div className="text-base font-semibold text-fg">Total {form.currency}: ${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>

          <div>
            <label className={labelCls}>Notas</label>
            <textarea rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={inputCls} />
          </div>

          {/* Cuotas — solo al crear */}
          {!isEditing && (
            <div className="border border-line rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setWithInstallments(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-fg-soft hover:bg-raised transition-colors"
              >
                <span>Configurar cuotas</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${withInstallments ? 'bg-brand text-white' : 'bg-raised text-fg-muted'}`}>
                  {withInstallments ? 'Activado' : 'Opcional'}
                </span>
              </button>
              {withInstallments && (
                <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-3 border-t border-line bg-raised">
                  <div>
                    <label className={labelCls}>Número de cuotas</label>
                    <input
                      type="number" min="2" max="60" step="1"
                      value={installCount}
                      onChange={e => setInstallCount(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Vencimiento 1ª cuota</label>
                    <DatePicker
                      value={installFirstDate}
                      onChange={e => setInstallFirstDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 pb-1">
            <button type="button" onClick={onClose} className="px-4 py-2.5 sm:py-2 text-sm text-fg-soft hover:text-fg border border-line-soft rounded-md sm:border-none">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2.5 sm:py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>

        {isEditing && quoteData && (
          <div className="px-5 pb-5">
            <div className="border border-line rounded-lg p-4 bg-raised">
              <InstallmentsPanel
                entityType="quote"
                entityId={quoteId}
                entityStatus={quoteData.status}
                canWrite={canWrite}
                currency={form.currency}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
