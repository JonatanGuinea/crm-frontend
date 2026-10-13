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
import { ProyectoIcon } from '../../components/DuIcons'
import AttachmentsPanel from '../../components/AttachmentsPanel'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }
const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"
const card = { background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0' }

const STATUS_LABELS = {
  pending: 'Pendiente', approved: 'Aprobado', in_progress: 'En curso',
  finished: 'Finalizado', cancelled: 'Cancelado'
}
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

function ChevronSvg({ size = 11, style }) {
  return (
    <svg style={{ display: 'block', width: size, height: size, ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
function PaperclipSvg({ style }) {
  return (
    <svg style={{ display: 'block', width: 13, height: 13, ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}
function EyeSvg({ style }) {
  return (
    <svg style={{ display: 'block', width: 13, height: 13, ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function TableSvg({ style }) {
  return (
    <svg style={{ display: 'block', width: 14, height: 14, ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  )
}
function ClockSvg({ style }) {
  return (
    <svg style={{ display: 'block', width: 14, height: 14, ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function CloseSvg({ style }) {
  return (
    <svg style={{ display: 'block', width: 16, height: 16, ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function StatusBadge({ status }) {
  const s = PROJECT_STATUS[status] || { label: status, bg: 'transparent', color: C.piedra }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '0 6px 6px 0', fontSize: 10.5, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function TaskProgress({ total, done }) {
  if (!total) return <span style={{ fontSize: 12, color: C.piedra }}>—</span>
  const pct = Math.round((done / total) * 100)
  const allDone = done === total
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: allDone ? C.ok : C.arena }}>{done}/{total}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: allDone ? C.ok : C.piedra }}>{pct}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: C.s3, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: allDone ? C.ok : C.crema, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

function StatusDropdown({ project, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const allowed = ALLOWED_TRANSITIONS[project.status] || []
  const s = PROJECT_STATUS[project.status] || { label: project.status, bg: 'transparent', color: C.piedra }

  if (!allowed.length) return <StatusBadge status={project.status} />

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
                {STATUS_LABELS[st]}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
      <button ref={btnRef} onClick={handleToggle}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: '0 6px 6px 0', fontSize: 10.5, fontWeight: 600, background: s.bg, color: s.color, border: 'none', cursor: 'pointer' }}
      >
        {s.label}
        <ChevronSvg size={10} />
      </button>
    </div>
  )
}

function fmtDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' +
         d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
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
  const [quotingProject, setQuotingProject]     = useState(null)
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

    if (pending.length === 0) { changeStatus.mutate({ id: projectId, status }); return }

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
    changeStatus.mutate({ id: projectId, status })
    qc.invalidateQueries(['tasks'])
  }

  const thStyle = { background: C.linea, color: C.crema, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 14px', textAlign: 'left', whiteSpace: 'nowrap' }
  const tdStyle = { padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, color: C.arena, fontSize: 13 }

  return (
    <div style={{ padding: '28px 24px 40px', fontFamily: 'Geist, system-ui, sans-serif' }}>
      {/* Título + controles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ProyectoIcon style={{ width: 18, height: 18, color: C.arena }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema, margin: 0 }}>Proyectos</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 3, padding: 4, height: 34, background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 10px 10px 0' }}>
            {[{ id: 'table', label: 'Tabla', Icon: TableSvg }, { id: 'history', label: 'Historial', Icon: ClockSvg }].map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', borderRadius: '0 7px 7px 0', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: tab === id ? C.s3 : 'transparent', color: tab === id ? C.crema : C.piedra, transition: 'background 0.15s, color 0.15s' }}
              >
                <Icon style={{ color: 'currentColor' }} />
                {label}
              </button>
            ))}
          </div>
          {tab === 'table' && canWrite && (
            <button onClick={() => { setEditing(null); setModalOpen(true) }}
              style={{ height: 34, padding: '0 14px', background: C.crema, color: C.bg, borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              + Nuevo
            </button>
          )}
        </div>
      </div>

      {/* Tab historial */}
      {tab === 'history' && (
        <div style={{ maxWidth: 680, marginTop: 16 }}>
          {historyData.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10, color: C.piedra }}>
              <ClockSvg style={{ width: 36, height: 36, opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>Sin movimientos registrados.</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {historyData.slice(0, historyVisible).map(entry => {
                const actionText = entry.action === 'created' ? 'creó el proyecto'
                  : entry.action === 'status_changed' ? 'cambió el estado' : 'actualizó'
                return (
                  <li key={entry.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.linea}`, fontSize: 13 }}>
                    <div style={{ width: 10, height: 16, flexShrink: 0, marginTop: 2, borderLeft: `2.5px solid ${C.piedra}`, borderBottom: `2.5px solid ${C.piedra}` }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, color: C.crema }}>{entry.user.name}</span>
                      <span style={{ color: C.arena }}> {actionText}</span>
                      {entry.detail && <span style={{ color: C.piedra }}> · {entry.detail}</span>}
                      <div style={{ marginTop: 2 }}>
                        <Link to={`/projects/${entry.project.id}`} style={{ fontSize: 12, color: C.info, textDecoration: 'none' }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >
                          {entry.project.title}
                        </Link>
                      </div>
                      <p style={{ fontSize: 11.5, color: C.piedra, marginTop: 2 }}>{fmtDateTime(entry.createdAt)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {historyData.length > historyVisible && (
            <button onClick={() => setHistoryVisible(v => v + 25)}
              style={{ marginTop: 12, width: '100%', padding: '10px 0', background: 'none', border: `1px dashed ${C.linea}`, borderRadius: '0 12px 12px 0', color: C.piedra, fontSize: 12.5, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
            >
              Mostrar más ({historyData.length - historyVisible} restante{historyData.length - historyVisible !== 1 ? 's' : ''})
            </button>
          )}
        </div>
      )}

      {/* Tab tabla */}
      {tab === 'table' && (
        <>
          {/* Filtro de estado */}
          <div style={{ marginBottom: 16 }}>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setVisible(PAGE_SIZE) }}
              style={{ height: 34, padding: '0 12px', background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', color: C.crema, fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {isLoading ? (
            <p style={{ fontSize: 13, color: C.piedra }}>Cargando...</p>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="md:hidden flex flex-col" style={{ gap: 10 }}>
                {shownProjects.map(p => (
                  <div key={p.id} style={{ ...card, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                      <StatusDropdown project={p} onUpdate={(status) => handleStatusChange(p.id, status)} />
                    </div>
                    <Link to={`/projects/${p.id}`} style={{ display: 'block', fontWeight: 600, color: C.crema, textDecoration: 'none', lineHeight: 1.3, marginBottom: 10 }}
                      onMouseEnter={e => e.currentTarget.style.color = C.arena}
                      onMouseLeave={e => e.currentTarget.style.color = C.crema}
                    >
                      {p.title}
                    </Link>
                    {p.client?.name && (
                      <p style={{ fontSize: 12, color: C.piedra, marginBottom: 6 }}>{p.client.name}</p>
                    )}
                    <TaskProgress total={p.taskCount} done={p.doneTaskCount} />
                    <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: `1px solid ${C.linea}`, marginTop: 12 }}>
                      {canWrite && !p.startDate && (
                        <button onClick={() => { setEditing(p); setModalOpen(true) }}
                          style={{ flex: 1, padding: '6px 0', fontSize: 12, fontWeight: 500, background: 'rgba(226,182,99,0.1)', color: C.warn, border: '1px solid rgba(226,182,99,0.25)', borderRadius: '0 7px 7px 0', cursor: 'pointer' }}
                        >
                          Completar datos
                        </button>
                      )}
                      <Link to={`/projects/${p.id}`}
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 0', fontSize: 12, fontWeight: 500, background: C.crema, color: C.bg, borderRadius: '0 7px 7px 0', textDecoration: 'none' }}
                      >
                        <EyeSvg /> Ver
                      </Link>
                      <button onClick={() => setAttachingProject(p)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', fontSize: 12, background: 'none', border: `1px solid ${C.linea}`, borderRadius: '0 7px 7px 0', color: C.piedra, cursor: 'pointer' }}
                      >
                        <PaperclipSvg />
                        {p.attachmentCount > 0 ? p.attachmentCount : '+'}
                      </button>
                    </div>
                  </div>
                ))}
                {!allProjects.length && (
                  <p style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: C.piedra }}>Sin proyectos</p>
                )}
              </div>

              {/* Desktop: tabla */}
              <div className="hidden md:block" style={{ ...card, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Título</th>
                        <th style={thStyle}>Cliente</th>
                        <th style={thStyle}>Estado</th>
                        <th style={thStyle}>Tareas</th>
                        {!isMember && <th style={thStyle}>Presupuesto</th>}
                        <th style={thStyle}>Archivos</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {shownProjects.map(p => (
                        <tr key={p.id}
                          onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = C.s2)}
                          onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = 'transparent')}
                        >
                          <td style={{ ...tdStyle, fontWeight: 500, color: C.crema }}>{p.title}</td>
                          <td style={tdStyle}>{p.client?.name || '—'}</td>
                          <td style={tdStyle}>
                            <StatusDropdown project={p} onUpdate={(status) => handleStatusChange(p.id, status)} />
                          </td>
                          <td style={tdStyle}>
                            <TaskProgress total={p.taskCount} done={p.doneTaskCount} />
                          </td>
                          {!isMember && (
                            <td style={tdStyle}>
                              {p.quotes?.length > 0
                                ? <span style={{ fontFamily: CIFRAS, fontWeight: 600, color: C.crema }}>
                                    ${Number(p.quotes.reduce((s, q) => s + (Number(q.total) || 0), 0)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                : canWrite && (
                                    <button onClick={() => setQuotingProject(p)}
                                      style={{ padding: '4px 10px', background: C.crema, color: C.bg, borderRadius: '0 7px 7px 0', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                    >
                                      Asignar
                                    </button>
                                  )
                              }
                            </td>
                          )}
                          <td style={tdStyle}>
                            <button onClick={() => setAttachingProject(p)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: '0 7px 7px 0', fontSize: 11, fontWeight: 500, border: `1px ${p.attachmentCount > 0 ? 'solid' : 'dashed'} ${C.linea}`, background: p.attachmentCount > 0 ? C.s2 : 'none', color: C.piedra, cursor: 'pointer' }}
                              onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
                              onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
                            >
                              <PaperclipSvg />
                              {p.attachmentCount > 0 ? p.attachmentCount : '+'}
                            </button>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                              {canWrite && !p.startDate && (
                                <button onClick={() => { setEditing(p); setModalOpen(true) }}
                                  style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '0 7px 7px 0', fontSize: 11, fontWeight: 500, background: 'rgba(226,182,99,0.1)', color: C.warn, border: '1px solid rgba(226,182,99,0.25)', cursor: 'pointer' }}
                                >
                                  Completar datos
                                </button>
                              )}
                              <Link to={`/projects/${p.id}`}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: '0 7px 7px 0', background: C.linea, color: C.crema, fontSize: 11, textDecoration: 'none' }}
                                onMouseEnter={e => e.currentTarget.style.background = C.s3}
                                onMouseLeave={e => e.currentTarget.style.background = C.linea}
                              >
                                Ver →
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!allProjects.length && (
                        <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: C.piedra }}>Sin proyectos</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {hasMore && (
            <button onClick={() => setVisible(v => v + PAGE_SIZE)}
              style={{ marginTop: 12, width: '100%', padding: '10px 0', background: 'none', border: `1px dashed ${C.linea}`, borderRadius: '0 12px 12px 0', color: C.piedra, fontSize: 12.5, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
            >
              Ver más ({allProjects.length - visible} restante{allProjects.length - visible !== 1 ? 's' : ''})
            </button>
          )}
        </>
      )}

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
          onSaved={() => { setQuotingProject(null); qc.invalidateQueries(['quotes']) }}
        />
      )}

      {attachingProject && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.65)' }}>
          <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 440, background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.linea}` }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.crema }}>Archivos adjuntos</p>
                <p style={{ fontSize: 11, color: C.piedra, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{attachingProject.title}</p>
              </div>
              <button onClick={() => setAttachingProject(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = C.arena}
                onMouseLeave={e => e.currentTarget.style.color = C.piedra}
              >
                <CloseSvg />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <AttachmentsPanel entityType="project" entityId={attachingProject.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
