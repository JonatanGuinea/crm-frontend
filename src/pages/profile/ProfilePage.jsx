import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, updateProfile, changePassword, uploadAvatar } from '../../api/profile'

const API_BASE = import.meta.env.VITE_API_URL.replace('/api', '')

function AvatarModal({ src, name, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative max-w-sm w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={src}
          alt={name}
          className="w-full rounded-2xl object-cover shadow-2xl"
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-surface border border-line rounded-full flex items-center justify-center text-fg-muted hover:text-fg transition-colors shadow"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function AvatarCircle({ avatar, name, size = 'lg', onClick }) {
  const dim = size === 'lg' ? 'w-24 h-24 text-3xl' : 'w-8 h-8 text-sm'
  if (avatar) {
    return (
      <img
        src={`${API_BASE}/uploads/${avatar}`}
        alt={name}
        onClick={onClick}
        className={`${dim} rounded-full object-cover ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
      />
    )
  }
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  return (
    <div className={`${dim} rounded-full bg-brand-subtle text-brand font-semibold flex items-center justify-center`}>
      {initials}
    </div>
  )
}

export default function ProfilePage() {
  const qc = useQueryClient()
  const fileInputRef = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile().then(r => r.data.data)
  })

  const [nameForm, setNameForm] = useState({ name: '' })
  const [nameMsg, setNameMsg] = useState(null)

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState(null)

  const [avatarMsg, setAvatarMsg] = useState(null)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)

  const nameMut = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      qc.invalidateQueries(['profile'])
      setNameMsg({ type: 'success', text: 'Nombre actualizado correctamente.' })
    },
    onError: (err) => {
      setNameMsg({ type: 'error', text: err.response?.data?.error || 'Error al actualizar.' })
    }
  })

  const pwMut = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
      setPwMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' })
    },
    onError: (err) => {
      setPwMsg({ type: 'error', text: err.response?.data?.error || 'Error al cambiar contraseña.' })
    }
  })

  const avatarMut = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      qc.invalidateQueries(['profile'])
      setAvatarMsg({ type: 'success', text: 'Foto actualizada.' })
    },
    onError: (err) => {
      setAvatarMsg({ type: 'error', text: err.response?.data?.error || 'Error al subir la imagen.' })
    }
  })

  function handleNameSubmit(e) {
    e.preventDefault()
    setNameMsg(null)
    nameMut.mutate({ name: nameForm.name })
  }

  function handlePwSubmit(e) {
    e.preventDefault()
    setPwMsg(null)
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' })
      return
    }
    pwMut.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarMsg(null)
    avatarMut.mutate(file)
    e.target.value = ''
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const inputCls = "w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
  const labelCls = "block text-sm font-medium text-fg-soft mb-1"

  return (
    <div className="p-4 md:p-8 max-w-lg">
      <h1 className="text-2xl font-semibold text-fg mb-8">Mi perfil</h1>

      {avatarModalOpen && data?.avatar && (
        <AvatarModal
          src={`${API_BASE}/uploads/${data.avatar}`}
          name={data.name}
          onClose={() => setAvatarModalOpen(false)}
        />
      )}

      {/* Avatar */}
      <div className="mb-8 flex items-center gap-5">
        <AvatarCircle
          avatar={data?.avatar}
          name={data?.name}
          size="lg"
          onClick={data?.avatar ? () => setAvatarModalOpen(true) : undefined}
        />
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={avatarMut.isPending}
            className="px-3 py-1.5 border border-line-soft rounded-md text-sm text-fg-soft hover:bg-raised disabled:opacity-50 transition-colors"
          >
            {avatarMut.isPending ? 'Subiendo...' : 'Cambiar foto'}
          </button>
          <p className="mt-1 text-xs text-fg-muted">JPG, PNG, GIF o WEBP · máx. 5 MB</p>
          {avatarMsg && (
            <p className={`mt-1 text-xs ${avatarMsg.type === 'success' ? 'text-brand' : 'text-danger'}`}>
              {avatarMsg.text}
            </p>
          )}
        </div>
      </div>

      {/* Info actual */}
      <div className="mb-8 p-4 bg-raised rounded-lg border border-line text-sm text-fg-soft space-y-1">
        <p><span className="font-medium text-fg">Email:</span> {data?.email}</p>
        <p><span className="font-medium text-fg">Nombre actual:</span> {data?.name}</p>
      </div>

      {/* Cambiar nombre */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-fg mb-4">Cambiar nombre</h2>
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Nuevo nombre</label>
            <input
              type="text"
              required
              value={nameForm.name}
              onChange={e => setNameForm({ name: e.target.value })}
              placeholder={data?.name}
              className={inputCls}
            />
          </div>
          {nameMsg && (
            <p className={`text-sm ${nameMsg.type === 'success' ? 'text-brand' : 'text-danger'}`}>
              {nameMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={nameMut.isPending}
            className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand-hover disabled:opacity-50 transition-colors"
          >
            {nameMut.isPending ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </form>
      </section>

      <hr className="border-line mb-8" />

      {/* Cambiar contraseña */}
      <section>
        <h2 className="text-base font-semibold text-fg mb-4">Cambiar contraseña</h2>
        <form onSubmit={handlePwSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Contraseña actual</label>
            <input
              type="password"
              required
              value={pwForm.currentPassword}
              onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Nueva contraseña</label>
            <input
              type="password"
              required
              value={pwForm.newPassword}
              onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Confirmar nueva contraseña</label>
            <input
              type="password"
              required
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              className={inputCls}
            />
          </div>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.type === 'success' ? 'text-brand' : 'text-danger'}`}>
              {pwMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={pwMut.isPending}
            className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand-hover disabled:opacity-50 transition-colors"
          >
            {pwMut.isPending ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>
    </div>
  )
}
