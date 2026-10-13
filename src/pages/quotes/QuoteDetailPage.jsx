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
import { PresupuestoIcon } from '../../components/DuIcons'

// ── tokens ────────────────────────────────────────────────────────────────────

const C = {
  bg:    '#0B0B0C',
  s1:    '#141415',
  s2:    '#1E1E20',
  s3:    '#26262A',
  linea: '#2C2C2F',
  crema: '#F2EDE3',
  arena: '#B9B4AA',
  piedra:'#8C877E',
  ok:    '#7DBE93',
  warn:  '#E2B663',
  err:   '#E58373',
  info:  '#8EB1DE',
}

const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"

const SECTION_TITLE = {
  fontSize: 10.5, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  color: C.arena, margin: 0,
}

const card = {
  background: C.s1,
  border: `1px solid ${C.linea}`,
  borderRadius: '0 16px 16px 0',
}

const QUOTE_STATUS = {
  draft:     { label: 'Borrador',   bg: 'rgba(242,237,227,0.07)', color: C.piedra },
  sent:      { label: 'Enviado',    bg: 'rgba(142,177,222,0.12)', color: C.info },
  approved:  { label: 'Aprobado',  bg: 'rgba(125,190,147,0.12)', color: C.ok },
  signed:    { label: 'Firmado',   bg: 'rgba(125,190,147,0.18)', color: C.ok },
  rejected:  { label: 'Rechazado', bg: 'rgba(229,131,115,0.12)', color: C.err },
  cancelled: { label: 'Cancelado', bg: 'rgba(229,131,115,0.08)', color: C.err },
  expired:   { label: 'Vencido',   bg: 'rgba(242,237,227,0.05)', color: C.piedra },
}

// ── subcomponents ─────────────────────────────────────────────────────────────

function InfoRow({ label, children }) {
  return (
    <div>
      <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.piedra, marginBottom: 3 }}>{label}</p>
      <div style={{ fontSize: 13, color: C.crema }}>{children}</div>
    </div>
  )
}

function GhostBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        height: 32, padding: '0 12px',
        background: 'none', border: `1px solid ${C.linea}`,
        borderRadius: '0 8px 8px 0',
        color: C.piedra, fontSize: 12, fontWeight: 500,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'border-color 0.12s, color 0.12s',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.arena } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.piedra }}
    >
      {children}
    </button>
  )
}

function DownloadSvg() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13 }}>
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

function ShareSvg() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13 }}>
      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
    </svg>
  )
}

function EditSvg() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13 }}>
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

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

  const isSigned = quote.status === 'signed'
  const status   = QUOTE_STATUS[quote.status]

  const subtotal    = Number(quote.subtotal)
  const total       = Number(quote.total)
  const discountAmt = quote.discountType === 'percent'
    ? subtotal * (Number(quote.discountValue) / 100)
    : Number(quote.discountValue) || 0
  const taxAmount = (subtotal - discountAmt) * (Number(quote.taxRate) / 100)

  return (
    <div style={{ padding: '28px 24px 40px', maxWidth: 1080, fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* Back */}
      <button
        onClick={() => navigate('/quotes')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: C.piedra, background: 'none',
          border: 'none', cursor: 'pointer', padding: '0 0 18px',
          fontFamily: 'inherit', transition: 'color 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = C.arena}
        onMouseLeave={e => e.currentTarget.style.color = C.piedra}
      >
        ← Presupuestos
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3" style={{ marginBottom: 28 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <PresupuestoIcon style={{ width: 18, height: 18, color: C.arena, flexShrink: 0 }} />
            <h1 style={{ fontSize: 20, fontWeight: 600, color: C.crema, margin: 0, lineHeight: 1.3 }}>{quote.title}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: C.piedra, fontFamily: CIFRAS }}>#{quote.number}</span>
            {status && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 8px', borderRadius: '0 6px 6px 0',
                fontSize: 10.5, fontWeight: 600,
                background: status.bg, color: status.color,
              }}>
                {status.label}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <GhostBtn onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/presupuesto/${id}`); toast('Enlace copiado', 'success') }}>
            <ShareSvg /> Compartir
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
              style={{
                display: 'flex', alignItems: 'center',
                height: 32, padding: '0 12px',
                background: 'rgba(229,131,115,0.12)', color: C.err,
                border: 'none', borderRadius: '0 8px 8px 0',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background 0.12s',
                opacity: del.isPending ? 0.5 : 1,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,131,115,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(229,131,115,0.12)'}
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Info */}
          <div style={{ ...card, padding: '20px' }}>
            <p style={SECTION_TITLE}>Información</p>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

              <InfoRow label="Cliente">
                {quote.client ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Link
                      to={`/clients/${quote.client.id}`}
                      style={{ color: C.info, textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                    >
                      {quote.client.name}
                    </Link>
                    {quote.client.company && <span style={{ color: C.piedra }}> · {quote.client.company}</span>}
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {quote.potentialClientName ?? '—'}
                    {!quote.client && quote.potentialClientName && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 6px', borderRadius: '0 4px 4px 0', fontSize: 10, fontWeight: 600, background: 'rgba(226,182,99,0.12)', color: C.warn }}>
                        Potencial
                      </span>
                    )}
                  </span>
                )}
              </InfoRow>

              {!quote.client && quote.potentialClientCompany && (
                <InfoRow label="Empresa">{quote.potentialClientCompany}</InfoRow>
              )}
              {!quote.client && quote.potentialClientEmail && (
                <InfoRow label="Email">
                  <span style={{ color: C.info }}>{quote.potentialClientEmail}</span>
                </InfoRow>
              )}

              {(quote.project || (!quote.client && quote.potentialProjectTitle)) && (
                <InfoRow label="Proyecto">
                  {quote.project ? (
                    <Link
                      to={`/projects/${quote.project.id}`}
                      style={{ color: C.info, textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                    >
                      {quote.project.title}
                    </Link>
                  ) : (
                    quote.potentialProjectTitle
                  )}
                </InfoRow>
              )}

              <InfoRow label="Moneda">{quote.currency}</InfoRow>

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
              {isSigned && quote.clientSignedAt && (
                <InfoRow label="Firmado el">
                  {new Date(quote.clientSignedAt).toLocaleDateString('es-AR')}
                </InfoRow>
              )}

              {quote.status === 'rejected' && quote.rejectionReason && (
                <InfoRow label="Motivo de rechazo">
                  <div style={{
                    marginTop: 4, padding: '10px 12px',
                    background: 'rgba(229,131,115,0.08)',
                    border: `1px solid rgba(229,131,115,0.2)`,
                    borderRadius: '0 10px 10px 0',
                    fontSize: 12, color: C.err, lineHeight: 1.5,
                  }}>
                    {quote.rejectionReason}
                  </div>
                </InfoRow>
              )}

              {quote.quoteNotes?.length > 0 && (
                <InfoRow label="Notas">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    {quote.quoteNotes.map(note => (
                      <div key={note.id}>
                        {note.title && (
                          <p style={{ fontSize: 13, fontWeight: 600, color: C.crema, marginBottom: 2, overflowWrap: 'anywhere' }}>
                            {note.title}
                          </p>
                        )}
                        <p style={{ fontSize: 13, color: C.arena, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
                          {note.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </InfoRow>
              )}

            </div>
          </div>

          {/* Installments */}
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

        </div>

        {/* ── Contenido principal ── */}
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Tabla ítems */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.linea}` }}>
              <p style={SECTION_TITLE}>Ítems</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                <thead>
                  <tr>
                    {['Descripción', 'Cant.', 'Precio unit.', 'Total'].map(h => (
                      <th key={h} style={{
                        background: C.linea, color: C.crema,
                        fontSize: 11, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        padding: '8px 14px', textAlign: 'left',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quote.items?.map((item, i) => (
                    <tr
                      key={i}
                      onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = C.s2)}
                      onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = '')}
                    >
                      <td style={{ padding: '10px 14px', color: C.crema, fontSize: 13, borderBottom: `1px solid ${C.linea}` }}>{item.description}</td>
                      <td style={{ padding: '10px 14px', color: C.arena, fontSize: 13, borderBottom: `1px solid ${C.linea}` }}>{item.quantity}</td>
                      <td style={{ padding: '10px 14px', color: C.arena, fontSize: 13, fontFamily: CIFRAS, borderBottom: `1px solid ${C.linea}` }}>{fmt(item.unitPrice, quote.currency)}</td>
                      <td style={{ padding: '10px 14px', color: C.crema, fontSize: 13, fontWeight: 600, fontFamily: CIFRAS, borderBottom: `1px solid ${C.linea}` }}>{fmt(item.amount, quote.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Totales */}
            <div style={{ borderTop: `1px solid ${C.linea}`, padding: '14px 20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
              <span style={{ fontSize: 12, color: C.piedra }}>
                Subtotal: <span style={{ color: C.crema, fontFamily: CIFRAS }}>{fmt(subtotal, quote.currency)}</span>
              </span>
              {discountAmt > 0 && (
                <span style={{ fontSize: 12, color: C.piedra }}>
                  Descuento{quote.discountType === 'percent' ? ` (${quote.discountValue}%)` : ''}: <span style={{ color: C.ok, fontFamily: CIFRAS }}>-{fmt(discountAmt, quote.currency)}</span>
                </span>
              )}
              {quote.taxRate > 0 && (
                <span style={{ fontSize: 12, color: C.piedra }}>
                  IVA ({quote.taxRate}%): <span style={{ color: C.crema, fontFamily: CIFRAS }}>{fmt(taxAmount, quote.currency)}</span>
                </span>
              )}
              <span style={{ fontSize: 20, fontWeight: 700, color: C.crema, fontFamily: CIFRAS, marginTop: 4 }}>
                Total {quote.currency}: {fmt(total, quote.currency)}
              </span>
            </div>
          </div>

          {/* Imágenes + Adjuntos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div style={{ ...card, padding: '20px' }}>
              <QuoteImagesPanel
                quoteId={id}
                images={quote.images ?? []}
                canWrite={canWrite}
              />
            </div>
            <div style={{ ...card, padding: '20px' }}>
              <AttachmentsPanel entityType="quote" entityId={id} />
            </div>
          </div>

        </div>
      </div>

      {/* Modales de edición */}
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
