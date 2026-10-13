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
import { ClienteIcon, MasIcon, PresupuestoIcon } from '../../components/DuIcons'
import { fmt } from '../../utils/fmt'

const C = {
  bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F',
  crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E',
  ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE',
}
const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"
const SECTION_TITLE = { fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena }
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

const ALLOWED_TRANSITIONS = {
  draft:     [],
  sent:      ['approved', 'rejected', 'expired'],
  approved:  [],
  signed:    [],
  rejected:  [],
  cancelled: [],
  expired:   [],
}

/* ── SVG helpers ─────────────────────────────────────────────────────────── */

function WaIcon({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
    </svg>
  )
}

function ChevronSvg({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DownloadSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function EmailSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function SpinSvg() {
  return (
    <svg style={{ display: 'block', animation: 'spin 1s linear infinite' }} width="14" height="14" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
      <path fill="currentColor" fillOpacity="0.75" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  )
}

/* ── Badge de estado ─────────────────────────────────────────────────────── */

function QBadge({ status }) {
  const s = QUOTE_STATUS[status] ?? QUOTE_STATUS.draft
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: '0 6px 6px 0', fontSize: 10.5, fontWeight: 600,
      background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

/* ── Dropdown de estado ──────────────────────────────────────────────────── */

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
          <div style={{
            position: 'fixed', top: dropPos.top, left: dropPos.left,
            zIndex: 9999, background: C.s2, border: `1px solid ${C.linea}`,
            borderRadius: '0 12px 12px 0', padding: '4px 0', minWidth: 152,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}>
            {allowed.map(st => {
              const opt = QUOTE_STATUS[st] ?? QUOTE_STATUS.draft
              return (
                <button
                  key={st}
                  onClick={() => { onUpdate(st); setOpen(false) }}
                  style={{
                    width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: C.arena, fontFamily: 'inherit',
                  }}
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
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 8px', borderRadius: '0 6px 6px 0',
          fontSize: 10.5, fontWeight: 600,
          background: s.bg, color: s.color,
          border: 'none', cursor: 'pointer', transition: 'opacity 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        {s.label}
        <ChevronSvg size={9} />
      </button>
    </div>
  )
}

/* ── Historial ───────────────────────────────────────────────────────────── */

const HISTORY_STEP = 25

function fmtDateTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
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

  if (isLoading) return (
    <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '40px 0' }}>Cargando historial…</p>
  )

  const dpClass = "h-[34px] px-3 bg-[#141415] border border-[#2C2C2F] rounded-[0_9px_9px_0] text-[13px] outline-none min-w-[130px]"

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <DatePicker
          value={fromDate}
          onChange={e => { setFromDate(e.target.value); setVisible(HISTORY_STEP) }}
          className={dpClass}
          placeholder="Desde"
        />
        <DatePicker
          value={toDate}
          onChange={e => { setToDate(e.target.value); setVisible(HISTORY_STEP) }}
          className={dpClass}
          placeholder="Hasta"
        />
        {(fromDate || toDate) && (
          <button
            onClick={() => { setFromDate(''); setToDate(''); setVisible(HISTORY_STEP) }}
            style={{
              height: 34, padding: '0 12px', background: 'none',
              border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0',
              color: C.piedra, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'color 0.12s, border-color 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
            onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
          >
            Limpiar
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '40px 0' }}>Sin movimientos registrados</p>
      ) : (
        <div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {shown.map(entry => (
              <li key={entry.id} style={{
                display: 'flex', gap: 12, padding: '12px 0',
                borderBottom: `1px solid ${C.linea}`, fontSize: 13,
              }}>
                {/* pie marker */}
                <div style={{
                  width: 10, height: 16, flexShrink: 0, marginTop: 2,
                  borderLeft: `2.5px solid ${C.piedra}`,
                  borderBottom: `2.5px solid ${C.piedra}`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontWeight: 600, color: C.crema }}>{entry.user?.name ?? 'Alguien'}</span>
                    <span style={{ color: C.arena }}>{actionText(entry)}</span>
                    {entry.quote && (
                      <Link
                        to={`/quotes/${entry.quote.id}`}
                        style={{ fontWeight: 600, color: C.crema, textDecoration: 'none' }}
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
              <button
                onClick={() => setVisible(v => v + HISTORY_STEP)}
                style={{
                  padding: '8px 20px', background: 'none',
                  border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0',
                  color: C.piedra, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'color 0.12s, border-color 0.12s',
                }}
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

/* ── Subcomponentes del header ───────────────────────────────────────────── */

const CTRL_H = 34

function TabSwitcher({ tab, setTab }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 3, padding: 4,
      height: CTRL_H,
      background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 10px 10px 0',
    }}>
      {[{ key: 'table', label: 'Tabla' }, { key: 'history', label: 'Historial' }].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          style={{
            background: tab === key ? C.s3 : 'transparent',
            color: tab === key ? C.crema : C.piedra,
            borderRadius: '0 7px 7px 0', fontSize: 12, fontWeight: 500,
            padding: '0 12px', height: '100%', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', transition: 'background 0.12s, color 0.12s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function NuevoBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        height: CTRL_H, padding: '0 14px',
        background: C.crema, color: C.bg,
        border: 'none', borderRadius: '0 9px 9px 0',
        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#E8E3D9'}
      onMouseLeave={e => e.currentTarget.style.background = C.crema}
    >
      + Nuevo
      <ChevronSvg size={10} />
    </button>
  )
}

/* ── Página principal ────────────────────────────────────────────────────── */

export default function QuotesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const canWrite = user?.role !== 'member'
  const orgId = user?.org

  const { data: orgData } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganizations().then(r => r.data.data?.find(o => o.id === orgId)),
    enabled: Boolean(orgId),
    staleTime: 5 * 60 * 1000,
  })

  const qc = useQueryClient()
  const [tab, setTab] = useState('table')
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [visible, setVisible] = useState(15)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [sendingEmailId, setSendingEmailId] = useState(null)
  const [sendingWaId, setSendingWaId] = useState(null)
  const [newMenuOpen, setNewMenuOpen] = useState(false)
  const [newMenuPos, setNewMenuPos] = useState({ top: 0, left: 0 })
  const [potentialOpen, setPotentialOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', statusFilter, fromDate, toDate],
    queryFn: () => getQuotes({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    }).then(r => r.data),
  })

  const allQuotes = data?.data ?? []
  const shownQuotes = allQuotes.slice(0, visible)
  const hasMore = allQuotes.length > visible
  const activeFilterCount = (statusFilter ? 1 : 0) + (fromDate ? 1 : 0) + (toDate ? 1 : 0)

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['quotes-history'],
    queryFn: () => getAllQuotesHistory().then(r => r.data.data),
    enabled: tab === 'history',
  })

  const changeStatus = useMutation({
    mutationFn: ({ id, status }) => updateQuote(id, { status }),
    onSuccess: () => qc.invalidateQueries(['quotes']),
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al cambiar estado', 'error'),
  })

  async function handleSendEmail(q) {
    if (!orgData?.signature) {
      toast('La organización no tiene firma configurada. Configurá la firma en Ajustes antes de enviar presupuestos.', 'error')
      return
    }
    setSendingEmailId(q.id)
    try {
      await sendQuote(q.id)
      qc.invalidateQueries(['quotes'])
      toast('Presupuesto enviado por email', 'success')
    } catch (err) {
      toast(err.response?.data?.error || err.message || 'Error al enviar presupuesto', 'error')
    } finally {
      setSendingEmailId(null)
    }
  }

  async function handleSendWa(q) {
    if (!orgData?.signature) {
      toast('La organización no tiene firma configurada. Configurá la firma en Ajustes antes de enviar presupuestos.', 'error')
      return
    }
    const phone = (q.client?.phone || q.potentialClientPhone || '').replace(/\D/g, '')
    if (!phone) {
      toast('Este cliente no tiene teléfono. Editá el presupuesto para agregar un número de WhatsApp.')
      return
    }
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
      toast(err.response?.data?.error || err.message || 'Error al registrar envío por WhatsApp', 'error')
    } finally {
      setSendingWaId(null)
    }
  }

  async function handleDownload(id, number) {
    setDownloading(id)
    try {
      const res = await downloadQuotePdf(id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `presupuesto-${number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(null)
    }
  }

  function renderEnvio(q) {
    if (!canWrite || !['draft', 'sent'].includes(q.status)) {
      return <span style={{ color: C.piedra }}>—</span>
    }
    const waOff  = q.sentByWhatsapp || sendingWaId === q.id
    const emlOff = q.sentByEmail    || sendingEmailId === q.id
    const iconBtn = (onClick, disabled, color, title, children) => (
      <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        style={{
          width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', borderRadius: '0 6px 6px 0', cursor: disabled ? 'not-allowed' : 'pointer',
          color, opacity: disabled ? 0.3 : 1, transition: 'opacity 0.12s',
        }}
      >
        {children}
      </button>
    )
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {iconBtn(() => handleSendWa(q), waOff, '#25D366',
          q.sentByWhatsapp ? 'Ya enviado por WhatsApp' : 'Compartir por WhatsApp',
          <WaIcon style={{ width: 14, height: 14 }} />
        )}
        {iconBtn(() => handleSendEmail(q), emlOff, C.info,
          q.sentByEmail ? 'Ya enviado por email' : 'Enviar por email',
          sendingEmailId === q.id ? <SpinSvg /> : <EmailSvg />
        )}
      </div>
    )
  }

  function openNewMenu(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const menuW = 220
    let left = r.right - menuW
    if (left < 8) left = r.left
    setNewMenuPos({ top: r.bottom + 4, left })
    setNewMenuOpen(true)
  }

  function handleSaved() { setModalOpen(false); qc.invalidateQueries(['quotes']) }
  function handlePotentialSaved() {
    setPotentialOpen(false)
    qc.invalidateQueries(['quotes'])
    qc.invalidateQueries(['clients-all'])
  }

  const filterSelectStyle = {
    height: 34, padding: '0 12px', background: C.s1, border: `1px solid ${C.linea}`,
    borderRadius: '0 9px 9px 0', color: C.crema, fontSize: 13, fontFamily: 'inherit',
    outline: 'none', appearance: 'none', cursor: 'pointer',
  }
  const dpClass = "h-[34px] px-3 bg-[#141415] border border-[#2C2C2F] rounded-[0_9px_9px_0] text-[13px] outline-none min-w-[120px]"

  /* ── render ── */
  return (
    <div style={{ padding: '28px 24px 40px', fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>

        {/* Fila 1 — título + (desktop: tabs + nuevo) (mobile: nuevo) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PresupuestoIcon style={{ width: 18, height: 18, color: C.arena }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, color: C.crema, margin: 0 }}>Presupuestos</h2>
          </div>

          {/* Tablet/Desktop: tabs + botón nuevo en la misma fila */}
          <div className="hidden sm:block">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TabSwitcher tab={tab} setTab={setTab} />
              {canWrite && <NuevoBtn onClick={openNewMenu} />}
            </div>
          </div>

          {/* Mobile: solo botón nuevo */}
          {canWrite && (
            <div className="sm:hidden">
              <NuevoBtn onClick={openNewMenu} />
            </div>
          )}
        </div>

        {/* Mobile fila 2 — tabs */}
        <div className="sm:hidden" style={{ marginBottom: tab === 'table' ? 10 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Filtros — solo cuando está en tabla */}
            {tab === 'table' && (
              <button
                onClick={() => setFiltersOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px',
                  background: activeFilterCount > 0 ? 'rgba(242,237,227,0.07)' : C.s1,
                  border: `1px solid ${activeFilterCount > 0 ? C.arena : C.linea}`,
                  borderRadius: '0 9px 9px 0',
                  color: activeFilterCount > 0 ? C.arena : C.piedra,
                  fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Filtros
                {activeFilterCount > 0 && (
                  <span style={{
                    width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%', background: C.arena, color: C.bg, fontSize: 10, fontWeight: 700,
                  }}>
                    {activeFilterCount}
                  </span>
                )}
                <ChevronSvg size={10} />
              </button>
            )}
            <div style={{ marginLeft: 'auto' }}>
              <TabSwitcher tab={tab} setTab={setTab} />
            </div>
          </div>
        </div>

      </div>

      {/* Dropdown "Nuevo" */}
      {newMenuOpen && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setNewMenuOpen(false)} />
          <div style={{
            position: 'fixed', top: newMenuPos.top, left: newMenuPos.left,
            zIndex: 9999, background: C.s2, border: `1px solid ${C.linea}`,
            borderRadius: '0 16px 16px 0', padding: '6px 0', width: 220,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}>
            {[
              { label: 'Cliente existente', sub: 'Elegir de la lista', Icon: ClienteIcon, action: () => { setNewMenuOpen(false); setEditingId(null); setModalOpen(true) } },
              { label: 'Potencial cliente', sub: 'Crear cliente y presupuesto', Icon: MasIcon, action: () => { setNewMenuOpen(false); setPotentialOpen(true) } },
            ].map(({ label, sub, Icon, action }) => (
              <button
                key={label}
                onClick={action}
                style={{
                  width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}
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

      {/* Historial */}
      {tab === 'history' && (
        <HistoryView historyData={historyData} isLoading={historyLoading} />
      )}

      {/* Tabla */}
      {tab === 'table' && (
        <>
          {/* Panel filtros mobile */}
          {filtersOpen && (
            <div className="sm:hidden" style={{
              marginBottom: 16, padding: '14px 16px',
              background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 12px 12px 0',
            }}>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setVisible(15) }}
                style={{ ...filterSelectStyle, width: '100%', marginBottom: 8 }}
              >
                <option value="">Todos los estados</option>
                {Object.entries(QUOTE_STATUS).map(([v, { label }]) => <option style={{ ...SECTION_TITLE, width: '100%' }} key={v} value={v}>{label}</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <DatePicker value={fromDate} onChange={e => { setFromDate(e.target.value); setVisible(15) }} className={`${dpClass} w-full`} placeholder="Desde" />
                </div>
                <div>
                  <DatePicker value={toDate} onChange={e => { setToDate(e.target.value); setVisible(15) }} className={`${dpClass} w-full`} placeholder="Hasta" />
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setStatusFilter(''); setFromDate(''); setToDate(''); setVisible(15) }}
                  style={{ marginTop: 10, background: 'none', border: 'none', color: C.err, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  × Limpiar filtros
                </button>
              )}
            </div>
          )}

          {/* Filtros desktop */}
          <div className="hidden sm:flex" style={{ flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setVisible(15) }} style={filterSelectStyle}>
              <option style={{ ...SECTION_TITLE}} value="">Todos los estados</option>
              {Object.entries(QUOTE_STATUS).map(([v, { label }]) => <option style={{ ...SECTION_TITLE}} key={v} value={v}>{label}</option>)}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <DatePicker value={fromDate} onChange={e => { setFromDate(e.target.value); setVisible(15) }} className={dpClass} placeholder="Desde" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <DatePicker value={toDate} onChange={e => { setToDate(e.target.value); setVisible(15) }} className={dpClass} placeholder="Hasta" />
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(''); setToDate(''); setVisible(15) }}
                style={{ background: 'none', border: 'none', color: C.piedra, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.arena}
                onMouseLeave={e => e.currentTarget.style.color = C.piedra}
              >
                × Limpiar fechas
              </button>
            )}
          </div>

          {isLoading ? (
            <p style={{ fontSize: 13, color: C.piedra }}>Cargando...</p>
          ) : (
            <>
              {/* Mobile — cards */}
              <div className="md:hidden">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {shownQuotes.map(q => (
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
                    <Link
                      to={`/quotes/${q.id}`}
                      style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: C.crema, textDecoration: 'none', marginBottom: 8 }}
                      onMouseEnter={e => e.currentTarget.style.color = C.arena}
                      onMouseLeave={e => e.currentTarget.style.color = C.crema}
                    >
                      {q.title}
                    </Link>
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
                      <button
                        onClick={() => handleDownload(q.id, q.number)}
                        disabled={downloading === q.id}
                        title="Descargar PDF"
                        style={{
                          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: C.s2, border: 'none', borderRadius: '0 7px 7px 0', cursor: 'pointer',
                          color: C.arena, opacity: downloading === q.id ? 0.4 : 1,
                        }}
                      >
                        <DownloadSvg />
                      </button>
                      {canWrite && ['draft', 'sent'].includes(q.status) && (
                        <>
                          <button
                            onClick={() => handleSendWa(q)}
                            disabled={q.sentByWhatsapp || sendingWaId === q.id}
                            title={q.sentByWhatsapp ? 'Ya enviado por WhatsApp' : 'Compartir por WhatsApp'}
                            style={{
                              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: C.s2, border: 'none', borderRadius: '0 7px 7px 0', cursor: 'pointer',
                              color: '#25D366', opacity: (q.sentByWhatsapp || sendingWaId === q.id) ? 0.3 : 1,
                            }}
                          >
                            <WaIcon style={{ width: 14, height: 14 }} />
                          </button>
                          <button
                            onClick={() => handleSendEmail(q)}
                            disabled={q.sentByEmail || sendingEmailId === q.id}
                            title={q.sentByEmail ? 'Ya enviado por email' : 'Enviar por email'}
                            style={{
                              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: C.s2, border: 'none', borderRadius: '0 7px 7px 0', cursor: 'pointer',
                              color: C.info, opacity: (q.sentByEmail || sendingEmailId === q.id) ? 0.3 : 1,
                            }}
                          >
                            {sendingEmailId === q.id ? <SpinSvg /> : <EmailSvg />}
                          </button>
                        </>
                      )}
                      <Link
                        to={`/quotes/${q.id}`}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          height: 30, background: C.linea, color: C.crema, borderRadius: '0 7px 7px 0',
                          textDecoration: 'none', fontSize: 12.5, fontWeight: 500,
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = C.s3}
                        onMouseLeave={e => e.currentTarget.style.background = C.linea}
                      >
                        Ver →
                      </Link>
                    </div>
                  </div>
                ))}
                {!allQuotes.length && (
                  <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '40px 0' }}>Sin presupuestos</p>
                )}
              </div>
              </div>

              {/* Desktop — tabla */}
              <div className="hidden md:block" style={{ ...card, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        {['#', 'Título', 'Cliente', 'Envío', 'Estado', 'Cuotas', 'Total', ''].map((h, i) => (
                          <th key={i} style={{
                            background: C.linea, color: C.crema, fontSize: 11, fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            padding: '12px 14px', textAlign: 'left', whiteSpace: 'nowrap',
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shownQuotes.map(q => (
                        <tr
                          key={q.id}
                          onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = C.s2)}
                          onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = 'transparent')}
                        >
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, color: C.piedra, fontFamily: "'Geist Mono', monospace", fontSize: 11.5 }}>
                            #{String(q.number).padStart(3, '0')}
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, fontWeight: 500, color: C.crema }}>
                            <Link
                              to={`/quotes/${q.id}`}
                              style={{ color: C.crema, textDecoration: 'none', transition: 'color 0.12s' }}
                              onMouseEnter={e => e.currentTarget.style.color = C.arena}
                              onMouseLeave={e => e.currentTarget.style.color = C.crema}
                            >
                              {q.title}
                            </Link>
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, color: C.arena, fontSize: 12.5 }}>
                            {q.client?.name ?? (
                              q.potentialClientName
                                ? <span style={{ fontStyle: 'italic', color: C.piedra }}>{q.potentialClientName}</span>
                                : '—'
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}` }}>
                            {renderEnvio(q)}
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}` }}>
                            {canWrite
                              ? <StatusDropdown quote={q} onUpdate={status => changeStatus.mutate({ id: q.id, status })} />
                              : <QBadge status={q.status} />
                            }
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}` }}>
                            {(q.installments?.length ?? 0) > 0
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '0 6px 6px 0', fontSize: 10.5, fontWeight: 600, background: 'rgba(226,182,99,0.12)', color: C.warn }}>
                                  {q.installments.length} pendiente{q.installments.length !== 1 ? 's' : ''}
                                </span>
                              : <span style={{ color: C.piedra }}>—</span>
                            }
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, fontFamily: CIFRAS, fontWeight: 600, color: C.crema, whiteSpace: 'nowrap' }}>
                            {fmt(q.total, q.currency)}
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <button
                                onClick={() => handleDownload(q.id, q.number)}
                                disabled={downloading === q.id}
                                title="Descargar PDF"
                                style={{
                                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: 'none', border: 'none', borderRadius: '0 6px 6px 0',
                                  cursor: downloading === q.id ? 'not-allowed' : 'pointer',
                                  color: C.piedra, opacity: downloading === q.id ? 0.4 : 1,
                                  transition: 'color 0.12s',
                                }}
                                onMouseEnter={e => { if (!downloading) e.currentTarget.style.color = C.arena }}
                                onMouseLeave={e => e.currentTarget.style.color = C.piedra}
                              >
                                <DownloadSvg />
                              </button>
                              <Link
                                to={`/quotes/${q.id}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center',
                                  padding: '4px 10px', borderRadius: '0 7px 7px 0',
                                  background: C.linea, color: C.crema, textDecoration: 'none',
                                  fontSize: 11.5, transition: 'background 0.12s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = C.s3}
                                onMouseLeave={e => e.currentTarget.style.background = C.linea}
                              >
                                Ver →
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!allQuotes.length && (
                        <tr>
                          <td colSpan={8} style={{ padding: '32px 14px', textAlign: 'center', color: C.piedra, fontSize: 13 }}>
                            Sin presupuestos
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {hasMore && (
            <button
              onClick={() => setVisible(v => v + 15)}
              style={{
                marginTop: 12, width: '100%', padding: '10px 0',
                background: 'none', border: `1px dashed ${C.linea}`,
                borderRadius: '0 12px 12px 0', color: C.piedra,
                fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'color 0.12s, border-color 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
            >
              Ver más ({allQuotes.length - visible} restante{allQuotes.length - visible !== 1 ? 's' : ''})
            </button>
          )}
        </>
      )}

      {modalOpen && (
        <QuoteModal quoteId={editingId} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      )}

      {potentialOpen && (
        <QuoteModalPotential onClose={() => setPotentialOpen(false)} onSaved={handlePotentialSaved} />
      )}
    </div>
  )
}
