import { useState } from 'react'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  pointerWithin,
} from '@dnd-kit/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, updateTask, deleteTask, getTaskHistory } from '../../api/tasks'
import { getMembers } from '../../api/members'
import { getProjects } from '../../api/projects'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../components/ConfirmDialog'
import DatePicker from '../../components/DatePicker'
import TaskModal from './TaskModal'
import { MasIcon } from '../../components/DuIcons'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }
const dpClass = "h-[34px] px-3 bg-[#141415] border border-[#2C2C2F] rounded-[0_9px_9px_0] text-[13px] outline-none min-w-[120px]"

// ── inline SVGs ────────────────────────────────────────────────────────────────

function TasksSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}
function TableSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  )
}
function ClockSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function PlusSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
function PencilSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
function TrashSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  )
}
function CalSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function FolderSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function ChevronRSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
function ChevronDownSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
function CheckCircleSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
// Solid icons for task states
function CheckCircleFill({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.707-1.293a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 1.414-1.414L10 7.586l5.293-5.293a1 1 0 0 1 1.414 0z"/>
    </svg>
  )
}
function XCircleFill({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.707 12.293a1 1 0 0 1-1.414 1.414L12 13.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L10.586 12 8.293 9.707a1 1 0 0 1 1.414-1.414L12 10.586l2.293-2.293a1 1 0 0 1 1.414 1.414L13.414 12l2.293 2.293z"/>
    </svg>
  )
}
function XMarkSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ── constants ──────────────────────────────────────────────────────────────────

const COLUMNS = [
  { id: 'todo',        label: 'Pendiente',   dotColor: C.piedra, labelColor: C.piedra, colBg: 'rgba(30,30,32,0.7)',      overBg: 'rgba(242,237,227,0.05)', overBorder: C.arena },
  { id: 'in_progress', label: 'En progreso', dotColor: C.warn,   labelColor: C.warn,   colBg: 'rgba(226,182,99,0.05)',  overBg: 'rgba(226,182,99,0.1)',  overBorder: C.warn  },
  { id: 'done',        label: 'Completada',  dotColor: C.ok,     labelColor: C.ok,     colBg: 'rgba(125,190,147,0.05)', overBg: 'rgba(125,190,147,0.1)', overBorder: C.ok    },
]

const PRIORITY = {
  high:   { label: 'Alta',  bg: 'rgba(229,131,115,0.12)', color: C.err },
  medium: { label: 'Media', bg: 'rgba(226,182,99,0.12)',  color: C.warn },
  low:    { label: 'Baja',  bg: 'rgba(140,135,126,0.12)', color: C.piedra },
}

const NEXT_STATUS = { todo: 'in_progress', in_progress: 'done', done: null, cancelled: null }
const PREV_STATUS = { todo: null, in_progress: 'todo', done: 'in_progress', cancelled: null }

const STATUS_LABELS = {
  todo:        'Pendiente',
  in_progress: 'En progreso',
  done:        'Completada',
  cancelled:   'Cancelada',
}

const STATUS_STYLE = {
  todo:        { bg: 'rgba(140,135,126,0.12)', color: C.piedra },
  in_progress: { bg: 'rgba(226,182,99,0.12)',  color: C.warn },
  done:        { bg: 'rgba(125,190,147,0.12)', color: C.ok },
  cancelled:   { bg: 'rgba(229,131,115,0.12)', color: C.err },
}

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function fmtDateTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) + ', ' +
         d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function isOverdue(iso) {
  if (!iso) return false
  return new Date(iso) < new Date(new Date().toDateString())
}

function Avatar({ user }) {
  if (!user) return null
  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  return (
    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(242,237,227,0.1)', color: C.crema, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title={user.name}>
      {initials}
    </div>
  )
}

function actionLabel(fromStatus, toStatus) {
  if (!fromStatus) return { verb: 'creó la tarea', color: C.piedra }
  if (toStatus === 'done')                                  return { verb: 'completó la tarea',              color: C.ok }
  if (toStatus === 'cancelled')                             return { verb: 'canceló la tarea',               color: C.err }
  if (toStatus === 'in_progress' && fromStatus === 'done')  return { verb: 'regresó la tarea a en progreso', color: C.warn }
  if (toStatus === 'in_progress')                           return { verb: 'inició la tarea',                color: C.warn }
  if (toStatus === 'todo')                                  return { verb: 'regresó la tarea a pendiente',   color: C.piedra }
  return { verb: `movió a ${STATUS_LABELS[toStatus] ?? toStatus}`, color: C.piedra }
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
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', fontSize: 13, color: C.piedra }}>Cargando historial...</div>
  }

  if (history.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10, color: C.piedra }}>
        <ClockSvg style={{ width: 36, height: 36, opacity: 0.3 }} />
        <p style={{ fontSize: 13 }}>Aún no hay movimientos registrados.</p>
      </div>
    )
  }

  const filtered = history.filter(e => {
    const d = new Date(e.createdAt)
    if (fromDate && d < new Date(fromDate))             return false
    if (toDate   && d > new Date(toDate + 'T23:59:59')) return false
    return true
  })

  const shown     = filtered.slice(0, visible)
  const remaining = filtered.length - visible

  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filtros fecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <DatePicker value={fromDate} onChange={e => { setFromDate(e.target.value); setVisible(25) }} placeholder="Desde" className={dpClass} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <DatePicker value={toDate} onChange={e => { setToDate(e.target.value); setVisible(25) }} placeholder="Hasta" className={dpClass} />
        </div>
        {(fromDate || toDate) && (
          <button onClick={() => { setFromDate(''); setToDate(''); setVisible(25) }}
            style={{ fontSize: 12, color: C.piedra, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            onMouseEnter={e => e.currentTarget.style.color = C.arena}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}
          >
            Limpiar
          </button>
        )}
        <span style={{ fontSize: 11, color: C.piedra, marginLeft: 'auto' }}>
          {filtered.length} movimiento{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 10, color: C.piedra }}>
          <ClockSvg style={{ width: 28, height: 28, opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>Sin movimientos en ese rango de fechas.</p>
        </div>
      ) : (
        <>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {shown.map(entry => {
              const { verb, color } = actionLabel(entry.fromStatus, entry.toStatus)
              const ss = entry.toStatus ? STATUS_STYLE[entry.toStatus] : null
              return (
                <li key={entry.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.linea}`, fontSize: 13 }}>
                  <div style={{ width: 10, height: 16, flexShrink: 0, marginTop: 2, borderLeft: `2.5px solid ${C.piedra}`, borderBottom: `2.5px solid ${C.piedra}` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0 6px', rowGap: 2 }}>
                      <span style={{ fontWeight: 600, color: C.crema }}>{entry.user.name}</span>
                      <span style={{ color }}>{verb}</span>
                      {ss && (
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: '0 4px 4px 0', background: ss.bg, color: ss.color }}>
                          {STATUS_LABELS[entry.toStatus]}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11.5, color: C.piedra, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{entry.task.title}"</p>
                    <p style={{ fontSize: 11, color: C.piedra, opacity: 0.7, marginTop: 3 }}>{fmtDateTime(entry.createdAt)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
          {remaining > 0 && (
            <button onClick={() => setVisible(v => v + 25)}
              style={{ marginTop: 4, width: '100%', padding: '10px 0', background: 'none', border: `1px dashed ${C.linea}`, borderRadius: '0 12px 12px 0', color: C.piedra, fontSize: 12.5, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
            >
              Mostrar más ({remaining} restante{remaining !== 1 ? 's' : ''})
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ── TaskCard ──────────────────────────────────────────────────────────────────

function TaskCard({ task, onEdit, onDelete, onMove, isOverlay = false, justCompleted = false }) {
  const overdue     = isOverdue(task.dueDate)
  const prio        = PRIORITY[task.priority] || PRIORITY.medium
  const isDone      = task.status === 'done'
  const isCancelled = task.status === 'cancelled'
  const canNext     = Boolean(NEXT_STATUS[task.status])
  const canPrev     = Boolean(PREV_STATUS[task.status])

  const cardBg    = isCancelled ? 'rgba(229,131,115,0.04)' : isDone ? 'rgba(125,190,147,0.04)' : C.s2
  const cardBorder = isCancelled ? 'rgba(229,131,115,0.2)' : isDone ? 'rgba(125,190,147,0.2)' : C.linea

  return (
    <div style={{
      position: 'relative', background: cardBg, border: `1px solid ${cardBorder}`,
      borderRadius: '0 12px 12px 0', padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 10,
      opacity: isCancelled ? 0.7 : 1,
      boxShadow: !isOverlay ? undefined : undefined,
    }}>
      {/* Ring animado al completar */}
      {justCompleted && !isOverlay && (
        <motion.div
          style={{ position: 'absolute', inset: 0, borderRadius: '0 12px 12px 0', pointerEvents: 'none' }}
          initial={{ opacity: 1, boxShadow: `0 0 0 2px ${C.ok}` }}
          animate={{ opacity: 0, boxShadow: '0 0 0 6px transparent' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}

      {/* Prioridad + acciones */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {isCancelled ? (
          <XCircleFill style={{ width: 14, height: 14, color: C.err, flexShrink: 0 }} />
        ) : isDone ? (
          <CheckCircleFill style={{ width: 14, height: 14, color: C.ok, flexShrink: 0 }} />
        ) : (
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: '0 5px 5px 0', background: prio.bg, color: prio.color }}>
            {prio.label}
          </span>
        )}
        {!isOverlay && !isCancelled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button onClick={() => onEdit(task)}
              style={{ padding: 4, borderRadius: '0 5px 5px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.color = C.arena}
              onMouseLeave={e => e.currentTarget.style.color = C.piedra}
            >
              <PencilSvg style={{ width: 12, height: 12 }} />
            </button>
            <button onClick={() => onDelete(task)}
              style={{ padding: 4, borderRadius: '0 5px 5px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.color = C.err}
              onMouseLeave={e => e.currentTarget.style.color = C.piedra}
            >
              <TrashSvg style={{ width: 12, height: 12 }} />
            </button>
          </div>
        )}
      </div>

      {/* Título */}
      <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35, color: isCancelled || isDone ? C.piedra : C.crema, textDecoration: isCancelled ? 'line-through' : 'none' }}>
        {task.title}
      </p>

      {/* Badge cancelada */}
      {isCancelled && (
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: '0 5px 5px 0', background: 'rgba(229,131,115,0.12)', color: C.err, width: 'fit-content' }}>
          Proyecto cancelado
        </span>
      )}

      {/* Descripción */}
      {task.description && !isDone && !isCancelled && (
        <p style={{ fontSize: 11.5, color: C.piedra, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</p>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 10px' }}>
        {isDone && task.completedAt ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.ok }}>
            <CheckCircleSvg style={{ width: 11, height: 11, flexShrink: 0 }} />
            {fmtDateTime(task.completedAt)}
          </span>
        ) : task.status === 'in_progress' && task.startedAt ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.warn }}>
            <CalSvg style={{ width: 11, height: 11, flexShrink: 0 }} />
            {fmtDateTime(task.startedAt)}
          </span>
        ) : task.dueDate ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: overdue ? C.err : C.piedra, fontWeight: overdue ? 500 : 400 }}>
            <CalSvg style={{ width: 11, height: 11, flexShrink: 0 }} />
            {fmtDate(task.dueDate)}
          </span>
        ) : null}

        {task.project && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.piedra, overflow: 'hidden', maxWidth: 120 }}>
            <FolderSvg style={{ width: 11, height: 11, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.project.title}</span>
          </span>
        )}
        {task.assignedTo && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.piedra, marginLeft: 'auto' }}>
            <Avatar user={task.assignedTo} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{task.assignedTo.name.split(' ')[0]}</span>
          </span>
        )}
      </div>

      {!isDone && task.createdBy && (
        <p style={{ fontSize: 11, color: C.piedra }}>
          Creada por <span style={{ fontWeight: 500, color: C.arena }}>{task.createdBy.name.split(' ')[0]}</span>
        </p>
      )}

      {/* Botones movimiento — solo mobile */}
      {!isOverlay && !isCancelled && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-line md:hidden">
          <button disabled={!canPrev} onClick={() => canPrev && onMove(task, PREV_STATUS[task.status])}
            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: canPrev ? C.piedra : 'transparent', background: 'none', border: 'none', cursor: canPrev ? 'pointer' : 'default', padding: '2px 4px', borderRadius: '0 4px 4px 0' }}
          >
            <ChevronRSvg style={{ width: 10, height: 10, transform: 'rotate(180deg)' }} /> Atrás
          </button>
          <div style={{ flex: 1 }} />
          <button disabled={!canNext} onClick={() => canNext && onMove(task, NEXT_STATUS[task.status])}
            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: canNext ? C.piedra : 'transparent', background: 'none', border: 'none', cursor: canNext ? 'pointer' : 'default', padding: '2px 4px', borderRadius: '0 4px 4px 0' }}
          >
            Siguiente <ChevronRSvg style={{ width: 10, height: 10 }} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── DraggableCard ─────────────────────────────────────────────────────────────

function DraggableCard({ task, justCompleted, ...props }) {
  const reduced = useReducedMotion()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })
  const spring = { type: 'spring', stiffness: 400, damping: 32 }

  return (
    <motion.div
      ref={setNodeRef}
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, scale: 0.97, y: -6 }}
      animate={{ opacity: isDragging ? 0.2 : 1, scale: isDragging ? 0.98 : 1, y: 0 }}
      exit={reduced ? {} : { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ layout: spring, opacity: { duration: 0.14 }, scale: { duration: 0.14 }, y: spring }}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none', willChange: 'transform, opacity' }}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} justCompleted={justCompleted} {...props} />
    </motion.div>
  )
}

// ── DroppableColumn ───────────────────────────────────────────────────────────

function DroppableColumn({ col, header, footer, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        borderRadius: '0 16px 16px 0', padding: 12,
        background: isOver ? col.overBg : col.colBg,
        outline: `2px solid ${isOver ? col.overBorder : 'transparent'}`,
        outlineOffset: -2,
        transition: 'background 0.22s ease-out, outline-color 0.22s ease-out',
      }}
    >
      {header}
      {children}
      {footer}
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
  const [filtersOpen, setFiltersOpen]       = useState(false)
  const [doneVisible, setDoneVisible]       = useState(10)
  const [activeTask, setActiveTask]         = useState(null)
  const [justCompletedId, setJustCompletedId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

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
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const snapshot = qc.getQueryData(['tasks'])
      qc.setQueryData(['tasks'], (old) =>
        old?.map(t =>
          t.id === id
            ? { ...t, status, completedAt: status === 'done' ? new Date().toISOString() : t.completedAt }
            : t
        ) ?? old
      )
      return { snapshot }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(['tasks'], ctx.snapshot)
      toast(err.response?.data?.error || err.message || 'Error al mover la tarea', 'error')
    },
    onSettled: () => {
      qc.invalidateQueries(['tasks'])
      qc.invalidateQueries(['tasks-history'])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTask(id),
    onSuccess: () => { qc.invalidateQueries(['tasks']); toast('Tarea eliminada', 'success') },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al eliminar', 'error'),
  })

  function handleDragStart({ active }) {
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task ?? null)
  }

  function handleDragCancel() { setActiveTask(null) }

  function buildStockBody(task) {
    const items = task.stockItems ?? []
    if (items.length === 0) return null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.piedra }}>Stock a descontar</p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map(item => (
            <li key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: C.crema }}>{item.product.name}</span>
              <span style={{ color: C.piedra, fontFamily: "'Geist Mono', monospace" }}>-{item.quantity} {item.product.unit}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  async function handleDragEnd({ active, over }) {
    setActiveTask(null)
    if (!over) return
    const task      = tasks.find(t => t.id === active.id)
    const newStatus = over.id
    if (!task || task.status === newStatus || task.status === 'cancelled') return

    if (task.status === 'in_progress' && newStatus === 'done') {
      const ok = await confirm(`¿Confirmás que "${task.title}" fue completada?`,
        { confirmLabel: 'Sí, completar', danger: false, body: buildStockBody(task) })
      if (!ok) return
    }
    if (newStatus === 'done') {
      setJustCompletedId(task.id)
      setTimeout(() => setJustCompletedId(null), 1000)
    }
    moveMutation.mutate({ id: task.id, status: newStatus })
  }

  async function handleMove(task, newStatus) {
    if (task.status === 'in_progress' && newStatus === 'done') {
      const ok = await confirm(`¿Confirmás que "${task.title}" fue completada?`,
        { confirmLabel: 'Sí, completar', danger: false, body: buildStockBody(task) })
      if (!ok) return
    }
    if (newStatus === 'done') {
      setJustCompletedId(task.id)
      setTimeout(() => setJustCompletedId(null), 1000)
    }
    moveMutation.mutate({ id: task.id, status: newStatus })
  }

  async function handleDelete(task) {
    const ok = await confirm(`¿Eliminar "${task.title}"? Esta acción no se puede deshacer.`,
      { confirmLabel: 'Eliminar', danger: true })
    if (ok) deleteMutation.mutate(task.id)
  }

  const myId = user?.uid
  const filtered = tasks.filter(t => {
    if (onlyMine       && t.assignedToId !== myId)         return false
    if (filterPriority && t.priority !== filterPriority)   return false
    if (filterMember   && t.assignedToId !== filterMember) return false
    if (filterProject  && t.projectId  !== filterProject)  return false
    return true
  })

  const byStatus = (status) => {
    const list = status === 'done'
      ? filtered.filter(t => t.status === 'done' || t.status === 'cancelled')
      : filtered.filter(t => t.status === status)
    if (status === 'done') list.sort((a, b) => new Date(b.completedAt ?? 0) - new Date(a.completedAt ?? 0))
    return list
  }

  const hasFilters = filterPriority || filterMember || filterProject || onlyMine
  const activeFilterCount = (onlyMine ? 1 : 0) + (filterPriority ? 1 : 0) + (filterMember ? 1 : 0) + (filterProject ? 1 : 0)

  const filterSelectStyle = {
    height: 34, padding: '0 12px', background: C.s1, border: `1px solid ${C.linea}`,
    borderRadius: '0 9px 9px 0', color: C.crema, fontSize: 13,
    outline: 'none', appearance: 'none', cursor: 'pointer',
  }

  return (
    <div className="px-4 pt-5 pb-10 md:px-6 md:pt-7" style={{ fontFamily: 'Geist, system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: 20, minHeight: '100%' }}>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TasksSvg style={{ width: 18, height: 18, color: C.arena }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema, margin: 0 }}>Tareas</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setTab(tab === 'history' ? 'board' : 'history')}
            style={{ height: 34, padding: '0 14px', background: tab === 'history' ? C.s2 : 'none', border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', color: C.piedra, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.12s, border-color 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
            onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
          >
            {tab === 'history' ? 'Ver tablero' : 'Historial'}
          </button>
          <button onClick={() => setModal({ defaultStatus: 'todo' })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: C.crema, color: C.bg, borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            <MasIcon style={{ width: 12, height: 12 }} />
            Nueva
          </button>
        </div>
      </div>

      {tab === 'history' && <HistoryView />}

      {tab === 'board' && (
        <>
          {/* Mobile: botón Filtros */}
          <div className="md:hidden">
            <button onClick={() => setFiltersOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: '0 9px 9px 0', border: `1px solid ${activeFilterCount > 0 ? C.arena : C.linea}`, background: activeFilterCount > 0 ? 'rgba(242,237,227,0.06)' : 'none', color: activeFilterCount > 0 ? C.crema : C.piedra, fontSize: 12, cursor: 'pointer' }}
            >
              Filtros
              {activeFilterCount > 0 && (
                <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: C.crema, color: C.bg, fontSize: 10, fontWeight: 700 }}>
                  {activeFilterCount}
                </span>
              )}
              <ChevronDownSvg style={{ width: 12, height: 12, transform: filtersOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
          </div>

          {/* Mobile: panel de filtros */}
          {filtersOpen && (
            <div className="md:hidden" style={{ padding: 12, borderRadius: '0 12px 12px 0', border: `1px solid ${C.linea}`, background: C.s2, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => setOnlyMine(v => !v)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '0 9px 9px 0', border: `1px solid ${onlyMine ? C.crema : C.linea}`, fontSize: 13, fontWeight: 500, color: onlyMine ? C.bg : C.arena, background: onlyMine ? C.crema : 'none', textAlign: 'left', cursor: 'pointer' }}
              >
                Mis tareas
              </button>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="du-input w-full">
                <option value="">Todas las prioridades</option>
                <option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option>
              </select>
              {members.length > 0 && (
                <select value={filterMember} onChange={e => setFilterMember(e.target.value)} className="du-input w-full">
                  <option value="">Todos los responsables</option>
                  {members.map(m => <option key={m.userId} value={m.userId}>{m.name}</option>)}
                </select>
              )}
              {projects.length > 0 && (
                <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="du-input w-full">
                  <option value="">Todos los proyectos</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              )}
              {hasFilters && (
                <button onClick={() => { setFilterPriority(''); setFilterMember(''); setFilterProject(''); setOnlyMine(false); setDoneVisible(10) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.err, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <XMarkSvg style={{ width: 13, height: 13 }} /> Limpiar filtros
                </button>
              )}
            </div>
          )}

          {/* Desktop: filtros inline */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setOnlyMine(v => !v)}
              style={{ height: 34, padding: '0 14px', borderRadius: '0 9px 9px 0', border: `1px solid ${onlyMine ? C.crema : C.linea}`, fontSize: 13, fontWeight: 500, color: onlyMine ? C.bg : C.arena, background: onlyMine ? C.crema : 'none', cursor: 'pointer' }}
              onMouseEnter={e => { if (!onlyMine) { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.crema } }}
              onMouseLeave={e => { if (!onlyMine) { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.arena } }}
            >
              Mis tareas
            </button>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={filterSelectStyle}>
              <option value="">Todas las prioridades</option>
              <option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option>
            </select>
            {members.length > 0 && (
              <select value={filterMember} onChange={e => setFilterMember(e.target.value)} style={filterSelectStyle}>
                <option value="">Todos los responsables</option>
                {members.map(m => <option key={m.userId} value={m.userId}>{m.name}</option>)}
              </select>
            )}
            {projects.length > 0 && (
              <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={filterSelectStyle}>
                <option value="">Todos los proyectos</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            )}
            {hasFilters && (
              <button onClick={() => { setFilterPriority(''); setFilterMember(''); setFilterProject(''); setOnlyMine(false); setDoneVisible(10) }}
                style={{ fontSize: 12, color: C.piedra, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                onMouseEnter={e => e.currentTarget.style.color = C.arena}
                onMouseLeave={e => e.currentTarget.style.color = C.piedra}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Kanban */}
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', fontSize: 13, color: C.piedra }}>Cargando...</div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {COLUMNS.map(col => {
                  const colTasks  = byStatus(col.id)
                  const isDoneCol = col.id === 'done'

                  const header = (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.dotColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: col.labelColor }}>{col.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: '0 5px 5px 0', background: C.s3, color: C.piedra }}>
                          {colTasks.length}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {isDoneCol && colTasks.length > 0 && (
                          <button onClick={() => setDoneCollapsed(v => !v)}
                            style={{ padding: 4, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.color = C.arena}
                            onMouseLeave={e => e.currentTarget.style.color = C.piedra}
                          >
                            <ChevronDownSvg style={{ width: 14, height: 14, transform: doneCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }} />
                          </button>
                        )}
                        {!isDoneCol && (
                          <button onClick={() => setModal({ defaultStatus: col.id })}
                            style={{ padding: 4, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.color = C.arena}
                            onMouseLeave={e => e.currentTarget.style.color = C.piedra}
                          >
                            <PlusSvg style={{ width: 14, height: 14 }} />
                          </button>
                        )}
                      </div>
                    </div>
                  )

                  const footer = isDoneCol && doneCollapsed && colTasks.length > 0 ? (
                    <button onClick={() => setDoneCollapsed(false)}
                      style={{ fontSize: 12, color: C.piedra, textAlign: 'center', padding: '8px 0', border: `1px dashed ${C.linea}`, borderRadius: '0 10px 10px 0', background: 'none', cursor: 'pointer', width: '100%' }}
                      onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
                      onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
                    >
                      Ver {colTasks.length} tarea{colTasks.length !== 1 ? 's' : ''} completada{colTasks.length !== 1 ? 's' : ''}
                    </button>
                  ) : null

                  return (
                    <DroppableColumn key={col.id} col={col} header={header} footer={footer}>
                      {(!isDoneCol || !doneCollapsed) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 60 }}>
                          {colTasks.length === 0 ? (
                            <div style={{ border: `1px dashed ${C.linea}`, borderRadius: '0 10px 10px 0', padding: 16, textAlign: 'center', fontSize: 12, color: C.piedra }}>
                              {isDoneCol ? '¡Sin tareas completadas aún!' : 'Sin tareas'}
                            </div>
                          ) : (
                            <>
                              <AnimatePresence mode="popLayout">
                                {(isDoneCol ? colTasks.slice(0, doneVisible) : colTasks).map(task => (
                                  <DraggableCard
                                    key={task.id}
                                    task={task}
                                    justCompleted={justCompletedId === task.id}
                                    onEdit={(t) => setModal({ task: t })}
                                    onDelete={handleDelete}
                                    onMove={handleMove}
                                  />
                                ))}
                              </AnimatePresence>
                              {isDoneCol && colTasks.length > doneVisible && (
                                <button onClick={() => setDoneVisible(v => v + 10)}
                                  style={{ fontSize: 12, color: C.piedra, textAlign: 'center', padding: '8px 0', border: `1px dashed ${C.linea}`, borderRadius: '0 10px 10px 0', background: 'none', cursor: 'pointer' }}
                                  onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
                                  onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
                                >
                                  Mostrar más ({colTasks.length - doneVisible} restante{colTasks.length - doneVisible !== 1 ? 's' : ''})
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </DroppableColumn>
                  )
                })}
              </div>

              <DragOverlay dropAnimation={null}>
                {activeTask && (
                  <motion.div
                    initial={{ scale: 1, rotate: 0 }}
                    animate={{ scale: 1.04, rotate: 1.5 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    style={{ boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.3)', opacity: 0.93, cursor: 'grabbing', willChange: 'transform' }}
                  >
                    <TaskCard task={activeTask} isOverlay />
                  </motion.div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </>
      )}

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
