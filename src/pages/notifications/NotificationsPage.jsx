import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markAllAsRead, deleteNotification } from '../../api/notifications'
import { getPendingInvitations, acceptInvitation, declineInvitation } from '../../api/invitations'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

function TrashSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
}
function BellSlashSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0" /><path d="M18.63 13A17.89 17.89 0 0 1 18 8" /><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" /><path d="M18 8a6 6 0 0 0-9.33-5" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
}
function BuildingSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
}

const TYPE_LABELS = {
  quote_expiring:   'Presupuesto por vencer',
  quote_approved:   'Presupuesto aprobado',
  quote_rejected:   'Presupuesto rechazado',
  project_deadline: 'Proyecto por vencer',
  member_joined:    'Nuevo miembro',
  task_assigned:    'Tarea asignada',
  stock_out:        'Sin stock',
  stock_low:        'Stock bajo',
  announcement:     'Novedad',
}

const TYPE_STYLES = {
  quote_expiring:   { bg: 'rgba(226,182,99,0.12)',  color: C.warn,  dot: C.warn },
  quote_approved:   { bg: 'rgba(242,237,227,0.08)', color: C.crema, dot: C.crema },
  quote_rejected:   { bg: 'rgba(229,131,115,0.12)', color: C.err,   dot: C.err },
  project_deadline: { bg: 'rgba(226,182,99,0.12)',  color: C.warn,  dot: C.warn },
  member_joined:    { bg: 'rgba(142,177,222,0.12)', color: C.info,  dot: C.info },
  task_assigned:    { bg: 'rgba(142,177,222,0.12)', color: C.info,  dot: C.info },
  stock_out:        { bg: 'rgba(229,131,115,0.12)', color: C.err,   dot: C.err },
  stock_low:        { bg: 'rgba(226,182,99,0.12)',  color: C.warn,  dot: C.warn },
  announcement:     { bg: 'rgba(242,237,227,0.08)', color: C.crema, dot: C.crema },
}

function WaIcon({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
    </svg>
  )
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`
  return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const qc = useQueryClient()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [decliningId, setDecliningId] = useState(null)
  const [visible, setVisible] = useState(10)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications().then(r => r.data.data)
  })

  const { data: invitations = [] } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => getPendingInvitations().then(r => r.data.data)
  })

  const accept = useMutation({
    mutationFn: acceptInvitation,
    onSuccess: (res) => {
      login(res.data.data.token)
      qc.clear()
      navigate('/')
    }
  })

  const decline = useMutation({
    mutationFn: declineInvitation,
    onSuccess: () => {
      setDecliningId(null)
      qc.invalidateQueries(['invitations'])
    }
  })

  const readAll = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      qc.setQueryData(['notifications'], (old) => {
        if (!old) return old
        const notifications = old.notifications.map(n => ({ ...n, read: true }))
        return { ...old, notifications, unreadCount: 0 }
      })
    }
  })

  const del = useMutation({
    mutationFn: deleteNotification,
    onSuccess: (_, deletedId) => {
      qc.setQueryData(['notifications'], (old) => {
        if (!old) return old
        const notifications = old.notifications.filter(n => n.id !== deletedId)
        const unreadCount = notifications.filter(n => !n.read).length
        return { ...old, notifications, unreadCount }
      })
    }
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { readAll.mutate() }, [])

  const notifications = data?.notifications ?? []
  const shownNotifications = notifications.slice(0, visible)
  const isEmpty = notifications.length === 0 && invitations.length === 0

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-fg">Notificaciones</h2>
        {!isEmpty && (
          <span className="text-xs text-fg-muted">{notifications.length + invitations.length} en total</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin" style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${C.crema}`, borderTopColor: 'transparent' }} />
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-fg-muted">
          <BellSlashSvg style={{ width: 40, height: 40, color: C.piedra, opacity: 0.3 }} />
          <p className="text-sm">Sin notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Invitaciones pendientes */}
          {invitations.map(inv => (
            <div
              key={inv.membershipId}
              className="flex items-start gap-3 p-4 rounded-xl bg-surface/60 backdrop-blur-xl border border-line transition-colors"
              style={{ borderLeft: `2px solid ${C.info}` }}
            >
              <BuildingSvg style={{ marginTop: 2, width: 16, height: 16, color: C.info, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: 'rgba(142,177,222,0.12)', color: C.info }}>
                    Invitación
                  </span>
                </div>
                <p className="text-sm text-fg leading-snug mb-3">
                  <span className="font-semibold">{inv.organization.name}</span>
                  {' '}te invitó a unirte como{' '}
                  <span className="font-medium">{inv.role === 'member' ? 'Miembro' : inv.role === 'owner' ? 'Dueño' : 'Administrador'}</span>.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => accept.mutate(inv.membershipId)}
                    disabled={accept.isPending || decline.isPending}
                    style={{ padding: '6px 12px', fontSize: 12, borderRadius: '0 8px 8px 0', border: 'none', background: C.crema, color: C.bg, fontWeight: 500, cursor: accept.isPending || decline.isPending ? 'not-allowed' : 'pointer', opacity: accept.isPending || decline.isPending ? 0.5 : 1 }}
                  >
                    {accept.isPending ? 'Aceptando...' : 'Aceptar'}
                  </button>
                  <button
                    onClick={() => setDecliningId(inv.membershipId)}
                    disabled={accept.isPending || decline.isPending}
                    className="px-3 py-1.5 text-xs rounded-md border border-line text-fg-soft hover:bg-raised disabled:opacity-50 transition-colors"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Notificaciones regulares */}
          {shownNotifications.map(n => {
            const typeStyle = TYPE_STYLES[n.type]
            const meta = n.metadata ? (() => { try { return JSON.parse(n.metadata) } catch { return null } })() : null
            const isRejection = n.type === 'quote_rejected'

            return (
              <div
                key={n.id}
                className="flex items-start gap-3 p-4 rounded-xl bg-surface/60 backdrop-blur-xl border border-line transition-colors"
                style={!n.read ? { borderLeft: `2px solid ${C.crema}` } : undefined}
              >
                <span style={{ marginTop: 2, width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: typeStyle?.dot ?? C.piedra }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: typeStyle?.bg ?? C.s2, color: typeStyle?.color ?? C.arena }}>
                      {TYPE_LABELS[n.type] ?? n.type}
                    </span>
                    <span className="text-xs text-fg-muted shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-fg leading-snug mb-2">{n.message}</p>

                  {isRejection && meta?.reason && (
                    <div style={{ padding: '8px 12px', marginBottom: 12, borderRadius: '0 8px 8px 0', background: 'rgba(229,131,115,0.08)', border: `1px solid rgba(229,131,115,0.2)`, fontSize: 12, color: C.err, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600 }}>Motivo: </span>{meta.reason}
                    </div>
                  )}

                  {(isRejection || n.type === 'quote_approved') && meta && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {meta.phone && (
                        <a
                          href={`https://wa.me/${meta.phone}?text=${encodeURIComponent(
                            isRejection
                              ? `Hola ${meta.clientName}, recibimos tu respuesta sobre el presupuesto #${meta.quoteNumber} — ${meta.quoteTitle}. ¿Podemos hablar para ver cómo seguimos?`
                              : `Hola ${meta.clientName}, ¡gracias por confirmar el presupuesto #${meta.quoteNumber} — ${meta.quoteTitle}! Nos ponemos en contacto para coordinar los próximos pasos.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20"
                        >
                          <WaIcon style={{ width: 14, height: 14 }} />
                          Contactar por WhatsApp
                        </a>
                      )}
                      <Link
                        to={`/quotes/${n.refId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-fg-soft hover:text-fg hover:bg-raised transition-colors border border-line"
                      >
                        Ver presupuesto →
                      </Link>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => del.mutate(n.id)}
                  style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, flexShrink: 0, marginRight: -4 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,131,115,0.12)'; e.currentTarget.style.color = C.err }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.piedra }}
                >
                  <TrashSvg style={{ width: 16, height: 16 }} />
                </button>
              </div>
            )
          })}

          {visible < notifications.length && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setVisible(v => v + 10)}
                className="px-4 py-2 text-sm rounded-lg border border-line-soft text-fg-muted hover:bg-raised transition-colors"
              >
                Mostrar más ({notifications.length - visible} restantes)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal confirmar rechazo */}
      {decliningId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 16 }}>
          <div style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', padding: 24, maxWidth: 384, width: '100%' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.crema, margin: '0 0 8px' }}>¿Rechazar invitación?</h3>
            <p style={{ fontSize: 13, color: C.arena, marginBottom: 24 }}>
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDecliningId(null)}
                disabled={decline.isPending}
                className="px-4 py-2 text-sm rounded-md border border-line text-fg-soft hover:bg-raised disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => decline.mutate(decliningId)}
                disabled={decline.isPending}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: C.bg, background: C.err, border: 'none', borderRadius: '0 10px 10px 0', cursor: decline.isPending ? 'not-allowed' : 'pointer', opacity: decline.isPending ? 0.5 : 1 }}
              >
                {decline.isPending ? 'Rechazando...' : 'Sí, rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
