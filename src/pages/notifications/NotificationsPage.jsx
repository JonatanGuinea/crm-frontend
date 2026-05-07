import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrashIcon } from '@heroicons/react/24/outline'
import { getNotifications, markAllAsRead, deleteNotification } from '../../api/notifications'

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

  const readAll = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => qc.invalidateQueries(['notifications'])
  })

  const del = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => qc.invalidateQueries(['notifications'])
  })

  // Marcar todas como leídas al entrar a la página
  useEffect(() => {
    readAll.mutate()
  }, [])

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-fg">Notificaciones</h2>
      </div>

      {isLoading ? (
        <p className="text-sm text-fg-soft">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {data?.notifications?.map(n => (
            <div key={n.id} className="flex items-start gap-3 p-4 rounded-xl border bg-surface border-line">
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[n.type]}`}>
                {TYPE_LABELS[n.type]}
              </span>
              <p className="flex-1 text-sm text-fg-soft">{n.message}</p>
              <button onClick={() => del.mutate(n.id)} className="p-1 rounded text-fg-muted hover:text-danger hover:bg-danger-subtle transition-colors shrink-0">
                <TrashIcon className="w-4 h-4" />
              </button>
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
