import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { getProjectById, deleteProject } from '../../api/projects'
import { getQuotes } from '../../api/quotes'
import { getTasks, updateTask, deleteTask } from '../../api/tasks'
import ProjectModal from './ProjectModal'
import QuoteModal from '../quotes/QuoteModal'
import TaskModal from '../tasks/TaskModal'
import AttachmentsPanel from '../../components/AttachmentsPanel'
import { PlusIcon, PencilIcon, TrashIcon, CalendarDaysIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

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
  expired:   'bg-warning-subtle text-warning',
  pending:   'bg-warning-subtle text-warning',
  paid:      'bg-brand-subtle text-brand',
  overdue:   'bg-danger-subtle text-danger',
  partial:   'bg-warning-subtle text-warning',
  cancelled: 'bg-raised text-fg-muted'
}
const DOC_STATUS_LABELS = {
  draft: 'Borrador', sent: 'Enviado', approved: 'Aprobado',
  rejected: 'Rechazado', expired: 'Vencido',
  pending: 'Pendiente', paid: 'Pagado', overdue: 'Vencido',
  partial: 'Parcial', cancelled: 'Cancelado'
}

const TASK_COLS = [
  { id: 'todo',        label: 'Pendiente',   dot: 'bg-fg-muted',  color: 'text-fg-muted' },
  { id: 'in_progress', label: 'En progreso', dot: 'bg-warning',   color: 'text-warning' },
  { id: 'done',        label: 'Completada',  dot: 'bg-success',   color: 'text-success' },
]
const TASK_PRIORITY = {
  high:   { label: 'Alta',  cls: 'bg-danger-subtle text-danger' },
  medium: { label: 'Media', cls: 'bg-warning-subtle text-warning' },
  low:    { label: 'Baja',  cls: 'bg-raised text-fg-muted' },
}
const NEXT_STATUS = { todo: 'in_progress', in_progress: 'done', done: null }
const PREV_STATUS = { todo: null, in_progress: 'todo', done: 'in_progress' }

function isOverdue(iso) {
  if (!iso) return false
  return new Date(iso) < new Date(new Date().toDateString())
}

function TaskAvatar({ user }) {
  if (!user) return null
  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  return (
    <div className="w-4 h-4 rounded-full bg-brand-subtle text-brand text-[9px] font-bold flex items-center justify-center shrink-0" title={user.name}>
      {initials}
    </div>
  )
}

function MiniTaskCard({ task, canWrite, onEdit, onDelete, onMove }) {
  const overdue = isOverdue(task.dueDate)
  const prio    = TASK_PRIORITY[task.priority]
  const canNext = Boolean(NEXT_STATUS[task.status])
  const canPrev = Boolean(PREV_STATUS[task.status])

  return (
    <div className={`group bg-surface border rounded-lg p-3 flex flex-col gap-2 transition-all hover:shadow-sm ${task.status === 'done' ? 'opacity-60' : ''} border-line`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-medium leading-snug flex-1 ${task.status === 'done' ? 'line-through text-fg-muted' : 'text-fg'}`}>
          {task.title}
        </p>
        {canWrite && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-raised text-fg-muted hover:text-fg" title="Editar">
              <PencilIcon className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(task)} className="p-1 rounded hover:bg-danger-subtle text-fg-muted hover:text-danger" title="Eliminar">
              <TrashIcon className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${prio.cls}`}>{prio.label}</span>
        {task.dueDate && (
          <span className={`flex items-center gap-0.5 text-[11px] ${overdue && task.status !== 'done' ? 'text-danger' : 'text-fg-muted'}`}>
            <CalendarDaysIcon className="w-3 h-3 shrink-0" />
            {new Date(task.dueDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
          </span>
        )}
        {task.assignedTo && (
          <span className="ml-auto flex items-center gap-1">
            <TaskAvatar user={task.assignedTo} />
            <span className="text-[11px] text-fg-muted">{task.assignedTo.name.split(' ')[0]}</span>
          </span>
        )}
      </div>

      {canWrite && (
        <div className="flex items-center gap-1 pt-1 border-t border-line opacity-0 group-hover:opacity-100 transition-opacity">
          <button disabled={!canPrev} onClick={() => canPrev && onMove(task, PREV_STATUS[task.status])}
            className="flex items-center gap-0.5 text-[10px] text-fg-muted hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed px-1 py-0.5 rounded hover:bg-raised">
            <ChevronRightIcon className="w-2.5 h-2.5 rotate-180" /> Atrás
          </button>
          <div className="flex-1" />
          <button disabled={!canNext} onClick={() => canNext && onMove(task, NEXT_STATUS[task.status])}
            className="flex items-center gap-0.5 text-[10px] text-fg-muted hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed px-1 py-0.5 rounded hover:bg-raised">
            Siguiente <ChevronRightIcon className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  )
}

function ProjectTasksPanel({ tasks, projectId, canWrite, onAdd, onEdit, onDelete, onMove }) {
  const total = tasks.length
  const done  = tasks.filter(t => t.status === 'done').length

  return (
    <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">
            Tareas <span className="text-fg-muted font-normal">({total})</span>
          </h3>
          {total > 0 && (
            <span className="text-xs text-fg-muted">{done}/{total} completadas</span>
          )}
        </div>
        {canWrite && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Nueva tarea
          </button>
        )}
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <p className="text-sm text-fg-muted">Sin tareas en este proyecto</p>
          {canWrite && (
            <button onClick={onAdd} className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity">
              Agregar tarea
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {TASK_COLS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id)
            return (
              <div key={col.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 px-0.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                  <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                  <span className="text-xs text-fg-muted ml-auto">{colTasks.length}</span>
                </div>
                {colTasks.length === 0 ? (
                  <div className="border border-dashed border-line rounded-lg p-3 text-center text-xs text-fg-muted">
                    Sin tareas
                  </div>
                ) : (
                  colTasks.map(t => (
                    <MiniTaskCard
                      key={t.id}
                      task={t}
                      canWrite={canWrite}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onMove={onMove}
                    />
                  ))
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canWrite = user?.role !== 'member'
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [editOpen, setEditOpen]         = useState(false)
  const [newQuoteOpen, setNewQuoteOpen] = useState(false)
  const [taskModal, setTaskModal]       = useState(null)

  const del = useMutation({
    mutationFn: () => deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries(['projects'])
      toast('Proyecto eliminado', 'success')
      navigate('/projects')
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al eliminar', 'error')
  })

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id).then(r => r.data.data)
  })

  const { data: quotesRes } = useQuery({
    queryKey: ['quotes', { projectId: id }],
    queryFn: () => getQuotes({ projectId: id, limit: 100 }).then(r => r.data),
    enabled: Boolean(id)
  })

  const { data: projectTasks = [] } = useQuery({
    queryKey: ['tasks', { projectId: id }],
    queryFn: () => getTasks({ projectId: id }).then(r => r.data.data),
    enabled: Boolean(id)
  })

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, status }) => updateTask(taskId, { status }),
    onSuccess: () => qc.invalidateQueries(['tasks', { projectId: id }]),
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al mover la tarea', 'error')
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => deleteTask(taskId),
    onSuccess: () => { qc.invalidateQueries(['tasks', { projectId: id }]); toast('Tarea eliminada', 'success') },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al eliminar', 'error')
  })

  if (isLoading) return <div className="p-8 text-sm text-fg-soft">Cargando...</div>
  if (!project) return <div className="p-8 text-sm text-fg-soft">Proyecto no encontrado</div>

  const quotes = quotesRes?.data || []

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-fg-muted">
        <button onClick={() => navigate('/projects')} className="hover:text-fg-soft">← Proyectos</button>
      </div>

      <div className="flex items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-fg leading-tight mb-1">{project.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[project.status]}`}>
              {STATUS_LABELS[project.status]}
            </span>
            {project.client && (
              <Link to={`/clients/${project.client.id}`} className="text-sm text-brand hover:underline">
                {project.client.name}
              </Link>
            )}
          </div>
        </div>
        {canWrite && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              className="self-start px-4 py-2 border border-line-soft rounded-md text-sm font-medium text-fg-soft hover:bg-raised transition-colors"
            >
              Editar
            </button>
            <button
              onClick={async () => { if (await confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.', { confirmLabel: 'Eliminar', danger: true })) del.mutate() }}
              disabled={del.isPending}
              className="self-start px-4 py-2 rounded-md text-sm font-medium bg-danger-subtle text-danger hover:opacity-80 disabled:opacity-50 transition-opacity"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line p-5">
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

          <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line p-5">
            <AttachmentsPanel entityType="project" entityId={id} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Tareas */}
          <ProjectTasksPanel
            tasks={projectTasks}
            projectId={id}
            canWrite={canWrite}
            onAdd={() => setTaskModal({ defaultStatus: 'todo' })}
            onEdit={(t) => setTaskModal({ task: t })}
            onDelete={async (t) => {
              if (await confirm(`¿Eliminar "${t.title}"?`, { confirmLabel: 'Eliminar', danger: true }))
                deleteTaskMutation.mutate(t.id)
            }}
            onMove={(t, status) => moveTaskMutation.mutate({ taskId: t.id, status })}
          />

          {/* Presupuestos */}
          <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">
                Presupuesto <span className="text-fg-muted font-normal">({quotes.length})</span>
              </h3>
              <div className="flex items-center gap-3">
                {canWrite && (
                  <button
                    onClick={() => setNewQuoteOpen(true)}
                    className="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover transition-colors"
                  >
                    Asignar
                  </button>
                )}
                {quotes.length > 0 && (
                  <Link to="/quotes" className="text-xs text-brand hover:underline">Ver todos</Link>
                )}
              </div>
            </div>
            {quotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <p className="text-sm text-fg-muted">Sin presupuesto asignado</p>
                {canWrite && (
                  <button
                    onClick={() => setNewQuoteOpen(true)}
                    className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-hover transition-colors"
                  >
                    Asignar presupuesto
                  </button>
                )}
              </div>
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
                          {DOC_STATUS_LABELS[q.status] || q.status}
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

      {newQuoteOpen && (
        <QuoteModal
          initialClientId={project.client?.id}
          initialProjectId={id}
          onClose={() => setNewQuoteOpen(false)}
          onSaved={() => {
            setNewQuoteOpen(false)
            qc.invalidateQueries(['quotes', { projectId: id }])
            qc.invalidateQueries(['quotes'])
          }}
        />
      )}

      {taskModal && (
        <TaskModal
          task={taskModal.task}
          defaultStatus={taskModal.defaultStatus}
          defaultProjectId={id}
          onClose={() => setTaskModal(null)}
        />
      )}
    </div>
  )
}
