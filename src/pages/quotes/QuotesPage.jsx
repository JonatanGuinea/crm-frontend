import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getQuotes, updateQuote, sendQuote, downloadQuotePdf, getAllQuotesHistory } from '../../api/quotes'
import { getOrganizations } from '../../api/organizations'
import QuoteModal from './QuoteModal'
import QuoteModalPotential from './QuoteModalPotential'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import DatePicker from '../../components/DatePicker'
import { PresupuestoIcon, ClienteIcon, MasIcon } from '../../components/DuIcons'
import { fmt } from '../../utils/fmt'

const C = {
  bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F',
  crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E',
  ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE',
}
const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"
const card = { background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0' }

const PAGE_SIZE = 10

const QUOTE_STATUS = {
  draft:     { label: 'Borrador',   bg: 'rgba(242,237,227,0.07)', color: C.piedra },
  sent:      { label: 'Enviado',    bg: 'rgba(142,177,222,0.12)', color: C.info },
  approved:  { label: 'Aprobado',  bg: 'rgba(125,190,147,0.12)', color: C.ok },
  signed:    { label: 'Firmado',   bg: 'rgba(125,190,147,0.18)', color: C.ok },
  rejected:  { label: 'Rechazado', bg: 'rgba(229,131,115,0.12)', color: C.err },
  cancelled: { label: 'Cancelado', bg: 'rgba(229,131,115,0.08)', color: C.err },
  expired:   { label: 'Vencido',   bg: 'rgba(242,237,227,0.05)', color: C.piedra },
}

const ALL_STATUS_TABS = [
  { key: '', label: 'Todos' },
  { key: 'draft', label: 'Borrador' },
  { key: 'sent', label: 'Enviado' },
  { key: 'approved', label: 'Aprobado' },
  { key: 'signed', label: 'Firmado' },
  { key: 'rejected', label: 'Rechazado' },
  { key: 'expired', label: 'Vencido' },
  { key: 'cancelled', label: 'Cancelado' },
]

const ALLOWED_TRANSITIONS = {
  draft: [], sent: ['approved', 'rejected', 'expired'],
  approved: [], signed: [], rejected: [], cancelled: [], expired: [],
}

/* ── SVGs ─────────────────────────────────────────────────────────────────── */
function WaIcon({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 16 16" fill="currentColor"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
}
function DownloadSvg({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
}
function EmailSvg() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
}
function SpinSvg() {
  return <svg style={{ display: 'block', animation: 'spin 1s linear infinite' }} width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25"/><path fill="currentColor" fillOpacity="0.75" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/></svg>
}
function ChevronSvg({ size = 11 }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ display: 'block', flexShrink: 0 }}><path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SearchSvg() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
}
function CalendarSvg() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}

/* ── Badge ────────────────────────────────────────────────────────────────── */
function QBadge({ status }) {
  const s = QUOTE_STATUS[status] ?? QUOTE_STATUS.draft
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '0 6px 6px 0', fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, marginRight: 5, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

/* ── Status dropdown ──────────────────────────────────────────────────────── */
function StatusDropdown({ quote, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const allowed = ALLOWED_TRANSITIONS[quote.status] || []
  if (!allowed.length) return <QBadge status={quote.status} />

  function handleToggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const dropW = 152
      const dropH = allowed.length * 36 + 8
      let top = r.bottom + 4
      let left = r.left
      if (left + dropW > window.innerWidth - 8) left = r.right - dropW
      if (top + dropH > window.innerHeight - 8) top = r.top - dropH - 4
      setDropPos({ top, left })
    }
    setOpen(o => !o)
  }
  const s = QUOTE_STATUS[quote.status] ?? QUOTE_STATUS.draft
  return (
    <div style={{ display: 'inline-block' }}>
      {open && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, zIndex: 9999, background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 12px 12px 0', padding: '4px 0', minWidth: 152, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            {allowed.map(st => {
              const opt = QUOTE_STATUS[st] ?? QUOTE_STATUS.draft
              return (
                <button key={st} onClick={() => { onUpdate(st); setOpen(false) }}
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.arena, fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.s3}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: opt.color, flexShrink: 0 }} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </>,
        document.body
      )}
      <button ref={btnRef} onClick={handleToggle}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: '0 6px 6px 0', fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: 'none', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
        {s.label}
        <ChevronSvg size={9} />
      </button>
    </div>
  )
}

/* ── Historial ────────────────────────────────────────────────────────────── */
const HISTORY_STEP = 25
function fmtDateTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function actionText(entry) {
  switch (entry.action) {
    case 'created':        return 'creó el presupuesto'
    case 'status_changed': return entry.detail ?? 'cambió el estado'
    case 'updated':        return `actualizó ${entry.detail ?? 'el presupuesto'}`
    case 'sent_email':     return `envió por email${entry.detail ? ` a ${entry.detail}` : ''}`
    default:               return entry.action
  }
}
function HistoryView({ historyData, isLoading }) {
  const [visible, setVisible] = useState(HISTORY_STEP)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const filtered = (historyData ?? []).filter(e => {
    const d = new Date(e.createdAt)
    if (fromDate && d < new Date(fromDate)) return false
    if (toDate && d > new Date(toDate + 'T23:59:59')) return false
    return true
  })
  const shown = filtered.slice(0, visible)
  const dpClass = "h-[34px] px-3 bg-[#141415] border border-[#2C2C2F] rounded-[0_9px_9px_0] text-[13px] outline-none min-w-[130px]"
  if (isLoading) return <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '40px 0' }}>Cargando historial…</p>
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <DatePicker value={fromDate} onChange={e => { setFromDate(e.target.value); setVisible(HISTORY_STEP) }} className={dpClass} placeholder="Desde" />
        <DatePicker value={toDate} onChange={e => { setToDate(e.target.value); setVisible(HISTORY_STEP) }} className={dpClass} placeholder="Hasta" />
        {(fromDate || toDate) && (
          <button onClick={() => { setFromDate(''); setToDate(''); setVisible(HISTORY_STEP) }}
            style={{ height: 34, padding: '0 12px', background: 'none', border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', color: C.piedra, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
            onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
          >Limpiar</button>
        )}
      </div>
      {shown.length === 0 ? (
        <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '40px 0' }}>Sin movimientos registrados</p>
      ) : (
        <div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {shown.map(entry => (
              <li key={entry.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.linea}`, fontSize: 13 }}>
                <div style={{ width: 10, height: 16, flexShrink: 0, marginTop: 2, borderLeft: `2.5px solid ${C.piedra}`, borderBottom: `2.5px solid ${C.piedra}` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontWeight: 600, color: C.crema }}>{entry.user?.name ?? 'Alguien'}</span>
                    <span style={{ color: C.arena }}>{actionText(entry)}</span>
                    {entry.quote && (
                      <Link to={`/quotes/${entry.quote.id}`} style={{ fontWeight: 600, color: C.crema, textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.color = C.arena}
                        onMouseLeave={e => e.currentTarget.style.color = C.crema}
                      >
                        #{String(entry.quote.number).padStart(3, '0')} {entry.quote.title}
                      </Link>
                    )}
                  </div>
                  <p style={{ fontSize: 11.5, color: C.piedra, marginTop: 2 }}>{fmtDateTime(entry.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
          {visible < filtered.length && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
              <button onClick={() => setVisible(v => v + HISTORY_STEP)}
                style={{ padding: '8px 20px', background: 'none', border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', color: C.piedra, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
                onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
              >
                Mostrar más ({filtered.length - visible} restantes)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Página ───────────────────────────────────────────────────────────────── */
export default function QuotesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const canWrite = user?.role !== 'member'
  const orgId = user?.org
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [clientInputOpen, setClientInputOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [sendingEmailId, setSendingEmailId] = useState(null)
  const [confirmEmailQuote, setConfirmEmailQuote] = useState(null)
  const [sendingWaId, setSendingWaId] = useState(null)
  const [newMenuOpen, setNewMenuOpen] = useState(false)
  const [newMenuPos, setNewMenuPos] = useState({ top: 0, left: 0 })
  const [potentialOpen, setPotentialOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const newBtnRef = useRef(null)
  const dateBtnRef = useRef(null)

  const { data: orgData } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganizations().then(r => r.data.data?.find(o => o.id === orgId)),
    enabled: Boolean(orgId),
    staleTime: 5 * 60 * 1000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => getQuotes({}).then(r => r.data),
  })

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['quotes-history'],
    queryFn: () => getAllQuotesHistory().then(r => r.data.data),
    enabled: showHistory,
  })

  const allQuotes = data?.data ?? []

  // ── Stats ──────────────────────────────────────────────────────────────────
  const now = new Date()
  const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const d90     = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const sentNoReply       = allQuotes.filter(q => q.status === 'sent')
  const sentNoReplyAmount = sentNoReply.reduce((s, q) => s + Number(q.total), 0)

  const approvedThisMonth = allQuotes.filter(q =>
    (q.status === 'signed' || q.status === 'approved') &&
    new Date(q.updatedAt || q.createdAt) >= startOfMonth
  )
  const approvedLastMonth = allQuotes.filter(q =>
    (q.status === 'signed' || q.status === 'approved') &&
    new Date(q.updatedAt || q.createdAt) >= lastMonthStart &&
    new Date(q.updatedAt || q.createdAt) <= lastMonthEnd
  )
  const approvedDiff = approvedThisMonth.length - approvedLastMonth.length

  const last90Actionable = allQuotes.filter(q =>
    new Date(q.createdAt) >= d90 && ['sent', 'signed', 'approved', 'rejected'].includes(q.status)
  )
  const last90Approved = last90Actionable.filter(q => ['signed', 'approved'].includes(q.status))
  const approvalRate = last90Actionable.length > 0
    ? Math.round((last90Approved.length / last90Actionable.length) * 100)
    : 0

  const expiringSoon = allQuotes.filter(q =>
    ['draft', 'sent'].includes(q.status) &&
    q.validUntil &&
    new Date(q.validUntil) <= in7Days &&
    new Date(q.validUntil) >= now
  )
  const expiringSoonLabel = expiringSoon
    .map(q => `#${String(q.number).padStart(3, '0')}`)
    .slice(0, 3)
    .join(' · ')

  // ── Tab counts ─────────────────────────────────────────────────────────────
  const tabCounts = {}
  ALL_STATUS_TABS.forEach(t => {
    tabCounts[t.key] = t.key === '' ? allQuotes.length : allQuotes.filter(q => q.status === t.key).length
  })
  const visibleTabs = ALL_STATUS_TABS.filter(t => t.key === '' || tabCounts[t.key] > 0)

  // ── Filtering + pagination ─────────────────────────────────────────────────
  const filteredQuotes = allQuotes
    .filter(q => {
      if (statusFilter && q.status !== statusFilter) return false
      if (fromDate && new Date(q.createdAt) < new Date(fromDate)) return false
      if (toDate   && new Date(q.createdAt) > new Date(toDate + 'T23:59:59')) return false
      if (clientSearch) {
        const name    = (q.client?.name    || q.potentialClientName    || '').toLowerCase()
        const company = (q.client?.company || q.potentialClientCompany || '').toLowerCase()
        const s = clientSearch.toLowerCase()
        if (!name.includes(s) && !company.includes(s)) return false
      }
      return true
    })
    .sort((a, b) => b.number - a.number)

  const totalPages  = Math.max(1, Math.ceil(filteredQuotes.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedQuotes = filteredQuotes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const activeFilterCount = (statusFilter ? 1 : 0) + (fromDate || toDate ? 1 : 0) + (clientSearch ? 1 : 0)

  // ── Mutations & handlers ───────────────────────────────────────────────────
  const changeStatus = useMutation({
    mutationFn: ({ id, status }) => updateQuote(id, { status }),
    onSuccess: () => qc.invalidateQueries(['quotes']),
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al cambiar estado', 'error'),
  })

  function handleSendEmail(q) {
    if (!orgData?.signature) { toast('Configurá la firma en Ajustes antes de enviar presupuestos.', 'error'); return }
    setConfirmEmailQuote(q)
  }

  async function doSendEmail(q) {
    setConfirmEmailQuote(null)
    setSendingEmailId(q.id)
    try {
      await sendQuote(q.id)
      qc.invalidateQueries(['quotes'])
      toast('Presupuesto enviado por email', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Error al enviar presupuesto', 'error')
    } finally { setSendingEmailId(null) }
  }

  async function handleSendWa(q) {
    if (!orgData?.signature) { toast('Configurá la firma en Ajustes antes de enviar presupuestos.', 'error'); return }
    const phone = (q.client?.phone || q.potentialClientPhone || '').replace(/\D/g, '')
    if (!phone) { toast('Este cliente no tiene teléfono registrado.'); return }
    const name = q.client?.name || q.potentialClientName || 'cliente'
    const publicUrl = `${window.location.origin}/p/presupuesto/${q.id}`
    const num = String(q.number).padStart(3, '0')
    const msg = `Hola ${name}, te comparto el presupuesto #${num} — ${q.title}:\n${publicUrl}`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
    setSendingWaId(q.id)
    try {
      await updateQuote(q.id, { sentByWhatsapp: true })
      qc.invalidateQueries(['quotes'])
      toast('Presupuesto compartido por WhatsApp', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Error al registrar envío', 'error')
    } finally { setSendingWaId(null) }
  }

  async function handleDownload(id, number) {
    setDownloading(id)
    try {
      const res = await downloadQuotePdf(id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = `presupuesto-${number}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(null) }
  }

  function openNewMenu(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const menuW = 220
    let left = r.right - menuW
    if (left < 8) left = r.left
    setNewMenuPos({ top: r.bottom + 6, left })
    setNewMenuOpen(true)
  }

  function handleSaved() { setModalOpen(false); qc.invalidateQueries(['quotes']) }
  function handlePotentialSaved() { setPotentialOpen(false); qc.invalidateQueries(['quotes']); qc.invalidateQueries(['clients-all']) }

  function changeTab(key) { setStatusFilter(key); setPage(1) }
  function clearFilters() { setStatusFilter(''); setFromDate(''); setToDate(''); setClientSearch(''); setPage(1) }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 pt-5 pb-10 md:px-6 md:pt-7" style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PresupuestoIcon style={{ width: 18, height: 18, color: C.arena }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema, margin: 0 }}>Presupuestos</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowHistory(v => !v)}
            style={{
              height: 36, padding: '0 14px', background: showHistory ? C.s2 : 'none',
              border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0',
              color: C.piedra, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'color 0.12s, border-color 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
            onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
          >
            {showHistory ? 'Ver tabla' : 'Historial'}
          </button>
          {canWrite && (
            <button
              ref={newBtnRef}
              onClick={openNewMenu}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 34, padding: '0 14px',
                background: C.crema, color: C.bg,
                border: 'none', borderRadius: '0 9px 9px 0',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#E8E3D9'}
              onMouseLeave={e => e.currentTarget.style.background = C.crema}
            >
              <MasIcon style={{ width: 12, height: 12 }} />
               Nuevo
            </button>
          )}
        </div>
      </div>

      {/* Historial view */}
      {showHistory && (
        <HistoryView historyData={historyData} isLoading={historyLoading} />
      )}

      {!showHistory && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3" style={{ marginBottom: 24 }}>
            {/* Enviados sin respuesta */}
            <div style={{ ...card, padding: '18px 20px' }}>
              <p style={{ fontSize: 11, color: C.piedra, marginBottom: 8 }}>Enviados sin respuesta</p>
              <p style={{ fontFamily: CIFRAS, fontSize: 28, fontWeight: 700, color: C.crema, lineHeight: 1, marginBottom: 6 }}>
                {isLoading ? '—' : sentNoReply.length}
              </p>
              <p style={{ fontSize: 11.5, color: C.arena }}>
                {sentNoReply.length > 0 ? fmt(sentNoReplyAmount, allQuotes[0]?.currency || 'ARS') : 'Sin enviados pendientes'}
              </p>
            </div>

            {/* Aprobados este mes */}
            <div style={{ ...card, padding: '18px 20px' }}>
              <p style={{ fontSize: 11, color: C.piedra, marginBottom: 8 }}>Aprobados este mes</p>
              <p style={{ fontFamily: CIFRAS, fontSize: 28, fontWeight: 700, color: C.crema, lineHeight: 1, marginBottom: 6 }}>
                {isLoading ? '—' : approvedThisMonth.length}
              </p>
              <p style={{ fontSize: 11.5, color: approvedDiff > 0 ? C.ok : approvedDiff < 0 ? C.err : C.arena }}>
                {isLoading ? '—' : approvedDiff === 0 ? 'Igual que el mes pasado'
                  : `${approvedDiff > 0 ? '+' : ''}${approvedDiff} vs. mes pasado`}
              </p>
            </div>

            {/* Tasa de aprobación */}
            <div style={{ ...card, padding: '18px 20px' }}>
              <p style={{ fontSize: 11, color: C.piedra, marginBottom: 8 }}>Tasa de aprobación</p>
              <p style={{ fontFamily: CIFRAS, fontSize: 28, fontWeight: 700, color: C.crema, lineHeight: 1, marginBottom: 6 }}>
                {isLoading ? '—' : `${approvalRate}%`}
              </p>
              <p style={{ fontSize: 11.5, color: C.arena }}>últimos 90 días</p>
            </div>

            {/* Por vencer */}
            <div style={{ ...card, padding: '18px 20px' }}>
              <p style={{ fontSize: 11, color: C.piedra, marginBottom: 8 }}>Por vencer (7 días)</p>
              <p style={{ fontFamily: CIFRAS, fontSize: 28, fontWeight: 700, color: expiringSoon.length > 0 ? C.warn : C.crema, lineHeight: 1, marginBottom: 6 }}>
                {isLoading ? '—' : expiringSoon.length}
              </p>
              <p style={{ fontSize: 11.5, color: C.arena, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {expiringSoon.length > 0 ? expiringSoonLabel : 'Sin vencimientos próximos'}
              </p>
            </div>
          </div>

          {/* Filtros: tabs de estado + fecha + cliente */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>

            {/* Tabs de estado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {visibleTabs.map(t => {
                const active = statusFilter === t.key
                const st = QUOTE_STATUS[t.key]
                return (
                  <button
                    key={t.key}
                    onClick={() => changeTab(t.key)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      height: 32, padding: '0 12px',
                      background: active ? C.s2 : 'none',
                      border: `1px solid ${active ? C.arena : C.linea}`,
                      borderRadius: '0 8px 8px 0',
                      color: active ? C.crema : C.piedra,
                      fontSize: 12.5, fontWeight: active ? 600 : 400,
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.arena } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.piedra } }}
                  >
                    {t.key && st && <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? st.color : C.piedra, flexShrink: 0, transition: 'background 0.12s' }} />}
                    {t.label}
                    <span style={{ fontSize: 11, fontWeight: 600, color: active ? C.arena : C.piedra, fontFamily: CIFRAS }}>
                      {tabCounts[t.key] ?? 0}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Fecha + cliente */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Desde · Hasta */}
              <div style={{ position: 'relative' }}>
                <button
                  ref={dateBtnRef}
                  onClick={() => setDatePickerOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    height: 32, padding: '0 12px',
                    background: (fromDate || toDate) ? C.s2 : 'none',
                    border: `1px solid ${(fromDate || toDate) ? C.arena : C.linea}`,
                    borderRadius: '0 8px 8px 0',
                    color: (fromDate || toDate) ? C.arena : C.piedra,
                    fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (!fromDate && !toDate) { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.arena } }}
                  onMouseLeave={e => { if (!fromDate && !toDate) { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.piedra } }}
                >
                  <CalendarSvg />
                  {fromDate || toDate
                    ? `${fromDate ? new Date(fromDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) : '…'} — ${toDate ? new Date(toDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) : '…'}`
                    : 'Desde · Hasta'
                  }
                </button>
                {datePickerOpen && createPortal(
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setDatePickerOpen(false)} />
                    <div style={{
                      position: 'fixed',
                      top: dateBtnRef.current ? dateBtnRef.current.getBoundingClientRect().bottom + 4 : 0,
                      left: dateBtnRef.current ? dateBtnRef.current.getBoundingClientRect().left : 0,
                      zIndex: 9999, background: C.s2, border: `1px solid ${C.linea}`,
                      borderRadius: '0 12px 12px 0', padding: '14px 16px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220,
                    }}>
                      <div>
                        <p style={{ fontSize: 10.5, color: C.piedra, marginBottom: 5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Desde</p>
                        <DatePicker value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1) }}
                          className="h-[34px] px-3 bg-[#141415] border border-[#2C2C2F] rounded-[0_9px_9px_0] text-[13px] outline-none w-full" placeholder="Desde" />
                      </div>
                      <div>
                        <p style={{ fontSize: 10.5, color: C.piedra, marginBottom: 5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Hasta</p>
                        <DatePicker value={toDate} onChange={e => { setToDate(e.target.value); setPage(1) }}
                          className="h-[34px] px-3 bg-[#141415] border border-[#2C2C2F] rounded-[0_9px_9px_0] text-[13px] outline-none w-full" placeholder="Hasta" />
                      </div>
                      {(fromDate || toDate) && (
                        <button onClick={() => { setFromDate(''); setToDate(''); setPage(1) }}
                          style={{ background: 'none', border: 'none', color: C.err, fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', padding: 0 }}>
                          × Limpiar fechas
                        </button>
                      )}
                    </div>
                  </>,
                  document.body
                )}
              </div>

              {/* Cliente */}
              {clientInputOpen ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 10, color: C.piedra, pointerEvents: 'none' }}><SearchSvg /></span>
                    <input
                      autoFocus
                      value={clientSearch}
                      onChange={e => { setClientSearch(e.target.value); setPage(1) }}
                      onKeyDown={e => e.key === 'Escape' && setClientInputOpen(false)}
                      placeholder="Buscar cliente..."
                      style={{
                        height: 32, paddingLeft: 30, paddingRight: 10,
                        background: C.s2, border: `1px solid ${clientSearch ? C.arena : C.linea}`,
                        borderRadius: '0 8px 8px 0', color: C.crema, fontSize: 12.5,
                        outline: 'none', fontFamily: 'inherit', width: 160,
                      }}
                    />
                  </div>
                  {clientSearch && (
                    <button onClick={() => { setClientSearch(''); setClientInputOpen(false) }}
                      style={{ background: 'none', border: 'none', color: C.piedra, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}>×</button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setClientInputOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    height: 32, padding: '0 12px',
                    background: clientSearch ? C.s2 : 'none',
                    border: `1px solid ${clientSearch ? C.arena : C.linea}`,
                    borderRadius: '0 8px 8px 0',
                    color: clientSearch ? C.arena : C.piedra,
                    fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (!clientSearch) { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.arena } }}
                  onMouseLeave={e => { if (!clientSearch) { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.piedra } }}
                >
                  <ClienteIcon style={{ width: 13, height: 13 }} />
                  Cliente
                </button>
              )}

              {activeFilterCount > 0 && (
                <button onClick={clearFilters}
                  style={{ background: 'none', border: 'none', color: C.piedra, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: '0 4px' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.err}
                  onMouseLeave={e => e.currentTarget.style.color = C.piedra}
                >
                  × Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Tabla */}
          {isLoading ? (
            <p style={{ fontSize: 13, color: C.piedra, padding: '40px 0', textAlign: 'center' }}>Cargando...</p>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pagedQuotes.map(q => (
                    <div key={q.id} style={{ ...card, padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", color: C.piedra }}>
                          #{String(q.number).padStart(3, '0')}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {(q.installments?.length ?? 0) > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '0 6px 6px 0', fontSize: 10.5, fontWeight: 600, background: 'rgba(226,182,99,0.12)', color: C.warn }}>
                              {q.installments.length} cuota{q.installments.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          <QBadge status={q.status} />
                        </div>
                      </div>
                      <Link to={`/quotes/${q.id}`}
                        style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: C.crema, textDecoration: 'none', marginBottom: 3 }}
                        onMouseEnter={e => e.currentTarget.style.color = C.arena}
                        onMouseLeave={e => e.currentTarget.style.color = C.crema}
                      >
                        {q.title}
                      </Link>
                      {(q.items?.length > 0) && (
                        <p style={{ fontSize: 11, color: C.piedra, marginBottom: 8 }}>{q.items.length} ítem{q.items.length !== 1 ? 's' : ''}</p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                        {(q.client?.name || q.potentialClientName) && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: C.arena, overflow: 'hidden' }}>
                            <ClienteIcon style={{ width: 12, height: 12, flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {q.client?.name ?? q.potentialClientName}
                            </span>
                          </span>
                        )}
                        <span style={{ fontSize: 15, fontWeight: 700, fontFamily: CIFRAS, color: C.crema, flexShrink: 0 }}>
                          {fmt(q.total, q.currency)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: `1px solid ${C.linea}` }}>
                        <button onClick={() => handleDownload(q.id, q.number)} disabled={downloading === q.id} title="Descargar PDF"
                          style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.s2, border: 'none', borderRadius: '0 7px 7px 0', cursor: 'pointer', color: C.arena, opacity: downloading === q.id ? 0.4 : 1 }}>
                          <DownloadSvg />
                        </button>
                        {canWrite && ['draft', 'sent'].includes(q.status) && (
                          <>
                            <button onClick={() => handleSendWa(q)} disabled={q.sentByWhatsapp || sendingWaId === q.id}
                              style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.s2, border: 'none', borderRadius: '0 7px 7px 0', cursor: 'pointer', color: '#25D366', opacity: (q.sentByWhatsapp || sendingWaId === q.id) ? 0.3 : 1 }}>
                              <WaIcon style={{ width: 14, height: 14 }} />
                            </button>
                            <button onClick={() => handleSendEmail(q)} disabled={q.sentByEmail || sendingEmailId === q.id}
                              style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.s2, border: 'none', borderRadius: '0 7px 7px 0', cursor: 'pointer', color: C.info, opacity: (q.sentByEmail || sendingEmailId === q.id) ? 0.3 : 1 }}>
                              {sendingEmailId === q.id ? <SpinSvg /> : <EmailSvg />}
                            </button>
                          </>
                        )}
                        <Link to={`/quotes/${q.id}`}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 30, background: C.linea, color: C.crema, borderRadius: '0 7px 7px 0', textDecoration: 'none', fontSize: 12.5, fontWeight: 500 }}
                          onMouseEnter={e => e.currentTarget.style.background = C.s3}
                          onMouseLeave={e => e.currentTarget.style.background = C.linea}
                        >
                          Ver →
                        </Link>
                      </div>
                    </div>
                  ))}
                  {!filteredQuotes.length && (
                    <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '40px 0' }}>Sin presupuestos</p>
                  )}
                </div>
              </div>

              {/* Desktop tabla */}
              <div className="hidden md:block" style={{ ...card, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: C.linea }}>
                        {['No', 'Título', 'Cliente', 'Estado', 'Válido hasta', 'Cuotas', 'Total', ''].map((h, i) => (
                          <th key={i} style={{
                            color: C.arena, fontSize: 10.5, fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            padding: '11px 14px', textAlign: i >= 5 ? 'right' : 'left',
                            whiteSpace: 'nowrap',
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedQuotes.map(q => (
                        <tr key={q.id}
                          onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = C.s2)}
                          onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = 'transparent')}
                        >
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, color: C.piedra, fontFamily: "'Geist Mono', monospace", fontSize: 11.5, whiteSpace: 'nowrap' }}>
                            #{String(q.number).padStart(3, '0')}
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}` }}>
                            <Link to={`/quotes/${q.id}`}
                              style={{ display: 'block', fontWeight: 500, color: C.crema, textDecoration: 'none', marginBottom: 2 }}
                              onMouseEnter={e => e.currentTarget.style.color = C.arena}
                              onMouseLeave={e => e.currentTarget.style.color = C.crema}
                            >
                              {q.title}
                            </Link>
                            {(q.items?.length > 0) && (
                              <span style={{ fontSize: 11, color: C.piedra }}>
                                {q.items.length} ítem{q.items.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, color: C.arena, fontSize: 12.5 }}>
                            {q.client?.name ?? (
                              q.potentialClientName
                                ? <span style={{ fontStyle: 'italic', color: C.piedra }}>{q.potentialClientName}</span>
                                : <span style={{ color: C.piedra }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}` }}>
                            {canWrite
                              ? <StatusDropdown quote={q} onUpdate={status => changeStatus.mutate({ id: q.id, status })} />
                              : <QBadge status={q.status} />
                            }
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, color: C.arena, fontSize: 12.5, whiteSpace: 'nowrap' }}>
                            {q.validUntil ? new Date(q.validUntil).toLocaleDateString('es-AR') : <span style={{ color: C.piedra }}>—</span>}
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, textAlign: 'right' }}>
                            {(q.installments?.length ?? 0) > 0
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '0 6px 6px 0', fontSize: 10.5, fontWeight: 600, background: 'rgba(226,182,99,0.12)', color: C.warn }}>
                                  {q.installments.length}
                                </span>
                              : <span style={{ color: C.piedra }}>—</span>
                            }
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, fontFamily: CIFRAS, fontWeight: 600, color: C.crema, whiteSpace: 'nowrap', textAlign: 'right' }}>
                            {fmt(q.total, q.currency)}
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {canWrite && ['draft', 'sent'].includes(q.status) && (
                                <>
                                  <button onClick={() => handleSendWa(q)} disabled={q.sentByWhatsapp || sendingWaId === q.id} title={q.sentByWhatsapp ? 'Ya enviado por WhatsApp' : 'WhatsApp'}
                                    style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderRadius: '0 5px 5px 0', cursor: 'pointer', color: '#25D366', opacity: (q.sentByWhatsapp || sendingWaId === q.id) ? 0.25 : 0.7, transition: 'opacity 0.12s' }}
                                    onMouseEnter={e => { if (!q.sentByWhatsapp) e.currentTarget.style.opacity = '1' }}
                                    onMouseLeave={e => { if (!q.sentByWhatsapp) e.currentTarget.style.opacity = '0.7' }}
                                  >
                                    <WaIcon style={{ width: 13, height: 13 }} />
                                  </button>
                                  <button onClick={() => handleSendEmail(q)} disabled={q.sentByEmail || sendingEmailId === q.id} title={q.sentByEmail ? 'Ya enviado por email' : 'Enviar por email'}
                                    style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderRadius: '0 5px 5px 0', cursor: 'pointer', color: C.crema, opacity: (q.sentByEmail || sendingEmailId === q.id) ? 0.25 : 0.7, transition: 'opacity 0.12s' }}
                                    onMouseEnter={e => { if (!q.sentByEmail) e.currentTarget.style.opacity = '1' }}
                                    onMouseLeave={e => { if (!q.sentByEmail) e.currentTarget.style.opacity = '0.7' }}
                                  >
                                    {sendingEmailId === q.id ? <SpinSvg /> : <EmailSvg />}
                                  </button>
                                </>
                              )}
                              <button onClick={() => handleDownload(q.id, q.number)} disabled={downloading === q.id} title="Descargar PDF"
                                style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderRadius: '0 5px 5px 0', cursor: downloading === q.id ? 'not-allowed' : 'pointer', color: C.piedra, opacity: downloading === q.id ? 0.3 : 0.7, transition: 'opacity 0.12s, color 0.12s' }}
                                onMouseEnter={e => { if (!downloading) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = C.arena } }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.color = C.piedra }}
                              >
                                <DownloadSvg size={13} />
                              </button>
                              <Link to={`/quotes/${q.id}`}
                                style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '0 6px 6px 0', background: C.linea, color: C.crema, textDecoration: 'none', fontSize: 11.5, transition: 'background 0.12s' }}
                                onMouseEnter={e => e.currentTarget.style.background = C.s3}
                                onMouseLeave={e => e.currentTarget.style.background = C.linea}
                              >
                                Ver →
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!filteredQuotes.length && (
                        <tr>
                          <td colSpan={8} style={{ padding: '40px 14px', textAlign: 'center', color: C.piedra, fontSize: 13 }}>
                            Sin presupuestos{activeFilterCount > 0 ? ' con los filtros aplicados' : ''}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginación */}
              {filteredQuotes.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <p style={{ fontSize: 12, color: C.piedra, margin: 0 }}>
                    Mostrando {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredQuotes.length)}–{Math.min(currentPage * PAGE_SIZE, filteredQuotes.length)} de {filteredQuotes.length}
                  </p>
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                        const active = p === currentPage
                        return (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            style={{
                              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: active ? C.crema : 'none',
                              border: `1px solid ${active ? C.crema : C.linea}`,
                              borderRadius: '0 7px 7px 0',
                              color: active ? C.bg : C.piedra,
                              fontSize: 12.5, fontWeight: active ? 600 : 400,
                              cursor: 'pointer', fontFamily: CIFRAS,
                              transition: 'all 0.12s',
                            }}
                            onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.arena } }}
                            onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.piedra } }}
                          >
                            {p}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Dropdown Nuevo */}
      {newMenuOpen && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setNewMenuOpen(false)} />
          <div style={{ position: 'fixed', top: newMenuPos.top, left: newMenuPos.left, zIndex: 9999, background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', padding: '6px 0', width: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            {[
              { label: 'Cliente existente', sub: 'Elegir de la lista', Icon: ClienteIcon, action: () => { setNewMenuOpen(false); setEditingId(null); setModalOpen(true) } },
              { label: 'Potencial cliente', sub: 'Crear cliente y presupuesto', Icon: MasIcon, action: () => { setNewMenuOpen(false); setPotentialOpen(true) } },
            ].map(({ label, sub, Icon, action }) => (
              <button key={label} onClick={action}
                style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = C.s3}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Icon style={{ width: 15, height: 15, color: C.arena, marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: C.crema, margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 11.5, color: C.piedra, margin: '2px 0 0' }}>{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </>,
        document.body
      )}

      {modalOpen && <QuoteModal quoteId={editingId} onClose={() => setModalOpen(false)} onSaved={handleSaved} />}
      {potentialOpen && <QuoteModalPotential onClose={() => setPotentialOpen(false)} onSaved={handlePotentialSaved} />}

      {/* Modal confirmación envío por email */}
      {confirmEmailQuote && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', padding: 16 }}>
          <div style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', width: '100%', maxWidth: 420, boxShadow: '0 24px 48px rgba(0,0,0,0.6)' }}>

            {/* Header */}
            <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '0 8px 8px 0', background: 'rgba(142,177,222,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.crema }}>
                <EmailSvg />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.crema, margin: 0 }}>Enviar presupuesto</p>
                <p style={{ fontSize: 11.5, color: C.piedra, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  #{String(confirmEmailQuote.number).padStart(3, '0')} · {confirmEmailQuote.title}
                </p>
              </div>
            </div>

            {/* Cuerpo */}
            <div style={{ padding: '18px 20px' }}>
              {(() => {
                const email = confirmEmailQuote.client?.email || confirmEmailQuote.potentialClientEmail
                const name  = confirmEmailQuote.client?.name  || confirmEmailQuote.potentialClientName
                return (
                  <>
                    <p style={{ fontSize: 12.5, color: C.arena, marginBottom: 10 }}>
                      Se enviará el link del presupuesto al destinatario configurado en el cliente.
                    </p>
                    {(name || email) && (
                      <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 10px 10px 0', padding: '10px 14px', marginBottom: 12 }}>
                        {name  && <p style={{ fontSize: 12.5, fontWeight: 500, color: C.crema, margin: 0 }}>{name}</p>}
                        {email
                          ? <p style={{ fontSize: 12, color: C.info, margin: name ? '3px 0 0' : 0 }}>{email}</p>
                          : <p style={{ fontSize: 12, color: C.warn, margin: name ? '3px 0 0' : 0 }}>Sin email registrado</p>
                        }
                      </div>
                    )}
                    {confirmEmailQuote.sentByEmail && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(226,182,99,0.08)', border: `1px solid rgba(226,182,99,0.2)`, borderRadius: '0 8px 8px 0', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, color: C.warn }}>⚠</span>
                        <p style={{ fontSize: 12, color: C.warn, margin: 0 }}>Este presupuesto ya fue enviado anteriormente.</p>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Footer */}
            {(() => {
              const hasEmail = !!(confirmEmailQuote.client?.email || confirmEmailQuote.potentialClientEmail)
              return (
                <div style={{ padding: '0 20px 18px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    onClick={() => setConfirmEmailQuote(null)}
                    style={{ height: 36, padding: '0 16px', background: 'none', border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', color: C.arena, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.arena }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => doSendEmail(confirmEmailQuote)}
                    disabled={!hasEmail}
                    title={!hasEmail ? 'El cliente no tiene email registrado' : undefined}
                    style={{ height: 36, padding: '0 18px', background: C.crema, border: 'none', borderRadius: '0 9px 9px 0', color: C.bg, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: hasEmail ? 'pointer' : 'not-allowed', opacity: hasEmail ? 1 : 0.35 }}
                    onMouseEnter={e => { if (hasEmail) e.currentTarget.style.background = '#E8E3D9' }}
                    onMouseLeave={e => { if (hasEmail) e.currentTarget.style.background = C.crema }}
                  >
                    Enviar
                  </button>
                </div>
              )
            })()}

          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
