import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrashIcon, BellSlashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { getNotifications, markAllAsRead, deleteNotification } from '../../api/notifications'
import { getPendingInvitations, acceptInvitation, declineInvitation } from '../../api/invitations'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

const TYPE_LABELS = {
  quote_expiring:   'Presupuesto por vencer',
  quote_approved:   'Presupuesto aprobado',
  quote_rejected:   'Presupuesto rechazado',
  project_deadline: 'Proyecto por vencer',
  member_joined:    'Nuevo miembro'
}

const TYPE_COLORS = {
  quote_expiring:   'bg-warning-subtle text-warning',
  quote_approved:   'bg-brand-subtle text-brand',
  quote_rejected:   'bg-danger-subtle text-danger',
  project_deadline: 'bg-warning-subtle text-warning',
  member_joined:    'bg-info-subtle text-info'
}

const TYPE_DOT = {
  quote_expiring:   'bg-warning',
  quote_approved:   'bg-brand',
  quote_rejected:   'bg-danger',
  project_deadline: 'bg-warning',
  member_joined:    'bg-info'
}

function WaIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
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
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-fg-muted">
          <BellSlashIcon className="w-10 h-10 opacity-30" />
          <p className="text-sm">Sin notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Invitaciones pendientes */}
          {invitations.map(inv => (
            <div
              key={inv.membershipId}
              className="flex items-start gap-3 p-4 rounded-xl bg-surface/60 backdrop-blur-xl border border-line border-l-2 border-l-info transition-colors"
            >
              <BuildingOfficeIcon className="mt-0.5 w-4 h-4 text-info shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-info-subtle text-info">
                    Invitación
                  </span>
                </div>
                <p className="text-sm text-fg leading-snug mb-3">
                  <span className="font-semibold">{inv.organization.name}</span>
                  {' '}te invitó a unirte como{' '}
                  <span className="font-medium">{inv.role === 'member' ? 'Miembro' : 'Admin'}</span>.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => accept.mutate(inv.membershipId)}
                    disabled={accept.isPending || decline.isPending}
                    className="px-3 py-1.5 text-xs rounded-md bg-brand text-white hover:bg-brand-hover disabled:opacity-50 transition-colors"
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
            const meta = n.metadata ? (() => { try { return JSON.parse(n.metadata) } catch { return null } })() : null
            const isRejection = n.type === 'quote_rejected'

            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-xl bg-surface/60 backdrop-blur-xl border border-line transition-colors ${!n.read ? 'border-l-2 border-l-brand' : ''}`}
              >
                <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[n.type] ?? 'bg-fg-muted'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[n.type] ?? 'bg-raised text-fg-soft'}`}>
                      {TYPE_LABELS[n.type] ?? n.type}
                    </span>
                    <span className="text-xs text-fg-muted shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-fg leading-snug mb-2">{n.message}</p>

                  {isRejection && meta?.reason && (
                    <div className="px-3 py-2 mb-3 rounded-lg bg-danger-subtle border border-danger/20 text-xs text-danger leading-snug">
                      <span className="font-semibold">Motivo: </span>{meta.reason}
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
                          <WaIcon className="w-3.5 h-3.5" />
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
                  className="p-1.5 rounded-lg text-fg-muted hover:text-danger hover:bg-danger-subtle transition-colors shrink-0 -mr-1"
                >
                  <TrashIcon className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-semibold text-fg mb-2">¿Rechazar invitación?</h3>
            <p className="text-sm text-fg-soft mb-6">
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
                className="px-4 py-2 text-sm rounded-md bg-danger text-white hover:opacity-90 disabled:opacity-50 transition-colors"
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
