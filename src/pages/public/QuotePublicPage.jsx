import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicQuote, getPublicQuotePdfUrl } from '../../api/public'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '')

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
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !quote) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-zinc-100 dark:bg-zinc-950 text-zinc-500">
        <p className="text-4xl">🔍</p>
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">Presupuesto no encontrado</p>
        <p className="text-sm">El enlace puede ser incorrecto o haber expirado.</p>
      </div>
    )
  }

  const subtotal    = Number(quote.subtotal)
  const total       = Number(quote.total)
  const discountAmt = quote.discountType === 'percent'
    ? subtotal * (Number(quote.discountValue) / 100)
    : Number(quote.discountValue) || 0
  const taxAmount   = (subtotal - discountAmt) * (Number(quote.taxRate) / 100)
  const sym        = quote.currency === 'USD' ? 'US$' : '$'
  const org        = quote.organization || {}
  const numStr     = String(quote.number).padStart(3, '0')
  const orgLogoUrl = org.logo ? `${API_BASE}/uploads/${org.logo}` : null

  const validDays = (quote.validUntil && quote.createdAt)
    ? Math.round((new Date(quote.validUntil) - new Date(quote.createdAt)) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Document card */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mb-5">

          {/* Header band */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-7 py-6">
            <div className="flex items-start justify-between gap-6">

              {/* Left: org identity + doc title */}
              <div className="min-w-0 flex-1">
                <div className="mb-3">
                  {orgLogoUrl
                    ? <img src={orgLogoUrl} alt={org.name} className="h-14 object-contain" />
                    : <p className="text-slate-300 font-semibold text-sm">{org.name}</p>
                  }
                </div>
                <p className="text-slate-400 text-xs uppercase tracking-[0.18em] font-medium mb-1">Presupuesto</p>
                <h1 className="text-white text-xl font-bold leading-snug break-words">{quote.title}</h1>
              </div>

              {/* Right: number + status + contact */}
              <div className="text-right shrink-0">
                <p className="text-white font-bold text-3xl leading-none tabular-nums mb-3">#{numStr}</p>
                <div className="space-y-0.5">
                  {orgLogoUrl && <p className="text-slate-300 text-xs font-medium">{org.name}</p>}
                  {org.cuit    && <p className="text-slate-400 text-xs">CUIL/CUIT: {org.cuit}</p>}
                  {org.email   && <p className="text-slate-400 text-xs">{org.email}</p>}
                  {org.phone   && <p className="text-slate-400 text-xs">{org.phone}</p>}
                  {org.address && <p className="text-slate-400 text-xs">{org.address}</p>}
                  {(org.city || org.province) && (
                    <p className="text-slate-400 text-xs">
                      {[org.city, org.province].filter(Boolean).join(', ')}
                      {org.postalCode ? ` (${org.postalCode})` : ''}
                    </p>
                  )}
                  {org.website && <p className="text-slate-400 text-xs">{org.website}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Info section: Cliente | Detalle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="px-7 py-5 sm:border-r border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Cliente</p>
              <p className="font-semibold text-zinc-800 dark:text-zinc-100 text-base">
                {quote.client?.name || quote.potentialClientName}
              </p>
              {(quote.client?.company || quote.potentialClientCompany) && (
                <p className="text-sm text-zinc-500 mt-0.5">{quote.client?.company || quote.potentialClientCompany}</p>
              )}
              {quote.client?.cuit    && <p className="text-sm text-zinc-500">CUIL/CUIT: {quote.client.cuit}</p>}
              {(quote.client?.email  || quote.potentialClientEmail) && (
                <p className="text-sm text-zinc-500">{quote.client?.email || quote.potentialClientEmail}</p>
              )}
              {quote.client?.phone   && <p className="text-sm text-zinc-500">{quote.client.phone}</p>}
              {quote.client?.address && <p className="text-sm text-zinc-500">{quote.client.address}</p>}
              {(quote.client?.city || quote.client?.province) && (
                <p className="text-sm text-zinc-500">
                  {[quote.client.city, quote.client.province].filter(Boolean).join(', ')}
                  {quote.client.postalCode ? ` (${quote.client.postalCode})` : ''}
                </p>
              )}
            </div>
            <div className="px-7 py-5">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Detalle</p>
              <div className="space-y-1.5">
                <InfoRow label="Número"      value={`#${numStr}`} />
                <InfoRow label="Fecha"       value={fmtDate(quote.createdAt)} />
                <InfoRow label="Moneda"      value={quote.currency} />
                {quote.project     && <InfoRow label="Proyecto"    value={quote.project.title} />}
                {validDays != null  && <InfoRow label="Válido por"  value={`${validDays} día${validDays !== 1 ? 's' : ''}`} />}
                {quote.validUntil  && <InfoRow label="Válido hasta" value={fmtDate(quote.validUntil)} />}
              </div>
            </div>
          </div>

          {/* Section: Ítems */}
          <SectionLabel label="Ítems" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Descripción</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Cant.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Precio unit.</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {quote.items?.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 1 ? 'bg-zinc-50/60 dark:bg-zinc-800/30' : ''}>
                    <td className="px-5 py-3.5 text-zinc-800 dark:text-zinc-100">{item.description}</td>
                    <td className="px-4 py-3.5 text-right text-zinc-500">{item.quantity}</td>
                    <td className="px-4 py-3.5 text-right text-zinc-500">{sym}{fmt(item.unitPrice)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-zinc-800 dark:text-zinc-100">{sym}{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-7 py-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Subtotal</span>
                <span className="font-medium">{sym}{fmt(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>Descuento{quote.discountType === 'percent' ? ` (${quote.discountValue}%)` : ''}</span>
                  <span className="font-medium text-emerald-600">-{sym}{fmt(discountAmt)}</span>
                </div>
              )}
              {quote.taxRate > 0 && (
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>IVA ({quote.taxRate}%)</span>
                  <span className="font-medium">{sym}{fmt(taxAmount)}</span>
                </div>
              )}
              <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 flex items-center justify-between px-4 py-3.5 mt-3">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total</p>
                  <p className="text-slate-500 text-xs">{quote.currency}</p>
                </div>
                <span className="text-white text-2xl font-bold tabular-nums">{sym}{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Section: Plan de pagos */}
          {quote.installments?.length > 0 && (
            <>
              <SectionLabel label="Plan de pagos" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">N°</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Vencimiento</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Estado</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {quote.installments.map((inst, i) => (
                      <tr key={inst.id} className={i % 2 === 1 ? 'bg-zinc-50/60 dark:bg-zinc-800/30' : ''}>
                        <td className="px-5 py-3 text-zinc-500">{inst.number}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{fmtDate(inst.dueDate)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_INST_COLORS[inst.status] || STATUS_INST_COLORS.pending}`}>
                            {STATUS_INST[inst.status] || inst.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-zinc-800 dark:text-zinc-100">{sym}{fmt(inst.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Section: Notas */}
          {quote.notes && (
            <>
              <SectionLabel label="Notas" />
              <div className="px-7 pb-6">
                <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">{quote.notes}</p>
              </div>
            </>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Generado por <span className="font-medium text-zinc-500">{org.name}</span>
          </p>
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

      </div>
    </div>
  )
}

function SectionLabel({ label }) {
  return (
    <div className="px-7 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex items-center gap-3">
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider shrink-0">{label}</p>
      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
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
