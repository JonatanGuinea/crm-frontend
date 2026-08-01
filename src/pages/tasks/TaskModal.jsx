import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask, updateTask } from '../../api/tasks'
import { getProjects } from '../../api/projects'
import { getMembers } from '../../api/members'
import { useToast } from '../../components/Toast'
import { XMarkIcon } from '@heroicons/react/24/outline'

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'Pendiente' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'done',        label: 'Completada' },
]

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high',   label: 'Alta' },
]

export default function TaskModal({ task, defaultStatus = 'todo', onClose }) {
  const qc    = useQueryClient()
  const toast = useToast()
  const isEdit = Boolean(task)

  const [form, setForm] = useState({
    title:        task?.title        ?? '',
    description:  task?.description  ?? '',
    status:       task?.status       ?? defaultStatus,
    priority:     task?.priority     ?? 'medium',
    dueDate:      task?.dueDate      ? task.dueDate.slice(0, 10) : '',
    assignedToId: task?.assignedToId ?? '',
    projectId:    task?.projectId    ?? '',
  })
  const [errors, setErrors] = useState({})

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects().then(r => r.data.data?.items ?? r.data.data ?? []),
    staleTime: 60_000,
  })

  const { data: membersData } = useQuery({
    queryKey: ['members'],
    queryFn: () => getMembers().then(r => r.data.data),
    staleTime: 60_000,
  })
  const members = membersData?.members ?? []

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateTask(task.id, data) : createTask(data),
    onSuccess: () => {
      qc.invalidateQueries(['tasks'])
      toast.success(isEdit ? 'Tarea actualizada' : 'Tarea creada')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Error al guardar'),
  })

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'El título es obligatorio'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    if (!validate()) return
    const payload = {
      title:        form.title.trim(),
      description:  form.description.trim() || null,
      status:       form.status,
      priority:     form.priority,
      dueDate:      form.dueDate || null,
      assignedToId: form.assignedToId || null,
      projectId:    form.projectId    || null,
    }
    mutation.mutate(payload)
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-lg bg-surface border border-line rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
          <h2 className="text-base font-semibold text-fg">
            {isEdit ? 'Editar tarea' : 'Nueva tarea'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-raised text-fg-muted hover:text-fg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* Título */}
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Título *</label>
              <input
                autoFocus
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Ej: Revisar propuesta del cliente"
                className={`w-full px-3 py-2 rounded-lg bg-raised border text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-brand transition-colors ${errors.title ? 'border-danger' : 'border-line'}`}
              />
              {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
                placeholder="Detalles opcionales..."
                className="w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-brand transition-colors resize-none"
              />
            </div>

            {/* Estado + Prioridad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Estado</label>
                <select
                  value={form.status}
                  onChange={e => set('status', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors"
                >
                  {STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Prioridad</label>
                <select
                  value={form.priority}
                  onChange={e => set('priority', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors"
                >
                  {PRIORITY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fecha límite */}
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Fecha límite</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            {/* Responsable */}
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Responsable</label>
              <select
                value={form.assignedToId}
                onChange={e => set('assignedToId', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors"
              >
                <option value="">Sin asignar</option>
                {members.map(m => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
            </div>

            {/* Proyecto */}
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Proyecto</label>
              <select
                value={form.projectId}
                onChange={e => set('projectId', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors"
              >
                <option value="">Sin proyecto</option>
                {(projects ?? []).map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-fg-soft hover:bg-raised transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
