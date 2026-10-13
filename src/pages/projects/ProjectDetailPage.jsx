import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { getProjectById, deleteProject, updateProject } from '../../api/projects'
import { getQuotes } from '../../api/quotes'
import { getTasks, updateTask, deleteTask } from '../../api/tasks'
import ProjectModal from './ProjectModal'
import QuoteModal from '../quotes/QuoteModal'
import TaskModal from '../tasks/TaskModal'
import AttachmentsPanel from '../../components/AttachmentsPanel'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }
const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"
const card = { background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0' }

const PROJECT_STATUS = {
  pending:     { label: 'Pendiente',  bg: 'rgba(226,182,99,0.12)',  color: '#E2B663' },
  approved:    { label: 'Aprobado',   bg: 'rgba(142,177,222,0.12)', color: '#8EB1DE' },
  in_progress: { label: 'En curso',   bg: 'rgba(242,237,227,0.08)', color: '#F2EDE3' },
  finished:    { label: 'Finalizado', bg: 'rgba(125,190,147,0.12)', color: '#7DBE93' },
  cancelled:   { label: 'Cancelado',  bg: 'rgba(140,135,126,0.12)', color: '#8C877E' },
}
const STATUS_DOT_COLOR = {
  pending: '#E2B663', approved: '#8EB1DE', in_progress: '#F2EDE3', finished: '#7DBE93', cancelled: '#8C877E',
}
const ALLOWED_TRANSITIONS = {
  pending:     ['approved', 'cancelled'],
  approved:    ['in_progress', 'cancelled'],
  in_progress: ['finished', 'cancelled'],
  finished:    [],
  cancelled:   [],
}

const DOC_STATUS = {
  draft:     { label: 'Borrador',  bg: 'rgba(140,135,126,0.12)', color: '#8C877E' },
  sent:      { label: 'Enviado',   bg: 'rgba(142,177,222,0.12)', color: '#8EB1DE' },
  approved:  { label: 'Aprobado', bg: 'rgba(242,237,227,0.08)', color: '#F2EDE3' },
  rejected:  { label: 'Rechazado',bg: 'rgba(229,131,115,0.12)', color: '#E58373' },
  expired:   { label: 'Vencido',  bg: 'rgba(226,182,99,0.12)',  color: '#E2B663' },
  pending:   { label: 'Pendiente',bg: 'rgba(226,182,99,0.12)',  color: '#E2B663' },
  paid:      { label: 'Pagado',   bg: 'rgba(125,190,147,0.12)', color: '#7DBE93' },
  overdue:   { label: 'Vencido',  bg: 'rgba(229,131,115,0.12)', color: '#E58373' },
  partial:   { label: 'Parcial',  bg: 'rgba(226,182,99,0.12)',  color: '#E2B663' },
  cancelled: { label: 'Cancelado',bg: 'rgba(140,135,126,0.12)', color: '#8C877E' },
}

const TASK_COLS = [
  { id: 'todo',        label: 'Pendiente',   color: C.piedra },
  { id: 'in_progress', label: 'En progreso', color: '#E2B663' },
  { id: 'done',        label: 'Completada',  color: '#7DBE93' },
]
const TASK_PRIORITY = {
  high:   { label: 'Alta',  bg: 'rgba(229,131,115,0.12)', color: '#E58373' },
  medium: { label: 'Media', bg: 'rgba(226,182,99,0.12)',  color: '#E2B663' },
  low:    { label: 'Baja',  bg: 'rgba(140,135,126,0.12)', color: '#8C877E' },
}
const NEXT_STATUS = { todo: 'in_progress', in_progress: 'done', done: null, cancelled: null }
const PREV_STATUS = { todo: null, in_progress: 'todo', done: 'in_progress', cancelled: null }

function isOverdue(iso) {
  if (!iso) return false
  return new Date(iso) < new Date(new Date().toDateString())
}

function PencilSvg() {
  return (
    <svg style={{ display: 'block', width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
function TrashSvg() {
  return (
    <svg style={{ display: 'block', width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  )
}
function PlusSvg() {
  return (
    <svg style={{ display: 'block', width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
function ChevronSvg({ style }) {
  return (
    <svg style={{ display: 'block', width: 10, height: 10, ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
function ChevronRightSvg() {
  return (
    <svg style={{ display: 'block', width: 10, height: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
function XCircleSvg() {
  return (
    <svg style={{ display: 'block', width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}
function CalSvg() {
  return (
    <svg style={{ display: 'block', width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function TaskAvatar({ user }) {
  if (!user) return null
  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  return (
    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(242,237,227,0.1)', color: C.crema, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title={user.name}>
      {initials}
    </div>
  )
}

function MiniTaskCard({ task, canWrite, onEdit, onDelete, onMove }) {
  const [hovered, setHovered] = useState(false)
  const overdue     = isOverdue(task.dueDate)
  const prio        = TASK_PRIORITY[task.priority] || TASK_PRIORITY.low
  const isCancelled = task.status === 'cancelled'
  const isDone      = task.status === 'done'
  const canNext     = Boolean(NEXT_STATUS[task.status])
  const canPrev     = Boolean(PREV_STATUS[task.status])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 10px 10px 0', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, opacity: isCancelled || isDone ? 0.65 : 1 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35, flex: 1, color: isCancelled || isDone ? C.piedra : C.crema, textDecoration: isCancelled || isDone ? 'line-through' : 'none' }}>
          {task.title}
        </p>
        {canWrite && !isCancelled && hovered && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <button onClick={() => onEdit(task)} style={{ padding: 4, borderRadius: '0 4px 4px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
              onMouseEnter={e => e.currentTarget.style.color = C.arena}
              onMouseLeave={e => e.currentTarget.style.color = C.piedra}
            >
              <PencilSvg />
            </button>
            <button onClick={() => onDelete(task)} style={{ padding: 4, borderRadius: '0 4px 4px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
              onMouseEnter={e => e.currentTarget.style.color = C.err}
              onMouseLeave={e => e.currentTarget.style.color = C.piedra}
            >
              <TrashSvg />
            </button>
          </div>
        )}
      </div>

      {isCancelled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.err }}>
          <XCircleSvg />
          <span style={{ fontSize: 10, fontWeight: 600 }}>Proyecto cancelado</span>
        </div>
      )}

      {!isCancelled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: '0 4px 4px 0', background: prio.bg, color: prio.color }}>{prio.label}</span>
          {task.dueDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: overdue && !isDone ? C.err : C.piedra }}>
              <CalSvg />
              {new Date(task.dueDate.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {task.assignedTo && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <TaskAvatar user={task.assignedTo} />
              <span style={{ fontSize: 11, color: C.piedra }}>{task.assignedTo.name.split(' ')[0]}</span>
            </span>
          )}
        </div>
      )}

      {canWrite && !isCancelled && hovered && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 6, borderTop: `1px solid ${C.linea}` }}>
          <button disabled={!canPrev} onClick={() => canPrev && onMove(task, PREV_STATUS[task.status])}
            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: canPrev ? C.piedra : 'transparent', background: 'none', border: 'none', cursor: canPrev ? 'pointer' : 'default', padding: '2px 4px', borderRadius: '0 4px 4px 0' }}
          >
            <ChevronRightSvg style={{ transform: 'rotate(180deg)' }} /> Atrás
          </button>
          <div style={{ flex: 1 }} />
          <button disabled={!canNext} onClick={() => canNext && onMove(task, NEXT_STATUS[task.status])}
            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: canNext ? C.piedra : 'transparent', background: 'none', border: 'none', cursor: canNext ? 'pointer' : 'default', padding: '2px 4px', borderRadius: '0 4px 4px 0' }}
          >
            Siguiente <ChevronRightSvg />
          </button>
        </div>
      )}
    </div>
  )
}

function StatusDropdown({ project, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const allowed = ALLOWED_TRANSITIONS[project.status] || []
  const s = PROJECT_STATUS[project.status] || { label: project.status, bg: 'transparent', color: C.piedra }

  if (!allowed.length) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '0 6px 6px 0', fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
        {s.label}
      </span>
    )
  }

  function handleToggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const dropW = 160, dropH = allowed.length * 36
      let top = r.bottom + 4, left = r.left
      if (left + dropW > window.innerWidth - 8) left = r.right - dropW
      if (top + dropH > window.innerHeight - 8) top = r.top - dropH - 4
      setPos({ top, left })
    }
    setOpen(o => !o)
  }

  return (
    <div style={{ display: 'inline-block' }}>
      {open && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 12px 12px 0', padding: '4px 0', minWidth: 152, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            {allowed.map(st => (
              <button key={st} onClick={() => { onUpdate(st); setOpen(false) }}
                style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 12, color: C.arena, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.background = C.s3}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_DOT_COLOR[st], flexShrink: 0 }} />
                {PROJECT_STATUS[st]?.label || st}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
      <button ref={btnRef} onClick={handleToggle}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: '0 6px 6px 0', fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: 'none', cursor: 'pointer' }}
      >
        {s.label}
        <ChevronSvg />
      </button>
    </div>
  )
}

function ProjectTasksPanel({ tasks, canWrite, onAdd, onEdit, onDelete, onMove }) {
  const total = tasks.length
  const done  = tasks.filter(t => t.status === 'done').length

  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.linea}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena }}>
            Tareas <span style={{ color: C.piedra, fontWeight: 400 }}>({total})</span>
          </span>
          {total > 0 && (
            <span style={{ fontSize: 11, color: C.piedra }}>{done}/{total} completadas</span>
          )}
        </div>
        {canWrite && (
          <button onClick={onAdd}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: C.crema, color: C.bg, borderRadius: '0 9px 9px 0', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            <PlusSvg /> Nueva tarea
          </button>
        )}
      </div>

      {total === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 12 }}>
          <p style={{ fontSize: 13, color: C.piedra }}>Sin tareas en este proyecto</p>
          {canWrite && (
            <button onClick={onAdd}
              style={{ padding: '8px 18px', background: C.crema, color: C.bg, borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              Agregar tarea
            </button>
          )}
        </div>
      ) : (
        <div style={{ padding: 16 }} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TASK_COLS.map(col => {
            const colTasks = tasks.filter(t => col.id === 'done'
              ? t.status === 'done' || t.status === 'cancelled'
              : t.status === col.id)
            return (
              <div key={col.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: col.color }}>{col.label}</span>
                  <span style={{ fontSize: 11, color: C.piedra, marginLeft: 'auto' }}>{colTasks.length}</span>
                </div>
                {colTasks.length === 0 ? (
                  <div style={{ border: `1px dashed ${C.linea}`, borderRadius: '0 10px 10px 0', padding: 12, textAlign: 'center', fontSize: 12, color: C.piedra }}>
                    Sin tareas
                  </div>
                ) : (
                  colTasks.map(t => (
                    <MiniTaskCard key={t.id} task={t} canWrite={canWrite} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
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
  const isMember = user?.role === 'member'
  const canWrite = !isMember
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [editOpen, setEditOpen]         = useState(false)
  const [newQuoteOpen, setNewQuoteOpen] = useState(false)
  const [taskModal, setTaskModal]       = useState(null)

  const del = useMutation({
    mutationFn: () => deleteProject(id),
    onSuccess: () => { qc.invalidateQueries(['projects']); toast('Proyecto eliminado', 'success'); navigate('/projects') },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al eliminar', 'error')
  })

  const changeStatus = useMutation({
    mutationFn: (status) => updateProject(id, { status }),
    onSuccess: () => { qc.invalidateQueries(['project', id]); qc.invalidateQueries(['projects']) },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al cambiar estado', 'error')
  })

  async function handleStatusChange(status) {
    if (status !== 'finished' && status !== 'cancelled') { changeStatus.mutate(status); return }

    const isCancelling = status === 'cancelled'
    const pending = isCancelling
      ? projectTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled')
      : projectTasks.filter(t => t.status !== 'done')

    if (pending.length === 0) { changeStatus.mutate(status); return }

    const body = (
      <div style={{ fontSize: 13 }}>
        <p style={{ fontSize: 11, color: C.piedra, marginBottom: 6 }}>
          {pending.length} tarea{pending.length !== 1 ? 's' : ''} {isCancelling ? 'en curso o pendiente:' : 'sin completar:'}
        </p>
        {pending.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.arena, marginBottom: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.piedra, flexShrink: 0 }} />
            {t.title}
          </div>
        ))}
      </div>
    )

    const ok = await confirm(
      isCancelling ? '¿Cancelar el proyecto? Las tareas pendientes también serán canceladas.'
                   : '¿Finalizar el proyecto? Las tareas pendientes se marcarán como completadas.',
      { confirmLabel: isCancelling ? 'Cancelar proyecto' : 'Finalizar y completar', danger: isCancelling, body }
    )
    if (!ok) return
    const newTaskStatus = isCancelling ? 'cancelled' : 'done'
    for (const t of pending) { try { await updateTask(t.id, { status: newTaskStatus }) } catch {} }
    changeStatus.mutate(status)
    qc.invalidateQueries(['tasks', { projectId: id }])
  }

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id).then(r => r.data.data)
  })

  const { data: quotesRes } = useQuery({
    queryKey: ['quotes', { projectId: id }],
    queryFn: () => getQuotes({ projectId: id, limit: 100 }).then(r => r.data),
    enabled: Boolean(id) && !isMember,
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

  if (isLoading) return <div style={{ padding: 32, fontSize: 13, color: C.piedra }}>Cargando...</div>
  if (!project) return <div style={{ padding: 32, fontSize: 13, color: C.piedra }}>Proyecto no encontrado</div>

  const quotes = quotesRes?.data || []

  const thStyle = { background: C.linea, color: C.crema, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 20px', textAlign: 'left', whiteSpace: 'nowrap' }
  const tdStyle = { padding: '12px 20px', borderBottom: `1px solid ${C.linea}`, color: C.arena, fontSize: 13 }

  return (
    <div style={{ padding: '24px', fontFamily: 'Geist, system-ui, sans-serif' }}>
      {/* Back */}
      <button onClick={() => navigate('/projects')}
        style={{ fontSize: 13, color: C.piedra, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = C.arena}
        onMouseLeave={e => e.currentTarget.style.color = C.piedra}
      >
        ← Proyectos
      </button>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.crema, lineHeight: 1.2, margin: '0 0 8px' }}>{project.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <StatusDropdown project={project} onUpdate={handleStatusChange} />
              {project.client && (
                <Link to={`/clients/${project.client.id}`}
                  style={{ fontSize: 13, color: C.info, textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  {project.client.name}
                </Link>
              )}
            </div>
          </div>
        </div>

        {canWrite && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setEditOpen(true)}
              style={{ padding: '6px 14px', border: `1px solid ${C.linea}`, borderRadius: '0 8px 8px 0', fontSize: 12, fontWeight: 500, color: C.arena, background: 'none', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.crema }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.arena }}
            >
              Editar
            </button>
            <button
              onClick={async () => { if (await confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.', { confirmLabel: 'Eliminar', danger: true })) del.mutate() }}
              disabled={del.isPending}
              style={{ padding: '6px 14px', borderRadius: '0 8px 8px 0', fontSize: 12, fontWeight: 500, background: 'rgba(229,131,115,0.1)', color: C.err, border: '1px solid rgba(229,131,115,0.25)', cursor: 'pointer' }}
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ ...card, padding: 20 }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, marginBottom: 16 }}>Información</p>
            <dl style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {project.budget != null && (
                <div>
                  <dt style={{ fontSize: 10, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Presupuesto</dt>
                  <dd style={{ fontSize: 14, fontWeight: 600, color: C.crema, fontFamily: CIFRAS }}>${Number(project.budget).toLocaleString('es-AR')}</dd>
                </div>
              )}
              {project.startDate && (
                <div>
                  <dt style={{ fontSize: 10, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Fecha inicio</dt>
                  <dd style={{ fontSize: 13, color: C.arena }}>{new Date(project.startDate.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR')}</dd>
                </div>
              )}
              {project.endDate && (
                <div>
                  <dt style={{ fontSize: 10, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Fecha fin</dt>
                  <dd style={{ fontSize: 13, color: C.arena }}>{new Date(project.endDate.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR')}</dd>
                </div>
              )}
              {project.description && (
                <div>
                  <dt style={{ fontSize: 10, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Descripción</dt>
                  <dd style={{ fontSize: 13, color: C.arena, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{project.description}</dd>
                </div>
              )}
            </dl>
          </div>

          <div style={{ ...card, padding: 20 }}>
            <AttachmentsPanel entityType="project" entityId={id} />
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

          {!isMember && (
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.linea}` }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena }}>
                  Presupuesto <span style={{ color: C.piedra, fontWeight: 400 }}>({quotes.length})</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {canWrite && (
                    <button onClick={() => setNewQuoteOpen(true)}
                      style={{ padding: '6px 12px', background: C.crema, color: C.bg, borderRadius: '0 9px 9px 0', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                    >
                      Asignar
                    </button>
                  )}
                  {quotes.length > 0 && (
                    <Link to="/quotes" style={{ fontSize: 12, color: C.info, textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                    >
                      Ver todos
                    </Link>
                  )}
                </div>
              </div>
              {quotes.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 12 }}>
                  <p style={{ fontSize: 13, color: C.piedra }}>Sin presupuesto asignado</p>
                  {canWrite && (
                    <button onClick={() => setNewQuoteOpen(true)}
                      style={{ padding: '8px 18px', background: C.crema, color: C.bg, borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                    >
                      Asignar presupuesto
                    </button>
                  )}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['N°', 'Estado', 'Total'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map(q => {
                      const ds = DOC_STATUS[q.status] || { label: q.status, bg: 'transparent', color: C.piedra }
                      return (
                        <tr key={q.id}
                          onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = C.s2)}
                          onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = 'transparent')}
                        >
                          <td style={{ ...tdStyle, fontFamily: "'Geist Mono', monospace", fontWeight: 500, color: C.crema }}>{q.number}</td>
                          <td style={tdStyle}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '0 6px 6px 0', fontSize: 10.5, fontWeight: 600, background: ds.bg, color: ds.color }}>
                              {ds.label}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, fontFamily: CIFRAS, fontWeight: 600, color: C.crema }}>
                            {q.total != null ? `$${Number(q.total).toLocaleString('es-AR')}` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {editOpen && (
        <ProjectModal
          project={project}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); qc.invalidateQueries(['project', id]); qc.invalidateQueries(['projects']) }}
        />
      )}

      {newQuoteOpen && (
        <QuoteModal
          initialClientId={project.client?.id}
          initialProjectId={id}
          onClose={() => setNewQuoteOpen(false)}
          onSaved={() => { setNewQuoteOpen(false); qc.invalidateQueries(['quotes', { projectId: id }]); qc.invalidateQueries(['quotes']) }}
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
