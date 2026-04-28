import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getQuotes, deleteQuote, createInvoiceFromQuote } from '../../api/quotes'
import QuoteModal from './QuoteModal'
import Pagination from '../../components/Pagination'
import { useAuth } from '../../context/AuthContext'

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

export default function QuotesPage() {
  const { user } = useAuth()
  const canWrite = user?.role !== 'member'
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', statusFilter, page],
    queryFn: () => getQuotes({ ...(statusFilter ? { status: statusFilter } : {}), page }).then(r => r.data)
  })

  const del = useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => qc.invalidateQueries(['quotes'])
  })

  const toInvoice = useMutation({
    mutationFn: (id) => createInvoiceFromQuote(id, {}),
    onSuccess: () => {
      qc.invalidateQueries(['invoices'])
      alert('Factura creada correctamente')
    },
    onError: (err) => alert(err.response?.data?.error || 'Error al generar factura')
  })

  function openCreate() { setEditingId(null); setModalOpen(true) }
  function openEdit(id) { setEditingId(id); setModalOpen(true) }
  function handleSaved() { setModalOpen(false); qc.invalidateQueries(['quotes']) }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-fg">Presupuestos</h2>
        {canWrite && (
          <button onClick={openCreate} className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-colors">
            + Nuevo presupuesto
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
          <div className="md:hidden bg-surface rounded-xl border border-line divide-y divide-line">
            {data?.data?.map(q => (
              <div key={q.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/quotes/${q.id}`} className="font-medium text-fg truncate block hover:text-brand">
                    {q.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[q.status]}`}>
                      {STATUS_LABELS[q.status]}
                    </span>
                    <p className="text-xs text-fg-muted">${Number(q.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {canWrite && <button onClick={() => openEdit(q.id)} className="px-2.5 py-1 rounded-md text-xs bg-brand-subtle text-brand">Editar</button>}
                  {canWrite && q.status === 'approved' && (
                    <button onClick={() => { if (confirm('¿Generar factura?')) toInvoice.mutate(q.id) }} className="px-2.5 py-1 rounded-md text-xs bg-info-subtle text-info">Facturar</button>
                  )}
                  {canWrite && q.status === 'draft' && (
                    <button onClick={() => { if (confirm('¿Eliminar?')) del.mutate(q.id) }} className="px-2.5 py-1 rounded-md text-xs bg-danger-subtle text-danger">Eliminar</button>
                  )}
                </div>
              </div>
            ))}
            {!data?.data?.length && (
              <p className="p-6 text-center text-sm text-fg-muted">Sin presupuestos</p>
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
                      <td className="px-4 py-3 text-fg-soft">{q.client?.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[q.status]}`}>
                          {STATUS_LABELS[q.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-fg-soft">${Number(q.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {canWrite && <button onClick={() => openEdit(q.id)} className="text-brand hover:underline text-xs">Editar</button>}
                        {canWrite && q.status === 'approved' && (
                          <button onClick={() => { if (confirm('¿Generar factura desde este presupuesto?')) toInvoice.mutate(q.id) }}
                            className="text-brand hover:underline text-xs">Facturar</button>
                        )}
                        {canWrite && q.status === 'draft' && (
                          <button onClick={() => { if (confirm('¿Eliminar?')) del.mutate(q.id) }} className="text-danger hover:underline text-xs">Eliminar</button>
                        )}
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
    </div>
  )
}
