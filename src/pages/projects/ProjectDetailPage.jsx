import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getProjectById } from '../../api/projects'
import { getQuotes } from '../../api/quotes'
import { getInvoices } from '../../api/invoices'
import ProjectModal from './ProjectModal'
import AttachmentsPanel from '../../components/AttachmentsPanel'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  finished: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500'
}
const STATUS_LABELS = {
  pending: 'Pendiente', approved: 'Aprobado', in_progress: 'En curso',
  finished: 'Finalizado', cancelled: 'Cancelado'
}

const DOC_STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500'
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
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

  if (isLoading) return <div className="p-8 text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
  if (!project) return <div className="p-8 text-sm text-gray-500 dark:text-gray-400">Proyecto no encontrado</div>

  const quotes = quotesRes?.data || []
  const invoices = invoicesRes?.data || []

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-400 dark:text-gray-500">
        <button onClick={() => navigate('/projects')} className="hover:text-gray-700 dark:hover:text-gray-300">← Proyectos</button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.title}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[project.status]}`}>
              {STATUS_LABELS[project.status]}
            </span>
          </div>
          {project.client && (
            <Link to={`/clients/${project.client.id}`} className="text-sm text-indigo-600 hover:underline">
              {project.client.name}
            </Link>
          )}
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Editar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Información</h3>
            <dl className="space-y-3 text-sm">
              {project.budget != null && (
                <div>
                  <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase mb-0.5">Presupuesto</dt>
                  <dd className="text-gray-800 dark:text-gray-100 font-medium">${Number(project.budget).toLocaleString('es-AR')}</dd>
                </div>
              )}
              {project.startDate && (
                <div>
                  <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase mb-0.5">Fecha inicio</dt>
                  <dd className="text-gray-800 dark:text-gray-100">{new Date(project.startDate).toLocaleDateString('es-AR')}</dd>
                </div>
              )}
              {project.endDate && (
                <div>
                  <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase mb-0.5">Fecha fin</dt>
                  <dd className="text-gray-800 dark:text-gray-100">{new Date(project.endDate).toLocaleDateString('es-AR')}</dd>
                </div>
              )}
              {project.description && (
                <div>
                  <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase mb-0.5">Descripción</dt>
                  <dd className="text-gray-800 dark:text-gray-100 whitespace-pre-line">{project.description}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Adjuntos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <AttachmentsPanel entityType="project" entityId={id} />
          </div>
        </div>

        {/* Columna derecha */}
        <div className="lg:col-span-2 space-y-6">
          {/* Presupuestos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Presupuestos <span className="text-gray-400 dark:text-gray-500 font-normal">({quotes.length})</span>
              </h3>
              <Link to="/quotes" className="text-xs text-indigo-600 hover:underline">Ver todos</Link>
            </div>
            {quotes.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400 dark:text-gray-500">Sin presupuestos asociados</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {['N°', 'Estado', 'Total'].map(h => (
                      <th key={h} className="text-left px-5 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {quotes.map(q => (
                    <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{q.number}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DOC_STATUS_COLORS[q.status] || 'bg-gray-100 text-gray-600'}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {q.total != null ? `$${Number(q.total).toLocaleString('es-AR')}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Facturas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Facturas <span className="text-gray-400 dark:text-gray-500 font-normal">({invoices.length})</span>
              </h3>
              <Link to="/invoices" className="text-xs text-indigo-600 hover:underline">Ver todos</Link>
            </div>
            {invoices.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400 dark:text-gray-500">Sin facturas asociadas</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {['N°', 'Estado', 'Total', 'Vencimiento'].map(h => (
                      <th key={h} className="text-left px-5 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{inv.number}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DOC_STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {inv.total != null ? `$${Number(inv.total).toLocaleString('es-AR')}` : '-'}
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
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
