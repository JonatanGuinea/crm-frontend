import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { getMembers, inviteMember, updateMemberRole, removeMember } from '../../api/members'

const ROLE_LABELS = { owner: 'Owner', admin: 'Admin', member: 'Miembro' }
const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  member: 'bg-gray-100 text-gray-600'
}
const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  invited: 'bg-yellow-100 text-yellow-700'
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
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Equipo</h2>
        {canInvite && (
          <button
            onClick={() => { setShowInvite(v => !v); setInviteToken(null); setInviteError('') }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Invitar miembro
          </button>
        )}
      </div>

      {/* Formulario de invitación */}
      {showInvite && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Invitar usuario</h3>
          <form
            onSubmit={e => { e.preventDefault(); invite.mutate(inviteForm) }}
            className="flex gap-3 items-end flex-wrap"
          >
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Email del usuario</label>
              <input
                type="email"
                required
                placeholder="usuario@email.com"
                value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Rol</label>
              <select
                value={inviteForm.role}
                onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="member">Miembro</option>
                {myRole === 'owner' && <option value="admin">Admin</option>}
              </select>
            </div>
            <button
              type="submit"
              disabled={invite.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {invite.isPending ? 'Invitando...' : 'Invitar'}
            </button>
          </form>
          {inviteError && <p className="mt-2 text-sm text-red-600">{inviteError}</p>}

          {/* Token de invitación */}
          {inviteToken && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Invitación creada. Comparte este token:</p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 text-xs bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded px-2 py-1.5 break-all text-gray-700 dark:text-gray-300">
                  {inviteToken}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(inviteToken)}
                  className="shrink-0 text-xs px-2 py-1.5 border border-green-300 dark:border-green-700 rounded text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                >
                  Copiar
                </button>
              </div>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">El usuario debe usar este token para aceptar la invitación.</p>
            </div>
          )}
        </div>
      )}

      {/* Lista de miembros */}
      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Nombre', 'Email', 'Rol', 'Estado', ...(canManage ? [''] : [])].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data?.map(m => (
                <tr key={m.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {m.name}
                    {m.userId === user?.uid && <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">(tú)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{m.email}</td>
                  <td className="px-4 py-3">
                    {canManage && m.role !== 'owner' && m.status === 'active' ? (
                      <select
                        value={m.role}
                        onChange={e => changeRole.mutate({ userId: m.userId, role: e.target.value })}
                        className="text-xs px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:bg-gray-700 dark:text-white"
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
                          className="text-red-500 hover:underline text-xs"
                        >
                          Remover
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {!data?.length && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">Sin miembros</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
