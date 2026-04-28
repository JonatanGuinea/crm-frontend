import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { getMembers, inviteMember, updateMemberRole, removeMember } from '../../api/members'

const ROLE_LABELS = { owner: 'Owner', admin: 'Admin', member: 'Miembro' }
const ROLE_COLORS = {
  owner:  'bg-brand-subtle text-brand',
  admin:  'bg-info-subtle text-info',
  member: 'bg-raised text-fg-soft'
}
const STATUS_COLORS = {
  active:  'bg-brand-subtle text-brand',
  invited: 'bg-warning-subtle text-warning'
}

export default function MembersPage() {
  const { user } = useAuth()
  const orgId = user?.org
  const myRole = user?.role
  const qc = useQueryClient()

  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' })
  const [inviteError, setInviteError] = useState('')
  const [inviteToken, setInviteToken] = useState(null)
  const [showInvite, setShowInvite] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => getMembers(orgId).then(r => r.data.data),
    enabled: Boolean(orgId)
  })

  const invite = useMutation({
    mutationFn: (form) => inviteMember(orgId, form),
    onSuccess: (res) => {
      setInviteToken(res.data.data.inviteToken)
      setInviteForm({ email: '', role: 'member' })
      setInviteError('')
      qc.invalidateQueries(['members', orgId])
    },
    onError: (err) => setInviteError(err.response?.data?.error || 'Error al invitar')
  })

  const changeRole = useMutation({
    mutationFn: ({ userId, role }) => updateMemberRole(orgId, userId, role),
    onSuccess: () => qc.invalidateQueries(['members', orgId])
  })

  const remove = useMutation({
    mutationFn: (userId) => removeMember(orgId, userId),
    onSuccess: () => qc.invalidateQueries(['members', orgId])
  })

  const canInvite = ['owner', 'admin'].includes(myRole)
  const canManage = myRole === 'owner'

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto min-h-full bg-base">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-fg">Equipo</h2>
        {canInvite && (
          <button
            onClick={() => { setShowInvite(v => !v); setInviteToken(null); setInviteError('') }}
            className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-colors"
          >
            + Invitar miembro
          </button>
        )}
      </div>

      {showInvite && (
        <div className="bg-surface rounded-xl border border-line p-5 mb-6">
          <h3 className="text-sm font-semibold text-fg-soft mb-4">Invitar usuario</h3>
          <form
            onSubmit={e => { e.preventDefault(); invite.mutate(inviteForm) }}
            className="flex flex-col sm:flex-row gap-3 sm:items-end"
          >
            <div className="flex-1">
              <label className="block text-xs text-fg-muted mb-1">Email del usuario</label>
              <input
                type="email"
                required
                placeholder="usuario@email.com"
                value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg placeholder:text-fg-muted"
              />
            </div>
            <div>
              <label className="block text-xs text-fg-muted mb-1">Rol</label>
              <select
                value={inviteForm.role}
                onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                className="w-full sm:w-auto px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
              >
                <option value="member">Miembro</option>
                {myRole === 'owner' && <option value="admin">Admin</option>}
              </select>
            </div>
            <button
              type="submit"
              disabled={invite.isPending}
              className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
            >
              {invite.isPending ? 'Invitando...' : 'Invitar'}
            </button>
          </form>
          {inviteError && <p className="mt-2 text-sm text-danger">{inviteError}</p>}

          {inviteToken && (
            <div className="mt-4 p-3 bg-brand-subtle border border-brand rounded-lg">
              <p className="text-xs font-medium text-brand mb-1">Invitación creada. Comparte este enlace:</p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 text-xs bg-surface border border-line rounded px-2 py-1.5 break-all text-fg">
                  {`${window.location.origin}/accept-invite?token=${inviteToken}`}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/accept-invite?token=${inviteToken}`)}
                  className="shrink-0 text-xs px-2 py-1.5 border border-brand rounded text-brand hover:bg-brand-subtle"
                >
                  Copiar
                </button>
              </div>
              <p className="text-xs text-fg-soft mt-1">El usuario solo tiene que abrir este enlace para unirse.</p>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-fg-soft">Cargando...</p>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="sm:hidden bg-surface rounded-xl border border-line divide-y divide-line">
            {data?.map(m => (
              <div key={m.userId} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-fg truncate">
                    {m.name}
                    {m.userId === user?.uid && <span className="ml-1 text-xs text-fg-muted">(tú)</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[m.role]}`}>
                      {ROLE_LABELS[m.role]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]}`}>
                      {m.status === 'active' ? 'Activo' : 'Invitado'}
                    </span>
                  </div>
                </div>
                {canManage && m.role !== 'owner' && m.userId !== user?.uid && (
                  <button
                    onClick={() => { if (confirm(`¿Remover a ${m.name}?`)) remove.mutate(m.userId) }}
                    className="px-2.5 py-1 rounded-md text-xs bg-danger-subtle text-danger shrink-0"
                  >
                    Remover
                  </button>
                )}
              </div>
            ))}
            {!data?.length && (
              <p className="p-6 text-center text-sm text-fg-muted">Sin miembros</p>
            )}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden sm:block bg-surface rounded-xl border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-raised border-b border-line">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Rol</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Estado</th>
                    {canManage && <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data?.map(m => (
                    <tr key={m.userId} className="hover:bg-raised">
                      <td className="px-4 py-3 font-medium text-fg">
                        {m.name}
                        {m.userId === user?.uid && <span className="ml-1 text-xs text-fg-muted">(tú)</span>}
                      </td>
                      <td className="px-4 py-3 text-fg-soft">{m.email}</td>
                      <td className="px-4 py-3">
                        {canManage && m.role !== 'owner' && m.status === 'active' ? (
                          <select
                            value={m.role}
                            onChange={e => changeRole.mutate({ userId: m.userId, role: e.target.value })}
                            className="text-xs px-2 py-1 border border-line rounded-md focus:outline-none focus:ring-1 focus:ring-brand bg-surface text-fg"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Miembro</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[m.role]}`}>
                            {ROLE_LABELS[m.role]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]}`}>
                          {m.status === 'active' ? 'Activo' : 'Invitado'}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          {m.role !== 'owner' && m.userId !== user?.uid && (
                            <button
                              onClick={() => { if (confirm(`¿Remover a ${m.name}?`)) remove.mutate(m.userId) }}
                              className="text-danger hover:underline text-xs"
                            >
                              Remover
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {!data?.length && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-fg-muted">Sin miembros</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
