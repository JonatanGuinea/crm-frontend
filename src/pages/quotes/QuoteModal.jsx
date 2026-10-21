import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getClients } from '../../api/clients'
import { getProjects } from '../../api/projects'
import { getQuoteById, createQuote, updateQuote, getNextQuoteNumber, uploadQuoteImage, updateQuoteImage, deleteQuoteImage, createQuoteNote, updateQuoteNote, deleteQuoteNote } from '../../api/quotes'
import { getOrganizations } from '../../api/organizations'
import { getProducts } from '../../api/stock'
import { createInstallments, createCustomInstallments } from '../../api/installments'
import DatePicker from '../../components/DatePicker'
import LineItemsEditor from '../../components/LineItemsEditor'
import InstallmentsPanel from '../../components/InstallmentsPanel'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'
import { MasIcon } from '../../components/DuIcons'
import { imgUrl } from '../../utils/imgUrl.js'
import { fmt } from '../../utils/fmt'
const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: 0, amount: 0 }
const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', err: '#E58373' }

function TrashSvg() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
}
function PhotoSvg() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
}

const inputCls = "du-input"
const labelCls = "block text-sm font-medium text-fg-soft mb-1"

export default function QuoteModal({ quoteId, onClose, onSaved, initialClientId = '', initialProjectId = '' }) {
  const isEditing = Boolean(quoteId)
  const { user } = useAuth()
  const canWrite = user?.role !== 'member'

  const [form, setForm] = useState({
    number: '', title: '', clientId: initialClientId, projectId: initialProjectId,
    validUntil: '', deliveryDate: '', paymentDueDate: '', taxRate: 21, currency: 'USD', notes: '', status: ''
  })
  const toast = useToast()
  const [items, setItems] = useState([EMPTY_ITEM])
  const [loading, setLoading] = useState(false)

  // Imágenes
  // existingImages: { id, storedName, url, title, description, _deleted, _titleOrig, _descOrig }
  // newImages:      { key, file, previewUrl, title, description }
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages]           = useState([])
  const imgFileRef = useRef(null)

  // Notas
  // existingNotes: { id, title, description, _deleted, _titleOrig, _descOrig }
  // newNotes:      { key, title, description }
  const [existingNotes, setExistingNotes] = useState([])
  const [newNotes, setNewNotes]           = useState([])

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
    queryFn: () => getProducts({ limit: 200, inventoryType: 'sale' }).then(r => r.data.data?.items ?? []),
    staleTime: 5 * 60 * 1000,
  })

  const { data: nextNumberData } = useQuery({
    queryKey: ['quote-next-number'],
    queryFn: () => getNextQuoteNumber().then(r => r.data.data),
    enabled: !isEditing,
    staleTime: 0,
  })

  useEffect(() => {
    if (!isEditing && orgData?.defaultCurrency) {
      setForm(f => ({ ...f, currency: orgData.defaultCurrency }))
    }
  }, [orgData, isEditing])

  useEffect(() => {
    if (!isEditing && nextNumberData?.nextNumber !== undefined) {
      setForm(f => ({ ...f, number: String(nextNumberData.nextNumber) }))
    }
  }, [nextNumberData, isEditing])

  useEffect(() => {
    if (quoteData) {
      setForm({
        number: String(quoteData.number),
        title: quoteData.title,
        clientId: quoteData.clientId,
        projectId: quoteData.projectId || '',
        validUntil:      quoteData.validUntil?.slice(0, 10)      || '',
        deliveryDate:    quoteData.deliveryDate?.slice(0, 10)    || '',
        paymentDueDate:  quoteData.paymentDueDate?.slice(0, 10)  || '',
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
      setExistingImages((quoteData.images ?? []).map(img => ({
        ...img,
        _deleted: false,
        _titleOrig: img.title ?? '',
        _descOrig:  img.description ?? '',
      })))
      setExistingNotes((quoteData.quoteNotes ?? []).map(n => ({
        ...n,
        _deleted:   false,
        _titleOrig: n.title ?? '',
        _descOrig:  n.description ?? '',
      })))
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
    if (items.some(i => !i.description.trim())) return toast('Todos los ítems deben tener descripción', 'error')
    if (withDownPayment) {
      if (!effectiveDownPayment || effectiveDownPayment <= 0) return toast('Ingresá el monto del pago inicial', 'error')
      if (!downPaymentDate) return toast('Ingresá la fecha del pago inicial', 'error')
      if (effectiveDownPayment >= total) return toast('El pago inicial no puede ser igual o mayor al total', 'error')
      if (remainderType === 'second' && !secondPaymentDate) return toast('Ingresá la fecha del segundo pago', 'error')
      if (remainderType === 'second' && secondPaymentDate && downPaymentDate >= secondPaymentDate) return toast('La fecha del segundo pago debe ser posterior al pago inicial', 'error')
      if (remainderType === 'installments' && !installFirstDate) return toast('Seleccioná la fecha del primer vencimiento', 'error')
      if (remainderType === 'installments' && installFirstDate && downPaymentDate >= installFirstDate) return toast('La fecha de la primera cuota debe ser posterior al pago inicial', 'error')
    } else if (withInstallments && !installFirstDate) {
      return toast('Seleccioná la fecha del primer vencimiento', 'error')
    }
    if (!form.clientId) return toast('Seleccioná un cliente', 'error')
    setLoading(true)
    try {
      const hasDiscount = Boolean(discountValue) && parseFloat(discountValue) > 0
      const payload = {
        number: parseInt(form.number),
        title: form.title,
        clientId: form.clientId,
        projectId: form.projectId || undefined,
        validUntil:      form.validUntil      || undefined,
        deliveryDate:    form.deliveryDate    || undefined,
        paymentDueDate:  form.paymentDueDate  || undefined,
        taxRate: parseFloat(form.taxRate) || 0,
        currency: form.currency,
        notes: form.notes || undefined,
        items,
        discountType:  hasDiscount ? discountMode : null,
        discountValue: hasDiscount ? parseFloat(discountValue) : 0,
        ...(form.status ? { status: form.status } : {})
      }
      let savedId = quoteId
      if (isEditing) {
        await updateQuote(quoteId, payload)
      } else {
        const res = await createQuote(payload)
        savedId = res.data.data?.id
      }

      // Operaciones de imágenes
      if (savedId) {
        // Nuevas imágenes
        for (const img of newImages) {
          const fd = new FormData()
          fd.append('file', img.file)
          if (img.title.trim())       fd.append('title', img.title.trim())
          if (img.description.trim()) fd.append('description', img.description.trim())
          await uploadQuoteImage(savedId, fd)
        }
        // Imágenes existentes modificadas o borradas
        for (const img of existingImages) {
          if (img._deleted) {
            await deleteQuoteImage(img.id)
          } else {
            const titleChanged = (img.title ?? '') !== img._titleOrig
            const descChanged  = (img.description ?? '') !== img._descOrig
            if (titleChanged || descChanged) {
              await updateQuoteImage(img.id, { title: img.title, description: img.description })
            }
          }
        }

        // Nuevas notas
        for (const note of newNotes) {
          if (note.description.trim()) {
            await createQuoteNote(savedId, { title: note.title.trim() || undefined, description: note.description.trim() })
          }
        }
        // Notas existentes modificadas o borradas
        for (const note of existingNotes) {
          if (note._deleted) {
            await deleteQuoteNote(note.id)
          } else {
            const titleChanged = (note.title ?? '') !== note._titleOrig
            const descChanged  = (note.description ?? '') !== note._descOrig
            if (titleChanged || descChanged) {
              await updateQuoteNote(note.id, { title: note.title, description: note.description })
            }
          }
        }
      }

      // Limpiar previews
      newImages.forEach(img => URL.revokeObjectURL(img.previewUrl))

      if (isEditing) {
        toast('Presupuesto actualizado', 'success')
      } else {
        const newId = savedId
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
      toast(err.response?.data?.error || err.message || 'Error al guardar', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="shadow-2xl w-full sm:max-w-2xl sm:mx-4 max-h-[92vh] flex flex-col" style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0' }}>
        {/* Header */}
        <div className="shrink-0 border-b border-line px-5 py-4 flex items-center justify-between">
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

          <div className="grid grid-cols-[100px_1fr] gap-3">
            <div>
              <label className={labelCls}>N°</label>
              <input type="number" min="1" step="1" required value={form.number}
                onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Título *</label>
              <input type="text" required value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className={inputCls} />
            </div>
          </div>

        <div className={`grid gap-3 ${isEditing ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
            <div>
              <label className={labelCls}>Válido hasta</label>
              <DatePicker value={form.validUntil}
                onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fecha de entrega de pedido</label>
              <DatePicker value={form.deliveryDate}
                onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))}
                className={inputCls} />
            </div>
            </div>
        <div className={`grid gap-3 ${isEditing ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
            {isEditing && (
              <div>
                <label className={labelCls}>Fecha de pago</label>
                <DatePicker value={form.paymentDueDate}
                  onChange={e => setForm(f => ({ ...f, paymentDueDate: e.target.value }))}
                  className={inputCls} />
              </div>
            )}
            <div>
              <label className={labelCls}>IVA (%)</label>
              <input type="number" min="0" max="100" step="1" value={form.taxRate}
                onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))}
                className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Ítems *</label>
            <div className="border border-line rounded-lg p-3 bg-raised">
              <LineItemsEditor items={items} onChange={setItems} products={productsData ?? []} currency={form.currency} />
            </div>
          </div>

          {/* Descuento */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls + ' mb-0'}>Descuento</label>
              <div className="flex rounded-md overflow-hidden border border-line text-xs">
                <button type="button" onClick={() => setDiscountMode('percent')}
                  className={`px-2 py-0.5 font-medium transition-colors ${discountMode === 'percent' ? 'bg-brand text-base' : 'bg-surface text-fg-soft hover:bg-raised'}`}>
                  %
                </button>
                <button type="button" onClick={() => setDiscountMode('amount')}
                  className={`px-2 py-0.5 font-medium transition-colors ${discountMode === 'amount' ? 'bg-brand text-base' : 'bg-surface text-fg-soft hover:bg-raised'}`}>
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
            <div className="text-fg-soft">Subtotal: <span className="text-fg font-medium">{fmt(subtotal, form.currency)}</span></div>
            {discountAmt > 0 && (
              <div className="text-fg-soft">
                Descuento{discountMode === 'percent' ? ` (${discountValue}%)` : ''}:
                <span className="text-success font-medium ml-1">
                  -{fmt(discountAmt, form.currency)}
                </span>
              </div>
            )}
            {form.taxRate > 0 && (
              <div className="text-fg-soft">IVA ({form.taxRate}%): <span className="text-fg font-medium">{fmt(taxAmount, form.currency)}</span></div>
            )}
            <div className="text-base font-semibold text-fg">Total: {fmt(total, form.currency)}</div>
          </div>

          {/* Notas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls + ' mb-0'}>Notas</label>
              <button
                type="button"
                onClick={() => setNewNotes(prev => [...prev, { key: crypto.randomUUID(), title: '', description: '' }])}
                className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
              style={{ color: C.arena }}
              >
                <MasIcon style={{ width: 12, height: 12 }} /> Agregar nota
              </button>
            </div>

            {/* Notas existentes */}
            {existingNotes.filter(n => !n._deleted).length > 0 && (
              <div className="space-y-2 mb-2">
                {existingNotes.filter(n => !n._deleted).map(note => (
                  <div key={note.id} className="rounded-lg border border-line bg-raised p-3 space-y-2">
                    <input
                      type="text"
                      value={note.title ?? ''}
                      onChange={e => setExistingNotes(prev => prev.map(n => n.id === note.id ? { ...n, title: e.target.value } : n))}
                      placeholder="Título (opcional)"
                      className="du-input w-full" style={{ height: 'auto', minHeight: 34, padding: '6px 12px', fontSize: 13, borderRadius: '0 8px 8px 0' }}
                    />
                    <textarea
                      ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
                      value={note.description ?? ''}
                      onChange={e => {
                        e.target.style.height = 'auto'
                        e.target.style.height = e.target.scrollHeight + 'px'
                        setExistingNotes(prev => prev.map(n => n.id === note.id ? { ...n, description: e.target.value } : n))
                      }}
                      placeholder="Descripción *"
                      rows={1}
                      className="w-full resize-none overflow-hidden outline-none font-[inherit]" style={{ background: C.bg, border: `1px solid ${C.linea}`, borderRadius: '0 8px 8px 0', color: C.crema, fontSize: 13, padding: '6px 12px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setExistingNotes(prev => prev.map(n => n.id === note.id ? { ...n, _deleted: true } : n))}
                      className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: C.err }}
                    >
                      <TrashSvg /> Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Nuevas notas pendientes */}
            {newNotes.length > 0 && (
              <div className="space-y-2 mb-2">
                {newNotes.map(note => (
                  <div key={note.key} className="p-3 space-y-2" style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 12px 12px 0' }}>
                    <input
                      type="text"
                      value={note.title}
                      onChange={e => setNewNotes(prev => prev.map(n => n.key === note.key ? { ...n, title: e.target.value } : n))}
                      placeholder="Título (opcional)"
                      className="du-input w-full" style={{ height: 'auto', minHeight: 34, padding: '6px 12px', fontSize: 13, borderRadius: '0 8px 8px 0' }}
                    />
                    <textarea
                      ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
                      value={note.description}
                      onChange={e => {
                        e.target.style.height = 'auto'
                        e.target.style.height = e.target.scrollHeight + 'px'
                        setNewNotes(prev => prev.map(n => n.key === note.key ? { ...n, description: e.target.value } : n))
                      }}
                      placeholder="Descripción *"
                      rows={1}
                      className="w-full resize-none overflow-hidden outline-none font-[inherit]" style={{ background: C.bg, border: `1px solid ${C.linea}`, borderRadius: '0 8px 8px 0', color: C.crema, fontSize: 13, padding: '6px 12px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setNewNotes(prev => prev.filter(n => n.key !== note.key))}
                      className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: C.err }}
                    >
                      <TrashSvg /> Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {existingNotes.filter(n => !n._deleted).length === 0 && newNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-4 rounded-lg border border-dashed border-line text-fg-muted gap-1">
                <p className="text-xs">Sin notas — hacé clic en "Agregar nota"</p>
              </div>
            )}
          </div>

          {/* Imágenes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls + ' mb-0'}>Imágenes</label>
              <button
                type="button"
                onClick={() => imgFileRef.current?.click()}
                className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
              style={{ color: C.arena }}
              >
                <MasIcon style={{ width: 12, height: 12 }} /> Agregar imagen
              </button>
              <input
                ref={imgFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setNewImages(prev => [...prev, {
                    key: crypto.randomUUID(),
                    file,
                    previewUrl: URL.createObjectURL(file),
                    title: '',
                    description: '',
                  }])
                  e.target.value = ''
                }}
              />
            </div>

            {/* Imágenes existentes (edición) */}
            {existingImages.filter(img => !img._deleted).length > 0 && (
              <div className="space-y-3 mb-2">
                {existingImages.filter(img => !img._deleted).map(img => (
                  <div key={img.id} className="rounded-lg border border-line overflow-hidden">
                    <img
                      src={imgUrl(img.url)}
                      alt={img.title || ''}
                      className="w-full h-auto block"
                    />
                    <div className="p-2 bg-raised space-y-1.5">
                      <input
                        type="text"
                        value={img.title ?? ''}
                        onChange={e => setExistingImages(prev => prev.map(i => i.id === img.id ? { ...i, title: e.target.value } : i))}
                        placeholder="Título"
                        className="du-input w-full" style={{ height: 'auto', minHeight: 30, padding: '5px 10px', fontSize: 12, borderRadius: '0 7px 7px 0' }}
                      />
                      <textarea
                        value={img.description ?? ''}
                        onChange={e => setExistingImages(prev => prev.map(i => i.id === img.id ? { ...i, description: e.target.value } : i))}
                        placeholder="Descripción"
                        rows={2}
                        className="w-full resize-none outline-none font-[inherit]" style={{ background: C.bg, border: `1px solid ${C.linea}`, borderRadius: '0 7px 7px 0', color: C.crema, fontSize: 12, padding: '5px 10px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setExistingImages(prev => prev.map(i => i.id === img.id ? { ...i, _deleted: true } : i))}
                        className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
                        title="Eliminar"
                        style={{ color: C.err }}
                      >
                        <TrashSvg /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Nuevas imágenes pendientes */}
            {newImages.length > 0 && (
              <div className="space-y-3 mb-2">
                {newImages.map(img => (
                  <div key={img.key} className="overflow-hidden" style={{ border: `1px solid ${C.linea}`, borderRadius: '0 12px 12px 0' }}>
                    <img
                      src={img.previewUrl}
                      alt=""
                      className="w-full h-auto block"
                    />
                    <div className="p-2 space-y-1.5" style={{ background: C.s2 }}>
                      <input
                        type="text"
                        value={img.title}
                        onChange={e => setNewImages(prev => prev.map(i => i.key === img.key ? { ...i, title: e.target.value } : i))}
                        placeholder="Título"
                        className="du-input w-full" style={{ height: 'auto', minHeight: 30, padding: '5px 10px', fontSize: 12, borderRadius: '0 7px 7px 0' }}
                      />
                      <textarea
                        value={img.description}
                        onChange={e => setNewImages(prev => prev.map(i => i.key === img.key ? { ...i, description: e.target.value } : i))}
                        placeholder="Descripción"
                        rows={2}
                        className="w-full resize-none outline-none font-[inherit]" style={{ background: C.bg, border: `1px solid ${C.linea}`, borderRadius: '0 7px 7px 0', color: C.crema, fontSize: 12, padding: '5px 10px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(img.previewUrl)
                          setNewImages(prev => prev.filter(i => i.key !== img.key))
                        }}
                        className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
                        title="Quitar"
                        style={{ color: C.err }}
                      >
                        <TrashSvg /> Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {existingImages.filter(img => !img._deleted).length === 0 && newImages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-5 rounded-lg border border-dashed border-line text-fg-muted gap-1.5">
                <PhotoSvg />
                <p className="text-xs">Sin imágenes — hacé clic en "Agregar imagen"</p>
              </div>
            )}
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
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${withDownPayment ? 'bg-brand text-base' : 'bg-raised text-fg-muted'}`}>
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
                            className={`px-2 py-0.5 font-medium transition-colors ${downPaymentMode === 'amount' ? 'bg-brand text-base' : 'bg-surface text-fg-soft hover:bg-raised'}`}>
                            Monto
                          </button>
                          <button type="button" onClick={() => setDownPaymentMode('percent')}
                            className={`px-2 py-0.5 font-medium transition-colors ${downPaymentMode === 'percent' ? 'bg-brand text-base' : 'bg-surface text-fg-soft hover:bg-raised'}`}>
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
                              = {fmt(effectiveDownPayment, form.currency)}
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
                        {fmt(total - effectiveDownPayment, form.currency)}
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
                        className="flex-1 py-2 text-xs font-medium transition-colors"
                        style={remainderType === 'second'
                          ? { border: `1px solid rgba(242,237,227,.35)`, background: 'rgba(242,237,227,.06)', color: C.crema, borderRadius: '0 8px 8px 0' }
                          : { border: `1px solid ${C.linea}`, color: C.piedra, borderRadius: '0 8px 8px 0' }}
                      >
                        Segundo pago
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemainderType('installments')}
                        className="flex-1 py-2 text-xs font-medium transition-colors"
                        style={remainderType === 'installments'
                          ? { border: `1px solid rgba(242,237,227,.35)`, background: 'rgba(242,237,227,.06)', color: C.crema, borderRadius: '0 8px 8px 0' }
                          : { border: `1px solid ${C.linea}`, color: C.piedra, borderRadius: '0 8px 8px 0' }}
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

              {/* Fecha de pago única — solo si no hay anticipo ni cuotas */}
              {!withDownPayment && !withInstallments && (
                <div className="px-4 py-3 border-t border-line">
                  <label className={labelCls}>Fecha de pago</label>
                  <DatePicker
                    value={form.paymentDueDate}
                    onChange={e => setForm(f => ({ ...f, paymentDueDate: e.target.value }))}
                    className={inputCls}
                  />
                  <p className="text-xs text-fg-muted mt-1">Se enviará un recordatorio al cliente el día del pago.</p>
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
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${withInstallments ? 'bg-brand text-base' : 'bg-raised text-fg-muted'}`}>
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
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm transition-colors" style={{ color: C.arena }}>Cancelar</button>
          <button type="submit" form="quote-form" disabled={loading} className="du-btn-pri disabled:opacity-50" style={{ width: 'auto', height: 38, paddingInline: 20, fontSize: 14 }}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
