import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getOrganizations, switchOrganization } from '../api/auth'

export default function OrgSwitcher() {
  const { user, switchOrg } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const ref = useRef()

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations().then(r => r.data.data)
  })

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
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

  const currentOrg = orgs?.find(o => o.id === user?.org)

  if (!orgs || orgs.length <= 1) {
    return (
      <div className="px-6 py-4 border-b border-gray-200">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Organización</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{currentOrg?.name || '...'}</p>
        <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative border-b border-gray-200">
      <button
        onClick={() => setOpen(v => !v)}
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
        </div>
      )}
    </div>
  )
}
