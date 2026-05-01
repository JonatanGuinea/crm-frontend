import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getProjects, deleteProject, updateProject } from '../../api/projects'
import ProjectModal from './ProjectModal'
import Pagination from '../../components/Pagination'
import { useAuth } from '../../context/AuthContext'
import { ChevronDownIcon, UserIcon, CalendarDaysIcon, BanknotesIcon } from '@heroicons/react/24/outline'

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
const STATUS_DOT = {
  pending:     'bg-warning',
  approved:    'bg-info',
  in_progress: 'bg-brand',
  finished:    'bg-brand',
  cancelled:   'bg-fg-muted',
}
const ALLOWED_TRANSITIONS = {
  pending:     ['approved', 'cancelled'],
  approved:    ['in_progress', 'cancelled'],
  in_progress: ['finished'],
  finished:    [],
  cancelled:   [],
}

function StatusDropdown({ project, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const allowed = ALLOWED_TRANSITIONS[project.status] || []

  if (!allowed.length) {
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[project.status]}`}>
        {STATUS_LABELS[project.status]}
      </span>
    )
  }

  function handleToggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(o => !o)
  }

  return (
    <div className="inline-block">
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-80 ${STATUS_COLORS[project.status]}`}
      >
        {STATUS_LABELS[project.status]}
        <ChevronDownIcon className="w-3 h-3 shrink-0" />
      </button>
      {open && (
        <div
          style={{ top: dropPos.top, left: dropPos.left }}
          className="fixed z-50 bg-surface border border-line-soft rounded-lg shadow-lg py-1 min-w-[150px]"
        >
          {allowed.map(s => (
            <button
              key={s}
              onClick={() => { onUpdate(s); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-raised text-fg flex items-center gap-2 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[s]}`} />
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const canWrite = user?.role !== 'member'
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

  const changeStatus = useMutation({
    mutationFn: ({ id, status }) => updateProject(id, { status }),
    onSuccess: () => qc.invalidateQueries(['projects']),
    onError: (err) => alert(err.response?.data?.error || 'Error al cambiar estado')
  })

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-fg">Proyectos</h2>
        {canWrite && (
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-colors">
            + Nuevo proyecto
          </button>
        )}
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
          <div className="md:hidden grid grid-cols-1 gap-3">
            {data?.data?.map(p => (
              <div key={p.id} className="bg-surface rounded-xl border border-line p-4">
                {/* Header: estado */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  {canWrite
                    ? <StatusDropdown project={p} onUpdate={(status) => changeStatus.mutate({ id: p.id, status })} />
                    : <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                  }
                </div>
                {/* Título */}
                <Link to={`/projects/${p.id}`} className="block font-semibold text-fg hover:text-brand leading-snug mb-3">
                  {p.title}
                </Link>
                {/* Meta */}
                <div className="space-y-1.5 mb-4">
                  {p.client?.name && (
                    <p className="text-xs text-fg-soft flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5 shrink-0 text-fg-muted" />
                      {p.client.name}
                    </p>
                  )}
                  {p.budget != null && (
                    <p className="text-xs text-fg-soft flex items-center gap-2">
                      <BanknotesIcon className="w-3.5 h-3.5 shrink-0 text-fg-muted" />
                      ${Number(p.budget).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                  {p.endDate && (
                    <p className="text-xs text-fg-soft flex items-center gap-2">
                      <CalendarDaysIcon className="w-3.5 h-3.5 shrink-0 text-fg-muted" />
                      Vence: {new Date(p.endDate).toLocaleDateString('es-AR')}
                    </p>
                  )}
                </div>
                {/* Acciones */}
                <div className="flex items-center gap-2 pt-3 border-t border-line">
                  <Link to={`/projects/${p.id}`} className="flex-1 text-center py-1.5 rounded-lg text-xs font-medium bg-raised text-fg-soft hover:bg-overlay transition-colors">Ver</Link>
                  {canWrite && <button onClick={() => { setEditing(p); setModalOpen(true) }} className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-brand-subtle text-brand hover:opacity-80 transition-opacity">Editar</button>}
                  {canWrite && <button onClick={() => { if (confirm('¿Eliminar proyecto?')) del.mutate(p.id) }} className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-danger-subtle text-danger hover:opacity-80 transition-opacity">Eliminar</button>}
                </div>
              </div>
            ))}
            {!data?.data?.length && (
              <p className="py-10 text-center text-sm text-fg-muted">Sin proyectos</p>
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
                        {canWrite
                          ? <StatusDropdown project={p} onUpdate={(status) => changeStatus.mutate({ id: p.id, status })} />
                          : <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-fg-soft">
                        {p.budget != null ? `$${Number(p.budget).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Link to={`/projects/${p.id}`} className="text-fg-muted hover:underline text-xs">Ver</Link>
                        {canWrite && <button onClick={() => { setEditing(p); setModalOpen(true) }} className="text-brand hover:underline text-xs">Editar</button>}
                        {canWrite && <button onClick={() => { if (confirm('¿Eliminar proyecto?')) del.mutate(p.id) }} className="text-danger hover:underline text-xs">Eliminar</button>}
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
