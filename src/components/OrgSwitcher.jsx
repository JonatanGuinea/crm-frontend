import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getOrganizations, switchOrganization } from '../api/auth'
import { SetupOrgModal } from './OrgModal'
import { AdjustmentsHorizontalIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

const C = {
  bg:    '#0B0B0C',
  s2:    '#1E1E20',
  s3:    '#26262A',
  linea: '#2C2C2F',
  crema: '#F2EDE3',
  arena: '#B9B4AA',
  piedra:'#8C877E',
}

const ROLE_LABEL = { owner: 'Dueño', admin: 'Admin', member: 'Miembro' }

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

  const triggerStyle = {
    width: '100%', padding: '10px 14px',
    background: 'none', border: 'none',
    cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 8,
    borderBottom: `1px solid ${C.linea}`,
    transition: 'background-color 0.12s',
  }

  if (hasNoOrgs) {
    return (
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowNewOrgModal(true)}
          style={triggerStyle}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(242,237,227,0.04)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <p style={{ color: C.arena, fontSize: 12.5, fontWeight: 600 }}>+ Agregar empresa</p>
          </div>
        </button>
        {showNewOrgModal && (
          <SetupOrgModal onClose={() => setShowNewOrgModal(false)} onCreated={handleCreated} />
        )}
      </div>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={triggerStyle}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(242,237,227,0.04)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <p style={{ color: C.crema, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentOrg?.name || '…'}
          </p>
          <p style={{ color: C.piedra, fontSize: 11 }}>
            {ROLE_LABEL[user?.role] || user?.role}
          </p>
        </div>
        {hasMultiple && (
          <AdjustmentsHorizontalIcon style={{
            width: 14, height: 14, flexShrink: 0, color: C.piedra,
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: C.s2, border: `1px solid ${C.linea}`,
          borderTop: 'none', borderRadius: '0 0 10px 0',
          zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,.4)',
        }}>
          {hasMultiple && (
            <>
              <p style={{ padding: '8px 14px', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.piedra, borderBottom: `1px solid ${C.linea}` }}>
                Cambiar a...
              </p>
              <ul style={{ maxHeight: 160, overflowY: 'auto', listStyle: 'none', padding: 0, margin: 0 }}>
                {orgs.map(org => (
                  <li key={org.id}>
                    <button
                      onClick={() => handleSwitch(org.id)}
                      disabled={switching || org.id === user?.org}
                      style={{
                        width: '100%', padding: '9px 14px',
                        background: org.id === user?.org ? 'rgba(242,237,227,0.05)' : 'none',
                        border: 'none', cursor: org.id === user?.org ? 'default' : 'pointer',
                        textAlign: 'left', fontFamily: 'inherit',
                        color: org.id === user?.org ? C.crema : C.arena,
                        fontSize: 13, transition: 'background-color 0.12s',
                      }}
                      onMouseEnter={e => { if (org.id !== user?.org) e.currentTarget.style.backgroundColor = 'rgba(242,237,227,0.04)' }}
                      onMouseLeave={e => { if (org.id !== user?.org) e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.name}</span>
                      <span style={{ fontSize: 11, color: C.piedra }}>{ROLE_LABEL[org.role] || org.role}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div style={{ borderTop: `1px solid ${C.linea}` }}>
            <button
              onClick={() => { setOpen(false); setShowNewOrgModal(true) }}
              style={{
                width: '100%', padding: '9px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', fontFamily: 'inherit',
                color: C.arena, fontSize: 13, transition: 'background-color 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(242,237,227,0.04)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              + Nueva organización
            </button>
          </div>
        </div>
      )}

      {showNewOrgModal && (
        <SetupOrgModal onClose={() => setShowNewOrgModal(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}
