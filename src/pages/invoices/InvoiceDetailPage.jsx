import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { getInvoiceById, downloadInvoicePdf } from '../../api/invoices'
import InvoiceModal from './InvoiceModal'
import AttachmentsPanel from '../../components/AttachmentsPanel'

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

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canWrite = user?.role !== 'member'
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function handleDownloadPdf() {
    setDownloading(true)
    try {
      const res = await downloadInvoicePdf(id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${invoice?.number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoiceById(id).then(r => r.data.data)
  })

  if (isLoading) return <div className="p-8 text-sm text-fg-soft">Cargando...</div>
  if (!invoice) return <div className="p-8 text-sm text-fg-soft">Factura no encontrada</div>

  const subtotal = Number(invoice.subtotal)
  const total = Number(invoice.total)
  const taxAmount = total - subtotal

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/invoices')} className="text-sm text-fg-muted hover:text-fg-soft">
          ← Facturas
        </button>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-fg">{invoice.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[invoice.status]}`}>
              {STATUS_LABELS[invoice.status]}
            </span>
          </div>
          <p className="text-fg-muted mt-0.5 text-sm">#{invoice.number}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-4 py-2 border border-line-soft rounded-md text-sm font-medium text-fg-soft hover:bg-raised disabled:opacity-50 transition-colors"
          >
            {downloading ? 'Generando...' : 'Descargar PDF'}
          </button>
          {canWrite && (
            <button
              onClick={() => setEditOpen(true)}
              className="px-4 py-2 border border-line-soft rounded-md text-sm font-medium text-fg-soft hover:bg-raised transition-colors"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-line p-5">
            <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide mb-4">Información</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-fg-muted uppercase mb-0.5">Cliente</dt>
                <dd>
                  <Link to={`/clients/${invoice.client?.id}`} className="text-brand hover:underline">
                    {invoice.client?.name}
                  </Link>
                  {invoice.client?.company && <span className="text-fg-muted ml-1">· {invoice.client.company}</span>}
                </dd>
              </div>
              {invoice.project && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Proyecto</dt>
                  <dd>
                    <Link to={`/projects/${invoice.project.id}`} className="text-brand hover:underline">
                      {invoice.project.title}
                    </Link>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-fg-muted uppercase mb-0.5">Moneda</dt>
                <dd className="text-fg">{invoice.currency}</dd>
              </div>
              {invoice.dueDate && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Vencimiento</dt>
                  <dd className={`font-medium ${invoice.status === 'overdue' ? 'text-danger' : 'text-fg'}`}>
                    {new Date(invoice.dueDate).toLocaleDateString('es-AR')}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-fg-muted uppercase mb-0.5">Creada</dt>
                <dd className="text-fg">{new Date(invoice.createdAt).toLocaleDateString('es-AR')}</dd>
              </div>
              {invoice.notes && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Notas</dt>
                  <dd className="text-fg whitespace-pre-line">{invoice.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-surface rounded-xl border border-line p-5">
            <AttachmentsPanel entityType="invoice" entityId={id} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-surface rounded-xl border border-line overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
              <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">Ítems</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-raised">
                <tr>
                  {['Descripción', 'Cant.', 'Precio unit.', 'Total'].map(h => (
                    <th key={h} className="text-left px-5 py-2 text-xs font-medium text-fg-soft uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invoice.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 text-fg">{item.description}</td>
                    <td className="px-5 py-3 text-fg-soft">{item.quantity}</td>
                    <td className="px-5 py-3 text-fg-soft">${Number(item.unitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3 font-medium text-fg">${Number(item.amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-line px-5 py-4 space-y-1 text-sm text-right">
              <div className="text-fg-soft">
                Subtotal: <span className="text-fg font-medium">${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {invoice.taxRate > 0 && (
                <div className="text-fg-soft">
                  IVA ({invoice.taxRate}%): <span className="text-fg font-medium">${taxAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="text-base font-semibold text-fg">
                Total {invoice.currency}: ${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
