import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInvoices, deleteInvoice, updateInvoice, downloadInvoicePdf } from '../../api/invoices'
import InvoiceModal from './InvoiceModal'
import Pagination from '../../components/Pagination'
import { useAuth } from '../../context/AuthContext'
import { ChevronDownIcon, UserIcon, CalendarDaysIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

const STATUS_LABELS = {
  draft: 'Borrador', sent: 'Enviada', paid: 'Pagada',
  overdue: 'Vencida', cancelled: 'Cancelada', partial: 'Cuotas pendientes'
}
const STATUS_COLORS = {
  draft:     'bg-raised text-fg-soft',
  sent:      'bg-info-subtle text-info',
  paid:      'bg-brand-subtle text-brand',
  overdue:   'bg-danger-subtle text-danger',
  cancelled: 'bg-raised text-fg-muted',
  partial:   'bg-warning-subtle text-warning'
}
const STATUS_DOT = {
  draft:     'bg-fg-muted',
  sent:      'bg-info',
  paid:      'bg-brand',
  overdue:   'bg-danger',
  cancelled: 'bg-fg-muted',
  partial:   'bg-warning'
}
const ALLOWED_TRANSITIONS = {
  draft:     ['sent', 'cancelled'],
  sent:      ['paid', 'cancelled'],
  partial:   [],
  paid:      [],
  overdue:   ['paid', 'cancelled'],
  cancelled: [],
}

function StatusDropdown({ invoice, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const allowed = ALLOWED_TRANSITIONS[invoice.status] || []

  if (!allowed.length) {
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[invoice.status]}`}>
        {STATUS_LABELS[invoice.status]}
      </span>
    )
  }

  function handleToggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(o => !o)
  }

  return (
    <div className="inline-block">
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-80 ${STATUS_COLORS[invoice.status]}`}
      >
        {STATUS_LABELS[invoice.status]}
        <ChevronDownIcon className="w-3 h-3 shrink-0" />
      </button>
      {open && (
        <div
          style={{ top: dropPos.top, left: dropPos.left }}
          className="fixed z-50 bg-surface border border-line-soft rounded-lg shadow-lg py-1 min-w-[150px]"
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
      )}
    </div>
  )
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const canWrite = user?.role !== 'member'
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [downloading, setDownloading] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter, page],
    queryFn: () => getInvoices({ ...(statusFilter ? { status: statusFilter } : {}), page }).then(r => r.data)
  })

  const del = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => qc.invalidateQueries(['invoices'])
  })

  const changeStatus = useMutation({
    mutationFn: ({ id, status }) => updateInvoice(id, { status }),
    onSuccess: () => qc.invalidateQueries(['invoices']),
    onError: (err) => alert(err.response?.data?.error || 'Error al cambiar estado')
  })

  async function handleDownload(id, number) {
    setDownloading(id)
    try {
      const res = await downloadInvoicePdf(id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(null)
    }
  }

  function openCreate() { setEditingId(null); setModalOpen(true) }
  function openEdit(id) { setEditingId(id); setModalOpen(true) }
  function handleSaved() { setModalOpen(false); qc.invalidateQueries(['invoices']) }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-fg">Facturas</h2>
        {canWrite && (
          <button onClick={openCreate} className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-colors">
            + Nueva factura
          </button>
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
            {data?.data?.map(inv => (
              <div key={inv.id} className="bg-surface rounded-xl border border-line p-4">
                {/* Header: número + estado */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-medium text-fg-muted bg-raised px-2 py-0.5 rounded-md">
                    #{inv.number}
                  </span>
                  {canWrite
                    ? <StatusDropdown invoice={inv} onUpdate={(status) => changeStatus.mutate({ id: inv.id, status })} />
                    : <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status]}`}>{STATUS_LABELS[inv.status]}</span>
                  }
                </div>
                {/* Título */}
                <Link to={`/invoices/${inv.id}`} className="block font-semibold text-fg hover:text-brand leading-snug mb-3">
                  {inv.title}
                </Link>
                {/* Meta */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  {inv.client?.name && (
                    <p className="text-xs text-fg-soft flex items-center gap-1.5 truncate">
                      <UserIcon className="w-3.5 h-3.5 shrink-0 text-fg-muted" />
                      {inv.client.name}
                    </p>
                  )}
                  <p className="text-base font-bold text-fg shrink-0">
                    ${Number(inv.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                {inv.dueDate && (
                  <p className="text-xs text-fg-muted flex items-center gap-1.5 mb-4">
                    <CalendarDaysIcon className="w-3.5 h-3.5 shrink-0" />
                    Vence: {new Date(inv.dueDate).toLocaleDateString('es-AR')}
                  </p>
                )}
                {!inv.dueDate && <div className="mb-4" />}
                {/* Acciones */}
                <div className="flex items-center gap-2 pt-3 border-t border-line">
                  <button
                    onClick={() => handleDownload(inv.id, inv.number)}
                    disabled={downloading === inv.id}
                    className="p-1.5 rounded-lg bg-raised text-fg-muted hover:bg-overlay disabled:opacity-50 transition-colors"
                    title="Descargar PDF"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  </button>
                  {canWrite && <button onClick={() => openEdit(inv.id)} className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-brand-subtle text-brand hover:opacity-80 transition-opacity">Editar</button>}
                  {canWrite && inv.status === 'draft' && (
                    <button onClick={() => { if (confirm('¿Eliminar?')) del.mutate(inv.id) }} className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-danger-subtle text-danger hover:opacity-80 transition-opacity">Eliminar</button>
                  )}
                </div>
              </div>
            ))}
            {!data?.data?.length && (
              <p className="py-10 text-center text-sm text-fg-muted">Sin facturas</p>
            )}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden md:block bg-surface rounded-xl border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-raised border-b border-line">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">#</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Título</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Vencimiento</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data?.data?.map(inv => (
                    <tr key={inv.id} className="hover:bg-raised">
                      <td className="px-4 py-3 text-fg-muted">#{inv.number}</td>
                      <td className="px-4 py-3 font-medium text-fg">
                        <Link to={`/invoices/${inv.id}`} className="hover:text-brand">{inv.title}</Link>
                      </td>
                      <td className="px-4 py-3 text-fg-soft">{inv.client?.name}</td>
                      <td className="px-4 py-3">
                        {canWrite
                          ? <StatusDropdown invoice={inv} onUpdate={(status) => changeStatus.mutate({ id: inv.id, status })} />
                          : <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status]}`}>{STATUS_LABELS[inv.status]}</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-fg-soft">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('es-AR') : '-'}
                      </td>
                      <td className="px-4 py-3 text-fg-soft">${Number(inv.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleDownload(inv.id, inv.number)}
                          disabled={downloading === inv.id}
                          className="text-fg-muted hover:text-fg disabled:opacity-50 transition-colors"
                          title="Descargar PDF"
                        >
                          <ArrowDownTrayIcon className={`w-4 h-4 ${downloading === inv.id ? 'animate-pulse' : ''}`} />
                        </button>
                        {canWrite && <button onClick={() => openEdit(inv.id)} className="text-brand hover:underline text-xs">Editar</button>}
                        {canWrite && inv.status === 'draft' && (
                          <button onClick={() => { if (confirm('¿Eliminar?')) del.mutate(inv.id) }} className="text-danger hover:underline text-xs">Eliminar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!data?.data?.length && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-fg-muted">Sin facturas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Pagination pagination={data?.pagination} onPageChange={setPage} />

      {modalOpen && (
        <InvoiceModal
          invoiceId={editingId}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
