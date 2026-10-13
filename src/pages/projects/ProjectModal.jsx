import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createProject, updateProject } from '../../api/projects'
import { getClients } from '../../api/clients'
import { getMembers } from '../../api/members'
import { useAuth } from '../../context/AuthContext'
import DatePicker from '../../components/DatePicker'
import { useToast } from '../../components/Toast'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

const dpClass = "h-[34px] px-3 bg-[#141415] border border-[#2C2C2F] rounded-[0_9px_9px_0] text-[13px] outline-none w-full"

function CloseSvg() {
  return (
    <svg style={{ display: 'block', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function MemberPicker({ members, selected, onChange }) {
  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }
  const selectedMembers = members.filter(m => selected.includes(m.userId))
  const unselected = members.filter(m => !selected.includes(m.userId))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {selectedMembers.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selectedMembers.map(m => (
            <span key={m.userId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, paddingLeft: 8, paddingRight: 4, paddingTop: 2, paddingBottom: 2, borderRadius: '0 999px 999px 0', fontSize: 12, fontWeight: 500, background: 'rgba(242,237,227,0.08)', color: C.crema, border: `1px solid rgba(242,237,227,0.18)` }}>
              {m.name}
              <button type="button" onClick={() => toggle(m.userId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, padding: 2, display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = C.err}
                onMouseLeave={e => e.currentTarget.style.color = C.piedra}
              >
                <svg style={{ display: 'block', width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
      {unselected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {unselected.map(m => (
            <button key={m.userId} type="button" onClick={() => toggle(m.userId)}
              style={{ padding: '2px 10px', borderRadius: '0 999px 999px 0', fontSize: 12, border: `1px solid ${C.linea}`, background: 'none', color: C.piedra, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.piedra }}
            >
              + {m.name}
            </button>
          ))}
        </div>
      )}
      {members.length === 0 && (
        <p style={{ fontSize: 12, color: C.piedra }}>No hay miembros activos</p>
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
      toast(err.response?.data?.error || err.message || 'Error al guardar', 'error')
    } finally {
      setLoading(false)
    }
  }

  const labelCls = "block text-sm font-medium text-fg-soft mb-1"

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="shadow-2xl w-full sm:max-w-lg sm:mx-4 max-h-[92vh] flex flex-col"
        style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', fontFamily: 'Geist, system-ui, sans-serif' }}>

        {/* Header */}
        <div className="shrink-0 border-b border-line px-5 py-4 flex items-center justify-between" style={{ background: C.s1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: C.crema, margin: 0 }}>
            {project ? 'Editar proyecto' : 'Nuevo proyecto'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.arena, padding: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.arena}
          >
            <CloseSvg />
          </button>
        </div>

        {/* Scrollable body */}
        <form id="project-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className={labelCls}>Cliente *</label>
            <select required value={form.client}
              onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
              className="du-input w-full"
            >
              <option value="">Seleccionar...</option>
              {clientsData?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Título *</label>
            <input type="text" required value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="du-input w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha inicio</label>
              <DatePicker value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className={dpClass}
              />
            </div>
            <div>
              <label className={labelCls}>Fecha fin</label>
              <DatePicker value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className={dpClass}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Descripción</label>
            <textarea rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full resize-none outline-none font-[inherit]"
              style={{ background: C.bg, border: `1px solid ${C.linea}`, borderRadius: '0 8px 8px 0', color: C.crema, fontSize: 13, padding: '6px 12px', boxSizing: 'border-box', width: '100%' }}
            />
          </div>

          <div>
            <label className={labelCls}>Responsables</label>
            <MemberPicker
              members={activeMembers}
              selected={form.memberIds}
              onChange={ids => setForm(f => ({ ...f, memberIds: ids }))}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 border-t border-line px-5 py-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: C.arena }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.arena}
          >
            Cancelar
          </button>
          <button type="submit" form="project-form" disabled={loading}
            className="du-btn-pri disabled:opacity-50"
            style={{ width: 'auto', height: 38, paddingInline: 20, fontSize: 14 }}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

      </div>
    </div>
  )
}
