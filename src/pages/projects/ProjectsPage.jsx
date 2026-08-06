import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getProjects, updateProject, getAllProjectsHistory } from '../../api/projects'
import { getTasks, updateTask } from '../../api/tasks'
import ProjectModal from './ProjectModal'
import QuoteModal from '../quotes/QuoteModal'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { ChevronDownIcon, UserIcon, CalendarDaysIcon, BanknotesIcon, EyeIcon, PaperClipIcon, XMarkIcon, ClockIcon, TableCellsIcon } from '@heroicons/react/24/outline'
import AttachmentsPanel from '../../components/AttachmentsPanel'

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
  cancelled:   'bg-danger',
}
const ALLOWED_TRANSITIONS = {
  pending:     ['approved', 'cancelled'],
  approved:    ['in_progress', 'cancelled'],
  in_progress: ['finished', 'cancelled'],
  finished:    [],
  cancelled:   [],
}

function TaskProgress({ total, done }) {
  if (!total) return <span className="text-xs text-fg-muted">—</span>
  const pct = Math.round((done / total) * 100)
  const allDone = done === total
  return (
    <div className="flex flex-col gap-1 min-w-[80px]">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-medium ${allDone ? 'text-success' : 'text-fg-soft'}`}>
          {done}/{total}
        </span>
        <span className={`text-[10px] font-semibold ${allDone ? 'text-success' : 'text-fg-muted'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-raised overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-success' : 'bg-brand'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
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
      const dropW = 160
      const dropH = allowed.length * 36
      let top = r.bottom + 4
      let left = r.left
      if (left + dropW > window.innerWidth - 8) left = r.right - dropW
      if (top + dropH > window.innerHeight - 8) top = r.top - dropH - 4
      setDropPos({ top, left })
    }
    setOpen(o => !o)
  }

  return (
    <div className="inline-block">
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            style={{ top: dropPos.top, left: dropPos.left }}
            className="fixed z-[9999] bg-surface/80 backdrop-blur-xl border border-line-soft rounded-lg shadow-lg py-1 min-w-[150px]"
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
        </>,
        document.body
      )}
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-80 ${STATUS_COLORS[project.status]}`}
      >
        {STATUS_LABELS[project.status]}
        <ChevronDownIcon className="w-3 h-3 shrink-0" />
      </button>
    </div>
  )
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const isMember = user?.role === 'member'
  const canWrite = !isMember
  const qc = useQueryClient()

  useEffect(() => {
    const now = new Date().toISOString()
    localStorage.setItem('projectsLastSeen', now)
    qc.invalidateQueries(['new-projects-count'])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const PAGE_SIZE = 15
  const [tab, setTab]             = useState('table')
  const [historyVisible, setHistoryVisible] = useState(25)
  const [statusFilter, setStatusFilter] = useState('')
  const [visible, setVisible]     = useState(15)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [quotingProject, setQuotingProject]   = useState(null)
  const [attachingProject, setAttachingProject] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['projects', statusFilter],
    queryFn: () => getProjects({ ...(statusFilter ? { status: statusFilter } : {}), limit: 500 }).then(r => r.data)
  })

  const allProjects = data?.data ?? []
  const shownProjects = allProjects.slice(0, visible)
  const hasMore = allProjects.length > visible

  const { data: historyData = [] } = useQuery({
    queryKey: ['projects-history'],
    queryFn: () => getAllProjectsHistory().then(r => r.data.data),
    enabled: tab === 'history',
  })

  const changeStatus = useMutation({
    mutationFn: ({ id, status }) => updateProject(id, { status }),
    onSuccess: () => qc.invalidateQueries(['projects']),
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al cambiar estado', 'error')
  })

  async function handleStatusChange(projectId, status) {
    if (status !== 'finished' && status !== 'cancelled') {
      changeStatus.mutate({ id: projectId, status })
      return
    }

    const isCancelling = status === 'cancelled'
    let pending = []
    try {
      const res = await getTasks({ projectId })
      const all = res.data.data || []
      pending = isCancelling
        ? all.filter(t => t.status !== 'done' && t.status !== 'cancelled')
        : all.filter(t => t.status !== 'done')
    } catch {}

    if (pending.length === 0) {
      changeStatus.mutate({ id: projectId, status })
      return
    }

    const body = (
      <div className="text-sm space-y-1">
        <p className="text-xs text-fg-muted font-medium mb-1">
          {pending.length} tarea{pending.length !== 1 ? 's' : ''} {isCancelling ? 'en curso o pendiente:' : 'sin completar:'}
        </p>
        {pending.map(t => (
          <div key={t.id} className="flex items-center gap-2 text-fg-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-fg-muted shrink-0" />
            {t.title}
          </div>
        ))}
      </div>
    )

    const ok = await confirm(
      isCancelling
        ? '¿Cancelar el proyecto? Las tareas pendientes también serán canceladas.'
        : '¿Finalizar el proyecto? Las tareas pendientes se marcarán como completadas.',
      { confirmLabel: isCancelling ? 'Cancelar proyecto' : 'Finalizar y completar', danger: isCancelling, body }
    )
    if (!ok) return

    const newTaskStatus = isCancelling ? 'cancelled' : 'done'
    for (const t of pending) {
      try { await updateTask(t.id, { status: newTaskStatus }) } catch {}
    }
    changeStatus.mutate({ id: projectId, status })
    qc.invalidateQueries(['tasks'])
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h2 className="text-xl font-semibold text-fg">Proyectos</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-raised rounded-lg border border-line overflow-hidden">
            <button
              onClick={() => setTab('table')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'table' ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
              }`}
            >
              <TableCellsIcon className="w-4 h-4" />
              Tabla
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'history' ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
              }`}
            >
              <ClockIcon className="w-4 h-4" />
              Historial
            </button>
          </div>
          {canWrite && tab === 'table' && (
            <button onClick={() => { setEditing(null); setModalOpen(true) }} className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-colors">
              + Nuevo proyecto
            </button>
          )}
        </div>
      </div>

      {tab === 'history' && (
        <div className="flex flex-col gap-4 max-w-2xl">
          {historyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-fg-muted">
              <ClockIcon className="w-10 h-10 opacity-30" />
              <p className="text-sm">Sin movimientos registrados.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {historyData.slice(0, historyVisible).map((entry, i) => {
                const initials = entry.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                const date = new Date(entry.createdAt)
                const dateStr = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
                const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                const shown = historyData.slice(0, historyVisible)
                const actionText = entry.action === 'created'
                  ? 'creó el proyecto'
                  : entry.action === 'status_changed'
                    ? 'cambió el estado'
                    : 'actualizó'
                return (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-brand-subtle text-brand text-[11px] font-bold flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      {i < shown.length - 1 && <div className="w-px flex-1 bg-line mt-1 mb-1 min-h-[16px]" />}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                        <span className="text-sm font-semibold text-fg">{entry.user.name}</span>
                        <span className="text-sm text-fg-muted">{actionText}</span>
                        {entry.detail && <span className="text-sm text-fg-soft">· {entry.detail}</span>}
                      </div>
                      <Link to={`/projects/${entry.project.id}`} className="text-xs text-brand hover:underline">
                        {entry.project.title}
                      </Link>
                      <p className="text-[11px] text-fg-muted/70 mt-0.5">{dateStr} · {timeStr}</p>
                    </div>
                  </div>
                )
              })}
              {historyData.length > historyVisible && (
                <button
                  onClick={() => setHistoryVisible(v => v + 25)}
                  className="mt-2 text-xs text-fg-muted hover:text-fg text-center py-2 border border-dashed border-line rounded-xl transition-colors"
                >
                  Mostrar más ({historyData.length - historyVisible} restante{historyData.length - historyVisible !== 1 ? 's' : ''})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'table' && <>
      <select
        value={statusFilter}
        onChange={e => { setStatusFilter(e.target.value); setVisible(PAGE_SIZE) }}
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
            {shownProjects.map(p => (
              <div key={p.id} className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line p-4">
                {/* Header: estado */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <StatusDropdown project={p} onUpdate={(status) => handleStatusChange(p.id, status)} />
                    {(() => { const n = p.quotes?.reduce((acc, q) => acc + (q.installments?.length || 0), 0) || 0; return n > 0 ? (
                      <span title={`${n} cuota${n !== 1 ? 's' : ''} pendiente${n !== 1 ? 's' : ''}`}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-warning-subtle text-warning text-xs font-medium">
                        <span>⏱</span>{n}
                      </span>
                    ) : null })()}
                  </div>
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
                  <TaskProgress total={p.taskCount} done={p.doneTaskCount} />
                </div>
                {/* Acciones */}
                <div className="flex flex-col gap-2 pt-3 border-t border-line">
                  {canWrite && !p.startDate && (
                    <button
                      onClick={() => { setEditing(p); setModalOpen(true) }}
                      className="w-full flex items-center justify-center py-1.5 rounded-lg text-xs font-medium bg-warning-subtle text-warning border border-warning/20 hover:opacity-80 transition-opacity"
                    >
                      Completar datos
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <Link to={`/projects/${p.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-brand text-white hover:opacity-90 transition-opacity">
                      <EyeIcon className="w-3.5 h-3.5" />
                      Ver
                    </Link>
                    <button
                      onClick={() => setAttachingProject(p)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-line text-fg-soft hover:bg-raised transition-colors"
                    >
                      <PaperClipIcon className="w-3.5 h-3.5" />
                      {p.attachmentCount > 0 ? p.attachmentCount : '+'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!allProjects.length && (
              <p className="py-10 text-center text-sm text-fg-muted">Sin proyectos</p>
            )}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden md:block bg-surface/60 backdrop-blur-xl rounded-xl border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-raised border-b border-line">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Título</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Tareas</th>
                    {!isMember && <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Presupuesto</th>}
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Archivos</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shownProjects.map(p => (
                    <tr key={p.id} className="hover:bg-raised">
                      <td className="px-4 py-3 font-medium text-fg">{p.title}</td>
                      <td className="px-4 py-3 text-fg-soft">{p.client?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <StatusDropdown project={p} onUpdate={(status) => handleStatusChange(p.id, status)} />
                          {(() => { const n = p.quotes?.reduce((acc, q) => acc + (q.installments?.length || 0), 0) || 0; return n > 0 ? (
                            <span title={`${n} cuota${n !== 1 ? 's' : ''} pendiente${n !== 1 ? 's' : ''}`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-warning-subtle text-warning text-xs font-medium">
                              <span>⏱</span>{n}
                            </span>
                          ) : null })()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <TaskProgress total={p.taskCount} done={p.doneTaskCount} />
                      </td>
                      {!isMember && (
                        <td className="px-4 py-3">
                          {p.quotes?.length > 0
                            ? <span className="text-fg-soft text-sm">
                                ${Number(p.quotes.reduce((s, q) => s + (Number(q.total) || 0), 0)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            : canWrite && (
                                <button
                                  onClick={() => setQuotingProject(p)}
                                  className="px-3 py-1 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover transition-colors"
                                >
                                  Asignar
                                </button>
                              )
                          }
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setAttachingProject(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                            p.attachmentCount > 0
                              ? 'border-line bg-raised text-fg-soft hover:text-fg'
                              : 'border-dashed border-line text-fg-muted hover:border-brand hover:text-brand'
                          }`}
                        >
                          <PaperClipIcon className="w-3.5 h-3.5 shrink-0" />
                          {p.attachmentCount > 0 ? p.attachmentCount : '+'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {canWrite && !p.startDate && (
                            <button
                              onClick={() => { setEditing(p); setModalOpen(true) }}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-warning-subtle text-warning border border-warning/20 hover:opacity-80 transition-opacity"
                            >
                              Completar datos
                            </button>
                          )}
                          <Link to={`/projects/${p.id}`} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-brand text-white hover:opacity-90 transition-opacity">
                            <EyeIcon className="w-3.5 h-3.5" />
                            Ver
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!allProjects.length && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-fg-muted">Sin proyectos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {hasMore && (
        <button
          onClick={() => setVisible(v => v + PAGE_SIZE)}
          className="mt-4 w-full py-2.5 text-sm text-fg-muted hover:text-fg border border-dashed border-line rounded-xl transition-colors"
        >
          Ver más ({allProjects.length - visible} restante{allProjects.length - visible !== 1 ? 's' : ''})
        </button>
      )}
      </>}

      {modalOpen && (
        <ProjectModal
          project={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); qc.invalidateQueries(['projects']) }}
        />
      )}

      {quotingProject && (
        <QuoteModal
          initialProjectId={quotingProject.id}
          initialClientId={quotingProject.clientId || quotingProject.client?.id}
          onClose={() => setQuotingProject(null)}
          onSaved={() => {
            setQuotingProject(null)
            qc.invalidateQueries(['quotes'])
          }}
        />
      )}

      {attachingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAttachingProject(null)} />
          <div className="relative z-10 w-full max-w-md bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <div>
                <h3 className="text-sm font-semibold text-fg">Archivos adjuntos</h3>
                <p className="text-xs text-fg-muted mt-0.5 truncate max-w-[280px]">{attachingProject.title}</p>
              </div>
              <button
                onClick={() => setAttachingProject(null)}
                className="p-1.5 rounded-lg hover:bg-raised text-fg-muted hover:text-fg transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <AttachmentsPanel entityType="project" entityId={attachingProject.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
