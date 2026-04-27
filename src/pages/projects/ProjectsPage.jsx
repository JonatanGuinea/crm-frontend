import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getProjects, deleteProject } from '../../api/projects'
import ProjectModal from './ProjectModal'
import Pagination from '../../components/Pagination'

const STATUS_LABELS = {
  pending: 'Pendiente', approved: 'Aprobado', in_progress: 'En curso',
  finished: 'Finalizado', cancelled: 'Cancelado'
}
const STATUS_COLORS = {
  pending:     'bg-warning-subtle text-warning',
  approved:    'bg-info-subtle text-info',
  in_progress: 'bg-brand-subtle text-brand',
  finished:    'bg-brand-subtle text-brand',
  cancelled:   'bg-raised text-fg-muted'
}

export default function ProjectsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['projects', statusFilter, page],
    queryFn: () => getProjects({ ...(statusFilter ? { status: statusFilter } : {}), page }).then(r => r.data)
  })

  const del = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => qc.invalidateQueries(['projects'])
  })

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-fg">Proyectos</h2>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-colors">
          + Nuevo proyecto
        </button>
      </div>

      <select
        value={statusFilter}
        onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
        className="mb-4 w-full md:w-auto px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
      >
        <option value="">Todos los estados</option>
        {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>

      {isLoading ? (
        <p className="text-sm text-fg-soft">Cargando...</p>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden bg-surface rounded-xl border border-line divide-y divide-line">
            {data?.data?.map(p => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-fg truncate">{p.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                    {p.client?.name && <p className="text-xs text-fg-muted truncate">{p.client.name}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link to={`/projects/${p.id}`} className="px-2.5 py-1 rounded-md text-xs bg-raised text-fg-soft">Ver</Link>
                  <button onClick={() => { setEditing(p); setModalOpen(true) }} className="px-2.5 py-1 rounded-md text-xs bg-brand-subtle text-brand">Editar</button>
                  <button onClick={() => { if (confirm('¿Eliminar proyecto?')) del.mutate(p.id) }} className="px-2.5 py-1 rounded-md text-xs bg-danger-subtle text-danger">Eliminar</button>
                </div>
              </div>
            ))}
            {!data?.data?.length && (
              <p className="p-6 text-center text-sm text-fg-muted">Sin proyectos</p>
            )}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden md:block bg-surface rounded-xl border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-raised border-b border-line">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Título</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Presupuesto</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data?.data?.map(p => (
                    <tr key={p.id} className="hover:bg-raised">
                      <td className="px-4 py-3 font-medium text-fg">{p.title}</td>
                      <td className="px-4 py-3 text-fg-soft">{p.client?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-fg-soft">
                        {p.budget != null ? `$${Number(p.budget).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Link to={`/projects/${p.id}`} className="text-fg-muted hover:underline text-xs">Ver</Link>
                        <button onClick={() => { setEditing(p); setModalOpen(true) }} className="text-brand hover:underline text-xs">Editar</button>
                        <button onClick={() => { if (confirm('¿Eliminar proyecto?')) del.mutate(p.id) }} className="text-danger hover:underline text-xs">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                  {!data?.data?.length && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-fg-muted">Sin proyectos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Pagination pagination={data?.pagination} onPageChange={setPage} />

      {modalOpen && (
        <ProjectModal
          project={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); qc.invalidateQueries(['projects']) }}
        />
      )}
    </div>
  )
}
