import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createProject, updateProject } from '../../api/projects'
import { getClients } from '../../api/clients'
import { getMembers } from '../../api/members'
import { useAuth } from '../../context/AuthContext'
import DatePicker from '../../components/DatePicker'
import { useToast } from '../../components/Toast'
import { XMarkIcon } from '@heroicons/react/24/outline'

const inputCls = "w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
const labelCls = "block text-sm font-medium text-fg-soft mb-1"

function MemberPicker({ members, selected, onChange }) {
  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  const selectedMembers = members.filter(m => selected.includes(m.userId))
  const unselected = members.filter(m => !selected.includes(m.userId))

  return (
    <div className="flex flex-col gap-2">
      {/* Chips de seleccionados */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedMembers.map(m => (
            <span
              key={m.userId}
              className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand border border-brand/20"
            >
              {m.name}
              <button
                type="button"
                onClick={() => toggle(m.userId)}
                className="ml-0.5 hover:text-danger transition-colors"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Lista de miembros disponibles */}
      {unselected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unselected.map(m => (
            <button
              key={m.userId}
              type="button"
              onClick={() => toggle(m.userId)}
              className="px-2.5 py-0.5 rounded-full text-xs border border-line text-fg-muted hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors"
            >
              + {m.name}
            </button>
          ))}
        </div>
      )}

      {members.length === 0 && (
        <p className="text-xs text-fg-muted">No hay miembros activos</p>
      )}
    </div>
  )
}

export default function ProjectModal({ project, onClose, onSaved }) {
  const toast = useToast()
  const { user } = useAuth()
  const orgId = user?.org

  const [form, setForm] = useState({
    title: project?.title || '',
    description: project?.description || '',
    startDate: project?.startDate?.slice(0, 10) || '',
    endDate: project?.endDate?.slice(0, 10) || '',
    client: project?.clientId || project?.client?.id || '',
    status: project?.status || undefined,
    memberIds: project?.members?.map(m => m.userId ?? m.user?.id).filter(Boolean) || []
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => getClients({ limit: 100 }).then(r => r.data.data)
  })

  const { data: membersData } = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => getMembers(orgId).then(r => r.data.data),
    enabled: Boolean(orgId),
    staleTime: 60_000,
  })
  const activeMembers = (membersData ?? []).filter(m => m.status === 'active')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form }
      if (project) {
        await updateProject(project.id, payload)
        toast('Proyecto actualizado', 'success')
      } else {
        await createProject(payload)
        toast('Proyecto creado', 'success')
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-surface/60 backdrop-blur-xl rounded-xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-line">
          <h3 className="text-lg font-semibold text-fg">
            {project ? 'Editar proyecto' : 'Nuevo proyecto'}
          </h3>
        </div>

        {/* Scrollable body */}
        <form id="project-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
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
            <label className={labelCls}>Título *</label>
            <input type="text" required value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha inicio</label>
              <DatePicker value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fecha fin</label>
              <DatePicker value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Descripción</label>
            <textarea rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Responsables</label>
            <MemberPicker
              members={activeMembers}
              selected={form.memberIds}
              onChange={ids => setForm(f => ({ ...f, memberIds: ids }))}
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
        </form>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-line flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-fg-soft hover:text-fg">Cancelar</button>
          <button type="submit" form="project-form" disabled={loading} className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

      </div>
    </div>
  )
}
