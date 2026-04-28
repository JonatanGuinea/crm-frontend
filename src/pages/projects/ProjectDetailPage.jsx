import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { getProjectById } from '../../api/projects'
import { getQuotes } from '../../api/quotes'
import { getInvoices } from '../../api/invoices'
import ProjectModal from './ProjectModal'
import AttachmentsPanel from '../../components/AttachmentsPanel'

const STATUS_COLORS = {
  pending:     'bg-warning-subtle text-warning',
  approved:    'bg-info-subtle text-info',
  in_progress: 'bg-brand-subtle text-brand',
  finished:    'bg-brand-subtle text-brand',
  cancelled:   'bg-raised text-fg-muted'
}
const STATUS_LABELS = {
  pending: 'Pendiente', approved: 'Aprobado', in_progress: 'En curso',
  finished: 'Finalizado', cancelled: 'Cancelado'
}

const DOC_STATUS_COLORS = {
  draft:     'bg-raised text-fg-soft',
  sent:      'bg-info-subtle text-info',
  approved:  'bg-brand-subtle text-brand',
  rejected:  'bg-danger-subtle text-danger',
  pending:   'bg-warning-subtle text-warning',
  paid:      'bg-brand-subtle text-brand',
  overdue:   'bg-danger-subtle text-danger',
  cancelled: 'bg-raised text-fg-muted'
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canWrite = user?.role !== 'member'
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id).then(r => r.data.data)
  })

  const { data: quotesRes } = useQuery({
    queryKey: ['quotes', { projectId: id }],
    queryFn: () => getQuotes({ projectId: id, limit: 100 }).then(r => r.data),
    enabled: Boolean(id)
  })

  const { data: invoicesRes } = useQuery({
    queryKey: ['invoices', { projectId: id }],
    queryFn: () => getInvoices({ projectId: id, limit: 100 }).then(r => r.data),
    enabled: Boolean(id)
  })

  if (isLoading) return <div className="p-8 text-sm text-fg-soft">Cargando...</div>
  if (!project) return <div className="p-8 text-sm text-fg-soft">Proyecto no encontrado</div>

  const quotes = quotesRes?.data || []
  const invoices = invoicesRes?.data || []

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-fg-muted">
        <button onClick={() => navigate('/projects')} className="hover:text-fg-soft">← Proyectos</button>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-fg">{project.title}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[project.status]}`}>
              {STATUS_LABELS[project.status]}
            </span>
          </div>
          {project.client && (
            <Link to={`/clients/${project.client.id}`} className="text-sm text-brand hover:underline">
              {project.client.name}
            </Link>
          )}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-line p-5">
            <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide mb-4">Información</h3>
            <dl className="space-y-3 text-sm">
              {project.budget != null && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Presupuesto</dt>
                  <dd className="text-fg font-medium">${Number(project.budget).toLocaleString('es-AR')}</dd>
                </div>
              )}
              {project.startDate && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Fecha inicio</dt>
                  <dd className="text-fg">{new Date(project.startDate).toLocaleDateString('es-AR')}</dd>
                </div>
              )}
              {project.endDate && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Fecha fin</dt>
                  <dd className="text-fg">{new Date(project.endDate).toLocaleDateString('es-AR')}</dd>
                </div>
              )}
              {project.description && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Descripción</dt>
                  <dd className="text-fg whitespace-pre-line">{project.description}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-surface rounded-xl border border-line p-5">
            <AttachmentsPanel entityType="project" entityId={id} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Presupuestos */}
          <div className="bg-surface rounded-xl border border-line overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">
                Presupuestos <span className="text-fg-muted font-normal">({quotes.length})</span>
              </h3>
              <Link to="/quotes" className="text-xs text-brand hover:underline">Ver todos</Link>
            </div>
            {quotes.length === 0 ? (
              <p className="px-5 py-4 text-sm text-fg-muted">Sin presupuestos asociados</p>
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
                  {quotes.map(q => (
                    <tr key={q.id} className="hover:bg-raised">
                      <td className="px-5 py-3 font-medium text-fg">{q.number}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DOC_STATUS_COLORS[q.status] || 'bg-raised text-fg-soft'}`}>
                          {q.status}
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

          {/* Facturas */}
          <div className="bg-surface rounded-xl border border-line overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">
                Facturas <span className="text-fg-muted font-normal">({invoices.length})</span>
              </h3>
              <Link to="/invoices" className="text-xs text-brand hover:underline">Ver todos</Link>
            </div>
            {invoices.length === 0 ? (
              <p className="px-5 py-4 text-sm text-fg-muted">Sin facturas asociadas</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-raised">
                  <tr>
                    {['N°', 'Estado', 'Total', 'Vencimiento'].map(h => (
                      <th key={h} className="text-left px-5 py-2 text-xs font-medium text-fg-soft uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-raised">
                      <td className="px-5 py-3 font-medium text-fg">{inv.number}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DOC_STATUS_COLORS[inv.status] || 'bg-raised text-fg-soft'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-fg-soft">
                        {inv.total != null ? `$${Number(inv.total).toLocaleString('es-AR')}` : '-'}
                      </td>
                      <td className="px-5 py-3 text-fg-soft">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('es-AR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {editOpen && (
        <ProjectModal
          project={project}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false)
            qc.invalidateQueries(['project', id])
            qc.invalidateQueries(['projects'])
          }}
        />
      )}
    </div>
  )
}
