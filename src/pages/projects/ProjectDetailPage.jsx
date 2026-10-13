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
  draft:     { label: 'Borrador',   color: '#8C877E' },
  sent:      { label: 'Enviado',    color: '#8EB1DE' },
  approved:  { label: 'Aprobado',   color: '#F2EDE3' },
  rejected:  { label: 'Rechazado', color: '#E58373' },
  expired:   { label: 'Vencido',   color: '#E2B663' },
  pending:   { label: 'Pendiente', color: '#E2B663' },
  paid:      { label: 'Pagado',    color: '#7DBE93' },
  overdue:   { label: 'Vencido',   color: '#E58373' },
  partial:   { label: 'Parcial',   color: '#E2B663' },
  cancelled: { label: 'Cancelado', color: '#8C877E' },
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

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtMoney(amount, currency) {
  const isARS = !currency || currency === 'ARS'
  return Number(amount).toLocaleString('es-AR', {
    minimumFractionDigits: isARS ? 0 : 2,
    maximumFractionDigits: isARS ? 0 : 2,
  })
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
function PaperclipSvg() {
  return (
    <svg style={{ display: 'block', width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}
function CheckSvg() {
  return (
    <svg style={{ display: 'block', width: 11, height: 11, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function CloseSvg() {
  return (
    <svg style={{ display: 'block', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
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

function MiniTaskCard({ task, canWrite, onEdit, onDelete, onMove }) {
  const [hovered, setHovered] = useState(false)
  const overdue     = isOverdue(task.dueDate)
  const prio        = TASK_PRIORITY[task.priority] || TASK_PRIORITY.low
  const isCancelled = task.status === 'cancelled'
  const isDone      = task.status === 'done'
  const canNext     = Boolean(NEXT_STATUS[task.status])
  const canPrev     = Boolean(PREV_STATUS[task.status])

  const fmtShort = iso => new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: '2-digit' })

  // Completed / cancelled — lista compacta
  if (isDone || isCancelled) {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderBottom: `1px solid ${C.linea}`, opacity: isCancelled ? 0.5 : 1 }}
      >
        <span style={{ color: isCancelled ? C.piedra : C.ok, flexShrink: 0 }}><CheckSvg /></span>
        <p style={{ flex: 1, fontSize: 12.5, color: C.piedra, textDecoration: isCancelled ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
          {task.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {hovered && canWrite && !isCancelled ? (
            <div style={{ display: 'flex', gap: 2 }}>
              <button onClick={() => onEdit(task)} style={{ padding: 3, background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, borderRadius: '0 3px 3px 0' }}
                onMouseEnter={e => e.currentTarget.style.color = C.arena}
                onMouseLeave={e => e.currentTarget.style.color = C.piedra}
              ><PencilSvg /></button>
              <button onClick={() => onDelete(task)} style={{ padding: 3, background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, borderRadius: '0 3px 3px 0' }}
                onMouseEnter={e => e.currentTarget.style.color = C.err}
                onMouseLeave={e => e.currentTarget.style.color = C.piedra}
              ><TrashSvg /></button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.piedra }}>
              {task.assignedTo && <span>{task.assignedTo.name.split(' ')[0]}</span>}
              {task.dueDate && <span>{fmtShort(task.dueDate)}</span>}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Pendiente / En progreso — card
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 10px 10px 0', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35, color: C.crema, margin: 0 }}>{task.title}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: '0 4px 4px 0', background: prio.bg, color: prio.color, whiteSpace: 'nowrap' }}>
          {prio.label}
        </span>
        {task.assignedTo && (
          <span style={{ fontSize: 11, color: C.arena }}>{task.assignedTo.name.split(' ')[0]}</span>
        )}
        {task.dueDate && (
          <span style={{ fontSize: 11, color: overdue ? C.err : C.piedra }}>
            {task.assignedTo && <span style={{ color: C.linea, marginRight: 4 }}>·</span>}
            {fmtShort(task.dueDate)}
          </span>
        )}
        {canWrite && hovered && (
          <div style={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>
            <button onClick={() => onEdit(task)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, borderRadius: '0 4px 4px 0' }}
              onMouseEnter={e => e.currentTarget.style.color = C.arena}
              onMouseLeave={e => e.currentTarget.style.color = C.piedra}
            ><PencilSvg /></button>
            <button onClick={() => onDelete(task)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, borderRadius: '0 4px 4px 0' }}
              onMouseEnter={e => e.currentTarget.style.color = C.err}
              onMouseLeave={e => e.currentTarget.style.color = C.piedra}
            ><TrashSvg /></button>
          </div>
        )}
      </div>

      {canWrite && hovered && (
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 8, borderTop: `1px solid ${C.linea}` }}>
          <button disabled={!canPrev} onClick={() => canPrev && onMove(task, PREV_STATUS[task.status])}
            style={{ fontSize: 10, color: canPrev ? C.piedra : 'transparent', background: 'none', border: 'none', cursor: canPrev ? 'pointer' : 'default', padding: '0 4px', borderRadius: '0 4px 4px 0' }}
            onMouseEnter={e => { if (canPrev) e.currentTarget.style.color = C.arena }}
            onMouseLeave={e => { if (canPrev) e.currentTarget.style.color = C.piedra }}
          >← Atrás</button>
          <div style={{ flex: 1 }} />
          <button disabled={!canNext} onClick={() => canNext && onMove(task, NEXT_STATUS[task.status])}
            style={{ fontSize: 10, color: canNext ? C.piedra : 'transparent', background: 'none', border: 'none', cursor: canNext ? 'pointer' : 'default', padding: '0 4px', borderRadius: '0 4px 4px 0' }}
            onMouseEnter={e => { if (canNext) e.currentTarget.style.color = C.arena }}
            onMouseLeave={e => { if (canNext) e.currentTarget.style.color = C.piedra }}
          >Siguiente →</button>
        </div>
      )}
    </div>
  )
}

function ProjectTasksPanel({ tasks, canWrite, onAdd, onEdit, onDelete, onMove }) {
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <div className="grid grid-cols-1 md:grid-cols-3">
        {TASK_COLS.map((col, colIdx) => {
          const isLast = colIdx === TASK_COLS.length - 1
          const colTasks = col.id === 'done'
            ? tasks.filter(t => t.status === 'done' || t.status === 'cancelled')
            : tasks.filter(t => t.status === col.id)

          return (
            <div key={col.id} style={{ borderRight: isLast ? 'none' : `1px solid ${C.linea}`, display: 'flex', flexDirection: 'column', borderBottom: isLast ? 'none' : undefined }}>
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 44, borderBottom: `1px solid ${C.linea}`, background: C.s2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: col.color }}>{col.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.piedra, fontWeight: 600 }}>{colTasks.length}</span>
                  {col.id === 'todo' && canWrite && (
                    <button onClick={onAdd}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, background: C.crema, color: C.bg, borderRadius: '0 5px 5px 0', border: 'none', cursor: 'pointer' }}
                    ><PlusSvg /></button>
                  )}
                </div>
              </div>

              {/* Tasks */}
              {col.id === 'done' ? (
                <div style={{ flex: 1 }}>
                  {colTasks.length === 0 ? (
                    <p style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: C.piedra, margin: 0 }}>Sin tareas</p>
                  ) : (
                    colTasks.map(t => (
                      <MiniTaskCard key={t.id} task={t} canWrite={canWrite} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
                    ))
                  )}
                </div>
              ) : (
                <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {colTasks.length === 0 ? (
                    <div style={{ border: `1px dashed ${C.linea}`, borderRadius: '0 10px 10px 0', padding: 16, textAlign: 'center', fontSize: 12, color: C.piedra }}>
                      Sin tareas
                    </div>
                  ) : (
                    colTasks.map(t => (
                      <MiniTaskCard key={t.id} task={t} canWrite={canWrite} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
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

  const [editOpen, setEditOpen]       = useState(false)
  const [newQuoteOpen, setNewQuoteOpen] = useState(false)
  const [taskModal, setTaskModal]     = useState(null)
  const [attachOpen, setAttachOpen]   = useState(false)

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

  if (isLoading) return <div style={{ padding: 32, fontSize: 13, color: C.piedra }}>Cargando...</div>
  if (!project)  return <div style={{ padding: 32, fontSize: 13, color: C.piedra }}>Proyecto no encontrado</div>

  const quotes     = quotesRes?.data || []
  const firstQuote = quotes[0]
  const totalTasks = projectTasks.length
  const doneTasks  = projectTasks.filter(t => t.status === 'done').length
  const daysLeft   = project.endDate
    ? Math.ceil((new Date(project.endDate.slice(0, 10) + 'T12:00:00') - new Date(new Date().toDateString())) / 86400000)
    : null

  return (
    <div style={{ padding: '24px', fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 13, color: C.piedra }}>
        <Link to="/projects"
          style={{ color: C.piedra, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = C.arena}
          onMouseLeave={e => e.currentTarget.style.color = C.piedra}
        >Proyectos</Link>
        {project.client && (
          <>
            <span style={{ opacity: 0.4 }}>/</span>
            <Link to={`/clients/${project.client.id}`}
              style={{ color: C.piedra, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = C.arena}
              onMouseLeave={e => e.currentTarget.style.color = C.piedra}
            >{project.client.name}</Link>
          </>
        )}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.crema, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>{project.title}</h1>
          <StatusDropdown project={project} onUpdate={handleStatusChange} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          <button onClick={() => setAttachOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', fontSize: 12, color: C.piedra, background: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.arena }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.piedra }}
          >
            <PaperclipSvg /> Archivos
          </button>
          {canWrite && (
            <>
              <button onClick={() => setEditOpen(true)}
                style={{ padding: '7px 16px', border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 500, color: C.arena, background: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.crema }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.arena }}
              >Editar</button>
              <button onClick={() => setTaskModal({ defaultStatus: 'todo' })}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: C.crema, color: C.bg, borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                <PlusSvg /> Nueva tarea
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12, marginBottom: 24 }}>

        {/* Tareas completadas */}
        <div style={{ ...card, padding: '20px 24px' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, marginBottom: 14 }}>Tareas completadas</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
            <span style={{ fontFamily: CIFRAS, fontSize: 34, fontWeight: 700, color: C.crema, lineHeight: 1 }}>{doneTasks}</span>
            <span style={{ fontSize: 14, color: C.piedra }}>de {totalTasks}</span>
          </div>
          {totalTasks > 0 && (
            <div style={{ height: 4, borderRadius: 999, background: C.s3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round((doneTasks / totalTasks) * 100)}%`, background: doneTasks === totalTasks ? C.ok : C.crema, borderRadius: 999, transition: 'width 0.5s' }} />
            </div>
          )}
        </div>

        {/* Presupuesto */}
        {!isMember && (
          <div style={{ ...card, padding: '20px 24px' }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, marginBottom: 14 }}>
              {firstQuote ? `Presupuesto P-${String(firstQuote.number).padStart(4, '0')}` : 'Presupuesto'}
            </p>
            {firstQuote ? (
              <>
                <p style={{ fontFamily: CIFRAS, fontSize: 28, fontWeight: 700, color: C.crema, lineHeight: 1, marginBottom: 8 }}>
                  ${fmtMoney(firstQuote.total, firstQuote.currency)}
                </p>
                {DOC_STATUS[firstQuote.status] && (
                  <span style={{ fontSize: 11.5, color: DOC_STATUS[firstQuote.status].color }}>
                    {DOC_STATUS[firstQuote.status].label}
                  </span>
                )}
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: C.piedra, marginBottom: 12 }}>Sin presupuesto</p>
                {canWrite && (
                  <button onClick={() => setNewQuoteOpen(true)}
                    style={{ padding: '6px 14px', background: C.crema, color: C.bg, borderRadius: '0 8px 8px 0', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  >Asignar</button>
                )}
              </>
            )}
          </div>
        )}

        {/* Responsables */}
        <div style={{ ...card, padding: '20px 24px' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, marginBottom: 14 }}>Responsables</p>
          {project.members?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {project.members.slice(0, 3).map(m => {
                const u = m.user || m
                const initials = u.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
                return (
                  <div key={m.userId || u.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(242,237,227,0.08)', border: `1px solid ${C.linea}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: C.crema, flexShrink: 0 }}>
                      {initials}
                    </div>
                    <span style={{ fontSize: 13, color: C.arena }}>{u.name}</span>
                  </div>
                )
              })}
              {project.members.length > 3 && (
                <span style={{ fontSize: 11, color: C.piedra }}>+{project.members.length - 3} más</span>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: C.piedra }}>Sin responsables</p>
          )}
        </div>

        {/* Días para la entrega */}
        <div style={{ ...card, padding: '20px 24px' }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, marginBottom: 14 }}>Días para la entrega</p>
          {daysLeft !== null ? (
            <>
              <p style={{ fontFamily: CIFRAS, fontSize: 34, fontWeight: 700, lineHeight: 1, marginBottom: 8, color: daysLeft < 0 ? C.err : daysLeft <= 7 ? C.warn : C.crema }}>
                {Math.abs(daysLeft)}
              </p>
              <p style={{ fontSize: 11.5, color: daysLeft < 0 ? C.err : C.piedra }}>
                {daysLeft < 0 ? `Vencido · ${fmtDate(project.endDate)}` : fmtDate(project.endDate)}
              </p>
            </>
          ) : (
            <p style={{ fontSize: 13, color: C.piedra }}>Sin fecha definida</p>
          )}
        </div>
      </div>

      {/* Kanban */}
      <ProjectTasksPanel
        tasks={projectTasks}
        canWrite={canWrite}
        onAdd={() => setTaskModal({ defaultStatus: 'todo' })}
        onEdit={(t) => setTaskModal({ task: t })}
        onDelete={async (t) => {
          if (await confirm(`¿Eliminar "${t.title}"?`, { confirmLabel: 'Eliminar', danger: true }))
            deleteTaskMutation.mutate(t.id)
        }}
        onMove={(t, status) => moveTaskMutation.mutate({ taskId: t.id, status })}
      />

      {/* Eliminar */}
      {canWrite && (
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={async () => {
              if (await confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.', { confirmLabel: 'Eliminar', danger: true }))
                del.mutate()
            }}
            disabled={del.isPending}
            style={{ padding: '6px 14px', borderRadius: '0 8px 8px 0', fontSize: 12, background: 'rgba(229,131,115,0.08)', color: C.err, border: '1px solid rgba(229,131,115,0.2)', cursor: 'pointer', opacity: del.isPending ? 0.5 : 1 }}
          >
            Eliminar proyecto
          </button>
        </div>
      )}

      {/* Modals */}
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

      {/* Archivos overlay */}
      {attachOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.65)' }}>
          <div style={{ width: '100%', maxWidth: 440, background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.linea}` }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.crema, margin: 0 }}>Archivos adjuntos</p>
              <button onClick={() => setAttachOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = C.arena}
                onMouseLeave={e => e.currentTarget.style.color = C.piedra}
              ><CloseSvg /></button>
            </div>
            <div style={{ padding: 20 }}>
              <AttachmentsPanel entityType="project" entityId={id} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
