import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, updateTask, deleteTask, getTaskHistory } from '../../api/tasks'
import { getMembers } from '../../api/members'
import { getProjects } from '../../api/projects'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../components/ConfirmDialog'
import TaskModal from './TaskModal'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  FolderIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'

// ── constants ─────────────────────────────────────────────────────────────────

const COLUMNS = [
  { id: 'todo',        label: 'Pendiente',   color: 'text-fg-muted',  dot: 'bg-fg-muted',  count_bg: 'bg-raised',          col_bg: 'bg-raised/60' },
  { id: 'in_progress', label: 'En progreso', color: 'text-warning',   dot: 'bg-warning',   count_bg: 'bg-warning-subtle',  col_bg: 'bg-warning-subtle/40' },
  { id: 'done',        label: 'Completada',  color: 'text-success',   dot: 'bg-success',   count_bg: 'bg-success-subtle',  col_bg: 'bg-success-subtle/40' },
]

const PRIORITY = {
  high:   { label: 'Alta',  cls: 'bg-danger-subtle text-danger' },
  medium: { label: 'Media', cls: 'bg-warning-subtle text-warning' },
  low:    { label: 'Baja',  cls: 'bg-raised text-fg-muted' },
}

const NEXT_STATUS = { todo: 'in_progress', in_progress: 'done', done: null }
const PREV_STATUS = { todo: null, in_progress: 'todo', done: 'in_progress' }

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function fmtDateTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const date = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${time}`
}

function isOverdue(iso) {
  if (!iso) return false
  return new Date(iso) < new Date(new Date().toDateString())
}

function Avatar({ user }) {
  if (!user) return null
  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  return (
    <div className="w-5 h-5 rounded-full bg-brand-subtle text-brand text-[10px] font-bold flex items-center justify-center shrink-0" title={user.name}>
      {initials}
    </div>
  )
}

const STATUS_LABELS = {
  todo:        'Pendiente',
  in_progress: 'En progreso',
  done:        'Completada',
}

const STATUS_COLORS = {
  todo:        'bg-raised text-fg-muted',
  in_progress: 'bg-warning-subtle text-warning',
  done:        'bg-success-subtle text-success',
}

function actionLabel(fromStatus, toStatus) {
  if (!fromStatus) return { verb: 'creó la tarea', color: 'text-fg-muted' }
  if (toStatus === 'done')        return { verb: 'completó la tarea',              color: 'text-success' }
  if (toStatus === 'in_progress') return { verb: 'inició la tarea',                color: 'text-warning' }
  if (toStatus === 'todo')        return { verb: 'regresó la tarea a pendiente',   color: 'text-fg-muted' }
  return { verb: `movió a ${STATUS_LABELS[toStatus]}`, color: 'text-fg-muted' }
}

// ── HistoryView ───────────────────────────────────────────────────────────────

function HistoryView() {
  const [visible, setVisible] = useState(25)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]     = useState('')

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['tasks-history'],
    queryFn: () => getTaskHistory().then(r => r.data.data),
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-fg-muted text-sm">Cargando historial...</div>
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-fg-muted">
        <ClockIcon className="w-10 h-10 opacity-30" />
        <p className="text-sm">Aún no hay movimientos registrados.</p>
      </div>
    )
  }

  const filtered = history.filter(e => {
    const d = new Date(e.createdAt)
    if (fromDate && d < new Date(fromDate))                    return false
    if (toDate   && d > new Date(toDate + 'T23:59:59'))        return false
    return true
  })

  const shown = filtered.slice(0, visible)
  const remaining = filtered.length - visible

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {/* Filtro de fecha */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-fg-muted whitespace-nowrap">Desde</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => { setFromDate(e.target.value); setVisible(25) }}
            className="px-2.5 py-1.5 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-fg-muted whitespace-nowrap">Hasta</label>
          <input
            type="date"
            value={toDate}
            onChange={e => { setToDate(e.target.value); setVisible(25) }}
            className="px-2.5 py-1.5 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors"
          />
        </div>
        {(fromDate || toDate) && (
          <button
            onClick={() => { setFromDate(''); setToDate(''); setVisible(25) }}
            className="text-xs text-fg-muted hover:text-fg underline transition-colors"
          >
            Limpiar
          </button>
        )}
        <span className="text-xs text-fg-muted ml-auto">
          {filtered.length} movimiento{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-fg-muted">
          <ClockIcon className="w-8 h-8 opacity-30" />
          <p className="text-sm">Sin movimientos en ese rango de fechas.</p>
        </div>
      ) : (
      <div className="flex flex-col gap-1">
      {shown.map((entry, i) => {
        const { verb, color } = actionLabel(entry.fromStatus, entry.toStatus)
        const initials = entry.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        const date = new Date(entry.createdAt)
        const dateStr = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
        const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

        return (
          <div key={entry.id} className="flex gap-4 group">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-brand-subtle text-brand text-[11px] font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
              {i < shown.length - 1 && (
                <div className="w-px flex-1 bg-line mt-1 mb-1 min-h-[16px]" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className="text-sm font-semibold text-fg">{entry.user.name}</span>
                <span className={`text-sm ${color}`}>{verb}</span>
                {entry.toStatus && (
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[entry.toStatus]}`}>
                    {STATUS_LABELS[entry.toStatus]}
                  </span>
                )}
              </div>
              <p className="text-xs text-fg-muted mt-0.5 truncate">
                "{entry.task.title}"
              </p>
              <p className="text-[11px] text-fg-muted/70 mt-1">
                {dateStr} · {timeStr}
              </p>
            </div>
          </div>
        )
      })}
      {remaining > 0 && (
        <button
          onClick={() => setVisible(v => v + 25)}
          className="mt-2 text-xs text-fg-muted hover:text-fg text-center py-2 border border-dashed border-line rounded-xl transition-colors"
        >
          Mostrar más ({remaining} restante{remaining !== 1 ? 's' : ''})
        </button>
      )}
      </div>
      )}
    </div>
  )
}

// ── TaskCard ──────────────────────────────────────────────────────────────────

function TaskCard({ task, onEdit, onDelete, onMove }) {
  const overdue  = isOverdue(task.dueDate)
  const prio     = PRIORITY[task.priority]
  const isDone   = task.status === 'done'
  const canNext  = Boolean(NEXT_STATUS[task.status])
  const canPrev  = Boolean(PREV_STATUS[task.status])

  return (
    <div className={`group bg-surface border rounded-xl p-3.5 flex flex-col gap-2.5 transition-all hover:shadow-sm ${
      isDone
        ? 'border-success/30 bg-success-subtle/10'
        : 'border-line hover:border-line-soft'
    }`}>
      {/* Priority + actions */}
      <div className="flex items-center justify-between gap-2">
        {isDone ? (
          <CheckCircleSolid className="w-4 h-4 text-success shrink-0" />
        ) : (
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${prio.cls}`}>
            {prio.label}
          </span>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded-md hover:bg-raised text-fg-muted hover:text-fg transition-colors"
            title="Editar"
          >
            <PencilIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-1 rounded-md hover:bg-danger-subtle text-fg-muted hover:text-danger transition-colors"
            title="Eliminar"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <p className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-fg-muted' : 'text-fg'}`}>
        {task.title}
      </p>

      {/* Description */}
      {task.description && !isDone && (
        <p className="text-xs text-fg-muted leading-relaxed line-clamp-2">{task.description}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-0.5">
        {isDone && task.completedAt ? (
          <span className="flex items-center gap-1 text-xs text-success">
            <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" />
            {fmtDateTime(task.completedAt)}
          </span>
        ) : task.status === 'in_progress' && task.startedAt ? (
          <span className="flex items-center gap-1 text-xs text-warning">
            <CalendarDaysIcon className="w-3.5 h-3.5 shrink-0" />
            {fmtDateTime(task.startedAt)}
          </span>
        ) : task.dueDate ? (
          <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-danger font-medium' : 'text-fg-muted'}`}>
            <CalendarDaysIcon className="w-3.5 h-3.5 shrink-0" />
            {fmtDate(task.dueDate)}
          </span>
        ) : null}

        {task.project && (
          <span className="flex items-center gap-1 text-xs text-fg-muted truncate max-w-[120px]">
            <FolderIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{task.project.title}</span>
          </span>
        )}
        {task.assignedTo && (
          <span className="flex items-center gap-1 text-xs text-fg-muted ml-auto">
            <Avatar user={task.assignedTo} />
            <span className="truncate max-w-[80px]">{task.assignedTo.name.split(' ')[0]}</span>
          </span>
        )}
      </div>

      {!isDone && task.createdBy && (
        <p className="text-[11px] text-fg-muted">
          Creada por <span className="font-medium text-fg-soft">{task.createdBy.name.split(' ')[0]}</span>
        </p>
      )}

      {/* Move buttons */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-line">
        <button
          disabled={!canPrev}
          onClick={() => canPrev && onMove(task, PREV_STATUS[task.status])}
          className="flex items-center gap-1 text-[11px] text-fg-muted hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-1.5 py-0.5 rounded hover:bg-raised"
        >
          <ChevronRightIcon className="w-3 h-3 rotate-180" />
          Atrás
        </button>
        <div className="flex-1" />
        <button
          disabled={!canNext}
          onClick={() => canNext && onMove(task, NEXT_STATUS[task.status])}
          className="flex items-center gap-1 text-[11px] text-fg-muted hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-1.5 py-0.5 rounded hover:bg-raised"
        >
          Siguiente
          <ChevronRightIcon className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const qc      = useQueryClient()
  const toast   = useToast()
  const confirm = useConfirm()
  const { user } = useAuth()
  const orgId   = user?.org

  const [tab, setTab]                       = useState('board')
  const [modal, setModal]                   = useState(null)
  const [filterPriority, setFilterPriority] = useState('')
  const [filterMember, setFilterMember]     = useState('')
  const [filterProject, setFilterProject]   = useState('')
  const [onlyMine, setOnlyMine]             = useState(false)
  const [doneCollapsed, setDoneCollapsed]   = useState(false)
  const [doneVisible, setDoneVisible]       = useState(10)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasks().then(r => r.data.data),
  })

  const { data: membersData } = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => getMembers(orgId).then(r => r.data.data),
    enabled: Boolean(orgId),
    staleTime: 60_000,
  })
  const members = (membersData ?? []).filter(m => m.status === 'active')

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects().then(r => r.data.data?.items ?? r.data.data ?? []),
    staleTime: 60_000,
  })
  const projects = projectsData ?? []

  const moveMutation = useMutation({
    mutationFn: ({ id, status }) => updateTask(id, { status }),
    onSuccess: () => qc.invalidateQueries(['tasks']),
    onError: () => toast('Error al mover la tarea', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTask(id),
    onSuccess: () => { qc.invalidateQueries(['tasks']); toast('Tarea eliminada', 'success') },
    onError: () => toast('Error al eliminar', 'error'),
  })


  async function handleDelete(task) {
    const ok = await confirm(
      `¿Eliminar "${task.title}"? Esta acción no se puede deshacer.`,
      { confirmLabel: 'Eliminar', danger: true }
    )
    if (ok) deleteMutation.mutate(task.id)
  }


  async function handleMove(task, newStatus) {
    if (task.status === 'in_progress' && newStatus === 'done') {
      const ok = await confirm(
        `¿Confirmás que "${task.title}" fue completada?`,
        { confirmLabel: 'Sí, completar', danger: false }
      )
      if (!ok) return
    }
    moveMutation.mutate({ id: task.id, status: newStatus })
  }

  const myId = user?.uid
  const filtered = tasks.filter(t => {
    if (onlyMine      && t.assignedToId !== myId)          return false
    if (filterPriority && t.priority !== filterPriority)   return false
    if (filterMember   && t.assignedToId !== filterMember) return false
    if (filterProject  && t.projectId  !== filterProject)  return false
    return true
  })

  const byStatus = (status) => filtered.filter(t => t.status === status)
  const hasFilters = filterPriority || filterMember || filterProject || onlyMine

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6 min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-fg">Tareas</h1>
          <p className="text-sm text-fg-muted mt-0.5">{filtered.length} tarea{filtered.length !== 1 ? 's' : ''}{hasFilters ? ' (filtradas)' : ' en total'}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-raised rounded-lg border border-line">
            <button
              onClick={() => setTab('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'board' ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
              }`}
            >
              <TableCellsIcon className="w-4 h-4" />
              Tablero
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
          {tab === 'board' && (
            <button
              onClick={() => setModal({ defaultStatus: 'todo' })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <PlusIcon className="w-4 h-4" />
              Nueva tarea
            </button>
          )}
        </div>
      </div>

      {/* Historial */}
      {tab === 'history' && <HistoryView />}

      {/* Filtros */}
      {tab === 'board' &&
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setOnlyMine(v => !v)}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
            onlyMine
              ? 'bg-brand text-white border-brand'
              : 'bg-raised border-line text-fg-soft hover:border-brand hover:text-brand'
          }`}
        >
          Mis tareas
        </button>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-raised border border-line text-sm text-fg-soft focus:outline-none focus:border-brand transition-colors"
        >
          <option value="">Todas las prioridades</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>

        {members.length > 0 && (
          <select
            value={filterMember}
            onChange={e => setFilterMember(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-raised border border-line text-sm text-fg-soft focus:outline-none focus:border-brand transition-colors"
          >
            <option value="">Todos los responsables</option>
            {members.map(m => (
              <option key={m.userId} value={m.userId}>{m.name}</option>
            ))}
          </select>
        )}

        {projects.length > 0 && (
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-raised border border-line text-sm text-fg-soft focus:outline-none focus:border-brand transition-colors"
          >
            <option value="">Todos los proyectos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={() => { setFilterPriority(''); setFilterMember(''); setFilterProject(''); setOnlyMine(false); setDoneVisible(10) }}
            className="text-xs text-fg-muted hover:text-fg underline transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>}

      {/* Kanban */}
      {tab === 'board' && (isLoading ? (
        <div className="flex items-center justify-center py-20 text-fg-muted text-sm">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {COLUMNS.map(col => {
            const colTasks = byStatus(col.id)
            const isDoneCol = col.id === 'done'

            return (
              <div key={col.id} className={`flex flex-col gap-3 rounded-2xl p-3 ${col.col_bg}`}>
                {/* Column header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                    <h2 className={`text-sm font-semibold ${col.color}`}>{col.label}</h2>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${col.count_bg} text-fg-muted`}>
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isDoneCol && colTasks.length > 0 && (
                      <button
                        onClick={() => setDoneCollapsed(v => !v)}
                        className="p-1 rounded-md hover:bg-raised text-fg-muted hover:text-fg transition-colors"
                        title={doneCollapsed ? 'Expandir' : 'Colapsar'}
                      >
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${doneCollapsed ? '-rotate-90' : ''}`} />
                      </button>
                    )}
                    {!isDoneCol && (
                      <button
                        onClick={() => setModal({ defaultStatus: col.id })}
                        className="p-1 rounded-md hover:bg-raised text-fg-muted hover:text-fg transition-colors"
                        title={`Agregar en ${col.label}`}
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Cards */}
                {(!isDoneCol || !doneCollapsed) && (
                  <div className="flex flex-col gap-2.5 min-h-[60px]">
                    {colTasks.length === 0 ? (
                      <div className="border border-dashed border-line rounded-xl p-4 text-center text-xs text-fg-muted">
                        {isDoneCol ? '¡Sin tareas completadas aún!' : 'Sin tareas'}
                      </div>
                    ) : (
                      <>
                        {(isDoneCol ? colTasks.slice(0, doneVisible) : colTasks).map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={(t) => setModal({ task: t })}
                            onDelete={handleDelete}
                            onMove={handleMove}
                          />
                        ))}
                        {isDoneCol && colTasks.length > doneVisible && (
                          <button
                            onClick={() => setDoneVisible(v => v + 10)}
                            className="text-xs text-fg-muted hover:text-fg text-center py-2 border border-dashed border-line rounded-xl transition-colors"
                          >
                            Mostrar más ({colTasks.length - doneVisible} restante{colTasks.length - doneVisible !== 1 ? 's' : ''})
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {isDoneCol && doneCollapsed && colTasks.length > 0 && (
                  <button
                    onClick={() => setDoneCollapsed(false)}
                    className="text-xs text-fg-muted hover:text-fg text-center py-2 border border-dashed border-line rounded-xl transition-colors"
                  >
                    Ver {colTasks.length} tarea{colTasks.length !== 1 ? 's' : ''} completada{colTasks.length !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* Modal */}
      {modal && (
        <TaskModal
          task={modal.task}
          defaultStatus={modal.defaultStatus}
          defaultProjectId={modal.defaultProjectId}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
