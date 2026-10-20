import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, updateProfile, changePassword, uploadAvatar } from '../../api/profile'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { imgUrl } from '../../utils/imgUrl.js'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

const labelStyle = { fontSize: 11, fontWeight: 500, color: C.piedra }

// ── SVGs ──────────────────────────────────────────────────────────────────────

function UserSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
}
function CloseSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}
function CameraSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
}
function MailSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
}
function LogOutSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

function AvatarCircle({ avatar, name, size = 80, onClick }) {
  const [err, setErr] = useState(false)
  if (avatar && !err) {
    return (
      <img src={imgUrl(avatar)} alt={name}
        onClick={onClick}
        onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.linea}`, cursor: onClick ? 'pointer' : 'default', flexShrink: 0 }} />
    )
  }
  return (
    <div onClick={onClick}
      style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(142,177,222,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.3, fontWeight: 700, color: C.info, border: `2px solid ${C.linea}`, cursor: onClick ? 'pointer' : 'default', flexShrink: 0 }}>
      {initials(name)}
    </div>
  )
}

function AvatarModal({ src, name, onClose }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: 360, width: '100%', margin: '0 16px' }}>
        <img src={src} alt={name} style={{ width: '100%', borderRadius: '0 24px 24px 0', objectFit: 'cover', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }} />
        <button onClick={onClose}
          style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: '50%', background: C.s2, border: `1px solid ${C.linea}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.piedra }}
          onMouseEnter={e => e.currentTarget.style.color = C.crema}
          onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
          <CloseSvg style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHead({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${C.linea}`, paddingBottom: 8, marginBottom: 16, marginTop: 0 }}>
      {children}
    </p>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const qc           = useQueryClient()
  const toast        = useToast()
  const fileInputRef = useRef(null)
  const { logout }   = useAuth()
  const navigate     = useNavigate()

  const [nameForm,        setNameForm]        = useState({ name: '', phone: '' })
  const [pwForm,          setPwForm]          = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwEmailSent,     setPwEmailSent]     = useState(false)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn:  () => getProfile().then(r => r.data.data),
  })

  const nameMut = useMutation({
    mutationFn: updateProfile,
    onSuccess:  () => { qc.invalidateQueries(['profile']); toast('Perfil actualizado.', 'success') },
    onError:    (err) => toast(err.response?.data?.error || 'Error al actualizar.', 'error'),
  })

  const pwMut = useMutation({
    mutationFn: changePassword,
    onSuccess:  () => { setPwForm({ currentPassword: '', newPassword: '', confirm: '' }); setPwEmailSent(true) },
    onError:    (err) => toast(err.response?.data?.error || 'Error al cambiar contraseña.', 'error'),
  })

  const avatarMut = useMutation({
    mutationFn: uploadAvatar,
    onSuccess:  () => { qc.invalidateQueries(['profile']); toast('Foto actualizada.', 'success') },
    onError:    (err) => toast(err.response?.data?.error || 'Error al subir la imagen.', 'error'),
  })

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    avatarMut.mutate(file)
    e.target.value = ''
  }

  return (
    <div style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.linea}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <UserSvg style={{ width: 18, height: 18, color: C.crema }} />
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.crema, margin: 0, lineHeight: 1.2 }}>Mi perfil</h1>
          {!isLoading && data?.email && (
            <p style={{ fontSize: 12, color: C.piedra, margin: 0, marginTop: 2 }}>{data.email}</p>
          )}
        </div>
      </div>

      {/* Avatar modal */}
      {avatarModalOpen && data?.avatar && (
        <AvatarModal
          src={imgUrl(data.avatar)}
          name={data.name}
          onClose={() => setAvatarModalOpen(false)}
        />
      )}

      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', fontSize: 13, color: C.piedra }}>Cargando…</div>
      ) : (
        <div style={{ padding: '24px 24px 40px', maxWidth: 520 }}>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <AvatarCircle
              avatar={data?.avatar}
              name={data?.name}
              size={72}
              onClick={data?.avatar ? () => setAvatarModalOpen(true) : undefined}
            />
            <div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                style={{ display: 'none' }} onChange={handleFileChange} />
              <button onClick={() => fileInputRef.current.click()} disabled={avatarMut.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', background: 'none', border: `1px solid ${C.linea}`, borderRadius: '0 8px 8px 0', fontSize: 12, fontWeight: 500, color: avatarMut.isPending ? C.piedra : C.arena, cursor: avatarMut.isPending ? 'not-allowed' : 'pointer', opacity: avatarMut.isPending ? 0.6 : 1 }}
                onMouseEnter={e => { if (!avatarMut.isPending) e.currentTarget.style.borderColor = C.arena }}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.linea}>
                <CameraSvg style={{ width: 13, height: 13 }} />
                {avatarMut.isPending ? 'Subiendo…' : 'Cambiar foto'}
              </button>
              <p style={{ fontSize: 11, color: C.piedra, marginTop: 5 }}>JPG, PNG, GIF o WEBP · máx. 5 MB</p>
            </div>
          </div>

          {/* Info card */}
          <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', padding: '14px 18px', marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Email',    value: data?.email },
              { label: 'Nombre',   value: data?.name },
              data?.phone && { label: 'Teléfono', value: data.phone },
            ].filter(Boolean).map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.piedra, width: 70, flexShrink: 0 }}>{label}</p>
                <p style={{ fontSize: 13, color: C.crema }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Información personal */}
          <section style={{ marginBottom: 28 }}>
            <SectionHead>Información personal</SectionHead>
            <form onSubmit={e => { e.preventDefault(); nameMut.mutate({ name: nameForm.name, phone: nameForm.phone }) }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={labelStyle}>Nombre</label>
                <input type="text" required placeholder={data?.name}
                  value={nameForm.name}
                  onChange={e => setNameForm(f => ({ ...f, name: e.target.value }))}
                  className="du-input" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={labelStyle}>Teléfono <span style={{ fontWeight: 400 }}>opcional</span></label>
                <input type="text" placeholder={data?.phone || '+54 11 1234-5678'}
                  value={nameForm.phone}
                  onChange={e => setNameForm(f => ({ ...f, phone: e.target.value }))}
                  className="du-input" />
              </div>
              <div>
                <button type="submit" disabled={nameMut.isPending}
                  style={{ height: 34, padding: '0 18px', borderRadius: '0 9px 9px 0', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, border: 'none', cursor: nameMut.isPending ? 'not-allowed' : 'pointer', opacity: nameMut.isPending ? 0.5 : 1 }}>
                  {nameMut.isPending ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </section>

          <div style={{ borderTop: `1px solid ${C.linea}`, marginBottom: 28 }} />

          {/* Cambiar contraseña */}
          <section style={{ marginBottom: 28 }}>
            <SectionHead>Cambiar contraseña</SectionHead>

            {pwEmailSent ? (
              <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(125,190,147,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MailSvg style={{ width: 20, height: 20, color: C.ok }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.crema, margin: 0 }}>Revisá tu email</p>
                  <p style={{ fontSize: 12, color: C.piedra, marginTop: 4 }}>Te enviamos un enlace para confirmar el cambio. Expira en 30 minutos.</p>
                </div>
                <button onClick={() => setPwEmailSent(false)}
                  style={{ fontSize: 12, color: C.piedra, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.arena}
                  onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                  Volver a intentar
                </button>
              </div>
            ) : (
              <form onSubmit={e => {
                e.preventDefault()
                if (pwForm.newPassword !== pwForm.confirm) return toast('Las contraseñas nuevas no coinciden.', 'error')
                pwMut.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
              }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'currentPassword', label: 'Contraseña actual' },
                  { key: 'newPassword',     label: 'Nueva contraseña' },
                  { key: 'confirm',         label: 'Confirmar nueva contraseña' },
                ].map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={labelStyle}>{label}</label>
                    <input type="password" required
                      value={pwForm[key]}
                      onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                      className="du-input" />
                  </div>
                ))}
                <div>
                  <button type="submit" disabled={pwMut.isPending}
                    style={{ height: 34, padding: '0 18px', borderRadius: '0 9px 9px 0', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, border: 'none', cursor: pwMut.isPending ? 'not-allowed' : 'pointer', opacity: pwMut.isPending ? 0.5 : 1 }}>
                    {pwMut.isPending ? 'Enviando…' : 'Cambiar contraseña'}
                  </button>
                </div>
              </form>
            )}
          </section>

          <div style={{ borderTop: `1px solid ${C.linea}`, marginBottom: 24 }} />

          {/* Logout */}
          <button onClick={() => { logout(); navigate('/login') }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 16px', borderRadius: '0 9px 9px 0', background: 'none', border: `1px solid ${C.err}44`, color: C.err, fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: 0.8 }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = C.err }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.borderColor = `${C.err}44` }}>
            <LogOutSvg style={{ width: 14, height: 14 }} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
