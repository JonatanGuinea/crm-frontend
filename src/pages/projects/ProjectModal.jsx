import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createProject, updateProject } from '../../api/projects'
import { getClients } from '../../api/clients'

const ALLOWED_TRANSITIONS = {
  pending: ['approved', 'cancelled'],
  approved: ['in_progress', 'cancelled'],
  in_progress: ['finished'],
  finished: [],
  cancelled: []
}

const STATUS_LABELS = {
  pending: 'Pendiente', approved: 'Aprobado', in_progress: 'En curso',
  finished: 'Finalizado', cancelled: 'Cancelado'
}

export default function ProjectModal({ project, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: project?.title || '',
    description: project?.description || '',
    budget: project?.budget ?? '',
    startDate: project?.startDate?.slice(0, 10) || '',
    endDate: project?.endDate?.slice(0, 10) || '',
    client: project?.clientId || project?.client?.id || '',
    status: project?.status || undefined
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => getClients({ limit: 100 }).then(r => r.data.data)
  })

  const allowedStatuses = project ? ALLOWED_TRANSITIONS[project.status] || [] : []

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form, budget: form.budget !== '' ? parseFloat(form.budget) : undefined }
      if (project) {
        await updateProject(project.id, payload)
      } else {
        await createProject(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {project ? 'Editar proyecto' : 'Nuevo proyecto'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelCls}>Título *</label>
            <input type="text" required value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Cliente *</label>
            <select required value={form.client}
              onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
              className={inputCls}>
              <option value="">Seleccionar...</option>
              {clientsData?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Presupuesto</label>
            <input type="number" min="0" step="0.01" value={form.budget}
              onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
              className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha inicio</label>
              <input type="date" value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fecha fin</label>
              <input type="date" value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className={inputCls} />
            </div>
          </div>

          {project && allowedStatuses.length > 0 && (
            <div>
              <label className={labelCls}>Cambiar estado</label>
              <select value={form.status || ''}
                onChange={e => setForm(f => ({ ...f, status: e.target.value || undefined }))}
                className={inputCls}>
                <option value="">Sin cambio ({STATUS_LABELS[project.status]})</option>
                {allowedStatuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className={labelCls}>Descripción</label>
            <textarea rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={inputCls} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
