import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicQuote, getPublicQuotePdfUrl } from '../../api/public'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

const STATUS_LABELS = {
  draft: 'Borrador', sent: 'Enviado', approved: 'Aprobado',
  rejected: 'Rechazado', expired: 'Vencido'
}
const STATUS_COLORS = {
  draft:    'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  sent:     'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  expired:  'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
}
const STATUS_INST = { pending: 'Pendiente', paid: 'Pagado', overdue: 'Vencido' }
const STATUS_INST_COLORS = {
  pending: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  paid:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  overdue: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
}

const fmt = (n) => Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-AR') : '—'

export default function QuotePublicPage() {
  const { id } = useParams()

  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ['public-quote', id],
    queryFn: () => getPublicQuote(id).then(r => r.data.data),
    retry: false
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !quote) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-950 text-zinc-500">
        <p className="text-4xl">🔍</p>
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">Presupuesto no encontrado</p>
        <p className="text-sm">El enlace puede ser incorrecto o haber expirado.</p>
      </div>
    )
  }

  const subtotal  = Number(quote.subtotal)
  const total     = Number(quote.total)
  const taxAmount = total - subtotal
  const sym       = quote.currency === 'USD' ? 'US$' : '$'
  const org       = quote.organization || {}

  const validDays = (quote.validUntil && quote.createdAt)
    ? Math.round((new Date(quote.validUntil) - new Date(quote.createdAt)) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header card */}
        <div className="rounded-2xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mb-4">

          {/* Top band */}
          <div className="bg-slate-800 px-7 py-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400 font-medium uppercase tracking-widest mb-0.5">
                Presupuesto
              </p>
              <h1 className="text-white text-xl font-bold leading-snug">{quote.title}</h1>
            </div>
            {/* Emisor */}
            <div className="text-right shrink-0">
              <p className="text-white font-semibold text-base">{org.name}</p>
              {org.cuit    && <p className="text-slate-400 text-xs mt-0.5">CUIL/CUIT: {org.cuit}</p>}
              {org.email   && <p className="text-slate-400 text-xs">{org.email}</p>}
              {org.phone   && <p className="text-slate-400 text-xs">{org.phone}</p>}
              {org.address && <p className="text-slate-400 text-xs">{org.address}</p>}
              {org.website && <p className="text-slate-400 text-xs">{org.website}</p>}
            </div>
          </div>

          {/* Info section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-7 py-5 border-b border-zinc-100 dark:border-zinc-800">
            {/* Cliente */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Cliente</p>
              <p className="font-semibold text-zinc-800 dark:text-zinc-100 text-base">{quote.client?.name}</p>
              {quote.client?.company && <p className="text-sm text-zinc-500">{quote.client.company}</p>}
              {quote.client?.cuit    && <p className="text-sm text-zinc-500">CUIL/CUIT: {quote.client.cuit}</p>}
              {quote.client?.email   && <p className="text-sm text-zinc-500">{quote.client.email}</p>}
              {quote.client?.phone   && <p className="text-sm text-zinc-500">{quote.client.phone}</p>}
              {quote.client?.address && <p className="text-sm text-zinc-500">{quote.client.address}</p>}
              {quote.client?.website && <p className="text-sm text-zinc-500">{quote.client.website}</p>}
            </div>

            {/* Detalle */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Detalle</p>
              <InfoRow label="Presupuesto" value={`#${String(quote.number).padStart(3, '0')}`} />
              <InfoRow label="Fecha"       value={fmtDate(quote.createdAt)} />
              <InfoRow label="Moneda"      value={quote.currency} />
              {quote.project    && <InfoRow label="Proyecto"    value={quote.project.title} />}
              {validDays != null && <InfoRow label="Válido por"  value={`${validDays} día${validDays !== 1 ? 's' : ''}`} />}
              {quote.validUntil && <InfoRow label="Válido hasta" value={fmtDate(quote.validUntil)} />}
              <InfoRow
                label="Estado"
                value={
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[quote.status] || STATUS_COLORS.draft}`}>
                    {STATUS_LABELS[quote.status] || quote.status}
                  </span>
                }
              />
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Descripción</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide">Cant.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide">Precio unit.</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {quote.items?.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 1 ? 'bg-zinc-50 dark:bg-zinc-800/40' : ''}>
                    <td className="px-5 py-3 text-zinc-800 dark:text-zinc-100">{item.description}</td>
                    <td className="px-4 py-3 text-right text-zinc-500">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-zinc-500">{sym}{fmt(item.unitPrice)}</td>
                    <td className="px-5 py-3 text-right font-medium text-zinc-800 dark:text-zinc-100">{sym}{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-7 py-5 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Subtotal</span>
                <span>{sym}{fmt(subtotal)}</span>
              </div>
              {quote.taxRate > 0 && (
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>IVA ({quote.taxRate}%)</span>
                  <span>{sym}{fmt(taxAmount)}</span>
                </div>
              )}
              <div className="rounded-xl bg-slate-800 flex items-center justify-between px-4 py-3 mt-2">
                <span className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Total {quote.currency}</span>
                <span className="text-white text-xl font-bold">{sym}{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Plan de cuotas */}
          {quote.installments?.length > 0 && (
            <div className="border-t border-zinc-100 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">N°</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">Vencimiento</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">Estado</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {quote.installments.map((inst, i) => (
                    <tr key={inst.id} className={i % 2 === 1 ? 'bg-zinc-50 dark:bg-zinc-800/40' : ''}>
                      <td className="px-5 py-3 text-zinc-500">{inst.number}</td>
                      <td className="px-4 py-3 text-zinc-500">{fmtDate(inst.dueDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_INST_COLORS[inst.status] || STATUS_INST_COLORS.pending}`}>
                          {STATUS_INST[inst.status] || inst.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-zinc-800 dark:text-zinc-100">{sym}{fmt(inst.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notas */}
          {quote.notes && (
            <div className="px-7 py-5 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Alcance / Notas</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Download PDF */}
        <div className="flex justify-end">
          <a
            href={getPublicQuotePdfUrl(id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors shadow"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Descargar PDF
          </a>
        </div>

        {/* Branding footer */}
        <p className="text-center text-xs text-zinc-400 mt-6">
          Generado con <span className="font-medium text-zinc-500">{org.name}</span>
        </p>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-zinc-400 w-24 shrink-0">{label}</span>
      <span className="text-zinc-700 dark:text-zinc-200 font-medium">{value}</span>
    </div>
  )
}
