import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, updateProfile, changePassword } from '../../api/profile'

export default function ProfilePage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile().then(r => r.data.data)
  })

  const [nameForm, setNameForm] = useState({ name: '' })
  const [nameMsg, setNameMsg] = useState(null)

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState(null)

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

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Mi perfil</h1>

      {/* Info actual */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 space-y-1">
        <p><span className="font-medium">Email:</span> {data?.email}</p>
        <p><span className="font-medium">Nombre actual:</span> {data?.name}</p>
      </div>

      {/* Cambiar nombre */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Cambiar nombre</h2>
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo nombre</label>
            <input
              type="text"
              required
              value={nameForm.name}
              onChange={e => setNameForm({ name: e.target.value })}
              placeholder={data?.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {nameMsg && (
            <p className={`text-sm ${nameMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {nameMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={nameMut.isPending}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {nameMut.isPending ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </form>
      </section>

      <hr className="border-gray-200 mb-8" />

      {/* Cambiar contraseña */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-4">Cambiar contraseña</h2>
        <form onSubmit={handlePwSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
            <input
              type="password"
              required
              value={pwForm.currentPassword}
              onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <input
              type="password"
              required
              value={pwForm.newPassword}
              onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
            <input
              type="password"
              required
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {pwMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={pwMut.isPending}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {pwMut.isPending ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>
    </div>
  )
}
