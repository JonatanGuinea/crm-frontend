import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrashIcon, BellSlashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { getNotifications, markAllAsRead, deleteNotification } from '../../api/notifications'
import { getPendingInvitations, acceptInvitation, declineInvitation } from '../../api/invitations'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const TYPE_LABELS = {
  invoice_overdue:  'Factura vencida',
  invoice_paid:     'Factura pagada',
  quote_expiring:   'Presupuesto por vencer',
  quote_approved:   'Presupuesto aprobado',
  quote_rejected:   'Presupuesto rechazado',
  project_deadline: 'Proyecto por vencer',
  member_joined:    'Nuevo miembro'
}

const TYPE_COLORS = {
  invoice_overdue:  'bg-danger-subtle text-danger',
  invoice_paid:     'bg-brand-subtle text-brand',
  quote_expiring:   'bg-warning-subtle text-warning',
  quote_approved:   'bg-brand-subtle text-brand',
  quote_rejected:   'bg-danger-subtle text-danger',
  project_deadline: 'bg-warning-subtle text-warning',
  member_joined:    'bg-info-subtle text-info'
}

const TYPE_DOT = {
  invoice_overdue:  'bg-danger',
  invoice_paid:     'bg-brand',
  quote_expiring:   'bg-warning',
  quote_approved:   'bg-brand',
  quote_rejected:   'bg-danger',
  project_deadline: 'bg-warning',
  member_joined:    'bg-info'
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

  useEffect(() => { readAll.mutate() }, [])

  const notifications = data?.notifications ?? []
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
          {notifications.map(n => (
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
                <p className="text-sm text-fg leading-snug">{n.message}</p>
              </div>
              <button
                onClick={() => del.mutate(n.id)}
                className="p-1.5 rounded-lg text-fg-muted hover:text-danger hover:bg-danger-subtle transition-colors shrink-0 -mr-1"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
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
