import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { getDefaultTasks, createDefaultTask, updateDefaultTask, deleteDefaultTask } from '../../api/defaultTasks'
import { getMembers } from '../../api/members'
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

const PRIORITY_LABEL = { low: 'Baja', medium: 'Media', high: 'Alta' }
const PRIORITY_COLOR = {
  low:    'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  high:   'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
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
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLOR[task.priority]}`}>
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
            <PencilIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-1.5 rounded-md text-fg-muted hover:text-danger hover:bg-danger/10 transition-colors"
            title="Eliminar"
          >
            <TrashIcon className="w-3.5 h-3.5" />
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
        <label className="block text-xs text-fg-muted mb-1">Título *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Ej: Reunión inicial con el cliente"
          className="w-full px-3 py-2 border border-line-soft rounded-md text-sm bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>
      <div>
        <label className="block text-xs text-fg-muted mb-1">Descripción</label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={2}
          placeholder="Descripción opcional..."
          className="w-full px-3 py-2 border border-line-soft rounded-md text-sm bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-fg-muted mb-1">Prioridad</label>
          <select
            value={form.priority}
            onChange={e => set('priority', e.target.value)}
            className="w-full px-3 py-2 border border-line-soft rounded-md text-sm bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-fg-muted mb-1">Responsable predeterminado</label>
          <select
            value={form.assignedToId}
            onChange={e => set('assignedToId', e.target.value)}
            className="w-full px-3 py-2 border border-line-soft rounded-md text-sm bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-brand"
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
          <XMarkIcon className="w-3.5 h-3.5" />
          Cancelar
        </button>
        <button
          type="button"
          disabled={!form.title.trim() || isPending}
          onClick={() => onSave(form)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <CheckIcon className="w-3.5 h-3.5" />
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
            className="px-3 py-1.5 rounded-md bg-brand text-white text-xs font-medium hover:opacity-90 transition-opacity"
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
              className="mt-3 text-xs text-brand hover:underline"
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
