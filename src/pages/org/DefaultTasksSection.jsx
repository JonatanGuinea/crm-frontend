import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { getDefaultTasks, createDefaultTask, updateDefaultTask, deleteDefaultTask } from '../../api/defaultTasks'
import { getMembers } from '../../api/members'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

function PencilSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function TrashSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
}
function CheckSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
}
function CloseSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}

const PRIORITY_LABEL = { low: 'Baja', medium: 'Media', high: 'Alta' }
const PRIORITY_STYLES = {
  low:    { background: 'rgba(142,177,222,0.12)', color: C.info },
  medium: { background: 'rgba(226,182,99,0.12)',  color: C.warn },
  high:   { background: 'rgba(229,131,115,0.12)', color: C.err },
}

const EMPTY_FORM = { title: '', description: '', priority: 'medium', assignedToId: '' }

function TaskRow({ task, members, canManage, onEdit, onDelete }) {
  const assignee = members?.find(m => m.userId === task.assignedToId)
  return (
    <div className="flex items-start gap-3 py-3 border-b border-line last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-fg leading-snug">{task.title}</p>
        {task.description && (
          <p className="text-xs text-fg-muted mt-0.5 line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, display: 'inline-block', ...PRIORITY_STYLES[task.priority] }}>
            {PRIORITY_LABEL[task.priority]}
          </span>
          {assignee && (
            <span className="text-xs text-fg-soft">
              → {assignee.name}
            </span>
          )}
          {!assignee && task.assignedToId && (
            <span className="text-xs text-fg-muted italic">Responsable eliminado</span>
          )}
        </div>
      </div>
      {canManage && (
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-md text-fg-muted hover:text-fg hover:bg-raised transition-colors"
            title="Editar"
          >
            <PencilSvg style={{ width: 14, height: 14 }} />
          </button>
          <button
            onClick={() => onDelete(task)}
            style={{ padding: 6, borderRadius: '0 5px 5px 0', background: 'none', border: 'none', color: C.piedra, cursor: 'pointer', display: 'flex' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,131,115,0.12)'; e.currentTarget.style.color = C.err }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.piedra }}
            title="Eliminar"
          >
            <TrashSvg style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}
    </div>
  )
}

function TaskForm({ initial = EMPTY_FORM, members, onSave, onCancel, isPending }) {
  const [form, setForm] = useState(initial)
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="bg-raised/60 rounded-lg border border-line p-4 space-y-3">
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: C.piedra, marginBottom: 4 }}>Título *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Ej: Reunión inicial con el cliente"
          className="du-input"
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: C.piedra, marginBottom: 4 }}>Descripción</label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={2}
          placeholder="Descripción opcional..."
          className="du-input resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: C.piedra, marginBottom: 4 }}>Prioridad</label>
          <select
            value={form.priority}
            onChange={e => set('priority', e.target.value)}
            className="du-input"
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: C.piedra, marginBottom: 4 }}>Responsable predeterminado</label>
          <select
            value={form.assignedToId}
            onChange={e => set('assignedToId', e.target.value)}
            className="du-input"
          >
            <option value="">Sin asignar</option>
            {members?.filter(m => m.status === 'active').map(m => (
              <option key={m.userId} value={m.userId}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line text-xs text-fg-muted hover:bg-raised transition-colors"
        >
          <CloseSvg style={{ width: 14, height: 14 }} />
          Cancelar
        </button>
        <button
          type="button"
          disabled={!form.title.trim() || isPending}
          onClick={() => onSave(form)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: '0 8px 8px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 12, fontWeight: 500, cursor: (!form.title.trim() || isPending) ? 'not-allowed' : 'pointer', opacity: (!form.title.trim() || isPending) ? 0.5 : 1 }}
        >
          <CheckSvg style={{ width: 14, height: 14 }} />
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

export default function DefaultTasksSection() {
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const qc = useQueryClient()
  const orgId = user?.org
  const canManage = ['owner', 'admin'].includes(user?.role)

  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['default-tasks', orgId],
    queryFn: () => getDefaultTasks(orgId).then(r => r.data.data),
    enabled: Boolean(orgId)
  })

  const { data: membersData = [] } = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => getMembers(orgId).then(r => r.data.data),
    enabled: Boolean(orgId)
  })

  const create = useMutation({
    mutationFn: (data) => createDefaultTask(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries(['default-tasks', orgId])
      setShowAdd(false)
      toast('Tarea predeterminada agregada', 'success')
    },
    onError: (err) => toast(err.response?.data?.error || err.message, 'error')
  })

  const update = useMutation({
    mutationFn: ({ id, data }) => updateDefaultTask(orgId, id, data),
    onSuccess: () => {
      qc.invalidateQueries(['default-tasks', orgId])
      setEditingId(null)
      toast('Tarea actualizada', 'success')
    },
    onError: (err) => toast(err.response?.data?.error || err.message, 'error')
  })

  const remove = useMutation({
    mutationFn: (id) => deleteDefaultTask(orgId, id),
    onSuccess: () => {
      qc.invalidateQueries(['default-tasks', orgId])
      toast('Tarea eliminada', 'success')
    },
    onError: (err) => toast(err.response?.data?.error || err.message, 'error')
  })

  async function handleDelete(task) {
    if (await confirm(`¿Eliminar "${task.title}" de las tareas predeterminadas?`, { confirmLabel: 'Eliminar', danger: true }))
      remove.mutate(task.id)
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-fg">Tareas predeterminadas</h2>
        {canManage && !showAdd && (
          <button
            type="button"
            onClick={() => { setShowAdd(true); setEditingId(null) }}
            style={{ padding: '6px 12px', borderRadius: '0 8px 8px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
          >
            + Nueva tarea
          </button>
        )}
      </div>
      <p className="text-xs text-fg-muted mb-4">
        Estas tareas se crean automáticamente en cada proyecto nuevo.
      </p>

      {isLoading ? (
        <p className="text-sm text-fg-soft">Cargando...</p>
      ) : tasks.length === 0 && !showAdd ? (
        <div className="border border-dashed border-line rounded-lg py-8 text-center">
          <p className="text-sm text-fg-muted">No hay tareas predeterminadas configuradas.</p>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              style={{ marginTop: 12, fontSize: 12, color: C.crema, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Agregar primera tarea
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line px-4">
          {tasks.map(task =>
            editingId === task.id ? (
              <div key={task.id} className="py-3 border-b border-line last:border-0">
                <TaskForm
                  initial={{
                    title:        task.title,
                    description:  task.description || '',
                    priority:     task.priority,
                    assignedToId: task.assignedToId || '',
                  }}
                  members={membersData}
                  isPending={update.isPending}
                  onSave={form => update.mutate({ id: task.id, data: form })}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <TaskRow
                key={task.id}
                task={task}
                members={membersData}
                canManage={canManage}
                onEdit={t => { setEditingId(t.id); setShowAdd(false) }}
                onDelete={handleDelete}
              />
            )
          )}
        </div>
      )}

      {showAdd && (
        <div className="mt-3">
          <TaskForm
            members={membersData}
            isPending={create.isPending}
            onSave={form => create.mutate(form)}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}
    </section>
  )
}
