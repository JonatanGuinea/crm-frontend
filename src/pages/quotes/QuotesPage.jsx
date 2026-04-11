import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getQuotes, deleteQuote, createInvoiceFromQuote } from '../../api/quotes'
import QuoteModal from './QuoteModal'

const STATUS_LABELS = {
  draft: 'Borrador', sent: 'Enviado', approved: 'Aprobado',
  rejected: 'Rechazado', expired: 'Vencido'
}
const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
  expired: 'bg-yellow-100 text-yellow-700'
}

export default function QuotesPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', statusFilter],
    queryFn: () => getQuotes(statusFilter ? { status: statusFilter } : {}).then(r => r.data)
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Presupuestos</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
          + Nuevo presupuesto
        </button>
      </div>

      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
        className="mb-4 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <option value="">Todos los estados</option>
        {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>

      {isLoading ? <p className="text-sm text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['#', 'Título', 'Cliente', 'Estado', 'Total', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data?.map(q => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">#{q.number}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{q.title}</td>
                  <td className="px-4 py-3 text-gray-600">{q.client?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[q.status]}`}>
                      {STATUS_LABELS[q.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">${Number(q.total).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(q.id)} className="text-indigo-600 hover:underline text-xs">Editar</button>
                    {q.status === 'approved' && (
                      <button onClick={() => { if (confirm('¿Generar factura desde este presupuesto?')) toInvoice.mutate(q.id) }}
                        className="text-green-600 hover:underline text-xs">Facturar</button>
                    )}
                    {q.status === 'draft' && (
                      <button onClick={() => { if (confirm('¿Eliminar?')) del.mutate(q.id) }} className="text-red-500 hover:underline text-xs">Eliminar</button>
                    )}
                  </td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Sin presupuestos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data?.pagination && (
        <p className="mt-3 text-xs text-gray-400">{data.pagination.total} presupuesto(s)</p>
      )}

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
