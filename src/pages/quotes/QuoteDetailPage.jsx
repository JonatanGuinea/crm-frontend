import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { getQuoteById, createInvoiceFromQuote, downloadQuotePdf } from '../../api/quotes'
import QuoteModal from './QuoteModal'
import AttachmentsPanel from '../../components/AttachmentsPanel'

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

export default function QuoteDetailPage() {
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
      const res = await downloadQuotePdf(id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `presupuesto-${quote?.number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => getQuoteById(id).then(r => r.data.data)
  })

  const toInvoice = useMutation({
    mutationFn: () => createInvoiceFromQuote(id, {}),
    onSuccess: () => {
      qc.invalidateQueries(['invoices'])
      alert('Factura creada correctamente')
      navigate('/invoices')
    },
    onError: (err) => alert(err.response?.data?.error || 'Error al generar factura')
  })

  if (isLoading) return <div className="p-8 text-sm text-fg-soft">Cargando...</div>
  if (!quote) return <div className="p-8 text-sm text-fg-soft">Presupuesto no encontrado</div>

  const subtotal = Number(quote.subtotal)
  const total = Number(quote.total)
  const taxAmount = total - subtotal

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/quotes')} className="text-sm text-fg-muted hover:text-fg-soft">
          ← Presupuestos
        </button>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-fg">{quote.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[quote.status]}`}>
              {STATUS_LABELS[quote.status]}
            </span>
          </div>
          <p className="text-fg-muted mt-0.5 text-sm">#{quote.number}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-4 py-2 border border-line-soft rounded-md text-sm font-medium text-fg-soft hover:bg-raised disabled:opacity-50 transition-colors"
          >
            {downloading ? 'Generando...' : 'Descargar PDF'}
          </button>
          {canWrite && quote.status === 'approved' && (
            <button
              onClick={() => { if (confirm('¿Generar factura desde este presupuesto?')) toInvoice.mutate() }}
              disabled={toInvoice.isPending}
              className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50 transition-colors"
            >
              Facturar
            </button>
          )}
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
                  <Link to={`/clients/${quote.client?.id}`} className="text-brand hover:underline">
                    {quote.client?.name}
                  </Link>
                  {quote.client?.company && <span className="text-fg-muted ml-1">· {quote.client.company}</span>}
                </dd>
              </div>
              {quote.project && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Proyecto</dt>
                  <dd>
                    <Link to={`/projects/${quote.project.id}`} className="text-brand hover:underline">
                      {quote.project.title}
                    </Link>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-fg-muted uppercase mb-0.5">Moneda</dt>
                <dd className="text-fg">{quote.currency}</dd>
              </div>
              {quote.validUntil && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Válido hasta</dt>
                  <dd className="text-fg">{new Date(quote.validUntil).toLocaleDateString('es-AR')}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-fg-muted uppercase mb-0.5">Creado</dt>
                <dd className="text-fg">{new Date(quote.createdAt).toLocaleDateString('es-AR')}</dd>
              </div>
              {quote.notes && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Notas</dt>
                  <dd className="text-fg whitespace-pre-line">{quote.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-surface rounded-xl border border-line p-5">
            <AttachmentsPanel entityType="quote" entityId={id} />
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
                {quote.items?.map((item, i) => (
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
              {quote.taxRate > 0 && (
                <div className="text-fg-soft">
                  IVA ({quote.taxRate}%): <span className="text-fg font-medium">${taxAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="text-base font-semibold text-fg">
                Total {quote.currency}: ${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <QuoteModal
          quoteId={id}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false)
            qc.invalidateQueries(['quote', id])
            qc.invalidateQueries(['quotes'])
          }}
        />
      )}
    </div>
  )
}
