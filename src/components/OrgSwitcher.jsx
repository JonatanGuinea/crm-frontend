import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getOrganizations, switchOrganization, createOrganization } from '../api/auth'

const inputCls = "w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg placeholder:text-fg-muted"
const labelCls = "block text-xs text-fg-muted mb-1"

function NewOrgModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', cuit: '', email: '', website: '', phone: '', address: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setError('')
    setLoading(true)
    try {
      const website = form.website && !/^https?:\/\//i.test(form.website) ? `https://${form.website}` : form.website
      const res = await createOrganization({ ...form, website })
      onCreated(res.data.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 px-4 py-6 overflow-y-auto">
      <div className="bg-surface/60 backdrop-blur-xl rounded-xl shadow-lg w-full max-w-md p-6 my-auto">
        <h3 className="text-lg font-semibold text-fg mb-4">Nueva organización</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nombre *</label>
              <input autoFocus type="text" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls} placeholder="Mi empresa S.A." />
            </div>
            <div>
              <label className={labelCls}>CUIT</label>
              <input type="text" value={form.cuit}
                onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))}
                className={inputCls} placeholder="20-12345678-9" />
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input type="text" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={inputCls} placeholder="+54 11 1234-5678" />
            </div>
            <div>
              <label className={labelCls}>Email de contacto</label>
              <input type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputCls} placeholder="info@empresa.com" />
            </div>
            <div>
              <label className={labelCls}>Sitio web</label>
              <input type="text" value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                className={inputCls} placeholder="empresa.com" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Dirección</label>
              <input type="text" value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className={inputCls} placeholder="Av. Corrientes 1234, CABA" />
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-fg-soft hover:text-fg">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !form.name.trim()}
              className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear organización'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

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
        <NewOrgModal
          onClose={() => setShowNewOrgModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
