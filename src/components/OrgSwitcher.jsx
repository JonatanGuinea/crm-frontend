import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getOrganizations, switchOrganization } from '../api/auth'
import { SetupOrgModal } from './OrgModal'

export default function OrgSwitcher() {
  const { user, switchOrg } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [showNewOrgModal, setShowNewOrgModal] = useState(false)
  const ref = useRef()

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations().then(r => r.data.data)
  })


  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
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

  async function handleCreated(newOrg) {
    setShowNewOrgModal(false)
    await qc.invalidateQueries(['organizations'])
    const switchRes = await switchOrganization(newOrg.id)
    switchOrg(switchRes.data.data.token)
    qc.clear()
    navigate('/')
  }

  const currentOrg = orgs?.find(o => o.id === user?.org)
  const hasMultiple = orgs && orgs.length > 1
  const hasNoOrgs = orgs !== undefined && orgs.length === 0

  if (hasNoOrgs) {
    return (
      <div ref={ref} className="relative border-b border-line">
        <button
          onClick={() => setShowNewOrgModal(true)}
          className="w-full px-6 py-4 text-left hover:bg-raised transition-colors"
        >
          <p className="text-xs text-fg-muted uppercase tracking-wide mb-0.5">Organización</p>
          <p className="text-sm font-semibold text-brand">Agregar empresa +</p>
        </button>
        {showNewOrgModal && (
          <SetupOrgModal
            onClose={() => setShowNewOrgModal(false)}
            onCreated={handleCreated}
          />
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative border-b border-line">
      <button
        onClick={() => setOpen(v => !v)}
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
              <ul className="max-h-48 overflow-y-auto">
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
            <button
              onClick={() => { setOpen(false); setShowNewOrgModal(true) }}
              className="w-full text-left px-4 py-2.5 text-sm text-brand hover:bg-brand-subtle transition-colors"
            >
              + Nueva organización
            </button>
          </div>
        </div>

      {showNewOrgModal && (
        <SetupOrgModal
          onClose={() => setShowNewOrgModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
