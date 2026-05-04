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
    <div ref={ref} className="relative border-b border-line">
      <button
        onClick={() => { setOpen(v => !v); setCreating(false); setNewName(''); setCreateError('') }}
        className="w-full px-6 py-4 text-left hover:bg-raised transition-colors"
      >
        <p className="text-xs text-fg-muted uppercase tracking-wide mb-0.5">Organización</p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-fg truncate">{currentOrg?.name || '...'}</p>
          <span className="text-fg-muted text-xs ml-1">{open ? '▲' : '▼'}</span>
        </div>
        <p className="text-xs text-fg-muted capitalize">{user?.role}</p>
      </button>

      <div className={`absolute top-full left-0 w-full bg-overlay border border-line rounded-b-xl shadow-lg z-50 transition-all duration-200 origin-top ${
        open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'
      }`}>
          {hasMultiple && (
            <>
              <p className="px-4 py-2 text-xs text-fg-muted uppercase tracking-wide border-b border-line">
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
                          ? 'text-brand font-medium bg-brand-subtle'
                          : 'text-fg-soft hover:bg-raised'
                      }`}
                    >
                      <span className="block truncate">{org.name}</span>
                      <span className="text-xs text-fg-muted capitalize">{org.role}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="border-t border-line">
            {!creating ? (
              <button
                onClick={() => setCreating(true)}
                className="w-full text-left px-4 py-2.5 text-sm text-brand hover:bg-brand-subtle transition-colors"
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
                  className="w-full px-2.5 py-1.5 text-sm border border-line-soft rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
                />
                {createError && <p className="text-xs text-danger">{createError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createLoading || !newName.trim()}
                    className="flex-1 py-1.5 bg-brand text-white text-xs rounded-md hover:bg-brand-hover disabled:opacity-50"
                  >
                    {createLoading ? 'Creando...' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCreating(false); setNewName(''); setCreateError('') }}
                    className="px-3 py-1.5 text-xs text-fg-muted hover:text-fg-soft"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    // </div>
  )
}
