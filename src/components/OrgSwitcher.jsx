import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getOrganizations, switchOrganization, createOrganization } from '../api/auth'

export default function OrgSwitcher() {
  const { user, switchOrg } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const ref = useRef()

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations().then(r => r.data.data)
  })

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setCreating(false)
        setNewName('')
        setCreateError('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSwitch(orgId) {
    if (orgId === user?.org || switching) return
    setSwitching(true)
    try {
      const res = await switchOrganization(orgId)
      switchOrg(res.data.data.token)
      qc.clear()
      navigate('/')
    } catch {
      // silencioso
    } finally {
      setSwitching(false)
      setOpen(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreateError('')
    setCreateLoading(true)
    try {
      const res = await createOrganization(newName.trim())
      const newOrg = res.data.data
      await qc.invalidateQueries(['organizations'])
      // switch automático a la nueva org
      const switchRes = await switchOrganization(newOrg.id)
      switchOrg(switchRes.data.data.token)
      qc.clear()
      navigate('/')
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Error al crear')
    } finally {
      setCreateLoading(false)
    }
  }

  const currentOrg = orgs?.find(o => o.id === user?.org)
  const hasMultiple = orgs && orgs.length > 1

  return (
    <div ref={ref} className="relative border-b border-gray-200">
      <button
        onClick={() => { setOpen(v => !v); setCreating(false); setNewName(''); setCreateError('') }}
        className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Organización</p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 truncate">{currentOrg?.name || '...'}</p>
          <span className="text-gray-400 text-xs ml-1">{open ? '▲' : '▼'}</span>
        </div>
        <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
      </button>

      {open && (
        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-b-xl shadow-lg z-50">
          {hasMultiple && (
            <>
              <p className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                Cambiar a...
              </p>
              <ul>
                {orgs.map(org => (
                  <li key={org.id}>
                    <button
                      onClick={() => handleSwitch(org.id)}
                      disabled={switching || org.id === user?.org}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        org.id === user?.org
                          ? 'text-indigo-700 font-medium bg-indigo-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="block truncate">{org.name}</span>
                      <span className="text-xs text-gray-400 capitalize">{org.role}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Crear nueva organización */}
          <div className="border-t border-gray-100">
            {!creating ? (
              <button
                onClick={() => setCreating(true)}
                className="w-full text-left px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                + Nueva organización
              </button>
            ) : (
              <form onSubmit={handleCreate} className="px-4 py-3 space-y-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Nombre de la organización"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {createError && <p className="text-xs text-red-600">{createError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createLoading || !newName.trim()}
                    className="flex-1 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {createLoading ? 'Creando...' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCreating(false); setNewName(''); setCreateError('') }}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
