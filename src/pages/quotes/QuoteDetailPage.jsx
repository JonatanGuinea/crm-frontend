import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { getQuoteById, downloadQuotePdf, deleteQuote, reactivateQuote, duplicateQuote, markRenewalRead, sendQuote, updateQuote } from '../../api/quotes'
import { getOrganizations } from '../../api/organizations'
import DatePicker from '../../components/DatePicker'
import { fmt } from '../../utils/fmt'
import QuoteModal from './QuoteModal'
import QuoteModalPotential from './QuoteModalPotential'
import AttachmentsPanel from '../../components/AttachmentsPanel'
import InstallmentsPanel from '../../components/InstallmentsPanel'
import QuoteImagesPanel from '../../components/QuoteImagesPanel'
import { PresupuestoIcon, ClienteIcon, CarpetaIcon } from '../../components/DuIcons'

const C = {
  bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F',
  crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E',
  ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE',
}
const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"
const card = { background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0' }

const QUOTE_STATUS = {
  draft:     { label: 'Borrador',   bg: 'rgba(242,237,227,0.07)', color: C.piedra },
  sent:      { label: 'Enviado',    bg: 'rgba(142,177,222,0.12)', color: C.info },
  approved:  { label: 'Aprobado',  bg: 'rgba(125,190,147,0.12)', color: C.ok },
  signed:    { label: 'Firmado',   bg: 'rgba(125,190,147,0.18)', color: C.ok },
  rejected:  { label: 'Rechazado', bg: 'rgba(229,131,115,0.12)', color: C.err },
  cancelled: { label: 'Cancelado', bg: 'rgba(229,131,115,0.08)', color: C.err },
  expired:   { label: 'Vencido',   bg: 'rgba(242,237,227,0.05)', color: C.piedra },
}

/* ── SVGs ─────────────────────────────────────────────────────────────────── */
function DownloadSvg() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
}
function ShareSvg() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
}
function EditSvg() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
}

/* ── GhostBtn ─────────────────────────────────────────────────────────────── */
function GhostBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', background: 'none', border: `1px solid ${C.linea}`, borderRadius: '0 8px 8px 0', color: C.piedra, fontSize: 12, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: disabled ? 0.5 : 1 }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.arena } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.piedra }}
    >
      {children}
    </button>
  )
}

function CopySvg() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
}
function RefreshSvg() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
}

function WaIcon({ size = 14 }) {
  return <svg width={size} height={size} style={{ display: 'block' }} viewBox="0 0 16 16" fill="currentColor"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
}
function MailSvg() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
}

const isoLocal = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const ddmmyyyy = iso => iso ? iso.slice(0, 10).split('-').reverse().join('/') : ''

/* ── ResendModal: reenviar por email o WhatsApp (sin cambios / actualizado) ── */
// mode 'resend': "Enviar sin cambios" · mode 'updated': después de "Editar y enviar".
// Si está vencido lo reactiva con la nueva validez; después envía y eso responde el pedido del cliente.
function ResendModal({ quote, mode, hasSignature, onClose, onDone }) {
  const toast = useToast()
  const todayIso   = isoLocal(new Date())
  const currentIso = quote.validUntil?.slice(0, 10) || ''
  const plus15 = new Date(); plus15.setDate(plus15.getDate() + 15)
  const [validUntil, setValidUntil] = useState(currentIso && currentIso >= todayIso ? currentIso : isoLocal(plus15))
  const [busy, setBusy] = useState(null) // 'email' | 'wa'

  const email = quote.client?.email || quote.potentialClientEmail || ''
  const phone = (quote.client?.phone || quote.potentialClientPhone || '').replace(/\D/g, '')
  const name  = quote.client?.name  || quote.potentialClientName  || 'cliente'
  const num   = String(quote.number).padStart(3, '0')
  const updated = mode === 'updated'

  async function send(channel) {
    if (!validUntil) return toast('Elegí la fecha de validez', 'error')
    if (validUntil < todayIso) return toast('La fecha de validez no puede ser anterior a hoy', 'error')
    if (!hasSignature) return toast('Configurá la firma en Ajustes antes de enviar presupuestos.', 'error')

    // WhatsApp: la pestaña se abre ya (dentro del click) para que el navegador no la bloquee
    const waWin = channel === 'wa' ? window.open('', '_blank') : null
    setBusy(channel)
    let step = 'date'
    try {
      if (quote.status === 'expired')     await reactivateQuote(quote.id, validUntil)
      else if (validUntil !== currentIso) await updateQuote(quote.id, { validUntil })
      step = 'send'
      if (channel === 'email') {
        await sendQuote(quote.id, mode)
      } else {
        const url = `${window.location.origin}/p/presupuesto/${quote.id}`
        const msg = updated
          ? `Hola ${name}, como nos pediste, te enviamos el presupuesto #${num} — ${quote.title} actualizado, válido hasta el ${ddmmyyyy(validUntil)}:\n${url}`
          : `Hola ${name}, como nos pediste, te reenviamos el presupuesto #${num} — ${quote.title}, ahora válido hasta el ${ddmmyyyy(validUntil)}:\n${url}`
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
        await updateQuote(quote.id, { sentByWhatsapp: true })
        let opened = false
        try { if (waWin && !waWin.closed) { waWin.location.href = waUrl; opened = true } } catch { /* pestaña no utilizable */ }
        if (!opened) window.open(waUrl, '_blank')
      }
      onDone(channel === 'email'
        ? `Presupuesto ${updated ? 'actualizado ' : ''}enviado por email a ${email}`
        : `Presupuesto ${updated ? 'actualizado ' : ''}compartido por WhatsApp`)
    } catch (err) {
      try { if (waWin) waWin.close() } catch { /* ya cerrada */ }
      const msg = err.response?.data?.error || 'No se pudo enviar'
      if (step === 'send') { onDone(null, `Se actualizó la validez, pero no se pudo enviar: ${msg}`) }
      else { toast(msg, 'error'); setBusy(null) }
    }
  }

  const channelBtn = (channel, enabled, icon, label, sub) => (
    <button onClick={() => send(channel)} disabled={!enabled || !!busy}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px', background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', color: channel === 'wa' ? '#25D366' : C.crema, cursor: (!enabled || busy) ? 'not-allowed' : 'pointer', opacity: !enabled ? 0.4 : (busy && busy !== channel ? 0.5 : 1), fontFamily: 'inherit', textAlign: 'left' }}
      onMouseEnter={e => { if (enabled && !busy) e.currentTarget.style.borderColor = C.arena }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea }}
    >
      {icon}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.crema }}>{busy === channel ? 'Enviando…' : label}</span>
        <span style={{ display: 'block', fontSize: 11.5, color: C.piedra, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>
      </span>
    </button>
  )

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="w-full sm:max-w-md sm:mx-4" style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}` }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.crema, margin: 0 }}>
            {updated ? 'Enviar presupuesto actualizado' : '¿Enviar presupuesto sin cambios?'}
          </p>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: C.arena, lineHeight: 1.6, margin: 0 }}>
            {updated
              ? <>Los cambios ya están guardados. Se envía el <strong style={{ color: C.crema }}>#{num}</strong> con el mismo enlace y el cliente recibe un aviso de que es la versión actualizada.</>
              : <>Se reenvía el <strong style={{ color: C.crema }}>#{num}</strong> con los mismos ítems y precios, el mismo enlace y una nueva fecha de validez.</>}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: C.piedra }}>Válido hasta</label>
            <DatePicker value={validUntil} onChange={e => setValidUntil(e.target.value)}
              className="h-[34px] px-3 bg-[#141415] border border-[#2C2C2F] rounded-[0_9px_9px_0] text-[13px] outline-none w-full" />
          </div>
          <p style={{ fontSize: 11, fontWeight: 500, color: C.piedra, margin: '4px 0 0' }}>¿Por dónde lo enviás?</p>
          {channelBtn('email', !!email, <MailSvg />, 'Enviar por email', email || 'El cliente no tiene email')}
          {channelBtn('wa', !!phone, <WaIcon />, 'Enviar por WhatsApp', phone ? `+${phone} · se abre WhatsApp con el mensaje armado` : 'El cliente no tiene teléfono')}
        </div>
        <div style={{ padding: '4px 20px 18px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={!!busy} style={{ padding: '0 16px', height: 34, background: 'none', border: 'none', color: C.arena, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

/* ── ReactivateModal ──────────────────────────────────────────────────────── */
function ReactivateModal({ quote, onClose, onDone }) {
  const toast = useToast()
  const d = new Date(); d.setDate(d.getDate() + 15)
  const [validUntil, setValidUntil] = useState(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  const [saving, setSaving] = useState(false)
  const recipientEmail = quote.client?.email || quote.potentialClientEmail || ''
  const [sendEmail, setSendEmail] = useState(!!recipientEmail)

  async function submit() {
    if (!validUntil) return toast('Elegí la nueva fecha de validez', 'error')
    setSaving(true)
    try {
      await reactivateQuote(quote.id, validUntil)
    } catch (err) {
      setSaving(false)
      return toast(err.response?.data?.error || 'No se pudo reactivar', 'error')
    }
    // Reactivado. Si se pidió, se reenvía por email; si falla, queda reactivado y se puede reenviar a mano.
    let emailError = null
    if (sendEmail && recipientEmail) {
      try { await sendQuote(quote.id) } catch (err) { emailError = err.response?.data?.error || 'No se pudo enviar el email' }
    }
    setSaving(false)
    onDone({ emailed: sendEmail && recipientEmail && !emailError, emailError })
  }

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="w-full sm:max-w-md sm:mx-4" style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}` }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.crema, margin: 0 }}>Reactivar presupuesto</p>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: C.arena, lineHeight: 1.6, margin: 0 }}>
            Vuelve a estado <strong style={{ color: C.crema }}>Enviado</strong> con el mismo número y el mismo enlace, así el cliente puede aprobarlo o firmarlo de nuevo. Los precios no cambian: si hay que actualizarlos, editalo antes de reactivar.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: C.piedra }}>Nueva fecha de validez</label>
            <DatePicker value={validUntil} onChange={e => setValidUntil(e.target.value)}
              className="h-[34px] px-3 bg-[#141415] border border-[#2C2C2F] rounded-[0_9px_9px_0] text-[13px] outline-none w-full" />
          </div>
          {recipientEmail ? (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 12px', background: C.s2, borderRadius: '0 9px 9px 0', cursor: 'pointer' }}>
              <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)}
                style={{ marginTop: 2, accentColor: C.crema, width: 14, height: 14, flexShrink: 0, cursor: 'pointer' }} />
              <span style={{ fontSize: 12.5, color: C.crema, lineHeight: 1.5 }}>
                Enviar por email al cliente ahora
                <span style={{ display: 'block', fontSize: 11.5, color: C.piedra, overflowWrap: 'anywhere' }}>{recipientEmail}</span>
              </span>
            </label>
          ) : (
            <p style={{ fontSize: 12, color: C.piedra, lineHeight: 1.5, margin: 0 }}>
              El cliente no tiene email. Después de reactivarlo podés mandarlo por WhatsApp desde la lista o copiar el enlace con "Compartir".
            </p>
          )}
        </div>
        <div style={{ padding: '12px 20px 18px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '0 16px', height: 34, background: 'none', border: 'none', color: C.arena, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={submit} disabled={saving}
            style={{ padding: '0 18px', height: 34, background: C.crema, color: C.bg, border: 'none', borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1, fontFamily: 'inherit' }}>
            {saving ? (sendEmail && recipientEmail ? 'Reactivando y enviando…' : 'Reactivando…') : (sendEmail && recipientEmail ? 'Reactivar y enviar' : 'Reactivar')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── SectionHead ──────────────────────────────────────────────────────────── */
function SectionHead({ children }) {
  return (
    <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.arena, margin: '0 0 14px' }}>
      {children}
    </p>
  )
}

/* ── InfoRow ──────────────────────────────────────────────────────────────── */
function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.piedra, margin: 0 }}>{label}</p>
      <div style={{ fontSize: 13, color: C.crema }}>{children}</div>
    </div>
  )
}

/* ── página ───────────────────────────────────────────────────────────────── */
export default function QuoteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const canWrite = user?.role !== 'member'
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [reactivateOpen, setReactivateOpen] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [resendMode, setResendMode] = useState(null)       // null | 'resend' | 'updated'
  const [editAndSend, setEditAndSend] = useState(false)    // el modal de edición termina en "Enviar presupuesto actualizado"

  const orgId = user?.org
  const { data: orgData } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganizations().then(r => r.data.data?.find(o => o.id === orgId)),
    enabled: Boolean(orgId),
    staleTime: 5 * 60 * 1000,
  })

  function closeEdit() { setEditOpen(false); setEditAndSend(false) }
  async function handleEditSaved() {
    const thenSend = editAndSend
    closeEdit()
    qc.invalidateQueries(['quotes'])
    await qc.refetchQueries({ queryKey: ['quote', id] }) // el modal de envío usa los datos recién guardados
    if (thenSend) setResendMode('updated')
  }

  async function handleDuplicate() {
    if (!await confirm('Se va a crear un borrador nuevo con el mismo cliente, ítems, notas e imágenes. Las cuotas y las fechas no se copian.', { confirmLabel: 'Duplicar' })) return
    setDuplicating(true)
    try {
      const { data } = await duplicateQuote(id)
      const { id: newId, number, skippedImages } = data.data
      qc.invalidateQueries(['quotes'])
      toast(`Borrador #${String(number).padStart(3, '0')} creado${skippedImages ? ` (${skippedImages} imagen${skippedImages !== 1 ? 'es' : ''} no se pudo copiar)` : ''}`, 'success')
      navigate(`/quotes/${newId}`)
    } catch (err) {
      toast(err.response?.data?.error || 'No se pudo duplicar', 'error')
    } finally {
      setDuplicating(false)
    }
  }

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => getQuoteById(id).then(r => r.data.data),
  })

  // Pedido de presupuesto actualizado: al abrir el detalle se marca como visto (apaga el globo rojo de la lista)
  const seenSentFor = useRef(null)
  useEffect(() => {
    if (!quote?.renewalRequestedAt || quote.renewalSeenAt || seenSentFor.current === quote.id) return
    seenSentFor.current = quote.id
    markRenewalRead(quote.id, 'seen')
      .then(({ data }) => {
        qc.setQueryData(['quote', id], prev => prev ? { ...prev, ...data.data } : prev)
        qc.invalidateQueries({ queryKey: ['quotes'] })
        qc.invalidateQueries({ queryKey: ['notifications'] })
      })
      .catch(() => { seenSentFor.current = null })
  }, [quote?.id, quote?.renewalRequestedAt, quote?.renewalSeenAt])

  const [acking, setAcking] = useState(false)
  async function handleAckRenewal() {
    setAcking(true)
    try {
      const { data } = await markRenewalRead(id, 'ack')
      qc.setQueryData(['quote', id], prev => prev ? { ...prev, ...data.data } : prev)
      qc.invalidateQueries({ queryKey: ['quotes'] })
    } catch (err) {
      toast(err.response?.data?.error || 'No se pudo marcar como leído', 'error')
    } finally {
      setAcking(false)
    }
  }

  const del = useMutation({
    mutationFn: () => deleteQuote(id),
    onSuccess: () => {
      qc.invalidateQueries(['quotes'])
      toast('Presupuesto eliminado', 'success')
      navigate('/quotes')
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al eliminar', 'error'),
  })

  async function handleDownloadPdf() {
    setDownloading(true)
    try {
      const res = await downloadQuotePdf(id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = `presupuesto-${quote?.number}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(false) }
  }

  if (isLoading) return (
    <div style={{ padding: '40px 24px', fontFamily: 'Geist, system-ui, sans-serif', fontSize: 13, color: C.piedra }}>
      Cargando...
    </div>
  )
  if (!quote) return (
    <div style={{ padding: '40px 24px', fontFamily: 'Geist, system-ui, sans-serif', fontSize: 13, color: C.piedra }}>
      Presupuesto no encontrado.
    </div>
  )

  const isSigned    = quote.status === 'signed'
  const status      = QUOTE_STATUS[quote.status]
  const subtotal    = Number(quote.subtotal)
  const total       = Number(quote.total)
  const discountAmt = quote.discountType === 'percent'
    ? subtotal * (Number(quote.discountValue) / 100)
    : Number(quote.discountValue) || 0
  const taxAmount   = (subtotal - discountAmt) * (Number(quote.taxRate) / 100)
  const numStr      = `#${String(quote.number).padStart(3, '0')}`
  const isPotential = !quote.client && !!quote.potentialClientName

  return (
    <div className="px-4 pt-5 pb-10 md:px-6 md:pt-7" style={{ maxWidth: 1200, fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 12.5, color: C.piedra }}>
        <Link to="/quotes"
          style={{ color: C.piedra, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = C.arena}
          onMouseLeave={e => e.currentTarget.style.color = C.piedra}
        >
          Presupuestos
        </Link>
        <span style={{ color: C.linea }}>/</span>
        <span style={{ color: C.arena, fontFamily: "'Geist Mono', monospace" }}>{numStr}</span>
        <span style={{ color: C.linea }}>/</span>
        <span style={{ color: C.piedra, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{quote.title}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3" style={{ marginBottom: 28 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {status && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: '0 7px 7px 0', fontSize: 11, fontWeight: 600, background: status.bg, color: status.color }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.color, flexShrink: 0 }} />
                {status.label}
              </span>
            )}
            {isSigned && quote.clientSignedAt && (
              <span style={{ fontSize: 11, color: C.piedra }}>
                Firmado el {new Date(quote.clientSignedAt).toLocaleDateString('es-AR')}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.crema, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            {quote.title}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
          <GhostBtn onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/presupuesto/${id}`); toast('Enlace copiado', 'success') }}>
            <ShareSvg /> Compartir
          </GhostBtn>
          <GhostBtn onClick={() => window.open(`${window.location.origin}/p/presupuesto/${id}`, '_blank')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Vista previa
          </GhostBtn>
          <GhostBtn onClick={handleDownloadPdf} disabled={downloading}>
            <DownloadSvg /> {downloading ? 'Generando...' : 'Descargar PDF'}
          </GhostBtn>
          {canWrite && (
            <GhostBtn onClick={() => isSigned ? toast('El presupuesto fue firmado, no se puede modificar') : setEditOpen(true)}>
              <EditSvg /> Editar
            </GhostBtn>
          )}
          {canWrite && (
            <GhostBtn onClick={handleDuplicate} disabled={duplicating}>
              <CopySvg /> {duplicating ? 'Duplicando...' : 'Duplicar'}
            </GhostBtn>
          )}
          {canWrite && quote.status === 'expired' && (
            <GhostBtn onClick={() => setReactivateOpen(true)}>
              <RefreshSvg /> Reactivar
            </GhostBtn>
          )}
          {canWrite && quote.status === 'draft' && (
            <button
              onClick={async () => { if (await confirm('¿Eliminar este presupuesto? Esta acción no se puede deshacer.', { confirmLabel: 'Eliminar', danger: true })) del.mutate() }}
              disabled={del.isPending}
              style={{ display: 'flex', alignItems: 'center', height: 32, padding: '0 12px', background: 'rgba(229,131,115,0.10)', color: C.err, border: 'none', borderRadius: '0 8px 8px 0', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', opacity: del.isPending ? 0.5 : 1 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,131,115,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(229,131,115,0.10)'}
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Rechazo banner */}
      {quote.status === 'rejected' && quote.rejectionReason && (
        <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(229,131,115,0.08)', border: `1px solid rgba(229,131,115,0.2)`, borderRadius: '0 12px 12px 0', display: 'flex', gap: 10 }}>
          <span style={{ color: C.err, fontSize: 16, flexShrink: 0 }}>✕</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.err, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Motivo de rechazo</p>
            <p style={{ fontSize: 13, color: C.arena, margin: 0, lineHeight: 1.5 }}>{quote.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Pedido de presupuesto actualizado */}
      {quote.renewalRequestedAt && !quote.renewalAckAt && (
        <div className="flex flex-col sm:flex-row sm:items-center" style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(226,182,99,0.08)', border: `1px solid rgba(226,182,99,0.25)`, borderRadius: '0 12px 12px 0', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 0 }}>
            <span style={{ color: C.warn, fontSize: 15, flexShrink: 0 }}>↻</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.warn, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>El cliente pidió un presupuesto actualizado</p>
              <p style={{ fontSize: 13, color: C.arena, margin: 0, lineHeight: 1.5 }}>
                Lo solicitó el {new Date(quote.renewalRequestedAt).toLocaleDateString('es-AR')} desde el enlace. Reenvialo tal cual con una nueva validez, o editalo y mandá la versión actualizada.
              </p>
            </div>
          </div>
          <div className="self-start sm:self-center" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
            {canWrite && (
              <GhostBtn onClick={() => setResendMode('resend')}><RefreshSvg /> Enviar sin cambios</GhostBtn>
            )}
            {canWrite && !isSigned && (
              <button onClick={() => { setEditAndSend(true); setEditOpen(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', background: C.warn, color: C.bg, border: 'none', borderRadius: '0 8px 8px 0', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <EditSvg /> Editar y enviar
              </button>
            )}
            <button onClick={handleAckRenewal} disabled={acking} title="Ocultar este aviso"
              style={{ height: 32, padding: '0 12px', background: 'none', border: 'none', color: C.piedra, fontSize: 12, fontWeight: 500, cursor: acking ? 'not-allowed' : 'pointer', opacity: acking ? 0.5 : 1, fontFamily: 'inherit' }}>
              {acking ? 'Guardando…' : 'Entendido'}
            </button>
          </div>
        </div>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Columna principal ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Cliente */}
          <div style={{ ...card, padding: '20px' }}>
            <SectionHead>Cliente</SectionHead>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px 24px' }}>

              <InfoRow label="Nombre">
                {quote.client ? (
                  <Link to={`/clients/${quote.client.id}`}
                    style={{ color: C.crema, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    onMouseEnter={e => e.currentTarget.style.color = C.arena}
                    onMouseLeave={e => e.currentTarget.style.color = C.crema}
                  >
                    <ClienteIcon style={{ width: 12, height: 12, flexShrink: 0 }} />
                    {quote.client.name}
                  </Link>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {quote.potentialClientName ?? '—'}
                    {isPotential && (
                      <span style={{ display: 'inline-flex', padding: '1px 6px', borderRadius: '0 4px 4px 0', fontSize: 10, fontWeight: 600, background: 'rgba(226,182,99,0.12)', color: C.warn }}>
                        Potencial
                      </span>
                    )}
                  </span>
                )}
              </InfoRow>

              {(quote.client?.company || quote.potentialClientCompany) && (
                <InfoRow label="Empresa">{quote.client?.company ?? quote.potentialClientCompany}</InfoRow>
              )}
              {(quote.client?.email || quote.potentialClientEmail) && (
                <InfoRow label="Email">
                  <span style={{ color: C.arena }}>{quote.client?.email ?? quote.potentialClientEmail}</span>
                </InfoRow>
              )}
              {(quote.client?.phone || quote.potentialClientPhone) && (
                <InfoRow label="Teléfono">
                  <span style={{ color: C.arena }}>{quote.client?.phone ?? quote.potentialClientPhone}</span>
                </InfoRow>
              )}
              {quote.potentialClientAddress && (
                <InfoRow label="Dirección"><span style={{ color: C.arena }}>{quote.potentialClientAddress}</span></InfoRow>
              )}
              {(quote.potentialClientProvince || quote.potentialClientCity) && (
                <InfoRow label="Localidad">
                  <span style={{ color: C.arena }}>
                    {[quote.potentialClientCity, quote.potentialClientProvince].filter(Boolean).join(', ')}
                  </span>
                </InfoRow>
              )}
              {quote.potentialClientCuit && (
                <InfoRow label="CUIT/CUIL"><span style={{ color: C.arena }}>{quote.potentialClientCuit}</span></InfoRow>
              )}

              <InfoRow label="Moneda">
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12 }}>{quote.currency}</span>
              </InfoRow>
              {quote.validUntil && (
                <InfoRow label="Válido hasta">
                  {new Date(quote.validUntil).toLocaleDateString('es-AR')}
                </InfoRow>
              )}
              {quote.deliveryDate && (
                <InfoRow label="Fecha de entrega">
                  {new Date(quote.deliveryDate.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR')}
                </InfoRow>
              )}
              <InfoRow label="Creado">
                {new Date(quote.createdAt).toLocaleDateString('es-AR')}
              </InfoRow>

            </div>
          </div>

          {/* Ítems */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.linea}` }}>
              <SectionHead>Ítems</SectionHead>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                <thead>
                  <tr>
                    {['Descripción', 'Cant.', 'Precio unit.', 'Total'].map((h, i) => (
                      <th key={h} style={{ background: C.linea, color: C.arena, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '10px 14px', textAlign: i > 0 ? 'right' : 'left', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quote.items?.map((item, i) => (
                    <tr key={i}
                      onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = C.s2)}
                      onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = '')}
                    >
                      <td style={{ padding: '11px 14px', color: C.crema, fontSize: 13, borderBottom: `1px solid ${C.linea}` }}>{item.description}</td>
                      <td style={{ padding: '11px 14px', color: C.arena, fontSize: 13, textAlign: 'right', borderBottom: `1px solid ${C.linea}` }}>{item.quantity}</td>
                      <td style={{ padding: '11px 14px', color: C.arena, fontSize: 13, fontFamily: CIFRAS, textAlign: 'right', borderBottom: `1px solid ${C.linea}` }}>{fmt(item.unitPrice, quote.currency)}</td>
                      <td style={{ padding: '11px 14px', color: C.crema, fontSize: 13, fontWeight: 600, fontFamily: CIFRAS, textAlign: 'right', borderBottom: `1px solid ${C.linea}` }}>{fmt(item.amount, quote.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notas */}
          {quote.quoteNotes?.length > 0 && (
            <div style={{ ...card, padding: '20px' }}>
              <SectionHead>Notas</SectionHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {quote.quoteNotes.map(note => (
                  <div key={note.id} style={{ paddingLeft: 12, borderLeft: `2px solid ${C.linea}` }}>
                    {note.title && (
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.crema, margin: '0 0 4px', overflowWrap: 'anywhere' }}>{note.title}</p>
                    )}
                    <p style={{ fontSize: 13, color: C.arena, margin: 0, whiteSpace: 'pre-line', overflowWrap: 'anywhere', lineHeight: 1.5 }}>{note.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Imágenes + Adjuntos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div style={{ ...card, padding: '20px' }}>
              <QuoteImagesPanel quoteId={id} images={quote.images ?? []} canWrite={canWrite} />
            </div>
            <div style={{ ...card, padding: '20px' }}>
              <AttachmentsPanel entityType="quote" entityId={id} />
            </div>
          </div>

        </div>

        {/* ── Sidebar derecha ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Resumen financiero */}
          <div style={{ ...card, padding: '20px' }}>
            <SectionHead>Resumen</SectionHead>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: C.piedra }}>Subtotal</span>
                <span style={{ fontSize: 13, color: C.arena, fontFamily: CIFRAS }}>{fmt(subtotal, quote.currency)}</span>
              </div>
              {discountAmt > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, color: C.piedra }}>
                    Descuento{quote.discountType === 'percent' ? ` (${quote.discountValue}%)` : ''}
                  </span>
                  <span style={{ fontSize: 13, color: C.ok, fontFamily: CIFRAS }}>−{fmt(discountAmt, quote.currency)}</span>
                </div>
              )}
              {quote.taxRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, color: C.piedra }}>IVA ({quote.taxRate}%)</span>
                  <span style={{ fontSize: 13, color: C.arena, fontFamily: CIFRAS }}>{fmt(taxAmount, quote.currency)}</span>
                </div>
              )}
            </div>

            <div style={{ borderTop: `1px solid ${C.linea}`, paddingTop: 14 }}>
              <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.piedra, margin: '0 0 6px' }}>Total</p>
              <p style={{ fontFamily: CIFRAS, fontSize: 32, fontWeight: 700, color: C.crema, margin: 0, lineHeight: 1 }}>
                {fmt(total, quote.currency)}
              </p>
            </div>
          </div>

          {/* Cuotas */}
          <div style={{ ...card, padding: '20px' }}>
            <InstallmentsPanel
              entityType="quote"
              entityId={id}
              entityStatus={quote.status}
              canWrite={canWrite}
              currency={quote.currency}
              total={total}
            />
          </div>

          {/* Proyecto */}
          {(quote.project || quote.potentialProjectTitle) && (
            <div style={{ ...card, padding: '20px' }}>
              <SectionHead>Proyecto</SectionHead>
              {quote.project ? (
                <Link to={`/projects/${quote.project.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: C.crema }}
                  onMouseEnter={e => e.currentTarget.style.color = C.arena}
                  onMouseLeave={e => e.currentTarget.style.color = C.crema}
                >
                  <CarpetaIcon style={{ width: 14, height: 14, flexShrink: 0, color: C.arena }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{quote.project.title}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: C.piedra, flexShrink: 0 }}>Ver →</span>
                </Link>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CarpetaIcon style={{ width: 14, height: 14, flexShrink: 0, color: C.arena }} />
                  <span style={{ fontSize: 13, color: C.arena }}>{quote.potentialProjectTitle}</span>
                </div>
              )}
            </div>
          )}

          {/* Info de envío */}
          {(quote.sentByEmail || quote.sentByWhatsapp) && (
            <div style={{ ...card, padding: '16px 20px' }}>
              <SectionHead>Enviado</SectionHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {quote.sentByEmail && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.arena }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.ok, flexShrink: 0 }} />
                    Por email
                  </div>
                )}
                {quote.sentByWhatsapp && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.arena }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.ok, flexShrink: 0 }} />
                    Por WhatsApp
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modales de edición */}
      {editOpen && (
        isPotential ? (
          <QuoteModalPotential quoteId={id} onClose={closeEdit} onSaved={handleEditSaved}
            submitLabel={editAndSend ? 'Enviar presupuesto actualizado →' : undefined} />
        ) : (
          <QuoteModal quoteId={id} onClose={closeEdit} onSaved={handleEditSaved}
            submitLabel={editAndSend ? 'Enviar presupuesto actualizado →' : undefined} />
        )
      )}

      {resendMode && (
        <ResendModal quote={quote} mode={resendMode} hasSignature={!!orgData?.signature}
          onClose={() => setResendMode(null)}
          onDone={(okMsg, errMsg) => {
            setResendMode(null)
            qc.invalidateQueries(['quote', id]); qc.invalidateQueries(['quotes']); qc.invalidateQueries({ queryKey: ['notifications'] })
            if (errMsg) toast(errMsg, 'error'); else toast(okMsg, 'success')
          }}
        />
      )}

      {reactivateOpen && (
        <ReactivateModal quote={quote} onClose={() => setReactivateOpen(false)}
          onDone={({ emailed, emailError } = {}) => {
            setReactivateOpen(false)
            qc.invalidateQueries(['quote', id]); qc.invalidateQueries(['quotes'])
            if (emailError) toast(`Reactivado, pero no se envió el email: ${emailError}`, 'error')
            else toast(emailed ? 'Presupuesto reactivado y enviado por email' : 'Presupuesto reactivado', 'success')
          }}
        />
      )}
    </div>
  )
}
