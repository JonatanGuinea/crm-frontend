import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../api/notifications'

const TYPE_LABELS = {
  invoice_overdue: 'Factura vencida',
  invoice_paid: 'Factura pagada',
  quote_expiring: 'Presupuesto por vencer',
  quote_approved: 'Presupuesto aprobado',
  quote_rejected: 'Presupuesto rechazado',
  project_deadline: 'Proyecto por vencer',
  member_joined: 'Nuevo miembro'
}

const TYPE_COLORS = {
  invoice_overdue: 'bg-red-100 text-red-700',
  invoice_paid: 'bg-green-100 text-green-700',
  quote_expiring: 'bg-yellow-100 text-yellow-700',
  quote_approved: 'bg-green-100 text-green-700',
  quote_rejected: 'bg-red-100 text-red-700',
  project_deadline: 'bg-orange-100 text-orange-700',
  member_joined: 'bg-blue-100 text-blue-700'
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Notificaciones</h2>
          {data?.unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{data.unreadCount} sin leer</p>
          )}
        </div>
        {data?.unreadCount > 0 && (
          <button onClick={() => readAll.mutate()} className="text-sm text-indigo-600 hover:underline">
            Marcar todas como leídas
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {data?.notifications?.map(n => (
            <div key={n.id} className={`flex items-start gap-3 p-4 rounded-xl border ${n.read ? 'bg-white border-gray-200' : 'bg-indigo-50 border-indigo-200'}`}>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[n.type]}`}>
                {TYPE_LABELS[n.type]}
              </span>
              <p className="flex-1 text-sm text-gray-700">{n.message}</p>
              <div className="flex items-center gap-2 shrink-0">
                {!n.read && (
                  <button onClick={() => readOne.mutate(n.id)} className="text-xs text-indigo-600 hover:underline">
                    Leído
                  </button>
                )}
                <button onClick={() => del.mutate(n.id)} className="text-xs text-gray-400 hover:text-red-500">
                  ×
                </button>
              </div>
            </div>
          ))}
          {!data?.notifications?.length && (
            <p className="text-sm text-gray-400 text-center py-8">Sin notificaciones</p>
          )}
        </div>
      )}
    </div>
  )
}
