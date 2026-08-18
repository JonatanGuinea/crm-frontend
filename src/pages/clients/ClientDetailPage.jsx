import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { getClientById, getClientHistory } from '../../api/clients'
import { getProjects } from '../../api/projects'
import { getQuotes } from '../../api/quotes'
import ClientModal from './ClientModal'
import AttachmentsPanel from '../../components/AttachmentsPanel'
import { ClockIcon, TableCellsIcon } from '@heroicons/react/24/outline'

const STATUS_COLORS_PROJECT = {
  pending:     'bg-warning-subtle text-warning',
  approved:    'bg-info-subtle text-info',
  in_progress: 'bg-brand-subtle text-brand',
  finished:    'bg-brand-subtle text-brand',
  cancelled:   'bg-raised text-fg-muted'
}
const STATUS_LABELS_PROJECT = {
  pending: 'Pendiente', approved: 'Aprobado', in_progress: 'En curso',
  finished: 'Finalizado', cancelled: 'Cancelado'
}

const STATUS_COLORS_DOC = {
  draft:     'bg-raised text-fg-soft',
  sent:      'bg-info-subtle text-info',
  approved:  'bg-brand-subtle text-brand',
  rejected:  'bg-danger-subtle text-danger',
  pending:   'bg-warning-subtle text-warning',
  paid:      'bg-brand-subtle text-brand',
  overdue:   'bg-danger-subtle text-danger',
  cancelled: 'bg-raised text-fg-muted',
  partial:   'bg-warning-subtle text-warning',
}
const STATUS_LABELS_DOC = {
  draft:     'Borrador',
  sent:      'Enviado',
  approved:  'Aprobado',
  rejected:  'Rechazado',
  pending:   'Pendiente',
  paid:      'Pagado',
  overdue:   'Vencido',
  cancelled: 'Cancelado',
  partial:   'Cuotas pendientes',
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canWrite = user?.role !== 'member'
  const qc = useQueryClient()
  const [tab, setTab]             = useState('table')
  const [editOpen, setEditOpen]   = useState(false)
  const [historyVisible, setHistoryVisible] = useState(25)

  const { data: clientRes, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => getClientById(id).then(r => r.data.data)
  })

  const { data: projectsRes } = useQuery({
    queryKey: ['projects', { clientId: id }],
    queryFn: () => getProjects({ clientId: id, limit: 100 }).then(r => r.data)
  })

  const { data: quotesRes } = useQuery({
    queryKey: ['quotes', { clientId: id }],
    queryFn: () => getQuotes({ clientId: id, limit: 100 }).then(r => r.data)
  })

  const { data: historyData = [] } = useQuery({
    queryKey: ['client-history', id],
    queryFn: () => getClientHistory(id).then(r => r.data.data),
  })


  if (isLoading) return <div className="p-8 text-sm text-fg-soft">Cargando...</div>
  if (!clientRes) return <div className="p-8 text-sm text-fg-soft">Cliente no encontrado</div>

  const client = clientRes
  const projects = projectsRes?.data || []
  const quotes = quotesRes?.data || []

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/clients')} className="text-sm text-fg-muted hover:text-fg-soft">
          ← Clientes
        </button>
      </div>

      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-fg">{client.name}</h1>
          {client.company && <p className="text-fg-soft mt-0.5">{client.company}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-raised rounded-lg border border-line">
            <button
              onClick={() => setTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'table' ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
              }`}
            >
              <TableCellsIcon className="w-4 h-4" />
              Tabla
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'history' ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
              }`}
            >
              <ClockIcon className="w-4 h-4" />
              Historial
            </button>
          </div>
          {canWrite && (
            <button
              onClick={() => setEditOpen(true)}
              className="px-4 py-2 border border-line-soft rounded-md text-sm font-medium text-fg-soft hover:bg-raised transition-colors"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      {tab === 'table' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line p-5">
            <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide mb-4">Información</h3>
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Email', value: client.email },
                { label: 'Teléfono', value: client.phone },
                { label: 'Empresa', value: client.company },
                { label: 'CUIL / CUIT', value: client.cuit },
                { label: 'Dirección', value: client.address },
              ].map(({ label, value }) => value && (
                <div key={label}>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">{label}</dt>
                  <dd className="text-fg">{value}</dd>
                </div>
              ))}
              {client.notes && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Notas</dt>
                  <dd className="text-fg whitespace-pre-line">{client.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line p-5">
            <AttachmentsPanel entityType="client" entityId={id} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Proyectos */}
          <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">
                Proyectos <span className="text-fg-muted font-normal">({projects.length})</span>
              </h3>
              <Link to={`/projects?clientId=${id}`} className="text-xs text-brand hover:underline">Ver todos</Link>
            </div>
            {projects.length === 0 ? (
              <p className="px-5 py-4 text-sm text-fg-muted">Sin proyectos</p>
            ) : (
              <ul className="divide-y divide-line">
                {projects.slice(0, 5).map(p => (
                  <li key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-raised">
                    <div>
                      <Link to={`/projects/${p.id}`} className="text-sm font-medium text-fg hover:text-brand">
                        {p.title}
                      </Link>
                      {p.budget != null && (
                        <p className="text-xs text-fg-muted">${Number(p.budget).toLocaleString('es-AR')}</p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS_PROJECT[p.status]}`}>
                      {STATUS_LABELS_PROJECT[p.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Presupuestos */}
          <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">
                Presupuestos <span className="text-fg-muted font-normal">({quotes.length})</span>
              </h3>
              <Link to="/quotes" className="text-xs text-brand hover:underline">Ver todos</Link>
            </div>
            {quotes.length === 0 ? (
              <p className="px-5 py-4 text-sm text-fg-muted">Sin presupuestos</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-raised">
                  <tr>
                    {['N°', 'Estado', 'Total'].map(h => (
                      <th key={h} className="text-left px-5 py-2 text-xs font-medium text-fg-soft uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {quotes.slice(0, 5).map(q => (
                    <tr key={q.id} className="hover:bg-raised">
                      <td className="px-5 py-3 font-medium text-fg">{q.number}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS_DOC[q.status] || 'bg-raised text-fg-soft'}`}>
                          {STATUS_LABELS_DOC[q.status] || q.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-fg-soft">
                        {q.total != null ? `$${Number(q.total).toLocaleString('es-AR')}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>}

      {/* Historial */}
      {tab === 'history' && <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-line">
          <ClockIcon className="w-4 h-4 text-fg-muted" />
          <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">Historial</h3>
          <span className="text-xs text-fg-muted">({historyData.length})</span>
        </div>
        {historyData.length === 0 ? (
          <p className="px-5 py-4 text-sm text-fg-muted">Sin movimientos registrados.</p>
        ) : (
          <div className="p-5 flex flex-col gap-1">
            {historyData.slice(0, historyVisible).map((entry, i) => {
              const initials = entry.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
              const date = new Date(entry.createdAt)
              const dateStr = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
              const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
              const shown = historyData.slice(0, historyVisible)
              return (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-brand-subtle text-brand text-[10px] font-bold flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    {i < shown.length - 1 && <div className="w-px flex-1 bg-line mt-1 mb-1 min-h-[12px]" />}
                  </div>
                  <div className="pb-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-1.5">
                      <span className="text-sm font-semibold text-fg">{entry.user.name}</span>
                      <span className="text-sm text-fg-muted">
                        {entry.action === 'created' ? 'creó el cliente' : 'actualizó'}
                        {entry.detail && <span className="text-fg-soft"> · {entry.detail}</span>}
                      </span>
                    </div>
                    <p className="text-[11px] text-fg-muted/70 mt-0.5">{dateStr} · {timeStr}</p>
                  </div>
                </div>
              )
            })}
            {historyData.length > historyVisible && (
              <button
                onClick={() => setHistoryVisible(v => v + 25)}
                className="mt-1 text-xs text-fg-muted hover:text-fg text-center py-2 border border-dashed border-line rounded-xl transition-colors"
              >
                Mostrar más ({historyData.length - historyVisible} restante{historyData.length - historyVisible !== 1 ? 's' : ''})
              </button>
            )}
          </div>
        )}
      </div>}

      {editOpen && (
        <ClientModal
          client={client}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false)
            qc.invalidateQueries(['client', id])
            qc.invalidateQueries(['clients'])
          }}
        />
      )}
    </div>
  )
}
