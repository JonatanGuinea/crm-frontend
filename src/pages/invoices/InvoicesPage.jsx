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
  draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500'
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Facturas</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
          + Nueva factura
        </button>
      </div>

      <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
        className="mb-4 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white">
        <option value="">Todos los estados</option>
        {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>

      {isLoading ? <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['#', 'Título', 'Cliente', 'Estado', 'Vencimiento', 'Total', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data?.data?.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">#{inv.number}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    <Link to={`/invoices/${inv.id}`} className="hover:text-indigo-600">{inv.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{inv.client?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status]}`}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('es-AR') : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">${Number(inv.total).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(inv.id)} className="text-indigo-600 hover:underline text-xs">Editar</button>
                    {inv.status === 'draft' && (
                      <button onClick={() => { if (confirm('¿Eliminar?')) del.mutate(inv.id) }} className="text-red-500 hover:underline text-xs">Eliminar</button>
                    )}
                  </td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">Sin facturas</td></tr>
              )}
            </tbody>
          </table>
        </div>
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
