import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { getMembers, inviteMember, updateMemberRole, removeMember } from '../../api/members'
import { EquipoIcon } from '../../components/DuIcons'
import { imgUrl } from '../../utils/imgUrl.js'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

const ROLE_LABELS = { owner: 'Dueño', admin: 'Administrador', member: 'Miembro' }
const ROLE_STYLE  = {
  owner:  { bg: 'rgba(242,237,227,0.1)',  color: C.crema  },
  admin:  { bg: 'rgba(142,177,222,0.12)', color: C.info   },
  member: { bg: 'rgba(140,135,126,0.15)', color: C.piedra },
}

const AVATAR_PALETTE = [
  { bg: 'rgba(142,177,222,0.18)', color: C.info  },
  { bg: 'rgba(125,190,147,0.18)', color: C.ok    },
  { bg: 'rgba(226,182,99,0.18)',  color: C.warn  },
  { bg: 'rgba(229,131,115,0.18)', color: C.err   },
  { bg: 'rgba(185,180,170,0.18)', color: C.arena },
  { bg: 'rgba(242,237,227,0.12)', color: C.crema },
]

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
function avatarStyle(name = '') {
  let n = 0
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i)
  return AVATAR_PALETTE[n % AVATAR_PALETTE.length]
}

function PlusSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}
function TrashSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
}
function CloseSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}

function InviteModal({ myRole, onClose, onInvite, isPending, error }) {
  const [form, setForm] = useState({ email: '', role: 'member' })

  function handleSubmit(e) {
    e.preventDefault()
    onInvite(form)
  }

  const labelStyle = { fontSize: 11, fontWeight: 500, color: C.piedra }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      className="items-end sm:items-center">
      <div style={{ width: '100%', maxWidth: 420, background: C.s1, borderRadius: '0 16px 0 0', border: `1px solid ${C.linea}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}
        className="sm:rounded-[0_16px_16px_0]">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EquipoIcon style={{ width: 15, height: 15, color: C.arena }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: C.crema }}>Invitar miembro</span>
          </div>
          <button onClick={onClose}
            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
            <CloseSvg style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Email del usuario</label>
            <input type="email" required placeholder="usuario@email.com" autoFocus
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="du-input" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Rol</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="du-input">
              <option value="member">Miembro</option>
              {myRole === 'owner' && <option value="admin">Administrador</option>}
            </select>
          </div>

          {error && <p style={{ fontSize: 12, color: C.err, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, paddingTop: 4, paddingBottom: 8 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: `1px solid ${C.linea}`, background: 'none', color: C.piedra, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.5 : 1 }}>
              {isPending ? 'Enviando…' : 'Invitar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MembersPage() {
  const { user } = useAuth()
  const confirm  = useConfirm()
  const toast    = useToast()
  const orgId    = user?.org
  const myRole   = user?.role
  const qc       = useQueryClient()

  const [inviteError, setInviteError] = useState('')
  const [showInvite,  setShowInvite]  = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['members', orgId],
    queryFn:  () => getMembers(orgId).then(r => r.data.data),
    enabled:  Boolean(orgId),
  })

  const invite = useMutation({
    mutationFn: (form) => inviteMember(orgId, form),
    onSuccess: (_, form) => {
      toast(`Invitación enviada a ${form.email}`, 'success')
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
  const members   = data ?? []

  return (
    <div style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.linea}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <EquipoIcon style={{ width: 18, height: 18, color: C.crema }} />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: C.crema, margin: 0, lineHeight: 1.2 }}>Equipo</h1>
            {!isLoading && (
              <p style={{ fontSize: 12, color: C.piedra, margin: 0, marginTop: 2 }}>
                {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
              </p>
            )}
          </div>
        </div>
        {canInvite && (
          <button
            onClick={() => { setShowInvite(true); setInviteError('') }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: C.crema, color: C.bg, borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <PlusSvg style={{ width: 13, height: 13 }} />
            Invitar miembro
          </button>
        )}
      </div>

      {showInvite && (
        <InviteModal
          myRole={myRole}
          isPending={invite.isPending}
          error={inviteError}
          onClose={() => { setShowInvite(false); setInviteError('') }}
          onInvite={form => invite.mutate(form)}
        />
      )}

      {/* Content */}
      <div className="px-4 pt-4 pb-10 md:px-6 md:pt-5">
        {isLoading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', fontSize: 13, color: C.piedra }}>Cargando…</div>
        ) : members.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <EquipoIcon style={{ width: 32, height: 32, color: C.piedra, opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 13, color: C.piedra }}>Sin miembros en el equipo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.map(m => {
              const isMe      = m.userId === user?.uid
              const canEdit   = canManage && m.role !== 'owner' && m.status === 'active'
              const canRemove = canManage && m.role !== 'owner' && !isMe
              const av        = avatarStyle(m.name)
              const rs        = ROLE_STYLE[m.role] ?? ROLE_STYLE.member

              return (
                <div key={m.userId}
                  style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {m.avatar ? (
                      <img src={imgUrl(m.avatar)} alt={m.name}
                        style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.linea}` }} />
                    ) : (
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: av.color, border: `2px solid ${C.linea}` }}>
                        {getInitials(m.name)}
                      </div>
                    )}
                    <span style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', background: m.status === 'active' ? C.ok : C.warn, border: `2px solid ${C.s2}` }} />
                  </div>

                  {/* Info */}
                  <div style={{ width: '100%', textAlign: 'center', minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.crema, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.name}
                      {isMe && <span style={{ fontSize: 11, fontWeight: 400, color: C.piedra, marginLeft: 5 }}>(tú)</span>}
                    </p>
                    <p style={{ fontSize: 11, color: C.piedra, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</p>
                  </div>

                  {/* Role */}
                  {canEdit ? (
                    <select value={m.role}
                      onChange={e => changeRole.mutate({ userId: m.userId, role: e.target.value })}
                      className="du-input" style={{ width: '100%', fontSize: 12 }}>
                      <option value="admin">Administrador</option>
                      <option value="member">Miembro</option>
                    </select>
                  ) : (
                    <span style={{ padding: '4px 12px', borderRadius: '0 8px 8px 0', fontSize: 11, fontWeight: 600, background: rs.bg, color: rs.color }}>
                      {ROLE_LABELS[m.role]}
                    </span>
                  )}

                  {/* Remove */}
                  {canRemove && (
                    <button
                      onClick={async () => {
                        if (await confirm(`¿Remover a ${m.name} del equipo?`, { confirmLabel: 'Remover', danger: true }))
                          remove.mutate(m.userId)
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.piedra, background: 'none', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.color = C.err}
                      onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                      <TrashSvg style={{ width: 12, height: 12 }} />
                      Remover del equipo
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
