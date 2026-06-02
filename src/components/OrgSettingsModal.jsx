import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { getOrganizations, updateOrganization, uploadOrgLogo } from '../api/organizations'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

const inputCls = "w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
const labelCls = "block text-xs text-fg-muted mb-1"
const API_BASE  = import.meta.env.VITE_API_URL?.replace('/api', '')

export default function OrgSettingsModal({ onClose }) {
  const { user } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const orgId = user?.org
  const logoInputRef = useRef(null)

  const [form, setForm] = useState({ name: '', cuit: '', email: '', website: '', phone: '', address: '' })
  const [logoPreview, setLogoPreview] = useState(null)

  const { data: orgData } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganizations().then(r => r.data.data?.find(o => o.id === orgId)),
    enabled: Boolean(orgId)
  })

  useEffect(() => {
    if (orgData) {
      setForm({
        name:    orgData.name    || '',
        cuit:    orgData.cuit    || '',
        email:   orgData.email   || '',
        website: orgData.website || '',
        phone:   orgData.phone   || '',
        address: orgData.address || '',
      })
      setLogoPreview(orgData.logo ? `${API_BASE}/uploads/${orgData.logo}` : null)
    }
  }, [orgData])

  const saveOrg = useMutation({
    mutationFn: () => updateOrganization(orgId, {
      ...form,
      website: form.website && !/^https?:\/\//i.test(form.website) ? `https://${form.website}` : form.website
    }),
    onSuccess: () => {
      qc.invalidateQueries(['organization', orgId])
      toast('Organización actualizada', 'success')
      onClose()
    },
    onError: (err) => toast(err.response?.data?.error || 'Error al guardar')
  })

  const uploadLogo = useMutation({
    mutationFn: (file) => uploadOrgLogo(orgId, file),
    onSuccess: (res) => {
      qc.invalidateQueries(['organization', orgId])
      const filename = res.data.data?.logo
      if (filename) setLogoPreview(`${API_BASE}/uploads/${filename}`)
      toast('Logo actualizado', 'success')
    },
    onError: (err) => toast(err.response?.data?.error || 'Error al subir logo')
  })

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-[9999] px-4 py-6 overflow-y-auto">
      <div className="bg-surface/60 backdrop-blur-xl rounded-xl shadow-lg w-full max-w-md p-6 my-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-fg">Configuración de la organización</h3>
          <button onClick={onClose} className="p-1.5 rounded-md text-fg-muted hover:bg-raised transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-4 mb-5">
          <div
            onClick={() => logoInputRef.current?.click()}
            className="w-16 h-16 rounded-lg border-2 border-dashed border-line-soft flex items-center justify-center cursor-pointer hover:border-brand transition-colors overflow-hidden bg-raised shrink-0"
          >
            {logoPreview
              ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              : <PhotoIcon className="w-7 h-7 text-fg-muted" />
            }
          </div>
          <div>
            <p className="text-sm font-medium text-fg">Logo de la organización</p>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadLogo.isPending}
              className="text-xs text-brand hover:underline mt-0.5 disabled:opacity-50"
            >
              {uploadLogo.isPending ? 'Subiendo...' : logoPreview ? 'Cambiar logo' : 'Subir logo'}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo.mutate(f) }}
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={e => { e.preventDefault(); saveOrg.mutate() }} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nombre *</label>
              <input type="text" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>CUIT</label>
              <input type="text" value={form.cuit} placeholder="20-12345678-9"
                onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input type="text" value={form.phone} placeholder="+54 11 1234-5678"
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email de contacto</label>
              <input type="email" value={form.email} placeholder="info@empresa.com"
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Sitio web</label>
              <input type="text" value={form.website} placeholder="empresa.com"
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Dirección</label>
              <input type="text" value={form.address} placeholder="Av. Corrientes 1234, CABA"
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between px-3 py-2.5 bg-raised rounded-md border border-line-soft">
              <span className="text-xs text-fg-muted">Moneda de trabajo</span>
              <span className="text-xs font-semibold text-fg">
                {orgData?.defaultCurrency === 'ARS' ? 'ARS — Peso argentino' : 'USD — Dólar'}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-fg-soft hover:text-fg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saveOrg.isPending}
              className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50 transition-colors">
              {saveOrg.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
