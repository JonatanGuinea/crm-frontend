import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { getMembers, inviteMember, updateMemberRole, removeMember } from '../../api/members'

const ROLE_LABELS = { owner: 'Dueño', admin: 'Administrador', member: 'Miembro' }
const ROLE_COLORS = {
  owner:  'bg-brand-subtle text-brand',
  admin:  'bg-info-subtle text-info',
  member: 'bg-raised text-fg-soft',
}

const AVATAR_PALETTE = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
]

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
function avatarColor(name = '') {
  let n = 0
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i)
  return AVATAR_PALETTE[n % AVATAR_PALETTE.length]
}

export default function MembersPage() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const toast = useToast()
  const orgId = user?.org
  const myRole = user?.role
  const qc = useQueryClient()

  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' })
  const [inviteError, setInviteError] = useState('')
  const [showInvite, setShowInvite] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => getMembers(orgId).then(r => r.data.data),
    enabled: Boolean(orgId),
  })

  const invite = useMutation({
    mutationFn: (form) => inviteMember(orgId, form),
    onSuccess: (_, form) => {
      toast(`Invitación enviada a ${form.email}`, 'success')
      setInviteForm({ email: '', role: 'member' })
      setInviteError('')
      setShowInvite(false)
      qc.invalidateQueries(['members', orgId])
    },
    onError: (err) => setInviteError(err.response?.data?.error || err.message || 'Error al invitar'),
  })

  const changeRole = useMutation({
    mutationFn: ({ userId, role }) => updateMemberRole(orgId, userId, role),
    onSuccess: () => qc.invalidateQueries(['members', orgId]),
  })

  const remove = useMutation({
    mutationFn: (userId) => removeMember(orgId, userId),
    onSuccess: () => qc.invalidateQueries(['members', orgId]),
  })

  const canInvite = ['owner', 'admin'].includes(myRole)
  const canManage = myRole === 'owner'

  return (
    <div className="p-4 md:p-8 min-h-full">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-xl font-semibold text-fg">Equipo</h2>
        </div>
        {canInvite && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowInvite(v => !v); setInviteError('') }}
              className="ml-auto px-3 py-1.5 rounded-md bg-brand text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              + Invitar miembro
            </button>
          </div>
        )}
      </div>

      {/* Formulario de invitación */}
      {showInvite && (
        <div className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line p-5 mb-6">
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
                {myRole === 'owner' && <option value="admin">Administrador</option>}
              </select>
            </div>
            <button
              type="submit"
              disabled={invite.isPending}
              className="px-4 py-2 rounded-md bg-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {invite.isPending ? 'Enviando...' : 'Invitar'}
            </button>
          </form>
          {inviteError && <p className="mt-2 text-sm text-danger">{inviteError}</p>}
        </div>
      )}

      {/* Contenido */}
      {isLoading ? (
        <p className="text-sm text-fg-soft">Cargando...</p>
      ) : !data?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-fg-muted">
          <p className="text-sm">Sin miembros en el equipo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map(m => {
            const isMe      = m.userId === user?.uid
            const canEdit   = canManage && m.role !== 'owner' && m.status === 'active'
            const canRemove = canManage && m.role !== 'owner' && !isMe

            return (
              <div key={m.userId} className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line p-5 flex flex-col items-center text-center gap-3">

                {/* Avatar */}
                <div className="relative mt-1">
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt={m.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${avatarColor(m.name)}`}>
                      {getInitials(m.name)}
                    </div>
                  )}
                  <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface ${
                    m.status === 'active' ? 'bg-success' : 'bg-warning'
                  }`} />
                </div>

                {/* Info */}
                <div className="w-full min-w-0">
                  <p className="text-sm font-semibold text-fg leading-snug">
                    {m.name}
                    {isMe && <span className="ml-1 text-xs font-normal text-fg-muted">(tú)</span>}
                  </p>
                  <p className="text-xs text-fg-muted mt-0.5 truncate">{m.email}</p>
                </div>

                {/* Rol */}
                {canEdit ? (
                  <select
                    value={m.role}
                    onChange={e => changeRole.mutate({ userId: m.userId, role: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 border border-line rounded-md bg-surface text-fg focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="admin">Administrador</option>
                    <option value="member">Miembro</option>
                  </select>
                ) : (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[m.role]}`}>
                    {ROLE_LABELS[m.role]}
                  </span>
                )}

                {/* Remover */}
                {canRemove && (
                  <button
                    onClick={async () => {
                      if (await confirm(`¿Remover a ${m.name} del equipo?`, { confirmLabel: 'Remover', danger: true }))
                        remove.mutate(m.userId)
                    }}
                    className="text-xs text-danger/60 hover:text-danger transition-colors"
                  >
                    Remover del equipo
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
