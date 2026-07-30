import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createQuote } from '../../api/quotes'
import { getOrganizations } from '../../api/organizations'
import { createInstallments, createCustomInstallments } from '../../api/installments'
import DatePicker from '../../components/DatePicker'
import LineItemsEditor from '../../components/LineItemsEditor'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'

const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: 0, amount: 0 }

const inputCls = "w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
const labelCls = "block text-sm font-medium text-fg-soft mb-1"

export default function QuoteModalPotential({ onClose, onSaved }) {
  const { user } = useAuth()
  const toast = useToast()

  // ── Cliente potencial ─────────────────────────────────────
  const [client, setClient] = useState({
    name: '', email: '', company: ''
  })

  // ── Proyecto (opcional) ───────────────────────────────────
  const [withProject, setWithProject] = useState(false)
  const [projectTitle, setProjectTitle] = useState('')

  // ── Presupuesto ───────────────────────────────────────────
  const [quote, setQuote] = useState({
    title: '', validUntil: '', taxRate: 21, notes: '', currency: 'USD'
  })
  const [items, setItems] = useState([EMPTY_ITEM])

  // ── Pago inicial ──────────────────────────────────────────
  const [withDownPayment, setWithDownPayment] = useState(false)
  const [downPaymentMode, setDownPaymentMode] = useState('amount') // 'amount' | 'percent'
  const [downPaymentAmount, setDownPaymentAmount] = useState('')
  const [downPaymentPercent, setDownPaymentPercent] = useState('')
  const [downPaymentDate, setDownPaymentDate] = useState('')
  const [remainderType, setRemainderType] = useState('second')
  const [secondPaymentDate, setSecondPaymentDate] = useState('')

  // ── Cuotas ────────────────────────────────────────────────
  const [withInstallments, setWithInstallments] = useState(false)
  const [installCount, setInstallCount] = useState(2)
  const [installFirstDate, setInstallFirstDate] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Moneda de la org
  const orgId = user?.org
  const { data: orgData } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganizations().then(r => r.data.data?.find(o => o.id === orgId)),
    enabled: Boolean(orgId),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (orgData?.defaultCurrency) {
      setQuote(q => ({ ...q, currency: orgData.defaultCurrency }))
    }
  }, [orgData])

  const subtotal = items.reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0)
  const taxAmount = subtotal * (parseFloat(quote.taxRate) / 100)
  const total = subtotal + taxAmount
  const effectiveDownPayment = downPaymentMode === 'amount'
    ? parseFloat(downPaymentAmount) || 0
    : parseFloat((total * (parseFloat(downPaymentPercent) || 0) / 100).toFixed(2))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!client.name.trim()) { setError('El nombre del cliente es obligatorio'); return }
    if (!quote.title.trim()) { setError('El título del presupuesto es obligatorio'); return }
    if (withProject && !projectTitle.trim()) { setError('El nombre del proyecto es obligatorio'); return }
    if (items.some(i => !i.description.trim())) { setError('Todos los ítems deben tener descripción'); return }
    if (withDownPayment) {
      if (!effectiveDownPayment || effectiveDownPayment <= 0) { setError('Ingresá el monto del pago inicial'); return }
      if (!downPaymentDate) { setError('Ingresá la fecha del pago inicial'); return }
      if (effectiveDownPayment >= total) { setError('El pago inicial no puede ser igual o mayor al total'); return }
      if (remainderType === 'second' && !secondPaymentDate) { setError('Ingresá la fecha del segundo pago'); return }
      if (remainderType === 'installments' && !installFirstDate) { setError('Seleccioná la fecha del primer vencimiento'); return }
    } else if (withInstallments && !installFirstDate) { setError('Seleccioná la fecha del primer vencimiento'); return }

    setError('')
    setLoading(true)
    try {
      const res = await createQuote({
        title: quote.title.trim(),
        validUntil: quote.validUntil || undefined,
        taxRate: parseFloat(quote.taxRate) || 0,
        currency: quote.currency,
        notes: quote.notes.trim() || undefined,
        items,
        potentialClientName: client.name.trim(),
        potentialClientEmail: client.email.trim() || undefined,
        potentialClientCompany: client.company.trim() || undefined,
        potentialProjectTitle: withProject ? projectTitle.trim() : undefined,
      })
      const newQuoteId = res.data.data?.id

      if (newQuoteId && withDownPayment) {
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
        await createCustomInstallments({ quoteId: newQuoteId, payments })
      } else if (newQuoteId && withInstallments) {
        await createInstallments({
          quoteId: newQuoteId,
          count: parseInt(installCount),
          firstDueDate: installFirstDate,
        })
      }

      toast('Presupuesto creado', 'success')
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

        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur-xl border-b border-line px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-fg">Nuevo presupuesto</h3>
            <p className="text-xs text-fg-muted mt-0.5">El cliente y proyecto se crearán al aprobar el presupuesto</p>
          </div>
          <button type="button" onClick={onClose} className="text-fg-muted hover:text-fg text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">

          {/* ── Sección: Cliente potencial ── */}
          <section>
            <h4 className="text-xs font-semibold text-fg-muted uppercase tracking-widest mb-3">
              Datos del cliente
            </h4>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Nombre *</label>
                <input
                  type="text" required value={client.name}
                  onChange={e => setClient(c => ({ ...c, name: e.target.value }))}
                  className={inputCls} placeholder="Ej: Juan García"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Empresa</label>
                  <input
                    type="text" value={client.company}
                    onChange={e => setClient(c => ({ ...c, company: e.target.value }))}
                    className={inputCls} placeholder="Ej: García & Co."
                  />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    type="email" value={client.email}
                    onChange={e => setClient(c => ({ ...c, email: e.target.value }))}
                    className={inputCls} placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Proyecto (toggle) ── */}
          <section>
            <div className="border border-line rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setWithProject(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-fg-soft hover:bg-raised transition-colors"
              >
                <span>Asociar a un proyecto</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${withProject ? 'bg-brand text-white' : 'bg-raised text-fg-muted'}`}>
                  {withProject ? 'Activado' : 'Opcional'}
                </span>
              </button>
              {withProject && (
                <div className="px-4 pb-4 pt-1 border-t border-line bg-raised">
                  <label className={labelCls}>Nombre del proyecto *</label>
                  <input
                    type="text" value={projectTitle}
                    onChange={e => setProjectTitle(e.target.value)}
                    className={inputCls} placeholder="Ej: Rediseño web 2026"
                  />
                </div>
              )}
            </div>
          </section>

          {/* ── Presupuesto ── */}
          <section>
            <h4 className="text-xs font-semibold text-fg-muted uppercase tracking-widest mb-3">
              Presupuesto
            </h4>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Título *</label>
                <input
                  type="text" required value={quote.title}
                  onChange={e => setQuote(q => ({ ...q, title: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Válido hasta</label>
                  <DatePicker
                    value={quote.validUntil}
                    onChange={e => setQuote(q => ({ ...q, validUntil: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>IVA (%)</label>
                  <input
                    type="number" min="0" max="100" step="1"
                    value={quote.taxRate}
                    onChange={e => setQuote(q => ({ ...q, taxRate: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Ítems *</label>
                <div className="border border-line rounded-lg p-3 bg-raised">
                  <LineItemsEditor items={items} onChange={setItems} />
                </div>
              </div>

              {/* Totales */}
              <div className="bg-raised rounded-lg p-3 text-sm space-y-1 text-right">
                <div className="text-fg-soft">
                  Subtotal: <span className="text-fg font-medium">
                    ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {quote.taxRate > 0 && (
                  <div className="text-fg-soft">
                    IVA ({quote.taxRate}%): <span className="text-fg font-medium">
                      ${taxAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="text-base font-semibold text-fg">
                  Total {quote.currency}: ${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <label className={labelCls}>Notas</label>
                <textarea
                  rows={2} value={quote.notes}
                  onChange={e => setQuote(q => ({ ...q, notes: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          {/* ── Pagos ── */}
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
                            = {quote.currency} {effectiveDownPayment.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      {quote.currency} {(total - effectiveDownPayment).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </p>
                )}

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

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 pb-1">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2.5 sm:py-2 text-sm text-fg-soft hover:text-fg border border-line-soft rounded-md sm:border-none"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={loading}
              className="px-4 py-2.5 sm:py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Crear presupuesto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
