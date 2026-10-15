import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { getQuoteById, downloadQuotePdf, deleteQuote } from '../../api/quotes'
import { fmt } from '../../utils/fmt'
import QuoteModal from './QuoteModal'
import QuoteModalPotential from './QuoteModalPotential'
import AttachmentsPanel from '../../components/AttachmentsPanel'
import InstallmentsPanel from '../../components/InstallmentsPanel'
import QuoteImagesPanel from '../../components/QuoteImagesPanel'
import { PresupuestoIcon, ClienteIcon, CarpetaIcon } from '../../components/DuIcons'

const C = {
  bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F',
  crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E',
  ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE',
}
const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"
const card = { background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0' }

const QUOTE_STATUS = {
  draft:     { label: 'Borrador',   bg: 'rgba(242,237,227,0.07)', color: C.piedra },
  sent:      { label: 'Enviado',    bg: 'rgba(142,177,222,0.12)', color: C.info },
  approved:  { label: 'Aprobado',  bg: 'rgba(125,190,147,0.12)', color: C.ok },
  signed:    { label: 'Firmado',   bg: 'rgba(125,190,147,0.18)', color: C.ok },
  rejected:  { label: 'Rechazado', bg: 'rgba(229,131,115,0.12)', color: C.err },
  cancelled: { label: 'Cancelado', bg: 'rgba(229,131,115,0.08)', color: C.err },
  expired:   { label: 'Vencido',   bg: 'rgba(242,237,227,0.05)', color: C.piedra },
}

/* ── SVGs ─────────────────────────────────────────────────────────────────── */
function DownloadSvg() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
}
function ShareSvg() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
}
function EditSvg() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
}

/* ── GhostBtn ─────────────────────────────────────────────────────────────── */
function GhostBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', background: 'none', border: `1px solid ${C.linea}`, borderRadius: '0 8px 8px 0', color: C.piedra, fontSize: 12, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: disabled ? 0.5 : 1 }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.arena } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.piedra }}
    >
      {children}
    </button>
  )
}

/* ── SectionHead ──────────────────────────────────────────────────────────── */
function SectionHead({ children }) {
  return (
    <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.arena, margin: '0 0 14px' }}>
      {children}
    </p>
  )
}

/* ── InfoRow ──────────────────────────────────────────────────────────────── */
function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.piedra, margin: 0 }}>{label}</p>
      <div style={{ fontSize: 13, color: C.crema }}>{children}</div>
    </div>
  )
}

/* ── página ───────────────────────────────────────────────────────────────── */
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

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => getQuoteById(id).then(r => r.data.data),
  })

  const del = useMutation({
    mutationFn: () => deleteQuote(id),
    onSuccess: () => {
      qc.invalidateQueries(['quotes'])
      toast('Presupuesto eliminado', 'success')
      navigate('/quotes')
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al eliminar', 'error'),
  })

  async function handleDownloadPdf() {
    setDownloading(true)
    try {
      const res = await downloadQuotePdf(id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = `presupuesto-${quote?.number}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(false) }
  }

  if (isLoading) return (
    <div style={{ padding: '40px 24px', fontFamily: 'Geist, system-ui, sans-serif', fontSize: 13, color: C.piedra }}>
      Cargando...
    </div>
  )
  if (!quote) return (
    <div style={{ padding: '40px 24px', fontFamily: 'Geist, system-ui, sans-serif', fontSize: 13, color: C.piedra }}>
      Presupuesto no encontrado.
    </div>
  )

  const isSigned    = quote.status === 'signed'
  const status      = QUOTE_STATUS[quote.status]
  const subtotal    = Number(quote.subtotal)
  const total       = Number(quote.total)
  const discountAmt = quote.discountType === 'percent'
    ? subtotal * (Number(quote.discountValue) / 100)
    : Number(quote.discountValue) || 0
  const taxAmount   = (subtotal - discountAmt) * (Number(quote.taxRate) / 100)
  const numStr      = `#${String(quote.number).padStart(3, '0')}`
  const isPotential = !quote.client && !!quote.potentialClientName

  return (
    <div className="px-4 pt-5 pb-10 md:px-6 md:pt-7" style={{ maxWidth: 1200, fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 12.5, color: C.piedra }}>
        <Link to="/quotes"
          style={{ color: C.piedra, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = C.arena}
          onMouseLeave={e => e.currentTarget.style.color = C.piedra}
        >
          Presupuestos
        </Link>
        <span style={{ color: C.linea }}>/</span>
        <span style={{ color: C.arena, fontFamily: "'Geist Mono', monospace" }}>{numStr}</span>
        <span style={{ color: C.linea }}>/</span>
        <span style={{ color: C.piedra, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{quote.title}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3" style={{ marginBottom: 28 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {status && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: '0 7px 7px 0', fontSize: 11, fontWeight: 600, background: status.bg, color: status.color }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.color, flexShrink: 0 }} />
                {status.label}
              </span>
            )}
            {isSigned && quote.clientSignedAt && (
              <span style={{ fontSize: 11, color: C.piedra }}>
                Firmado el {new Date(quote.clientSignedAt).toLocaleDateString('es-AR')}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.crema, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            {quote.title}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
          <GhostBtn onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/presupuesto/${id}`); toast('Enlace copiado', 'success') }}>
            <ShareSvg /> Compartir
          </GhostBtn>
          <GhostBtn onClick={() => window.open(`${window.location.origin}/p/presupuesto/${id}`, '_blank')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Vista previa
          </GhostBtn>
          <GhostBtn onClick={handleDownloadPdf} disabled={downloading}>
            <DownloadSvg /> {downloading ? 'Generando...' : 'Descargar PDF'}
          </GhostBtn>
          {canWrite && (
            <GhostBtn onClick={() => isSigned ? toast('El presupuesto fue firmado, no se puede modificar') : setEditOpen(true)}>
              <EditSvg /> Editar
            </GhostBtn>
          )}
          {canWrite && quote.status === 'draft' && (
            <button
              onClick={async () => { if (await confirm('¿Eliminar este presupuesto? Esta acción no se puede deshacer.', { confirmLabel: 'Eliminar', danger: true })) del.mutate() }}
              disabled={del.isPending}
              style={{ display: 'flex', alignItems: 'center', height: 32, padding: '0 12px', background: 'rgba(229,131,115,0.10)', color: C.err, border: 'none', borderRadius: '0 8px 8px 0', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', opacity: del.isPending ? 0.5 : 1 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,131,115,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(229,131,115,0.10)'}
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Rechazo banner */}
      {quote.status === 'rejected' && quote.rejectionReason && (
        <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(229,131,115,0.08)', border: `1px solid rgba(229,131,115,0.2)`, borderRadius: '0 12px 12px 0', display: 'flex', gap: 10 }}>
          <span style={{ color: C.err, fontSize: 16, flexShrink: 0 }}>✕</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.err, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Motivo de rechazo</p>
            <p style={{ fontSize: 13, color: C.arena, margin: 0, lineHeight: 1.5 }}>{quote.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Columna principal ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Cliente */}
          <div style={{ ...card, padding: '20px' }}>
            <SectionHead>Cliente</SectionHead>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px 24px' }}>

              <InfoRow label="Nombre">
                {quote.client ? (
                  <Link to={`/clients/${quote.client.id}`}
                    style={{ color: C.crema, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    onMouseEnter={e => e.currentTarget.style.color = C.arena}
                    onMouseLeave={e => e.currentTarget.style.color = C.crema}
                  >
                    <ClienteIcon style={{ width: 12, height: 12, flexShrink: 0 }} />
                    {quote.client.name}
                  </Link>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {quote.potentialClientName ?? '—'}
                    {isPotential && (
                      <span style={{ display: 'inline-flex', padding: '1px 6px', borderRadius: '0 4px 4px 0', fontSize: 10, fontWeight: 600, background: 'rgba(226,182,99,0.12)', color: C.warn }}>
                        Potencial
                      </span>
                    )}
                  </span>
                )}
              </InfoRow>

              {(quote.client?.company || quote.potentialClientCompany) && (
                <InfoRow label="Empresa">{quote.client?.company ?? quote.potentialClientCompany}</InfoRow>
              )}
              {(quote.client?.email || quote.potentialClientEmail) && (
                <InfoRow label="Email">
                  <span style={{ color: C.arena }}>{quote.client?.email ?? quote.potentialClientEmail}</span>
                </InfoRow>
              )}
              {(quote.client?.phone || quote.potentialClientPhone) && (
                <InfoRow label="Teléfono">
                  <span style={{ color: C.arena }}>{quote.client?.phone ?? quote.potentialClientPhone}</span>
                </InfoRow>
              )}
              {quote.potentialClientAddress && (
                <InfoRow label="Dirección"><span style={{ color: C.arena }}>{quote.potentialClientAddress}</span></InfoRow>
              )}
              {(quote.potentialClientProvince || quote.potentialClientCity) && (
                <InfoRow label="Localidad">
                  <span style={{ color: C.arena }}>
                    {[quote.potentialClientCity, quote.potentialClientProvince].filter(Boolean).join(', ')}
                  </span>
                </InfoRow>
              )}
              {quote.potentialClientCuit && (
                <InfoRow label="CUIT/CUIL"><span style={{ color: C.arena }}>{quote.potentialClientCuit}</span></InfoRow>
              )}

              <InfoRow label="Moneda">
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12 }}>{quote.currency}</span>
              </InfoRow>
              {quote.validUntil && (
                <InfoRow label="Válido hasta">
                  {new Date(quote.validUntil).toLocaleDateString('es-AR')}
                </InfoRow>
              )}
              {quote.deliveryDate && (
                <InfoRow label="Fecha de entrega">
                  {new Date(quote.deliveryDate.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR')}
                </InfoRow>
              )}
              <InfoRow label="Creado">
                {new Date(quote.createdAt).toLocaleDateString('es-AR')}
              </InfoRow>

            </div>
          </div>

          {/* Ítems */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.linea}` }}>
              <SectionHead>Ítems</SectionHead>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                <thead>
                  <tr>
                    {['Descripción', 'Cant.', 'Precio unit.', 'Total'].map((h, i) => (
                      <th key={h} style={{ background: C.linea, color: C.arena, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '10px 14px', textAlign: i > 0 ? 'right' : 'left', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quote.items?.map((item, i) => (
                    <tr key={i}
                      onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = C.s2)}
                      onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = '')}
                    >
                      <td style={{ padding: '11px 14px', color: C.crema, fontSize: 13, borderBottom: `1px solid ${C.linea}` }}>{item.description}</td>
                      <td style={{ padding: '11px 14px', color: C.arena, fontSize: 13, textAlign: 'right', borderBottom: `1px solid ${C.linea}` }}>{item.quantity}</td>
                      <td style={{ padding: '11px 14px', color: C.arena, fontSize: 13, fontFamily: CIFRAS, textAlign: 'right', borderBottom: `1px solid ${C.linea}` }}>{fmt(item.unitPrice, quote.currency)}</td>
                      <td style={{ padding: '11px 14px', color: C.crema, fontSize: 13, fontWeight: 600, fontFamily: CIFRAS, textAlign: 'right', borderBottom: `1px solid ${C.linea}` }}>{fmt(item.amount, quote.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notas */}
          {quote.quoteNotes?.length > 0 && (
            <div style={{ ...card, padding: '20px' }}>
              <SectionHead>Notas</SectionHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {quote.quoteNotes.map(note => (
                  <div key={note.id} style={{ paddingLeft: 12, borderLeft: `2px solid ${C.linea}` }}>
                    {note.title && (
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.crema, margin: '0 0 4px', overflowWrap: 'anywhere' }}>{note.title}</p>
                    )}
                    <p style={{ fontSize: 13, color: C.arena, margin: 0, whiteSpace: 'pre-line', overflowWrap: 'anywhere', lineHeight: 1.5 }}>{note.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Imágenes + Adjuntos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div style={{ ...card, padding: '20px' }}>
              <QuoteImagesPanel quoteId={id} images={quote.images ?? []} canWrite={canWrite} />
            </div>
            <div style={{ ...card, padding: '20px' }}>
              <AttachmentsPanel entityType="quote" entityId={id} />
            </div>
          </div>

        </div>

        {/* ── Sidebar derecha ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Resumen financiero */}
          <div style={{ ...card, padding: '20px' }}>
            <SectionHead>Resumen</SectionHead>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: C.piedra }}>Subtotal</span>
                <span style={{ fontSize: 13, color: C.arena, fontFamily: CIFRAS }}>{fmt(subtotal, quote.currency)}</span>
              </div>
              {discountAmt > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, color: C.piedra }}>
                    Descuento{quote.discountType === 'percent' ? ` (${quote.discountValue}%)` : ''}
                  </span>
                  <span style={{ fontSize: 13, color: C.ok, fontFamily: CIFRAS }}>−{fmt(discountAmt, quote.currency)}</span>
                </div>
              )}
              {quote.taxRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, color: C.piedra }}>IVA ({quote.taxRate}%)</span>
                  <span style={{ fontSize: 13, color: C.arena, fontFamily: CIFRAS }}>{fmt(taxAmount, quote.currency)}</span>
                </div>
              )}
            </div>

            <div style={{ borderTop: `1px solid ${C.linea}`, paddingTop: 14 }}>
              <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.piedra, margin: '0 0 6px' }}>Total</p>
              <p style={{ fontFamily: CIFRAS, fontSize: 32, fontWeight: 700, color: C.crema, margin: 0, lineHeight: 1 }}>
                {fmt(total, quote.currency)}
              </p>
            </div>
          </div>

          {/* Cuotas */}
          <div style={{ ...card, padding: '20px' }}>
            <InstallmentsPanel
              entityType="quote"
              entityId={id}
              entityStatus={quote.status}
              canWrite={canWrite}
              currency={quote.currency}
              total={total}
            />
          </div>

          {/* Proyecto */}
          {(quote.project || quote.potentialProjectTitle) && (
            <div style={{ ...card, padding: '20px' }}>
              <SectionHead>Proyecto</SectionHead>
              {quote.project ? (
                <Link to={`/projects/${quote.project.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: C.crema }}
                  onMouseEnter={e => e.currentTarget.style.color = C.arena}
                  onMouseLeave={e => e.currentTarget.style.color = C.crema}
                >
                  <CarpetaIcon style={{ width: 14, height: 14, flexShrink: 0, color: C.arena }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{quote.project.title}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: C.piedra, flexShrink: 0 }}>Ver →</span>
                </Link>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CarpetaIcon style={{ width: 14, height: 14, flexShrink: 0, color: C.arena }} />
                  <span style={{ fontSize: 13, color: C.arena }}>{quote.potentialProjectTitle}</span>
                </div>
              )}
            </div>
          )}

          {/* Info de envío */}
          {(quote.sentByEmail || quote.sentByWhatsapp) && (
            <div style={{ ...card, padding: '16px 20px' }}>
              <SectionHead>Enviado</SectionHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {quote.sentByEmail && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.arena }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.ok, flexShrink: 0 }} />
                    Por email
                  </div>
                )}
                {quote.sentByWhatsapp && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.arena }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.ok, flexShrink: 0 }} />
                    Por WhatsApp
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modales de edición */}
      {editOpen && (
        isPotential ? (
          <QuoteModalPotential quoteId={id} onClose={() => setEditOpen(false)}
            onSaved={() => { setEditOpen(false); qc.invalidateQueries(['quote', id]); qc.invalidateQueries(['quotes']) }}
          />
        ) : (
          <QuoteModal quoteId={id} onClose={() => setEditOpen(false)}
            onSaved={() => { setEditOpen(false); qc.invalidateQueries(['quote', id]); qc.invalidateQueries(['quotes']) }}
          />
        )
      )}
    </div>
  )
}
