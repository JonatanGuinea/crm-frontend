import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicQuote, getPublicQuotePdfUrl, confirmQuote } from '../../api/public'
import { ArrowDownTrayIcon, CheckCircleIcon, CheckIcon, ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline'
import ProvinceSelect from '../../components/ProvinceSelect'
import PhoneInput, { PHONE_COUNTRIES, checkPhone } from '../../components/PhoneInput'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '')

const STATUS_INST = { pending: 'Pendiente', paid: 'Pagado', overdue: 'Vencido' }
const STATUS_INST_COLORS = {
  pending: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  paid:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  overdue: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
}

const fmt     = (n) => Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-AR') : '—'

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 placeholder:text-zinc-400"
const labelCls = "block text-xs font-semibold text-zinc-500 mb-1"

export default function QuotePublicPage() {
  const { id } = useParams()

  const [confirmStep, setConfirmStep] = useState(null) // null | 'modal' | 'form' | 'signature' | 'success'
  const [clientForm, setClientForm] = useState({
    name: '', company: '', email: '', website: '',
    cuit: '', address: '', province: '', city: '', postalCode: '', notes: ''
  })
  const [phoneCountry, setPhoneCountry] = useState('AR')
  const [phoneNumber, setPhoneNumber]   = useState('')
  const [phoneValid, setPhoneValid]     = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmError, setConfirmError]     = useState('')
  const [signatureImg, setSignatureImg]     = useState(null)

  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ['public-quote', id],
    queryFn: () => getPublicQuote(id).then(r => r.data.data),
    retry: false
  })

  useEffect(() => {
    if (quote) {
      setClientForm(f => ({
        ...f,
        name:    quote.potentialClientName    || '',
        email:   quote.potentialClientEmail   || '',
        company: quote.potentialClientCompany || '',
      }))
    }
  }, [quote])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !quote) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-zinc-100 dark:bg-zinc-950 text-zinc-500">
        <p className="text-4xl">🔍</p>
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">Presupuesto no encontrado</p>
        <p className="text-sm">El enlace puede ser incorrecto o haber expirado.</p>
      </div>
    )
  }

  const subtotal    = Number(quote.subtotal)
  const total       = Number(quote.total)
  const discountAmt = quote.discountType === 'percent'
    ? subtotal * (Number(quote.discountValue) / 100)
    : Number(quote.discountValue) || 0
  const taxAmount   = (subtotal - discountAmt) * (Number(quote.taxRate) / 100)
  const sym         = quote.currency === 'USD' ? 'US$' : '$'
  const org         = quote.organization || {}
  const numStr      = String(quote.number).padStart(3, '0')
  const orgLogoUrl  = org.logo ? `${API_BASE}/uploads/${org.logo}` : null

  const validDays = (quote.validUntil && quote.createdAt)
    ? Math.round((new Date(quote.validUntil) - new Date(quote.createdAt)) / (1000 * 60 * 60 * 24))
    : null

  const clientName    = quote.client?.name    || quote.potentialClientName
  const clientCompany = quote.client?.company || quote.potentialClientCompany
  const clientEmail   = quote.client?.email   || quote.potentialClientEmail

  const orgContactLines = [
    orgLogoUrl ? org.name : null,
    org.cuit    ? `CUIL/CUIT: ${org.cuit}` : null,
    org.email,
    org.phone,
    org.address,
    (org.city || org.province)
      ? [org.city, org.province].filter(Boolean).join(', ') + (org.postalCode ? ` (${org.postalCode})` : '')
      : null,
    org.website,
  ].filter(Boolean)

  const isPotential   = !quote.client && !!quote.potentialClientName
  const isConfirmable = quote.status === 'draft' || quote.status === 'sent'

  function setField(key) {
    return (e) => setClientForm(f => ({ ...f, [key]: e.target.value }))
  }

  // Desde el modal: si es potencial va al form, si es real va directo a firma
  function handleConfirmStep1() {
    setConfirmError('')
    setConfirmStep(isPotential ? 'form' : 'signature')
  }

  // Desde el form: valida y avanza a firma (sin llamar la API todavía)
  function handleFormNext(e) {
    e.preventDefault()
    if (!clientForm.province) {
      setConfirmError('Seleccioná una provincia.')
      return
    }
    if (!phoneValid) {
      setConfirmError('Ingresá un número de teléfono válido.')
      return
    }
    setConfirmError('')
    setConfirmStep('signature')
  }

  // Desde la firma: llama a la API con todos los datos + firma
  async function handleSignatureConfirm(signatureDataUrl) {
    setConfirmLoading(true)
    setConfirmError('')
    try {
      const dialCode  = PHONE_COUNTRIES.find(c => c.code === phoneCountry)?.dial || ''
      const fullPhone = phoneNumber.trim() ? `${dialCode} ${phoneNumber.trim()}` : ''
      const payload   = isPotential
        ? { ...clientForm, phone: fullPhone || undefined, signature: signatureDataUrl }
        : { signature: signatureDataUrl }
      await confirmQuote(id, payload)
      setSignatureImg(signatureDataUrl)
      setConfirmStep('success')
    } catch (err) {
      setConfirmError(err.response?.data?.error || 'Error al confirmar')
    } finally {
      setConfirmLoading(false)
    }
  }

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (confirmStep === 'success') {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center py-10 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 px-7 py-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-9 h-9 text-white" />
                </div>
              </div>
              <h1 className="text-white text-2xl font-bold mb-1">¡Presupuesto confirmado!</h1>
              <p className="text-emerald-100 text-sm">Tu confirmación fue recibida exitosamente</p>
            </div>
            <div className="px-7 py-6 space-y-3">
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 space-y-1">
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Presupuesto</p>
                <p className="text-zinc-800 dark:text-zinc-100 font-semibold">{quote.title}</p>
                <p className="text-zinc-500 text-sm">#{numStr} · {sym}{fmt(total)}</p>
              </div>
              {isPotential && clientForm.name && (
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 space-y-0.5">
                  <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1">Cliente registrado</p>
                  <p className="text-zinc-800 dark:text-zinc-100 font-semibold">{clientForm.company || clientForm.name}</p>
                  {clientForm.company && <p className="text-zinc-500 text-sm">{clientForm.name}</p>}
                </div>
              )}
              {signatureImg && (
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3">
                  <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-2">Firma del cliente</p>
                  <img src={signatureImg} alt="Firma" className="max-h-16 object-contain" />
                </div>
              )}
              <p className="text-sm text-zinc-500 text-center pt-1">
                {org.name} se pondrá en contacto con vos a la brevedad.
              </p>
            </div>
            <div className="px-7 pb-7">
              <a
                href={getPublicQuotePdfUrl(id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Descargar PDF del presupuesto
              </a>
            </div>
          </div>
          <p className="text-center text-xs text-zinc-400 mt-4">
            Presupuesto generado por{' '}
            <a href="https://sofiapp.dev" target="_blank" rel="noopener noreferrer" className="font-medium text-zinc-500 hover:text-zinc-700 underline underline-offset-2">
              sofiapp.dev
            </a>
          </p>
        </div>
      </div>
    )
  }

  // ── Formulario de datos del cliente (pantalla completa) ───────────────────
  if (confirmStep === 'form') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 overflow-y-auto">
        <div className="max-w-lg mx-auto py-8 px-4">
          <button
            onClick={() => { setConfirmStep('modal'); setConfirmError('') }}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver
          </button>

          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-1">Completá tus datos</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Para confirmar el presupuesto <span className="font-medium text-zinc-600 dark:text-zinc-300">«{quote.title}»</span> necesitamos algunos datos adicionales.
          </p>

          <form onSubmit={handleFormNext} className="space-y-4">
            <div>
              <label className={labelCls}>Nombre *</label>
              <input required value={clientForm.name} onChange={setField('name')} className={inputCls} placeholder="Tu nombre completo" />
            </div>

            <div>
              <label className={labelCls}>Empresa *</label>
              <input required value={clientForm.company} onChange={setField('company')} className={inputCls} placeholder="Nombre de tu empresa" />
            </div>

            <div>
              <label className={labelCls}>Email *</label>
              <input required type="email" value={clientForm.email} onChange={setField('email')} className={inputCls} placeholder="tu@email.com" />
            </div>

            <PhoneInput
              countryCode={phoneCountry}
              phoneNumber={phoneNumber}
              onChangeCountry={setPhoneCountry}
              onChangeNumber={setPhoneNumber}
              onValidChange={setPhoneValid}
              label="Teléfono *"
            />

            <div>
              <label className={labelCls}>Sitio web</label>
              <input value={clientForm.website} onChange={setField('website')} className={inputCls} placeholder="ejemplo.com" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>CUIL / CUIT *</label>
                <input required value={clientForm.cuit} onChange={setField('cuit')} className={inputCls} placeholder="20-12345678-9" />
              </div>
              <div>
                <label className={labelCls}>Dirección *</label>
                <input required value={clientForm.address} onChange={setField('address')} className={inputCls} placeholder="Calle 123" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Provincia *</label>
              <ProvinceSelect
                value={clientForm.province}
                onChange={v => setClientForm(f => ({ ...f, province: v }))}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Ciudad *</label>
                <input required value={clientForm.city} onChange={setField('city')} className={inputCls} placeholder="Ej: Rosario" />
              </div>
              <div>
                <label className={labelCls}>Código postal *</label>
                <input required value={clientForm.postalCode} onChange={setField('postalCode')} className={inputCls} placeholder="Ej: 2000" />
              </div>
            </div>

            {confirmError && (
              <p className="text-sm text-red-500">{confirmError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-colors mt-2"
            >
              Continuar a firma →
            </button>
          </form>

          <p className="text-center text-xs text-zinc-400 mt-8">
            Presupuesto generado por{' '}
            <a href="https://sofiapp.dev" target="_blank" rel="noopener noreferrer" className="font-medium text-zinc-500 underline underline-offset-2">
              sofiapp.dev
            </a>
          </p>
        </div>
      </div>
    )
  }

  // ── Paso de firma ─────────────────────────────────────────────────────────
  if (confirmStep === 'signature') {
    return (
      <SignatureStep
        quote={quote}
        numStr={numStr}
        sym={sym}
        total={total}
        fmt={fmt}
        clientName={isPotential ? (clientForm.company || clientForm.name) : (clientCompany || clientName)}
        onBack={() => { setConfirmError(''); setConfirmStep(isPotential ? 'form' : 'modal') }}
        onConfirm={handleSignatureConfirm}
        loading={confirmLoading}
        error={confirmError}
      />
    )
  }

  // ── Vista principal del presupuesto ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 py-4 px-3 sm:py-10 sm:px-4">
      <div className="max-w-3xl mx-auto">

        {/* Document card */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mb-4 sm:mb-5">

          {/* ── Header ─────────────────────────────────────────── */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-5 py-5 sm:px-7 sm:py-6">

            {/* Mobile */}
            <div className="sm:hidden">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  {orgLogoUrl
                    ? <img src={orgLogoUrl} alt={org.name} className="h-10 object-contain max-w-[160px]" />
                    : <p className="text-slate-300 font-semibold text-sm">{org.name}</p>
                  }
                </div>
                <p className="text-white font-bold text-2xl leading-none tabular-nums shrink-0">#{numStr}</p>
              </div>
              <p className="text-slate-400 text-xs uppercase tracking-[0.18em] font-medium mb-1">Presupuesto</p>
              <h1 className="text-white text-lg font-bold leading-snug break-words">{quote.title}</h1>
              {orgContactLines.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700/60 space-y-0.5">
                  {orgContactLines.map((line, i) => (
                    <p key={i} className="text-slate-400 text-xs">{line}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop */}
            <div className="hidden sm:flex items-start justify-between gap-6">
              <div className="min-w-0">
                {orgLogoUrl
                  ? <img src={orgLogoUrl} alt={org.name} className="h-14 object-contain max-w-[200px] mb-4" />
                  : <p className="text-slate-300 font-semibold text-sm mb-2">{org.name}</p>
                }
                <p className="text-slate-400 text-xs uppercase tracking-[0.18em] font-medium mb-1">Presupuesto</p>
                <h1 className="text-white text-xl font-bold leading-snug break-words">{quote.title}</h1>
              </div>
              <div className="text-right shrink-0">
                <p className="text-white font-bold text-3xl leading-none tabular-nums mb-3">#{numStr}</p>
                {orgContactLines.map((line, i) => (
                  <p key={i} className="text-slate-400 text-xs">{line}</p>
                ))}
              </div>
            </div>
          </div>

          {/* ── Cliente + Detalle ───────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="px-5 py-4 sm:px-7 sm:py-5 sm:border-r border-zinc-100 dark:border-zinc-800 border-b sm:border-b-0">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Cliente</p>
              {clientCompany && <p className="font-semibold text-zinc-800 dark:text-zinc-100 text-base leading-snug">{clientCompany}</p>}
              <p className={clientCompany ? 'text-sm text-zinc-500 mt-0.5' : 'font-semibold text-zinc-800 dark:text-zinc-100 text-base leading-snug'}>{clientName}</p>
              {quote.client?.cuit    && <p className="text-sm text-zinc-500 mt-0.5">CUIL/CUIT: {quote.client.cuit}</p>}
              {clientEmail           && <p className="text-sm text-zinc-500 mt-0.5">{clientEmail}</p>}
              {quote.client?.phone   && <p className="text-sm text-zinc-500 mt-0.5">{quote.client.phone}</p>}
              {quote.client?.address && <p className="text-sm text-zinc-500 mt-0.5">{quote.client.address}</p>}
              {(quote.client?.city || quote.client?.province) && (
                <p className="text-sm text-zinc-500 mt-0.5">
                  {[quote.client.city, quote.client.province].filter(Boolean).join(', ')}
                  {quote.client.postalCode ? ` (${quote.client.postalCode})` : ''}
                </p>
              )}
            </div>
            <div className="px-5 py-4 sm:px-7 sm:py-5">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Detalle</p>
              <div className="space-y-1.5">
                <InfoRow label="Número"      value={`#${numStr}`} />
                <InfoRow label="Fecha"       value={fmtDate(quote.createdAt)} />
                <InfoRow label="Moneda"      value={quote.currency} />
                {quote.project      && <InfoRow label="Proyecto"       value={quote.project.title} />}
                {validDays != null  && <InfoRow label="Válido por"     value={`${validDays} día${validDays !== 1 ? 's' : ''}`} />}
                {quote.validUntil   && <InfoRow label="Válido hasta"   value={fmtDate(quote.validUntil)} />}
                {quote.deliveryDate && <InfoRow label="Fecha de entrega" value={fmtDate(quote.deliveryDate)} />}
              </div>
            </div>
          </div>

          {/* ── Ítems ──────────────────────────────────────────── */}
          <SectionLabel label="Ítems" />

          {/* Mobile: cards */}
          <div className="sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            {quote.items?.map((item) => (
              <div key={item.id} className="px-5 py-3">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 mb-1 leading-snug">{item.description}</p>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{Number(item.quantity)} × {sym}{fmt(item.unitPrice)}</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200 text-sm">{sym}{fmt(item.amount)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left px-7 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Descripción</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Cant.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Precio unit.</th>
                  <th className="text-right px-7 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {quote.items?.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 1 ? 'bg-zinc-50/60 dark:bg-zinc-800/30' : ''}>
                    <td className="px-7 py-3.5 text-zinc-800 dark:text-zinc-100">{item.description}</td>
                    <td className="px-4 py-3.5 text-right text-zinc-500">{item.quantity}</td>
                    <td className="px-4 py-3.5 text-right text-zinc-500">{sym}{fmt(item.unitPrice)}</td>
                    <td className="px-7 py-3.5 text-right font-semibold text-zinc-800 dark:text-zinc-100">{sym}{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Totales ─────────────────────────────────────────── */}
          <div className="px-5 py-4 sm:px-7 sm:py-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
            <div className="w-full sm:max-w-xs sm:ml-auto space-y-2">
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Subtotal</span>
                <span className="font-medium">{sym}{fmt(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>Descuento{quote.discountType === 'percent' ? ` (${quote.discountValue}%)` : ''}</span>
                  <span className="font-medium text-emerald-600">-{sym}{fmt(discountAmt)}</span>
                </div>
              )}
              {quote.taxRate > 0 && (
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>IVA ({quote.taxRate}%)</span>
                  <span className="font-medium">{sym}{fmt(taxAmount)}</span>
                </div>
              )}
              <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 flex items-center justify-between px-4 py-3.5 mt-1">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total</p>
                  <p className="text-slate-500 text-xs">{quote.currency}</p>
                </div>
                <span className="text-white text-2xl font-bold tabular-nums">{sym}{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* ── Plan de pagos ────────────────────────────────────── */}
          {quote.installments?.length > 0 && (
            <>
              <SectionLabel label="Plan de pagos" />

              {/* Mobile: cards */}
              <div className="sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                {quote.installments.map((inst) => (
                  <div key={inst.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Cuota {inst.number} · {fmtDate(inst.dueDate)}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_INST_COLORS[inst.status] || STATUS_INST_COLORS.pending}`}>
                        {STATUS_INST[inst.status] || inst.status}
                      </span>
                    </div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm shrink-0">{sym}{fmt(inst.amount)}</p>
                  </div>
                ))}
              </div>

              {/* Desktop: tabla */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left px-7 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">N°</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Vencimiento</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Estado</th>
                      <th className="text-right px-7 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {quote.installments.map((inst, i) => (
                      <tr key={inst.id} className={i % 2 === 1 ? 'bg-zinc-50/60 dark:bg-zinc-800/30' : ''}>
                        <td className="px-7 py-3 text-zinc-500">{inst.number}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{fmtDate(inst.dueDate)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_INST_COLORS[inst.status] || STATUS_INST_COLORS.pending}`}>
                            {STATUS_INST[inst.status] || inst.status}
                          </span>
                        </td>
                        <td className="px-7 py-3 text-right font-semibold text-zinc-800 dark:text-zinc-100">{sym}{fmt(inst.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Notas ───────────────────────────────────────────── */}
          {quote.notes && (
            <>
              <SectionLabel label="Notas" />
              <div className="px-5 pb-5 sm:px-7 sm:pb-6">
                <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">{quote.notes}</p>
              </div>
            </>
          )}

          {/* ── Firmas ──────────────────────────────────────────── */}
          {(quote.clientSignature || org.signature) && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-5 py-6 sm:px-10 sm:py-7">
              <p className="text-base text-slate-400 leading-relaxed mb-5 border-b border-slate-700 pb-5">
                Las partes declaran haber leído y aceptado el presente presupuesto en todas sus condiciones.
                La firma a continuación implica conformidad con los servicios, plazos y valores detallados en este documento.
              </p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Firmas</p>
              <div className="grid grid-cols-2 gap-6">
                {/* Cliente */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-full min-h-[52px] flex items-end justify-center">
                    {quote.clientSignature && (
                      <img
                        src={quote.clientSignature}
                        alt="Firma del cliente"
                        className="max-h-12 object-contain"
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                    )}
                  </div>
                  <div className="w-full h-px bg-slate-600" />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-200">
                      {quote.client?.name || quote.potentialClientName || 'Cliente'}
                    </p>
                    {(quote.client?.company || quote.potentialClientCompany) && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {quote.client?.company || quote.potentialClientCompany}
                      </p>
                    )}
                  </div>
                </div>
                {/* Organización */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-full min-h-[52px] flex items-end justify-center">
                    {org.signature && (
                      <img
                        src={org.signature}
                        alt="Firma de la empresa"
                        className="max-h-12 object-contain"
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                    )}
                  </div>
                  <div className="w-full h-px bg-slate-600" />
                  <div className="text-center">
                    {org.signatureOwnerName && (
                      <p className="text-xs font-semibold text-slate-200">{org.signatureOwnerName}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">{org.name}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-zinc-400 text-center sm:text-left">
            Presupuesto generado por{' '}
            <a href="https://sofiapp.dev" target="_blank" rel="noopener noreferrer" className="font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline underline-offset-2 transition-colors">
              sofiapp.dev
            </a>
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            {isConfirmable && (
              <button
                onClick={() => setConfirmStep('modal')}
                className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors shadow"
              >
                <CheckIcon className="w-4 h-4" />
                Confirmar presupuesto
              </button>
            )}
            <a
              href={getPublicQuotePdfUrl(id)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors shadow"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Descargar PDF
            </a>
          </div>
        </div>

      </div>

      {/* ── Modal de confirmación ────────────────────────────────── */}
      {confirmStep === 'modal' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">Confirmar presupuesto</h2>
              <p className="text-sm text-zinc-500">¿Estás de acuerdo con el siguiente presupuesto?</p>
            </div>
            <div className="px-6 py-4">
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 space-y-1">
                <p className="font-semibold text-zinc-800 dark:text-zinc-100">{quote.title}</p>
                <p className="text-zinc-500 text-sm">#{numStr}</p>
                <p className="text-zinc-800 dark:text-zinc-100 font-bold text-xl tabular-nums">{sym}{fmt(total)}</p>
              </div>
              {confirmError && <p className="text-sm text-red-500 mt-3">{confirmError}</p>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { setConfirmStep(null); setConfirmError('') }}
                className="flex-1 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmStep1}
                disabled={confirmLoading}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              >
                {confirmLoading ? 'Procesando...' : isPotential ? 'Sí, continuar' : 'Sí, confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SignatureStep({ quote, numStr, sym, total, fmt, clientName, onBack, onConfirm, loading, error }) {
  const canvasRef  = useRef(null)
  const drawing    = useRef(false)
  const [isEmpty, setIsEmpty] = useState(true)

  function getXY(e) {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const src    = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    }
  }

  function onStart(e) {
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = getXY(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    drawing.current = true
    setIsEmpty(false)
  }

  function onMove(e) {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = getXY(e)
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
  }

  function onEnd(e) {
    e.preventDefault()
    drawing.current = false
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  function handleConfirm() {
    onConfirm(canvasRef.current.toDataURL('image/png'))
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 overflow-y-auto">
      <div className="max-w-lg mx-auto py-8 px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Volver
        </button>

        <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-1">Firma del presupuesto</h2>
        <p className="text-sm text-zinc-500 mb-6">
          Firmá en el recuadro para confirmar el presupuesto.
        </p>

        {/* Resumen del presupuesto */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 mb-6 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-zinc-800 dark:text-zinc-100 truncate">{quote.title}</p>
            <p className="text-xs text-zinc-400 mt-0.5">#{numStr}{clientName ? ` · ${clientName}` : ''}</p>
          </div>
          <p className="font-bold text-zinc-800 dark:text-zinc-100 text-lg tabular-nums shrink-0">{sym}{fmt(total)}</p>
        </div>

        {/* Canvas de firma */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 bg-white">
          <canvas
            ref={canvasRef}
            width={640}
            height={240}
            className="w-full touch-none cursor-crosshair block"
            onMouseDown={onStart}
            onMouseMove={onMove}
            onMouseUp={onEnd}
            onMouseLeave={onEnd}
            onTouchStart={onStart}
            onTouchMove={onMove}
            onTouchEnd={onEnd}
          />
          {/* Línea de firma */}
          <div className="absolute bottom-10 left-8 right-8 h-px bg-zinc-200" />
          {/* Placeholder */}
          {isEmpty && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-zinc-300 pointer-events-none select-none">
              Firmá aquí usando el mouse o el dedo
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-3 mb-6">
          <button
            onClick={clearCanvas}
            disabled={isEmpty}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            <TrashIcon className="w-4 h-4" />
            Limpiar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isEmpty || loading}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? 'Confirmando...' : 'Confirmar presupuesto'}
          </button>
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <p className="text-center text-xs text-zinc-400 mt-6">
          Presupuesto generado por{' '}
          <a href="https://sofiapp.dev" target="_blank" rel="noopener noreferrer" className="font-medium text-zinc-500 underline underline-offset-2">
            sofiapp.dev
          </a>
        </p>
      </div>
    </div>
  )
}

function SectionLabel({ label }) {
  return (
    <div className="px-5 py-3 sm:px-7 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex items-center gap-3">
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider shrink-0">{label}</p>
      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="text-zinc-400 w-20 sm:w-24 shrink-0 text-xs">{label}</span>
      <span className="text-zinc-700 dark:text-zinc-200 font-medium">{value}</span>
    </div>
  )
}
