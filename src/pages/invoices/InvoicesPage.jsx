import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInvoices, deleteInvoice } from '../../api/invoices'
import InvoiceModal from './InvoiceModal'
import Pagination from '../../components/Pagination'

const STATUS_LABELS = {
  draft: 'Borrador', sent: 'Enviada', paid: 'Pagada',
  overdue: 'Vencida', cancelled: 'Cancelada'
}
const STATUS_COLORS = {
  draft:     'bg-raised text-fg-soft',
  sent:      'bg-info-subtle text-info',
  paid:      'bg-brand-subtle text-brand',
  overdue:   'bg-danger-subtle text-danger',
  cancelled: 'bg-raised text-fg-muted'
}

export default function InvoicesPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter, page],
    queryFn: () => getInvoices({ ...(statusFilter ? { status: statusFilter } : {}), page }).then(r => r.data)
  })

  const del = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => qc.invalidateQueries(['invoices'])
  })

  function openCreate() { setEditingId(null); setModalOpen(true) }
  function openEdit(id) { setEditingId(id); setModalOpen(true) }
  function handleSaved() { setModalOpen(false); qc.invalidateQueries(['invoices']) }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-fg">Facturas</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-colors">
          + Nueva factura
        </button>
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
            {data?.data?.map(inv => (
              <div key={inv.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/invoices/${inv.id}`} className="font-medium text-fg truncate block hover:text-brand">
                    {inv.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status]}`}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                    <p className="text-xs text-fg-muted">${Number(inv.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openEdit(inv.id)} className="px-2.5 py-1 rounded-md text-xs bg-brand-subtle text-brand">Editar</button>
                  {inv.status === 'draft' && (
                    <button onClick={() => { if (confirm('¿Eliminar?')) del.mutate(inv.id) }} className="px-2.5 py-1 rounded-md text-xs bg-danger-subtle text-danger">Eliminar</button>
                  )}
                </div>
              </div>
            ))}
            {!data?.data?.length && (
              <p className="p-6 text-center text-sm text-fg-muted">Sin facturas</p>
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
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status]}`}>
                          {STATUS_LABELS[inv.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-fg-soft">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('es-AR') : '-'}
                      </td>
                      <td className="px-4 py-3 text-fg-soft">${Number(inv.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => openEdit(inv.id)} className="text-brand hover:underline text-xs">Editar</button>
                        {inv.status === 'draft' && (
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
