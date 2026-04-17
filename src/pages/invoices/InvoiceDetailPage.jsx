import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getInvoiceById } from '../../api/invoices'
import InvoiceModal from './InvoiceModal'
import AttachmentsPanel from '../../components/AttachmentsPanel'

const STATUS_LABELS = {
  draft: 'Borrador', sent: 'Enviada', paid: 'Pagada',
  overdue: 'Vencida', cancelled: 'Cancelada'
}
const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500'
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoiceById(id).then(r => r.data.data)
  })

  if (isLoading) return <div className="p-8 text-sm text-gray-500">Cargando...</div>
  if (!invoice) return <div className="p-8 text-sm text-gray-500">Factura no encontrada</div>

  const subtotal = Number(invoice.subtotal)
  const total = Number(invoice.total)
  const taxAmount = total - subtotal

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/invoices')} className="text-sm text-gray-400 hover:text-gray-700">
          ← Facturas
        </button>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{invoice.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[invoice.status]}`}>
              {STATUS_LABELS[invoice.status]}
            </span>
          </div>
          <p className="text-gray-400 mt-0.5 text-sm">#{invoice.number}</p>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Editar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Información</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-gray-400 uppercase mb-0.5">Cliente</dt>
                <dd>
                  <Link to={`/clients/${invoice.client?.id}`} className="text-indigo-600 hover:underline">
                    {invoice.client?.name}
                  </Link>
                  {invoice.client?.company && <span className="text-gray-400 ml-1">· {invoice.client.company}</span>}
                </dd>
              </div>
              {invoice.project && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase mb-0.5">Proyecto</dt>
                  <dd>
                    <Link to={`/projects/${invoice.project.id}`} className="text-indigo-600 hover:underline">
                      {invoice.project.title}
                    </Link>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-400 uppercase mb-0.5">Moneda</dt>
                <dd className="text-gray-800">{invoice.currency}</dd>
              </div>
              {invoice.dueDate && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase mb-0.5">Vencimiento</dt>
                  <dd className={`font-medium ${invoice.status === 'overdue' ? 'text-red-600' : 'text-gray-800'}`}>
                    {new Date(invoice.dueDate).toLocaleDateString('es-AR')}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-400 uppercase mb-0.5">Creada</dt>
                <dd className="text-gray-800">{new Date(invoice.createdAt).toLocaleDateString('es-AR')}</dd>
              </div>
              {invoice.notes && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase mb-0.5">Notas</dt>
                  <dd className="text-gray-800 whitespace-pre-line">{invoice.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Adjuntos */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <AttachmentsPanel entityType="invoice" entityId={id} />
          </div>
        </div>

        {/* Columna derecha — ítems */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Ítems</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Descripción', 'Cant.', 'Precio unit.', 'Total'].map(h => (
                    <th key={h} className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 text-gray-800">{item.description}</td>
                    <td className="px-5 py-3 text-gray-600">{item.quantity}</td>
                    <td className="px-5 py-3 text-gray-600">${Number(item.unitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">${Number(item.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales */}
            <div className="border-t border-gray-100 px-5 py-4 space-y-1 text-sm text-right">
              <div className="text-gray-500">
                Subtotal: <span className="text-gray-900 font-medium">${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              {invoice.taxRate > 0 && (
                <div className="text-gray-500">
                  IVA ({invoice.taxRate}%): <span className="text-gray-900 font-medium">${taxAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="text-base font-semibold text-gray-900">
                Total {invoice.currency}: ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <InvoiceModal
          invoiceId={id}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false)
            qc.invalidateQueries(['invoice', id])
            qc.invalidateQueries(['invoices'])
          }}
        />
      )}
    </div>
  )
}
