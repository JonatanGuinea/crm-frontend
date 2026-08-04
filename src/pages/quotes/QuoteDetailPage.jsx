import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { getQuoteById, downloadQuotePdf, deleteQuote } from '../../api/quotes'
import QuoteModal from './QuoteModal'
import QuoteModalPotential from './QuoteModalPotential'
import AttachmentsPanel from '../../components/AttachmentsPanel'
import InstallmentsPanel from '../../components/InstallmentsPanel'

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

export default function QuoteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
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

  const del = useMutation({
    mutationFn: () => deleteQuote(id),
    onSuccess: () => {
      qc.invalidateQueries(['quotes'])
      toast('Presupuesto eliminado', 'success')
      navigate('/quotes')
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al eliminar', 'error')
  })

  if (isLoading) return <div className="p-8 text-sm text-fg-soft">Cargando...</div>
  if (!quote) return <div className="p-8 text-sm text-fg-soft">Presupuesto no encontrado</div>

  const isSigned = quote.status === 'signed'

  const subtotal = Number(quote.subtotal)
  const total    = Number(quote.total)
  const discountAmt = quote.discountType === 'percent'
    ? subtotal * (Number(quote.discountValue) / 100)
    : Number(quote.discountValue) || 0
  const taxAmount = (subtotal - discountAmt) * (Number(quote.taxRate) / 100)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/quotes')} className="text-sm text-fg-muted hover:text-fg-soft">
          ← Presupuestos
        </button>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-fg">{quote.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[quote.status]}`}>
              {STATUS_LABELS[quote.status]}
            </span>
          </div>
          <p className="text-fg-muted mt-0.5 text-sm">#{quote.number}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={() => {
              const url = `${window.location.origin}/p/presupuesto/${id}`
              navigator.clipboard.writeText(url)
              toast('Enlace copiado al portapapeles', 'success')
            }}
            className="px-4 py-2 border border-line-soft rounded-md text-sm font-medium text-fg-soft hover:bg-raised transition-colors"
          >
            Compartir
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-4 py-2 border border-line-soft rounded-md text-sm font-medium text-fg-soft hover:bg-raised disabled:opacity-50 transition-colors"
          >
            {downloading ? 'Generando...' : 'Descargar PDF'}
          </button>
          {canWrite && (
            <button
              onClick={() => isSigned ? toast('El presupuesto fue firmado, no se puede modificar') : setEditOpen(true)}
              className="px-4 py-2 border border-line-soft rounded-md text-sm font-medium text-fg-soft hover:bg-raised transition-colors"
            >
              Editar
            </button>
          )}
          {canWrite && quote.status === 'draft' && (
            <button
              onClick={async () => { if (await confirm('¿Eliminar este presupuesto? Esta acción no se puede deshacer.', { confirmLabel: 'Eliminar', danger: true })) del.mutate() }}
              disabled={del.isPending}
              className="px-4 py-2 rounded-md text-sm font-medium bg-danger-subtle text-danger hover:opacity-80 disabled:opacity-50 transition-opacity"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line p-5">
            <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide mb-4">Información</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-fg-muted uppercase mb-0.5">
                  Cliente
                  {!quote.client && quote.potentialClientName && (
                    <span className="ml-2 normal-case px-1.5 py-0.5 rounded-md bg-warning-subtle text-warning font-medium text-[10px]">Potencial</span>
                  )}
                </dt>
                <dd className="text-fg">
                  {quote.client ? (
                    <>
                      <Link to={`/clients/${quote.client.id}`} className="text-brand hover:underline">
                        {quote.client.name}
                      </Link>
                      {quote.client.company && <span className="text-fg-muted ml-1">· {quote.client.company}</span>}
                    </>
                  ) : (
                    quote.potentialClientName ?? '—'
                  )}
                </dd>
              </div>
              {!quote.client && quote.potentialClientCompany && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Empresa</dt>
                  <dd className="text-fg">{quote.potentialClientCompany}</dd>
                </div>
              )}
              {!quote.client && quote.potentialClientEmail && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Email</dt>
                  <dd className="text-fg">{quote.potentialClientEmail}</dd>
                </div>
              )}
              {(quote.project || (!quote.client && quote.potentialProjectTitle)) && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Proyecto</dt>
                  <dd>
                    {quote.project ? (
                      <Link to={`/projects/${quote.project.id}`} className="text-brand hover:underline">
                        {quote.project.title}
                      </Link>
                    ) : (
                      <span className="text-fg">{quote.potentialProjectTitle}</span>
                    )}
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
              {quote.deliveryDate && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Fecha de entrega</dt>
                  <dd className="text-fg">{new Date(quote.deliveryDate).toLocaleDateString('es-AR')}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-fg-muted uppercase mb-0.5">Creado</dt>
                <dd className="text-fg">{new Date(quote.createdAt).toLocaleDateString('es-AR')}</dd>
              </div>
              {isSigned && quote.clientSignedAt && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Firmado el</dt>
                  <dd className="text-fg">{new Date(quote.clientSignedAt).toLocaleDateString('es-AR')}</dd>
                </div>
              )}
              {quote.status === 'rejected' && quote.rejectionReason && (
                <div className="pt-1">
                  <dt className="text-xs text-fg-muted uppercase mb-1.5">Motivo de rechazo</dt>
                  <dd className="px-3 py-2.5 rounded-lg bg-danger-subtle border border-danger/20 text-sm text-danger leading-snug">
                    {quote.rejectionReason}
                  </dd>
                </div>
              )}
              {quote.notes && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Notas</dt>
                  <dd className="text-fg whitespace-pre-line">{quote.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line p-5">
            <InstallmentsPanel
              entityType="quote"
              entityId={id}
              entityStatus={quote.status}
              canWrite={canWrite}
              currency={quote.currency}
              total={total}
            />
          </div>

          <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line p-5">
            <AttachmentsPanel entityType="quote" entityId={id} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line overflow-hidden">
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
              {discountAmt > 0 && (
                <div className="text-fg-soft">
                  Descuento{quote.discountType === 'percent' ? ` (${quote.discountValue}%)` : ''}:
                  <span className="text-emerald-600 font-medium ml-1">
                    -${discountAmt.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
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
        quote.potentialClientName && !quote.client ? (
          <QuoteModalPotential
            quoteId={id}
            onClose={() => setEditOpen(false)}
            onSaved={() => {
              setEditOpen(false)
              qc.invalidateQueries(['quote', id])
              qc.invalidateQueries(['quotes'])
            }}
          />
        ) : (
          <QuoteModal
            quoteId={id}
            onClose={() => setEditOpen(false)}
            onSaved={() => {
              setEditOpen(false)
              qc.invalidateQueries(['quote', id])
              qc.invalidateQueries(['quotes'])
            }}
          />
        )
      )}
    </div>
  )
}
