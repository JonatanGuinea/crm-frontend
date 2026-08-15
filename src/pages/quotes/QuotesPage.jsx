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
import { ChevronDownIcon, UserIcon, ArrowDownTrayIcon, PaperAirplaneIcon, EyeIcon, UserPlusIcon, UsersIcon, TableCellsIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline'

const STATUS_LABELS = {
  draft: 'Borrador', sent: 'Enviado', approved: 'Aprobado',
  signed: 'Firmado', rejected: 'Rechazado', expired: 'Vencido'
}
const STATUS_COLORS = {
  draft:    'bg-raised text-fg-soft',
  sent:     'bg-info-subtle text-info',
  approved: 'bg-brand-subtle text-brand',
  signed:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-danger-subtle text-danger',
  expired:  'bg-warning-subtle text-warning'
}
const STATUS_DOT = {
  draft:    'bg-fg-muted',
  sent:     'bg-info',
  approved: 'bg-brand',
  signed:   'bg-emerald-500',
  rejected: 'bg-danger',
  expired:  'bg-warning'
}
const ALLOWED_TRANSITIONS = {
  draft:    [],
  sent:     ['approved', 'rejected', 'expired'],
  approved: [],
  signed:   [],
  rejected: [],
  expired:  [],
}

function WaIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
    </svg>
  )
}

function StatusDropdown({ quote, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const allowed = ALLOWED_TRANSITIONS[quote.status] || []

  if (!allowed.length) {
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[quote.status]}`}>
        {STATUS_LABELS[quote.status]}
      </span>
    )
  }

  function handleToggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const dropW = 160
      const dropH = allowed.length * 36
      let top = r.bottom + 4
      let left = r.left
      if (left + dropW > window.innerWidth - 8) left = r.right - dropW
      if (top + dropH > window.innerHeight - 8) top = r.top - dropH - 4
      setDropPos({ top, left })
    }
    setOpen(o => !o)
  }

  return (
    <div className="inline-block">
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            style={{ top: dropPos.top, left: dropPos.left }}
            className="fixed z-[9999] bg-surface/80 backdrop-blur-xl border border-line rounded-lg shadow-lg py-1 min-w-[150px]"
          >
            {allowed.map(s => (
              <button
                key={s}
                onClick={() => { onUpdate(s); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-raised text-fg flex items-center gap-2 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[s]}`} />
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-80 ${STATUS_COLORS[quote.status]}`}
      >
        {STATUS_LABELS[quote.status]}
        <ChevronDownIcon className="w-3 h-3 shrink-0" />
      </button>
    </div>
  )
}

const HISTORY_STEP = 25

function fmtDateTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function actionText(entry) {
  switch (entry.action) {
    case 'created':      return 'creó el presupuesto'
    case 'status_changed': return entry.detail ?? 'cambió el estado'
    case 'updated':      return `actualizó ${entry.detail ?? 'el presupuesto'}`
    case 'sent_email':   return `envió por email${entry.detail ? ` a ${entry.detail}` : ''}`
    default:             return entry.action
  }
}

function HistoryView({ historyData, isLoading }) {
  const [visible, setVisible]   = useState(HISTORY_STEP)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]     = useState('')

  const filtered = (historyData ?? []).filter(e => {
    const d = new Date(e.createdAt)
    if (fromDate && d < new Date(fromDate)) return false
    if (toDate   && d > new Date(toDate + 'T23:59:59')) return false
    return true
  })
  const shown = filtered.slice(0, visible)

  if (isLoading) return <p className="text-sm text-fg-muted py-10 text-center">Cargando historial…</p>
  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <DatePicker value={fromDate} onChange={e => { setFromDate(e.target.value); setVisible(HISTORY_STEP) }}
          className="px-3 py-2 text-sm border border-line rounded-md bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-brand/40" />
        <DatePicker value={toDate} onChange={e => { setToDate(e.target.value); setVisible(HISTORY_STEP) }}
          className="px-3 py-2 text-sm border border-line rounded-md bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-brand/40" />
        {(fromDate || toDate) && (
          <button onClick={() => { setFromDate(''); setToDate(''); setVisible(HISTORY_STEP) }}
            className="px-3 py-2 text-xs rounded-md border border-line text-fg-muted hover:bg-raised transition-colors">
            Limpiar
          </button>
        )}
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-fg-muted py-10 text-center">Sin movimientos registrados</p>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-line" />
          <ul className="space-y-1">
            {shown.map(entry => (
              <li key={entry.id} className="flex gap-4 items-start relative pl-12">
                <div className="absolute left-3 top-3 w-4 h-4 rounded-full bg-brand-subtle border-2 border-brand flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                </div>
                <div className="flex-1 bg-surface/60 border border-line rounded-xl px-4 py-3 hover:border-brand/30 transition-colors">
                  <div className="flex flex-wrap items-center gap-1 text-sm text-fg">
                    <span className="font-medium">{entry.user?.name ?? 'Alguien'}</span>
                    <span className="text-fg-muted">{actionText(entry)}</span>
                    {entry.quote && (
                      <Link to={`/quotes/${entry.quote.id}`}
                        className="font-medium text-brand hover:underline">
                        #{String(entry.quote.number).padStart(3, '0')} {entry.quote.title}
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-fg-muted mt-1">{fmtDateTime(entry.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
          {visible < filtered.length && (
            <div className="flex justify-center mt-6">
              <button onClick={() => setVisible(v => v + HISTORY_STEP)}
                className="px-4 py-2 text-sm rounded-lg border border-line text-fg-muted hover:bg-raised transition-colors">
                Mostrar más ({filtered.length - visible} restantes)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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
  const [toDate, setToDate]     = useState('')
  const [visible, setVisible]   = useState(15)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [sendingEmailId, setSendingEmailId] = useState(null)
  const [sendingWaId, setSendingWaId] = useState(null)
  const [newMenuOpen, setNewMenuOpen] = useState(false)
  const [newMenuPos, setNewMenuPos] = useState({ top: 0, left: 0 })
  const [potentialOpen, setPotentialOpen] = useState(false)
  const newBtnRef = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', statusFilter, fromDate, toDate],
    queryFn: () => getQuotes({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate   ? { toDate }   : {}),
    }).then(r => r.data)
  })

  const allQuotes = data?.data ?? []
  const shownQuotes = allQuotes.slice(0, visible)
  const hasMore = allQuotes.length > visible
  const hasDateFilter = fromDate || toDate

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['quotes-history'],
    queryFn: () => getAllQuotesHistory().then(r => r.data.data),
    enabled: tab === 'history',
  })

  const changeStatus = useMutation({
    mutationFn: ({ id, status }) => updateQuote(id, { status }),
    onSuccess: () => qc.invalidateQueries(['quotes']),
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al cambiar estado', 'error')
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

  function renderStatus(q) {
    if (!canWrite) {
      return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[q.status]}`}>{STATUS_LABELS[q.status]}</span>
    }
    return <StatusDropdown quote={q} onUpdate={(status) => changeStatus.mutate({ id: q.id, status })} />
  }

  function renderCuotas(q) {
    const n = q.installments?.length ?? 0
    if (!n) return <span className="text-fg-muted">—</span>
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-subtle text-warning text-xs font-medium">
        {n} pendiente{n !== 1 ? 's' : ''}
      </span>
    )
  }

  function renderEnvio(q) {
    if (!canWrite || !['draft', 'sent'].includes(q.status)) {
      return <span className="text-fg-muted">—</span>
    }
    const waDisabled  = q.sentByWhatsapp || sendingWaId === q.id
    const emlDisabled = q.sentByEmail    || sendingEmailId === q.id
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleSendWa(q)}
          disabled={waDisabled}
          title={q.sentByWhatsapp ? 'Ya enviado por WhatsApp' : 'Compartir por WhatsApp'}
          className={`p-1.5 rounded-lg transition-colors ${waDisabled ? 'text-[#25D366]/30 cursor-not-allowed' : 'text-[#25D366] hover:bg-[#25D366]/10'}`}
        >
          <WaIcon className={`w-4 h-4 ${sendingWaId === q.id ? 'animate-pulse' : ''}`} />
        </button>
        <button
          onClick={() => handleSendEmail(q)}
          disabled={emlDisabled}
          title={q.sentByEmail ? 'Ya enviado por email' : 'Enviar por email'}
          className={`p-1.5 rounded-lg transition-colors ${emlDisabled ? 'text-brand/30 cursor-not-allowed' : 'text-brand hover:bg-brand-subtle'}`}
        >
          {sendingEmailId === q.id
            ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/></svg>
            : <PaperAirplaneIcon className="w-4 h-4" />}
        </button>
      </div>
    )
  }

  function openNewMenu() {
    if (newBtnRef.current) {
      const r = newBtnRef.current.getBoundingClientRect()
      const menuW = 220
      let left = r.right - menuW
      if (left < 8) left = r.left
      setNewMenuPos({ top: r.bottom + 4, left })
    }
    setNewMenuOpen(true)
  }
  function openCreate() { setEditingId(null); setModalOpen(true) }
  function handleSaved() { setModalOpen(false); qc.invalidateQueries(['quotes']) }
  function handlePotentialSaved() { setPotentialOpen(false); qc.invalidateQueries(['quotes']); qc.invalidateQueries(['clients-all']) }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-fg">Presupuestos</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-raised rounded-lg border border-line overflow-hidden">
            <button
              onClick={() => setTab('table')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'table' ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'}`}
            >
              <TableCellsIcon className="w-4 h-4" /> Tabla
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'history' ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'}`}
            >
              <ClockIcon className="w-4 h-4" /> Historial
            </button>
          </div>
          {canWrite && tab === 'table' && (
            <button
              ref={newBtnRef}
              onClick={openNewMenu}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              + Nuevo presupuesto
              <ChevronDownIcon className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>

        {newMenuOpen && createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setNewMenuOpen(false)} />
            <div
              style={{ top: newMenuPos.top, left: newMenuPos.left }}
              className="fixed z-[9999] bg-surface/90 backdrop-blur-xl border border-line rounded-xl shadow-xl py-1.5 w-56"
            >
              <button
                onClick={() => { setNewMenuOpen(false); openCreate() }}
                className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-raised text-left transition-colors"
              >
                <UsersIcon className="w-4 h-4 mt-0.5 text-brand shrink-0" />
                <div>
                  <p className="text-sm font-medium text-fg">Cliente existente</p>
                  <p className="text-xs text-fg-muted">Elegir de la lista</p>
                </div>
              </button>
              <button
                onClick={() => { setNewMenuOpen(false); setPotentialOpen(true) }}
                className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-raised text-left transition-colors"
              >
                <UserPlusIcon className="w-4 h-4 mt-0.5 text-brand shrink-0" />
                <div>
                  <p className="text-sm font-medium text-fg">Potencial cliente</p>
                  <p className="text-xs text-fg-muted">Crear cliente y presupuesto</p>
                </div>
              </button>
            </div>
          </>,
          document.body
        )}
      </div>

      {tab === 'history' && (
        <HistoryView historyData={historyData} isLoading={historyLoading} />
      )}

      {tab === 'table' && <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setVisible(15) }}
          className="px-3 py-2 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg w-full md:w-auto">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-fg-muted whitespace-nowrap">Desde</span>
          <DatePicker
            value={fromDate}
            onChange={e => { setFromDate(e.target.value); setVisible(15) }}
            placeholder="Fecha desde"
            className="px-3 py-2 rounded-md bg-surface border border-line text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-fg-muted whitespace-nowrap">Hasta</span>
          <DatePicker
            value={toDate}
            onChange={e => { setToDate(e.target.value); setVisible(15) }}
            placeholder="Fecha hasta"
            className="px-3 py-2 rounded-md bg-surface border border-line text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand transition-colors"
          />
        </div>
        {hasDateFilter && (
          <button
            onClick={() => { setFromDate(''); setToDate(''); setVisible(15) }}
            className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition-colors"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
            Limpiar fechas
          </button>
        )}
      </div>

      {isLoading ? <p className="text-sm text-fg-soft">Cargando...</p> : (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {shownQuotes.map(q => (
              <div key={q.id} className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line p-4">
                {/* Header: número + estado */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-medium text-fg-muted bg-raised px-2 py-0.5 rounded-md">
                    #{q.number}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {renderCuotas(q)}
                    {renderStatus(q)}
                  </div>
                </div>
                {/* Título */}
                <Link to={`/quotes/${q.id}`} className="block font-semibold text-fg hover:text-brand leading-snug mb-3">
                  {q.title}
                </Link>
                {/* Meta */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  {(q.client?.name || q.potentialClientName) && (
                    <p className="text-xs text-fg-soft flex items-center gap-1.5 truncate">
                      <UserIcon className="w-3.5 h-3.5 shrink-0 text-fg-muted" />
                      {q.client?.name ?? <span className="italic">{q.potentialClientName}</span>}
                    </p>
                  )}
                  <p className="text-base font-bold text-fg shrink-0">
                    ${Number(q.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                {/* Acciones */}
                <div className="flex items-center gap-2 pt-3 border-t border-line">
                  <button
                    onClick={() => handleDownload(q.id, q.number)}
                    disabled={downloading === q.id}
                    className="p-1.5 rounded-lg bg-raised text-fg-muted hover:bg-overlay disabled:opacity-50 transition-colors"
                    title="Descargar PDF"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  </button>
                  {canWrite && ['draft', 'sent'].includes(q.status) && (
                    <>
                      <button
                        onClick={() => handleSendWa(q)}
                        disabled={q.sentByWhatsapp || sendingWaId === q.id}
                        title={q.sentByWhatsapp ? 'Ya enviado por WhatsApp' : 'Compartir por WhatsApp'}
                        className={`p-1.5 rounded-lg transition-colors ${q.sentByWhatsapp || sendingWaId === q.id ? 'text-[#25D366]/30 cursor-not-allowed bg-raised' : 'text-[#25D366] hover:bg-[#25D366]/10 bg-raised'}`}
                      >
                        <WaIcon className={`w-4 h-4 ${sendingWaId === q.id ? 'animate-pulse' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleSendEmail(q)}
                        disabled={q.sentByEmail || sendingEmailId === q.id}
                        title={q.sentByEmail ? 'Ya enviado por email' : 'Enviar por email'}
                        className={`p-1.5 rounded-lg transition-colors ${q.sentByEmail || sendingEmailId === q.id ? 'text-brand/30 cursor-not-allowed bg-raised' : 'text-brand hover:bg-brand-subtle bg-raised'}`}
                      >
                        {sendingEmailId === q.id
                          ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/></svg>
                          : <PaperAirplaneIcon className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                  <Link to={`/quotes/${q.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-brand text-white hover:opacity-90 transition-opacity">
                    <EyeIcon className="w-3.5 h-3.5" />
                    Ver
                  </Link>
                </div>
              </div>
            ))}
            {!allQuotes.length && (
              <p className="py-10 text-center text-sm text-fg-muted">Sin presupuestos</p>
            )}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden md:block bg-surface/60 backdrop-blur-xl rounded-xl border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-raised border-b border-line">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">#</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Título</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Envío</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Cuotas</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shownQuotes.map(q => (
                    <tr key={q.id} className="hover:bg-raised">
                      <td className="px-4 py-3 text-fg-muted">#{q.number}</td>
                      <td className="px-4 py-3 font-medium text-fg">
                        <Link to={`/quotes/${q.id}`} className="hover:text-brand">{q.title}</Link>
                      </td>
                      <td className="px-4 py-3 text-fg-soft">
                        {q.client?.name ?? (
                          q.potentialClientName
                            ? <span className="italic text-fg-muted">{q.potentialClientName}</span>
                            : '—'
                        )}
                      </td>
                      <td className="px-4 py-3">{renderEnvio(q)}</td>
                      <td className="px-4 py-3">{renderStatus(q)}</td>
                      <td className="px-4 py-3">{renderCuotas(q)}</td>
                      <td className="px-4 py-3 text-fg-soft">${Number(q.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleDownload(q.id, q.number)}
                          disabled={downloading === q.id}
                          className="text-fg-muted hover:text-fg disabled:opacity-50 transition-colors"
                          title="Descargar PDF"
                        >
                          <ArrowDownTrayIcon className={`w-4 h-4 ${downloading === q.id ? 'animate-pulse' : ''}`} />
                        </button>
                        <Link to={`/quotes/${q.id}`} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-brand text-white hover:opacity-90 transition-opacity">
                          <EyeIcon className="w-3.5 h-3.5" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!allQuotes.length && (
                    <tr><td colSpan={8} className="px-4 py-6 text-center text-fg-muted">Sin presupuestos</td></tr>
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
          className="mt-4 w-full py-2.5 text-sm text-fg-muted hover:text-fg border border-dashed border-line rounded-xl transition-colors"
        >
          Ver más ({allQuotes.length - visible} restante{allQuotes.length - visible !== 1 ? 's' : ''})
        </button>
      )}
      </>}

      {modalOpen && (
        <QuoteModal
          quoteId={editingId}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {potentialOpen && (
        <QuoteModalPotential
          onClose={() => setPotentialOpen(false)}
          onSaved={handlePotentialSaved}
        />
      )}
    </div>
  )
}
