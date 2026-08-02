import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, updateTask, deleteTask } from '../../api/tasks'
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
} from '@heroicons/react/24/outline'

// ── constants ─────────────────────────────────────────────────────────────────

const COLUMNS = [
  { id: 'todo',        label: 'Pendiente',   color: 'text-fg-muted',  dot: 'bg-fg-muted',  count_bg: 'bg-raised' },
  { id: 'in_progress', label: 'En progreso', color: 'text-warning',   dot: 'bg-warning',   count_bg: 'bg-warning-subtle' },
  { id: 'done',        label: 'Completada',  color: 'text-success',   dot: 'bg-success',   count_bg: 'bg-success-subtle' },
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

// ── TaskCard ──────────────────────────────────────────────────────────────────

function TaskCard({ task, onEdit, onDelete, onMove }) {
  const overdue = isOverdue(task.dueDate)
  const prio    = PRIORITY[task.priority]
  const canNext = Boolean(NEXT_STATUS[task.status])
  const canPrev = Boolean(PREV_STATUS[task.status])

  return (
    <div className={`group bg-surface border rounded-xl p-3.5 flex flex-col gap-2.5 transition-all hover:border-line-soft hover:shadow-sm ${task.status === 'done' ? 'border-line opacity-70' : 'border-line'}`}>
      {/* Priority + actions */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${prio.cls}`}>
          {prio.label}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
      <p className={`text-sm font-medium leading-snug ${task.status === 'done' ? 'line-through text-fg-muted' : 'text-fg'}`}>
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-fg-muted leading-relaxed line-clamp-2">{task.description}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-0.5">
        {task.dueDate && (
          <span className={`flex items-center gap-1 text-xs ${overdue && task.status !== 'done' ? 'text-danger font-medium' : 'text-fg-muted'}`}>
            <CalendarDaysIcon className="w-3.5 h-3.5 shrink-0" />
            {fmtDate(task.dueDate)}
          </span>
        )}
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

      {task.createdBy && (
        <p className="text-[11px] text-fg-muted">
          Creada por <span className="font-medium text-fg-soft">{task.createdBy.name.split(' ')[0]}</span>
        </p>
      )}

      {/* Move buttons */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-line opacity-0 group-hover:opacity-100 transition-opacity">
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

  const [modal, setModal]                   = useState(null)
  const [filterPriority, setFilterPriority] = useState('')
  const [filterMember, setFilterMember]     = useState('')
  const [filterProject, setFilterProject]   = useState('')
  const [onlyMine, setOnlyMine]             = useState(false)

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
    onError: () => toast.error('Error al mover la tarea'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTask(id),
    onSuccess: () => { qc.invalidateQueries(['tasks']); toast.success('Tarea eliminada') },
    onError: () => toast.error('Error al eliminar'),
  })

  async function handleDelete(task) {
    const ok = await confirm({ title: 'Eliminar tarea', message: `¿Eliminar "${task.title}"? Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar', danger: true })
    if (ok) deleteMutation.mutate(task.id)
  }

  function handleMove(task, newStatus) {
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
        <button
          onClick={() => setModal({ defaultStatus: 'todo' })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <PlusIcon className="w-4 h-4" />
          Nueva tarea
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Mis tareas toggle */}
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
            onClick={() => { setFilterPriority(''); setFilterMember(''); setFilterProject(''); setOnlyMine(false) }}
            className="text-xs text-fg-muted hover:text-fg underline transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Kanban */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-fg-muted text-sm">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {COLUMNS.map(col => {
            const colTasks = byStatus(col.id)
            return (
              <div key={col.id} className="flex flex-col gap-3">
                {/* Column header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                    <h2 className={`text-sm font-semibold ${col.color}`}>{col.label}</h2>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${col.count_bg} text-fg-muted`}>
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setModal({ defaultStatus: col.id })}
                    className="p-1 rounded-md hover:bg-raised text-fg-muted hover:text-fg transition-colors"
                    title={`Agregar en ${col.label}`}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2.5 min-h-[60px]">
                  {colTasks.length === 0 ? (
                    <div className="border border-dashed border-line rounded-xl p-4 text-center text-xs text-fg-muted">
                      Sin tareas
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={(t) => setModal({ task: t })}
                        onDelete={handleDelete}
                        onMove={handleMove}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

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
