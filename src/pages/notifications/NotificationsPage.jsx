import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../api/notifications'

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

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications().then(r => r.data.data)
  })

  const readOne = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => qc.invalidateQueries(['notifications'])
  })

  const readAll = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => qc.invalidateQueries(['notifications'])
  })

  const del = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => qc.invalidateQueries(['notifications'])
  })

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-fg">Notificaciones</h2>
          {data?.unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand text-white">
              {data.unreadCount}
            </span>
          )}
        </div>
        {data?.unreadCount > 0 && (
          <button onClick={() => readAll.mutate()} className="text-sm text-brand hover:underline">
            Marcar todas como leídas
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-fg-soft">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {data?.notifications?.map(n => (
            <div key={n.id} className={`flex items-start gap-3 p-4 rounded-xl border ${n.read ? 'bg-surface border-line' : 'bg-brand-subtle border-brand'}`}>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[n.type]}`}>
                {TYPE_LABELS[n.type]}
              </span>
              <p className="flex-1 text-sm text-fg-soft">{n.message}</p>
              <div className="flex items-center gap-2 shrink-0">
                {!n.read && (
                  <button onClick={() => readOne.mutate(n.id)} className="text-xs text-brand hover:underline">
                    Leído
                  </button>
                )}
                <button onClick={() => del.mutate(n.id)} className="text-xs text-fg-muted hover:text-danger">
                  ×
                </button>
              </div>
            </div>
          ))}
          {!data?.notifications?.length && (
            <p className="text-sm text-fg-muted text-center py-8">Sin notificaciones</p>
          )}
        </div>
      )}
    </div>
  )
}
