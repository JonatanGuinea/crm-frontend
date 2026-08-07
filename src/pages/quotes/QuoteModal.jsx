import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getClients } from '../../api/clients'
import { getProjects } from '../../api/projects'
import { getQuoteById, createQuote, updateQuote } from '../../api/quotes'
import { getOrganizations } from '../../api/organizations'
import { getProducts } from '../../api/stock'
import { createInstallments, createCustomInstallments } from '../../api/installments'
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
    validUntil: '', deliveryDate: '', taxRate: 21, currency: 'USD', notes: '', status: ''
  })
  const toast = useToast()
  const [items, setItems] = useState([EMPTY_ITEM])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Descuento
  const [discountMode, setDiscountMode] = useState('percent') // 'percent' | 'amount'
  const [discountValue, setDiscountValue] = useState('')

  // Pago inicial
  const [withDownPayment, setWithDownPayment] = useState(false)
  const [downPaymentMode, setDownPaymentMode] = useState('amount') // 'amount' | 'percent'
  const [downPaymentAmount, setDownPaymentAmount] = useState('')
  const [downPaymentPercent, setDownPaymentPercent] = useState('')
  const [downPaymentDate, setDownPaymentDate] = useState('')
  const [remainderType, setRemainderType] = useState('second') // 'second' | 'installments'
  const [secondPaymentDate, setSecondPaymentDate] = useState('')

  // Cuotas (solo cuando no hay pago inicial, o como opción del saldo restante)
  const [withInstallments, setWithInstallments] = useState(false)
  const [installCount, setInstallCount] = useState(2)
  const [installFirstDate, setInstallFirstDate] = useState('')

  const orgId = user?.org
  const { data: orgData } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganizations().then(r => r.data.data?.find(o => o.id === orgId)),
    enabled: Boolean(orgId) && !isEditing,
    staleTime: 5 * 60 * 1000,
  })

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

  const { data: productsData } = useQuery({
    queryKey: ['products-for-quote'],
    queryFn: () => getProducts({ limit: 200 }).then(r => r.data.data?.items ?? []),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (!isEditing && orgData?.defaultCurrency) {
      setForm(f => ({ ...f, currency: orgData.defaultCurrency }))
    }
  }, [orgData, isEditing])

  useEffect(() => {
    if (quoteData) {
      setForm({
        title: quoteData.title,
        clientId: quoteData.clientId,
        projectId: quoteData.projectId || '',
        validUntil:   quoteData.validUntil?.slice(0, 10)   || '',
        deliveryDate: quoteData.deliveryDate?.slice(0, 10) || '',
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
      if (quoteData.discountType) {
        setDiscountMode(quoteData.discountType)
        setDiscountValue(String(quoteData.discountValue ?? ''))
      }
    }
  }, [quoteData])

  const subtotal = items.reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0)
  const discountAmt = discountMode === 'percent'
    ? subtotal * ((parseFloat(discountValue) || 0) / 100)
    : parseFloat(discountValue) || 0
  const discountedSubtotal = subtotal - discountAmt
  const taxAmount = discountedSubtotal * (parseFloat(form.taxRate) / 100)
  const total = discountedSubtotal + taxAmount
  const effectiveDownPayment = downPaymentMode === 'amount'
    ? parseFloat(downPaymentAmount) || 0
    : parseFloat((total * (parseFloat(downPaymentPercent) || 0) / 100).toFixed(2))

  async function handleSubmit(e) {
    e.preventDefault()
    if (items.some(i => !i.description.trim())) {
      setError('Todos los ítems deben tener descripción')
      return
    }
    if (withDownPayment) {
      if (!effectiveDownPayment || effectiveDownPayment <= 0) { setError('Ingresá el monto del pago inicial'); return }
      if (!downPaymentDate) { setError('Ingresá la fecha del pago inicial'); return }
      if (effectiveDownPayment >= total) { setError('El pago inicial no puede ser igual o mayor al total'); return }
      if (remainderType === 'second' && !secondPaymentDate) { setError('Ingresá la fecha del segundo pago'); return }
      if (remainderType === 'second' && secondPaymentDate && downPaymentDate >= secondPaymentDate) { setError('La fecha del segundo pago debe ser posterior al pago inicial'); return }
      if (remainderType === 'installments' && !installFirstDate) { setError('Seleccioná la fecha del primer vencimiento'); return }
      if (remainderType === 'installments' && installFirstDate && downPaymentDate >= installFirstDate) { setError('La fecha de la primera cuota debe ser posterior al pago inicial'); return }
    } else if (withInstallments && !installFirstDate) {
      setError('Seleccioná la fecha del primer vencimiento')
      return
    }
    if (!form.clientId) { setError('Seleccioná un cliente'); return }
    setError('')
    setLoading(true)
    try {
      const hasDiscount = Boolean(discountValue) && parseFloat(discountValue) > 0
      const payload = {
        title: form.title,
        clientId: form.clientId,
        projectId: form.projectId || undefined,
        validUntil:   form.validUntil   || undefined,
        deliveryDate: form.deliveryDate || undefined,
        taxRate: parseFloat(form.taxRate) || 0,
        currency: form.currency,
        notes: form.notes || undefined,
        items,
        discountType:  hasDiscount ? discountMode : null,
        discountValue: hasDiscount ? parseFloat(discountValue) : 0,
        ...(form.status ? { status: form.status } : {})
      }
      if (isEditing) {
        await updateQuote(quoteId, payload)
        toast('Presupuesto actualizado', 'success')
      } else {
        const res = await createQuote(payload)
        const newId = res.data.data?.id
        if (newId && withDownPayment) {
          const dpAmt = effectiveDownPayment
          const remaining = parseFloat((total - dpAmt).toFixed(2))
          const payments = [{ amount: dpAmt, dueDate: downPaymentDate }]
          if (remainderType === 'second') {
            payments.push({ amount: remaining, dueDate: secondPaymentDate })
          } else {
            const n = parseInt(installCount)
            const perInstall = parseFloat((remaining / n).toFixed(2))
            const diff = parseFloat((remaining - perInstall * n).toFixed(2))
            for (let i = 0; i < n; i++) {
              const d = new Date(installFirstDate)
              d.setMonth(d.getMonth() + i)
              payments.push({ amount: i === n - 1 ? parseFloat((perInstall + diff).toFixed(2)) : perInstall, dueDate: d.toISOString().slice(0, 10) })
            }
          }
          await createCustomInstallments({ quoteId: newId, payments })
        } else if (newId && withInstallments) {
          await createInstallments({ quoteId: newId, count: parseInt(installCount), firstDueDate: installFirstDate })
        }
        toast('Presupuesto creado', 'success')
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-surface/60 backdrop-blur-xl rounded-t-2xl sm:rounded-xl shadow-lg w-full sm:max-w-2xl sm:mx-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="shrink-0 bg-surface/80 backdrop-blur-xl border-b border-line px-5 py-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-fg">
            {isEditing ? 'Editar presupuesto' : 'Nuevo presupuesto'}
            {quoteData && <span className="ml-2 text-sm font-normal text-fg-muted">#{quoteData.number}</span>}
          </h3>
          <button type="button" onClick={onClose} className="text-fg-muted hover:text-fg text-xl leading-none">×</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
        <form id="quote-form" onSubmit={handleSubmit} className="p-5 space-y-4">
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

          <div>
            <label className={labelCls}>Título *</label>
            <input type="text" required value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={inputCls} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Válido hasta</label>
              <DatePicker value={form.validUntil}
                onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fecha de entrega</label>
              <DatePicker value={form.deliveryDate}
                onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))}
                className={inputCls} />
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
              <LineItemsEditor items={items} onChange={setItems} products={productsData ?? []} />
            </div>
          </div>

          {/* Descuento */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls + ' mb-0'}>Descuento</label>
              <div className="flex rounded-md overflow-hidden border border-line text-xs">
                <button type="button" onClick={() => setDiscountMode('percent')}
                  className={`px-2 py-0.5 font-medium transition-colors ${discountMode === 'percent' ? 'bg-brand text-white' : 'bg-surface text-fg-soft hover:bg-raised'}`}>
                  %
                </button>
                <button type="button" onClick={() => setDiscountMode('amount')}
                  className={`px-2 py-0.5 font-medium transition-colors ${discountMode === 'amount' ? 'bg-brand text-white' : 'bg-surface text-fg-soft hover:bg-raised'}`}>
                  Monto
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                type="number" min="0" step="0.01"
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
                className={inputCls + (discountMode === 'percent' ? ' pr-7' : '')}
                placeholder="0"
              />
              {discountMode === 'percent' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-fg-muted pointer-events-none">%</span>
              )}
            </div>
          </div>

          <div className="bg-raised rounded-lg p-3 text-sm space-y-1 text-right">
            <div className="text-fg-soft">Subtotal: <span className="text-fg font-medium">${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            {discountAmt > 0 && (
              <div className="text-fg-soft">
                Descuento{discountMode === 'percent' ? ` (${discountValue}%)` : ''}:
                <span className="text-emerald-600 font-medium ml-1">
                  -${discountAmt.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
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

          {/* Pagos — solo al crear */}
          {!isEditing && (
            <div className="border border-line rounded-lg overflow-hidden">
              {/* Pago inicial */}
              <button
                type="button"
                onClick={() => { setWithDownPayment(v => !v); setWithInstallments(false) }}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-fg-soft hover:bg-raised transition-colors"
              >
                <span>Pago inicial (anticipo)</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${withDownPayment ? 'bg-brand text-white' : 'bg-raised text-fg-muted'}`}>
                  {withDownPayment ? 'Activado' : 'Opcional'}
                </span>
              </button>

              {withDownPayment && (
                <div className="border-t border-line bg-raised px-4 pt-3 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={labelCls + ' mb-0'}>Anticipo</label>
                        <div className="flex rounded-md overflow-hidden border border-line text-xs">
                          <button type="button" onClick={() => setDownPaymentMode('amount')}
                            className={`px-2 py-0.5 font-medium transition-colors ${downPaymentMode === 'amount' ? 'bg-brand text-white' : 'bg-surface text-fg-soft hover:bg-raised'}`}>
                            Monto
                          </button>
                          <button type="button" onClick={() => setDownPaymentMode('percent')}
                            className={`px-2 py-0.5 font-medium transition-colors ${downPaymentMode === 'percent' ? 'bg-brand text-white' : 'bg-surface text-fg-soft hover:bg-raised'}`}>
                            %
                          </button>
                        </div>
                      </div>
                      {downPaymentMode === 'amount' ? (
                        <input
                          type="number" min="0" step="0.01"
                          value={downPaymentAmount}
                          onChange={e => setDownPaymentAmount(e.target.value)}
                          className={inputCls}
                          placeholder="0.00"
                        />
                      ) : (
                        <div>
                          <div className="relative">
                            <input
                              type="number" min="0" max="100" step="1"
                              value={downPaymentPercent}
                              onChange={e => setDownPaymentPercent(e.target.value)}
                              className={inputCls + ' pr-7'}
                              placeholder="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-fg-muted pointer-events-none">%</span>
                          </div>
                          {parseFloat(downPaymentPercent) > 0 && total > 0 && (
                            <p className="text-xs text-fg-muted mt-1">
                              = {form.currency} {effectiveDownPayment.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>Fecha de pago</label>
                      <DatePicker
                        value={downPaymentDate}
                        onChange={e => setDownPaymentDate(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {effectiveDownPayment > 0 && effectiveDownPayment < total && (
                    <p className="text-xs text-fg-muted">
                      Saldo restante: <span className="font-semibold text-fg">
                        {form.currency} {(total - effectiveDownPayment).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </p>
                  )}

                  {/* Cómo pagar el saldo restante */}
                  <div>
                    <p className="text-xs font-medium text-fg-soft mb-2">Saldo restante</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRemainderType('second')}
                        className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${remainderType === 'second' ? 'border-brand bg-brand-subtle text-brand' : 'border-line text-fg-soft hover:bg-raised'}`}
                      >
                        Segundo pago
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemainderType('installments')}
                        className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${remainderType === 'installments' ? 'border-brand bg-brand-subtle text-brand' : 'border-line text-fg-soft hover:bg-raised'}`}
                      >
                        En cuotas
                      </button>
                    </div>
                  </div>

                  {remainderType === 'second' && (
                    <div>
                      <label className={labelCls}>Fecha del segundo pago</label>
                      <DatePicker
                        value={secondPaymentDate}
                        onChange={e => setSecondPaymentDate(e.target.value)}
                        className={inputCls}
                      />
                      {secondPaymentDate && downPaymentDate && downPaymentDate >= secondPaymentDate && (
                        <p className="text-xs text-danger mt-1">Debe ser posterior al pago inicial</p>
                      )}
                    </div>
                  )}

                  {remainderType === 'installments' && (
                    <div className="grid grid-cols-2 gap-3">
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
                        {installFirstDate && downPaymentDate && downPaymentDate >= installFirstDate && (
                          <p className="text-xs text-danger mt-1">Debe ser posterior al pago inicial</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cuotas simples — solo si no hay pago inicial */}
              {!withDownPayment && (
                <>
                  <button
                    type="button"
                    onClick={() => setWithInstallments(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-fg-soft hover:bg-raised transition-colors border-t border-line"
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
                </>
              )}
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
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
                total={total}
              />
            </div>
          </div>
        )}
        </div>{/* end scrollable body */}

        {/* Footer fijo */}
        <div className="shrink-0 border-t border-line px-5 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 sm:py-2 text-sm text-fg-soft hover:text-fg border border-line-soft rounded-md sm:border-none">Cancelar</button>
          <button type="submit" form="quote-form" disabled={loading} className="px-4 py-2.5 sm:py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
