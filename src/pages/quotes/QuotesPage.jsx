import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getQuotes, deleteQuote, updateQuote, sendQuote, downloadQuotePdf } from '../../api/quotes'
import QuoteModal from './QuoteModal'
import QuoteModalPotential from './QuoteModalPotential'
import Pagination from '../../components/Pagination'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { ChevronDownIcon, UserIcon, ArrowDownTrayIcon, PaperAirplaneIcon, DocumentArrowDownIcon, EyeIcon, UserPlusIcon, UsersIcon } from '@heroicons/react/24/outline'

const STATUS_LABELS = {
  draft: 'Borrador', sent: 'Enviado', approved: 'Aprobado',
  rejected: 'Rechazado', expired: 'Vencido'
}
const STATUS_COLORS = {
  draft:    'bg-raised text-fg-soft',
  sent:     'bg-info-subtle text-info',
  approved: 'bg-brand-subtle text-brand',
  rejected: 'bg-danger-subtle text-danger',
  expired:  'bg-warning-subtle text-warning'
}
const STATUS_DOT = {
  draft:    'bg-fg-muted',
  sent:     'bg-info',
  approved: 'bg-brand',
  rejected: 'bg-danger',
  expired:  'bg-warning'
}
const ALLOWED_TRANSITIONS = {
  draft:    [],
  sent:     ['approved', 'rejected', 'expired'],
  approved: [],
  rejected: [],
  expired:  [],
}

function SendConfirmModal({ quote, onClose, onConfirm, onViewPdf, sending, downloading }) {
  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-surface/60 backdrop-blur-xl rounded-xl shadow-lg w-full max-w-sm p-6 border border-line">
        <h3 className="text-base font-semibold text-fg mb-1">Confirmar envío de presupuesto</h3>
        <p className="text-sm text-fg-soft mb-1">
          Se enviará el presupuesto <span className="font-medium text-fg">#{quote.number} — {quote.title}</span>
        </p>
        <p className="text-sm text-fg-soft mb-5">
          Destinatario: <span className="font-medium text-fg">
            {quote.client?.name || quote.potentialClientName}
          </span>
          {(quote.client?.email || quote.potentialClientEmail) && (
            <span className="text-fg-muted ml-1">({quote.client?.email || quote.potentialClientEmail})</span>
          )}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm text-fg-soft hover:text-fg border border-line-soft rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onViewPdf}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-line-soft rounded-md text-fg-soft hover:bg-raised disabled:opacity-50 transition-colors"
          >
            <DocumentArrowDownIcon className="w-4 h-4 shrink-0" />
            {downloading ? 'Generando...' : 'Ver PDF'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={sending}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-brand text-white rounded-md hover:bg-brand-hover disabled:opacity-50 transition-colors"
          >
            <PaperAirplaneIcon className="w-4 h-4 shrink-0" />
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
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
            className="fixed z-[9999] bg-surface/80 backdrop-blur-xl border border-line-soft rounded-lg shadow-lg py-1 min-w-[150px]"
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

export default function QuotesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const canWrite = user?.role !== 'member'
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [confirmSend, setConfirmSend] = useState(null)
  const [newMenuOpen, setNewMenuOpen] = useState(false)
  const [newMenuPos, setNewMenuPos] = useState({ top: 0, left: 0 })
  const [potentialOpen, setPotentialOpen] = useState(false)
  const newBtnRef = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', statusFilter, page],
    queryFn: () => getQuotes({ ...(statusFilter ? { status: statusFilter } : {}), page }).then(r => r.data)
  })

  const del = useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => { qc.invalidateQueries(['quotes']); toast('Presupuesto eliminado', 'success') }
  })

  const send = useMutation({
    mutationFn: (id) => sendQuote(id),
    onSuccess: () => { qc.invalidateQueries(['quotes']); toast('Presupuesto enviado', 'success'); setConfirmSend(null) },
    onError: (err) => { toast(err.response?.data?.error || 'Error al enviar presupuesto'); setConfirmSend(null) }
  })

  const changeStatus = useMutation({
    mutationFn: ({ id, status }) => updateQuote(id, { status }),
    onSuccess: () => qc.invalidateQueries(['quotes']),
    onError: (err) => toast(err.response?.data?.error || 'Error al cambiar estado')
  })

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
    if (q.status === 'draft') {
      return (
        <button
          onClick={() => setConfirmSend(q)}
          className="flex items-center gap-1.5 px-3 py-1 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover transition-colors"
        >
          <PaperAirplaneIcon className="w-3.5 h-3.5 shrink-0" />
          Enviar presupuesto
        </button>
      )
    }
    const hasPendingInstallments = q.status === 'approved' && q.installments?.length > 0
    return (
      <div className="flex items-center gap-1.5">
        <StatusDropdown quote={q} onUpdate={(status) => changeStatus.mutate({ id: q.id, status })} />
        {hasPendingInstallments && (
          <span title={`${q.installments.length} cuota${q.installments.length !== 1 ? 's' : ''} pendiente${q.installments.length !== 1 ? 's' : ''}`}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-warning-subtle text-warning text-xs font-medium">
            <span>⏱</span>
            {q.installments.length}
          </span>
        )}
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
  function openEdit(id) { setEditingId(id); setModalOpen(true) }
  function handleSaved() { setModalOpen(false); qc.invalidateQueries(['quotes']) }
  function handlePotentialSaved() { setPotentialOpen(false); qc.invalidateQueries(['quotes']); qc.invalidateQueries(['clients-all']) }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-fg">Presupuestos</h2>
        {canWrite && (
          <button
            ref={newBtnRef}
            onClick={openNewMenu}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-colors"
          >
            + Nuevo presupuesto
            <ChevronDownIcon className="w-4 h-4 shrink-0" />
          </button>
        )}

        {newMenuOpen && createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setNewMenuOpen(false)} />
            <div
              style={{ top: newMenuPos.top, left: newMenuPos.left }}
              className="fixed z-[9999] bg-surface/90 backdrop-blur-xl border border-line-soft rounded-xl shadow-xl py-1.5 w-56"
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

      <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
        className="mb-4 w-full md:w-auto px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg">
        <option value="">Todos los estados</option>
        {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>

      {isLoading ? <p className="text-sm text-fg-soft">Cargando...</p> : (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {data?.data?.map(q => (
              <div key={q.id} className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line p-4">
                {/* Header: número + estado */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-medium text-fg-muted bg-raised px-2 py-0.5 rounded-md">
                    #{q.number}
                  </span>
                  {renderStatus(q)}
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
                  <Link to={`/quotes/${q.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-brand text-white hover:opacity-90 transition-opacity">
                    <EyeIcon className="w-3.5 h-3.5" />
                    Ver
                  </Link>
                </div>
              </div>
            ))}
            {!data?.data?.length && (
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data?.data?.map(q => (
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
                      <td className="px-4 py-3">{renderStatus(q)}</td>
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
                  {!data?.data?.length && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-fg-muted">Sin presupuestos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Pagination pagination={data?.pagination} onPageChange={setPage} />

      {modalOpen && (
        <QuoteModal
          quoteId={editingId}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {confirmSend && (
        <SendConfirmModal
          quote={confirmSend}
          onClose={() => setConfirmSend(null)}
          onConfirm={() => send.mutate(confirmSend.id)}
          onViewPdf={() => handleDownload(confirmSend.id, confirmSend.number)}
          sending={send.isPending}
          downloading={downloading === confirmSend.id}
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
