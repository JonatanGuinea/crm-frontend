import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicQuote, getPublicQuotePdfUrl, confirmQuote, rejectQuote } from '../../api/public'
import ProvinceSelect from '../../components/ProvinceSelect'
import PhoneInput, { PHONE_COUNTRIES } from '../../components/PhoneInput'
import danteupLogo from '../../assets/danteup/logotipo-horizontal-negro.png'
import { imgUrl } from '../../utils/imgUrl.js'
const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"
const MONO  = "'Geist Mono', monospace"

const BG   = '#EDE8DF'
const CARD  = '#FFFFFF'
const INK   = '#1A1A1A'
const INK2  = '#3A3A3A'
const INK3  = '#6B6B6B'
const LINE  = '#E5E7EB'

const fmt     = (n, dec = 0) => Number(n).toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-AR') : '—'

const inputSt = {
  width: '100%', height: 40, padding: '0 12px',
  border: `1px solid ${LINE}`, borderRadius: 6,
  background: CARD, color: INK, fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
}
const labelSt = { display: 'block', fontSize: 11, fontWeight: 600, color: INK3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }

function DownloadSvg() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
}
function CheckSvg() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
}

const STATUS_INST_BADGE = {
  pending: { bg: '#F3F4F6', color: '#6B7280', label: 'Pendiente' },
  paid:    { bg: '#ECFDF5', color: '#065F46', label: 'Pagado' },
  overdue: { bg: '#FEF2F2', color: '#991B1B', label: 'Vencido' },
}

export default function QuotePublicPage() {
  const { id } = useParams()

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // client form
  const [clientForm, setClientForm] = useState({ name: '', company: '', email: '', website: '', cuit: '', address: '', province: '', city: '', postalCode: '', notes: '' })
  const [phoneCountry, setPhoneCountry] = useState('AR')
  const [phoneNumber, setPhoneNumber]   = useState('')
  const [phoneValid, setPhoneValid]     = useState(false)

  // signature
  const canvasRef  = useRef(null)
  const drawing    = useRef(false)
  const [sigEmpty, setSigEmpty] = useState(true)

  // submit
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted]     = useState(false)
  const [sigImg, setSigImg]           = useState(null)

  // reject
  const [showReject, setShowReject]       = useState(false)
  const [rejectOption, setRejectOption]   = useState('')
  const [rejectOther, setRejectOther]     = useState('')
  const [rejectLoading, setRejectLoading] = useState(false)
  const [rejectError, setRejectError]     = useState('')

  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ['public-quote', id],
    queryFn: () => getPublicQuote(id).then(r => r.data.data),
    retry: false,
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${INK}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (isError || !quote) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: BG, color: INK2, padding: '0 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 36 }}>🔍</p>
        <p style={{ fontSize: 16, fontWeight: 600, color: INK }}>Presupuesto no encontrado</p>
        <p style={{ fontSize: 13 }}>El enlace puede ser incorrecto o haber expirado.</p>
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
  const dec         = quote.currency === 'USD' ? 2 : 0
  const org         = quote.organization || {}
  const numStr      = String(quote.number).padStart(3, '0')
  const orgLogoUrl  = imgUrl(org.logo)
  const orgInitials = org.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const clientName    = quote.client?.name    || quote.potentialClientName
  const clientCompany = quote.client?.company || quote.potentialClientCompany
  const clientEmail   = quote.client?.email   || quote.potentialClientEmail

  const bp     = org.brandPrimary   || null
  const bs     = org.brandSecondary || null
  const pageBg = (bp && bs) ? `linear-gradient(145deg, ${bp} 0%, ${bs} 100%)` : bp || BG

  const isPotential   = !quote.client && !!quote.potentialClientName
  const isConfirmable = quote.status === 'draft' || quote.status === 'sent'
  const isExpired     = quote.status === 'expired'
  const isRejected    = quote.status === 'rejected'
  const isSigned      = quote.status === 'signed'

  // Responsive shortcuts
  const SP  = isMobile ? '16px' : '40px'   // horizontal section padding
  const col2 = isMobile ? '1fr' : '1fr 1fr'

  // ── Canvas helpers ──────────────────────────────────────────────────────────
  function getXY(e) {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const src    = e.touches ? e.touches[0] : e
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY }
  }
  function onStart(e) {
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = getXY(e)
    ctx.beginPath(); ctx.moveTo(x, y)
    drawing.current = true; setSigEmpty(false)
  }
  function onMove(e) {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = getXY(e)
    ctx.lineTo(x, y)
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.stroke()
  }
  function onEnd(e) { e.preventDefault(); drawing.current = false }
  function clearCanvas() {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setSigEmpty(true)
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    if (sigEmpty) { setSubmitError('Dibujá tu firma para confirmar.'); return }
    if (isPotential && !phoneValid) { setSubmitError('Ingresá un número de teléfono válido.'); return }
    if (isPotential && !clientForm.province) { setSubmitError('Seleccioná una provincia.'); return }
    setSubmitting(true)
    try {
      const signatureDataUrl = canvasRef.current.toDataURL('image/png')
      const dialCode  = PHONE_COUNTRIES.find(c => c.code === phoneCountry)?.dial || ''
      const fullPhone = phoneNumber.trim() ? `${dialCode} ${phoneNumber.trim()}` : ''
      const payload   = isPotential
        ? { ...clientForm, phone: fullPhone || undefined, signature: signatureDataUrl }
        : { signature: signatureDataUrl }
      await confirmQuote(id, payload)
      setSigImg(signatureDataUrl)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Error al confirmar')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Reject ──────────────────────────────────────────────────────────────────
  async function handleRejectSubmit(e) {
    e.preventDefault()
    if (!rejectOption) { setRejectError('Seleccioná un motivo.'); return }
    const reason = rejectOption === '__other__' ? (rejectOther.trim() || 'Otro motivo') : rejectOption
    setRejectLoading(true); setRejectError('')
    try {
      await rejectQuote(id, reason)
      setShowReject(false)
      window.location.reload()
    } catch (err) {
      setRejectError(err.response?.data?.error || 'Error al enviar la respuesta')
    } finally {
      setRejectLoading(false)
    }
  }

  // ── Pantalla de éxito ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, fontFamily: 'Geist, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ maxWidth: 480, width: '100%', background: CARD, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', overflow: 'hidden' }}>
          <div style={{ background: INK, padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckSvg />
            </div>
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>¡Presupuesto confirmado!</h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>Tu confirmación fue recibida exitosamente</p>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ background: BG, borderRadius: 6, padding: '14px 16px', marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: INK3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Presupuesto</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 2 }}>{quote.title}</p>
              <p style={{ fontSize: 12, color: INK2 }}>#{numStr} · {sym}{fmt(total, dec)}</p>
            </div>
            {isPotential && clientForm.name && (
              <div style={{ background: BG, borderRadius: 6, padding: '14px 16px', marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: INK3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Cliente registrado</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 2 }}>{clientForm.company || clientForm.name}</p>
                {clientForm.company && <p style={{ fontSize: 12, color: INK2 }}>{clientForm.name}</p>}
              </div>
            )}
            {sigImg && (
              <div style={{ background: BG, borderRadius: 6, padding: '14px 16px', marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: INK3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Firma</p>
                <div style={{ background: CARD, borderRadius: 4, padding: 8 }}>
                  <img src={sigImg} alt="Firma" style={{ maxHeight: 60, width: '100%', objectFit: 'contain' }} />
                </div>
              </div>
            )}
            <p style={{ fontSize: 12, color: INK3, textAlign: 'center', marginBottom: 20 }}>{org.name} se pondrá en contacto con vos a la brevedad.</p>
            <a
              href={getPublicQuotePdfUrl(id)} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '11px 0', background: INK, color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none', boxSizing: 'border-box' }}
            >
              <DownloadSvg /> Descargar PDF del presupuesto
            </a>
          </div>
        </div>
        <p style={{ marginTop: 20, fontSize: 12, color: INK3 }}>
          Enviado con <strong style={{ color: INK2, letterSpacing: '0.05em' }}>DANTEUP</strong>
        </p>
      </div>
    )
  }

  // ── Vista principal ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: 'Geist, system-ui, sans-serif', color: INK }}>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: `20px ${isMobile ? '12px' : '16px'} 60px` }}>

        {/* Document card */}
        <div style={{ background: CARD, borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 16, overflow: 'hidden' }}>

          {/* Datos empresa emisora */}
          <div style={{ padding: `24px ${SP} 20px`, borderBottom: `1px solid ${LINE}` }}>
            {orgLogoUrl
              ? <img src={orgLogoUrl} alt={org.name} style={{ display: 'block', width: '33%', height: 'auto', objectFit: 'contain', borderRadius: 4, marginBottom: 14 }} />
              : <div style={{ width: '33%', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', background: INK, color: '#fff', borderRadius: 4, fontSize: 18, fontWeight: 700, marginBottom: 14 }}>{orgInitials}</div>
            }
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: isMobile ? 14 : 20 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 4 }}>{org.name}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {org.cuit    && <p style={{ fontSize: 11, color: INK2 }}>CUIT: {org.cuit}</p>}
                  {org.address && <p style={{ fontSize: 11, color: INK2 }}>{[org.address, org.city, org.province].filter(Boolean).join(', ')}{org.postalCode ? ` (${org.postalCode})` : ''}</p>}
                  {org.phone   && <p style={{ fontSize: 11, color: INK2 }}>{org.phone}</p>}
                  {org.email   && <p style={{ fontSize: 11, color: INK2 }}>{org.email}</p>}
                  {org.website && <p style={{ fontSize: 11, color: INK2 }}>{org.website}</p>}
                </div>
              </div>
              <div style={{ textAlign: isMobile ? 'left' : 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK3, marginBottom: 4 }}>Presupuesto #{numStr}</p>
                <p style={{ fontSize: 12, color: INK2, lineHeight: 1.8 }}>Emitido <strong style={{ color: INK }}>{fmtDate(quote.createdAt)}</strong></p>
                {quote.validUntil && (
                  <p style={{ fontSize: 12, color: INK2, lineHeight: 1.8 }}>Válido hasta <strong style={{ color: INK }}>{fmtDate(quote.validUntil)}</strong></p>
                )}
                {quote.project && (
                  <p style={{ fontSize: 12, color: INK3, marginTop: 4 }}>{quote.project.title}</p>
                )}
              </div>
            </div>
          </div>

          {/* Título presupuesto */}
          <div style={{ padding: `20px ${SP} 18px`, borderBottom: `1px solid ${LINE}` }}>
            <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, letterSpacing: '-0.025em', color: INK, lineHeight: 1.2, margin: 0 }}>{quote.title}</h1>
          </div>

          {/* Cliente */}
          {(clientName || clientCompany) && (
            <div style={{ padding: `14px ${SP}`, borderBottom: `1px solid ${LINE}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK3, marginBottom: 4 }}>Cliente</p>
              {clientCompany && <p style={{ fontSize: 13, fontWeight: 600, color: INK }}>{clientCompany}</p>}
              <p style={{ fontSize: 13, color: clientCompany ? INK2 : INK, fontWeight: clientCompany ? 400 : 600 }}>{clientName}</p>
              {clientEmail && <p style={{ fontSize: 12, color: INK3 }}>{clientEmail}</p>}
            </div>
          )}

          {/* Items */}
          <div style={{ overflowX: 'auto', padding: `0 ${SP}` }}>
            <table style={{ width: '100%', minWidth: isMobile ? 400 : 'auto', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                  <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK3 }}>Descripción</th>
                  <th style={{ textAlign: 'right', padding: '12px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK3 }}>Cant.</th>
                  <th style={{ textAlign: 'right', padding: '12px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK3, whiteSpace: 'nowrap' }}>Precio unit.</th>
                  <th style={{ textAlign: 'right', padding: '12px 0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK3 }}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {quote.items?.map((item) => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${LINE}` }}>
                    <td style={{ padding: '13px 0', verticalAlign: 'top' }}>
                      <p style={{ fontWeight: 500, color: INK }}>{item.description}</p>
                    </td>
                    <td style={{ padding: '13px 12px', textAlign: 'right', color: INK2, fontFamily: MONO, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{Number(item.quantity)}</td>
                    <td style={{ padding: '13px 12px', textAlign: 'right', color: INK2, fontFamily: MONO, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{sym} {fmt(item.unitPrice, dec)}</td>
                    <td style={{ padding: '13px 0', textAlign: 'right', fontWeight: 600, color: INK, fontFamily: MONO, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{sym} {fmt(item.amount, dec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div style={{ padding: `20px ${SP}`, borderTop: `1px solid ${LINE}` }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: isMobile ? '100%' : undefined, minWidth: isMobile ? undefined : 280 }}>
                {subtotal !== total && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: INK2 }}>
                    <span>Subtotal</span>
                    <span style={{ fontFamily: MONO }}>{sym} {fmt(subtotal, dec)}</span>
                  </div>
                )}
                {discountAmt > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: INK2 }}>
                    <span>Descuento{quote.discountType === 'percent' ? ` ${quote.discountValue}%` : ''}</span>
                    <span style={{ fontFamily: MONO }}>– {sym} {fmt(discountAmt, dec)}</span>
                  </div>
                )}
                {quote.taxRate > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: INK2 }}>
                    <span>IVA {quote.taxRate}%</span>
                    <span style={{ fontFamily: MONO }}>{sym} {fmt(taxAmount, dec)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>Total</span>
                  <div style={{ background: INK, borderRadius: 4, padding: isMobile ? '9px 14px' : '10px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: isMobile ? 18 : 22, fontWeight: 200, lineHeight: 1 }}>[</span>
                    <span style={{ color: '#fff', fontFamily: CIFRAS, fontSize: isMobile ? 18 : 22, fontWeight: 700, lineHeight: 1 }}>{sym}{fmt(total, dec)}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: isMobile ? 18 : 22, fontWeight: 200, lineHeight: 1 }}>]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plan de pagos */}
          {quote.installments?.length > 0 && (
            <div style={{ borderTop: `1px solid ${LINE}`, padding: `0 ${SP}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK3, padding: '16px 0 10px' }}>Plan de pagos</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: isMobile ? 360 : 'auto', borderCollapse: 'collapse', fontSize: 13, marginBottom: 18 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                      {['N°', 'Vencimiento', 'Estado', 'Importe'].map(h => (
                        <th key={h} style={{ textAlign: h === 'Importe' ? 'right' : 'left', padding: '8px 0', paddingRight: h !== 'Importe' ? 12 : 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK3, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quote.installments.map((inst) => {
                      const st = STATUS_INST_BADGE[inst.status] || STATUS_INST_BADGE.pending
                      return (
                        <tr key={inst.id} style={{ borderBottom: `1px solid ${LINE}` }}>
                          <td style={{ padding: '10px 12px 10px 0', color: INK2 }}>{inst.number}</td>
                          <td style={{ padding: '10px 12px 10px 0', color: INK2, whiteSpace: 'nowrap' }}>{fmtDate(inst.dueDate)}</td>
                          <td style={{ padding: '10px 12px 10px 0' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span>
                          </td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600, color: INK, fontFamily: MONO, whiteSpace: 'nowrap' }}>{sym} {fmt(inst.amount, dec)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notas */}
          {quote.quoteNotes?.length > 0 && (
            <div style={{ borderTop: `1px solid ${LINE}`, padding: `18px ${SP} 22px` }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK3, marginBottom: 12 }}>Notas</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {quote.quoteNotes.map(note => (
                  <div key={note.id}>
                    {note.title && <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 3 }}>{note.title}</p>}
                    <p style={{ fontSize: 13, color: INK2, lineHeight: 1.6, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{note.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Imágenes */}
          {quote.images?.length > 0 && (
            <div style={{ borderTop: `1px solid ${LINE}`, padding: `18px ${SP} 22px` }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK3, marginBottom: 12 }}>Imágenes</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {quote.images.map(img => (
                  <div key={img.id} style={{ borderRadius: 6, overflow: 'hidden', border: `1px solid ${LINE}` }}>
                    <img src={imgUrl(img.url)} alt={img.title || 'Imagen'} style={{ width: '100%', height: 'auto', display: 'block' }} />
                    {(img.title || img.description) && (
                      <div style={{ padding: '10px 14px', background: BG }}>
                        {img.title && <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 2 }}>{img.title}</p>}
                        {img.description && <p style={{ fontSize: 12, color: INK2, lineHeight: 1.5 }}>{img.description}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Firmas */}
          {quote.clientSignature && (
            <div style={{ borderTop: `1px solid ${LINE}`, padding: `20px ${SP}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK3, marginBottom: 16 }}>Firmas</p>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 20 }}>
                {[
                  { sig: quote.clientSignature, name: quote.client?.name || quote.potentialClientName, sub: quote.client?.company || quote.potentialClientCompany },
                  { sig: org.signature, name: org.signatureOwnerName, sub: org.name },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: '100%', background: CARD, border: `1px solid ${LINE}`, borderRadius: 4, padding: 8, minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {f.sig && <img src={f.sig} alt="Firma" style={{ maxHeight: 48, width: '100%', objectFit: 'contain' }} />}
                    </div>
                    <div style={{ width: '100%', borderTop: `1px solid ${INK}` }} />
                    <div style={{ textAlign: 'center' }}>
                      {f.name && <p style={{ fontSize: 11, fontWeight: 600, color: INK }}>{f.name}</p>}
                      {f.sub  && <p style={{ fontSize: 11, color: INK3 }}>{f.sub}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Banner estado */}
        {(isExpired || isRejected || isSigned) && (
          <div style={{
            borderRadius: 6, padding: '14px 16px', marginBottom: 16,
            background: isSigned ? '#ECFDF5' : isExpired ? '#FFFBEB' : '#FEF2F2',
            border: `1px solid ${isSigned ? '#A7F3D0' : isExpired ? '#FDE68A' : '#FECACA'}`,
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: isSigned ? '#065F46' : isExpired ? '#92400E' : '#991B1B', marginBottom: 4 }}>
              {isSigned   && '✓ Presupuesto confirmado y firmado'}
              {isExpired  && '⏱ Este presupuesto ha vencido'}
              {isRejected && '✕ Este presupuesto fue rechazado'}
            </p>
            <p style={{ fontSize: 12, color: INK2 }}>
              {isSigned   && 'El presupuesto fue aceptado. Podés descargar el PDF con la firma.'}
              {isExpired  && `El plazo de validez venció el ${fmtDate(quote.validUntil)}. Contactá a ${org.name} para solicitar un nuevo presupuesto.`}
              {isRejected && `Contactá a ${org.name} si querés revisar las condiciones del presupuesto.`}
            </p>
          </div>
        )}

        {/* Sección de confirmación inline */}
        {isConfirmable && (
          <form onSubmit={handleSubmit} style={{ background: CARD, borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: `28px ${SP}` }}>
            <h2 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, color: INK, margin: '0 0 20px' }}>¿Estás de acuerdo con este presupuesto?</h2>

            {isPotential && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 12 }}>
                  <div>
                    <label style={labelSt}>Nombre y apellido *</label>
                    <input required value={clientForm.name} onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))} style={inputSt} placeholder="Laura Ejemplo" />
                  </div>
                  <div>
                    <label style={labelSt}>Empresa</label>
                    <input value={clientForm.company} onChange={e => setClientForm(f => ({ ...f, company: e.target.value }))} style={inputSt} placeholder="Empresa S.A." />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 12 }}>
                  <div>
                    <label style={labelSt}>Email *</label>
                    <input required type="email" value={clientForm.email} onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))} style={inputSt} placeholder="tu@email.com" />
                  </div>
                  <div>
                    <label style={labelSt}>CUIT / CUIL</label>
                    <input value={clientForm.cuit} onChange={e => setClientForm(f => ({ ...f, cuit: e.target.value }))} style={inputSt} placeholder="30-12345678-9" />
                  </div>
                </div>
                <div>
                  <PhoneInput
                    countryCode={phoneCountry}
                    phoneNumber={phoneNumber}
                    onChangeCountry={setPhoneCountry}
                    onChangeNumber={setPhoneNumber}
                    onValidChange={setPhoneValid}
                    label="Teléfono *"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 12 }}>
                  <div>
                    <label style={labelSt}>Dirección *</label>
                    <input required value={clientForm.address} onChange={e => setClientForm(f => ({ ...f, address: e.target.value }))} style={inputSt} placeholder="Calle 123" />
                  </div>
                  <div>
                    <label style={labelSt}>Provincia *</label>
                    <ProvinceSelect value={clientForm.province} onChange={v => setClientForm(f => ({ ...f, province: v }))} className="" style={inputSt} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 12 }}>
                  <div>
                    <label style={labelSt}>Ciudad *</label>
                    <input required value={clientForm.city} onChange={e => setClientForm(f => ({ ...f, city: e.target.value }))} style={inputSt} placeholder="Rosario" />
                  </div>
                  <div>
                    <label style={labelSt}>Código postal *</label>
                    <input required value={clientForm.postalCode} onChange={e => setClientForm(f => ({ ...f, postalCode: e.target.value }))} style={inputSt} placeholder="2000" />
                  </div>
                </div>
                <div>
                  <label style={labelSt}>Sitio web</label>
                  <input value={clientForm.website} onChange={e => setClientForm(f => ({ ...f, website: e.target.value }))} style={inputSt} placeholder="https://tuempresa.com" />
                </div>
                <div>
                  <label style={labelSt}>Notas adicionales</label>
                  <textarea value={clientForm.notes} onChange={e => setClientForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                    style={{ ...inputSt, height: 'auto', padding: '10px 12px', resize: 'vertical' }} placeholder="Información adicional relevante..." />
                </div>
              </div>
            )}

            {/* Canvas firma */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelSt}>Firma</label>
              <div style={{ position: 'relative', border: `1px dashed #CBD5E1`, borderRadius: 4, background: CARD, overflow: 'hidden' }}>
                <canvas
                  ref={canvasRef}
                  width={620} height={160}
                  style={{ width: '100%', height: 160, display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                  onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
                  onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
                />
                {sigEmpty && (
                  <p style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: INK3, pointerEvents: 'none', userSelect: 'none', textAlign: 'center', padding: '0 16px' }}>
                    Firmá aquí usando el mouse o el dedo
                  </p>
                )}
                <button
                  type="button" onClick={clearCanvas} disabled={sigEmpty}
                  style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 11, color: sigEmpty ? LINE : INK3, background: 'none', border: 'none', cursor: sigEmpty ? 'default' : 'pointer', padding: 0 }}
                >
                  Borrar
                </button>
              </div>
            </div>

            {submitError && (
              <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 14 }}>{submitError}</p>
            )}

            {/* Botones */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'flex-end', gap: 10 }}>
              <a
                href={getPublicQuotePdfUrl(id)} target="_blank" rel="noopener noreferrer"
                style={{ padding: '11px 20px', fontSize: 13, fontWeight: 500, color: INK, background: 'none', border: `1.5px solid ${INK}`, borderRadius: '0 7px 7px 0', cursor: 'pointer', order: isMobile ? 3 : 0, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Descargar PDF
              </a>
              <button
                type="button"
                onClick={() => { setShowReject(true); setRejectOption(''); setRejectOther(''); setRejectError('') }}
                style={{ padding: '11px 20px', fontSize: 13, fontWeight: 500, color: INK, background: 'none', border: `1.5px solid ${INK}`, borderRadius: '0 7px 7px 0', cursor: 'pointer', order: isMobile ? 2 : 0 }}
              >
                Rechazar
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, color: '#fff', background: INK, border: 'none', borderRadius: '0 7px 7px 0', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, order: isMobile ? 1 : 0 }}
              >
                {submitting && <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 1s linear infinite' }} />}
                {submitting ? 'Confirmando...' : 'Confirmar presupuesto'}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 28 }}>
          <span style={{ fontSize: 12, color: INK3 }}>Presupuesto generado con</span>
          <a href="https://danteup.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center' }}>
            <img src={danteupLogo} alt="DanteUP" style={{ height: 14, display: 'block' }} />
          </a>
        </div>
      </div>

      {/* Modal rechazo */}
      {showReject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: CARD, borderRadius: isMobile ? '12px 12px 0 0' : 12, width: '100%', maxWidth: 480, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${LINE}` }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: INK, margin: '0 0 4px' }}>Rechazar presupuesto</h2>
              <p style={{ fontSize: 13, color: INK2 }}>Contanos por qué no podés avanzar.</p>
            </div>
            <form onSubmit={handleRejectSubmit} style={{ padding: '14px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Los montos superan lo esperado',
                'El plazo de entrega es muy largo',
                'El alcance del servicio no es el adecuado',
                'Decidí contratar otro proveedor',
                'El proyecto fue cancelado o postergado',
              ].map(option => (
                <label key={option} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1px solid ${rejectOption === option ? INK : LINE}`, borderRadius: 6, cursor: 'pointer', background: rejectOption === option ? '#F8F8F7' : CARD }}>
                  <input type="radio" name="rejectOption" value={option} checked={rejectOption === option} onChange={() => setRejectOption(option)} style={{ accentColor: INK, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: INK }}>{option}</span>
                </label>
              ))}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', border: `1px solid ${rejectOption === '__other__' ? INK : LINE}`, borderRadius: 6, cursor: 'pointer', background: rejectOption === '__other__' ? '#F8F8F7' : CARD }}>
                <input type="radio" name="rejectOption" value="__other__" checked={rejectOption === '__other__'} onChange={() => setRejectOption('__other__')} style={{ accentColor: INK, flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, color: INK }}>Otro motivo</span>
                  {rejectOption === '__other__' && (
                    <textarea value={rejectOther} onChange={e => setRejectOther(e.target.value)} placeholder="Describí el motivo..." rows={3} autoFocus
                      style={{ marginTop: 8, width: '100%', padding: '8px 10px', border: `1px solid ${LINE}`, borderRadius: 4, fontSize: 13, color: INK, background: CARD, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
                  )}
                </div>
              </label>
              {rejectError && <p style={{ fontSize: 12, color: '#DC2626' }}>{rejectError}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowReject(false)} disabled={rejectLoading}
                  style={{ flex: 1, padding: '10px 0', fontSize: 13, color: INK2, background: 'none', border: `1px solid ${LINE}`, borderRadius: '0 7px 7px 0', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={rejectLoading}
                  style={{ flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600, color: '#fff', background: '#DC2626', border: 'none', borderRadius: '0 7px 7px 0', cursor: rejectLoading ? 'not-allowed' : 'pointer', opacity: rejectLoading ? 0.6 : 1 }}>
                  {rejectLoading ? 'Enviando...' : 'Enviar respuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
