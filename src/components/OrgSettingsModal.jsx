import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { getOrganizations, updateOrganization, uploadOrgLogo } from '../api/organizations'
import { PhotoIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'
import ProvinceSelect from './ProvinceSelect'

const inputCls = "w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
const labelCls = "block text-xs text-fg-muted mb-1"
const API_BASE  = import.meta.env.VITE_API_URL?.replace('/api', '')

export default function OrgSettingsModal({ onClose }) {
  const { user } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const orgId = user?.org
  const logoInputRef  = useRef(null)
  const sigCanvasRef  = useRef(null)
  const sigDrawing    = useRef(false)
  const sigHasDrawing = useRef(false)

  const [form, setForm] = useState({
    name: '', cuit: '', email: '', website: '', phone: '',
    address: '', province: '', city: '', postalCode: '', signatureOwnerName: ''
  })
  const [logoPreview,   setLogoPreview]   = useState(null)
  const [orgSignature,  setOrgSignature]  = useState(null) // null = no change, '' = delete, string = new
  const [sigIsEmpty,    setSigIsEmpty]    = useState(true)

  const { data: orgData } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganizations().then(r => r.data.data?.find(o => o.id === orgId)),
    enabled: Boolean(orgId)
  })

  useEffect(() => {
    if (orgData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name:               orgData.name               || '',
        cuit:               orgData.cuit               || '',
        email:              orgData.email              || '',
        website:            orgData.website            || '',
        phone:              orgData.phone              || '',
        address:            orgData.address            || '',
        province:           orgData.province           || '',
        city:               orgData.city               || '',
        postalCode:         orgData.postalCode         || '',
        signatureOwnerName: orgData.signatureOwnerName || '',
      })
      setLogoPreview(orgData.logo ? `${API_BASE}/uploads/${orgData.logo}` : null)
    }
  }, [orgData])

  function getSigXY(e) {
    const canvas = sigCanvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const src    = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    }
  }

  function onSigStart(e) {
    e.preventDefault()
    const ctx = sigCanvasRef.current.getContext('2d')
    const { x, y } = getSigXY(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    sigDrawing.current    = true
    sigHasDrawing.current = true
    setSigIsEmpty(false)
  }

  function onSigMove(e) {
    if (!sigDrawing.current) return
    e.preventDefault()
    const ctx = sigCanvasRef.current.getContext('2d')
    const { x, y } = getSigXY(e)
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
  }

  function onSigEnd(e) {
    if (!sigDrawing.current) return
    e.preventDefault()
    sigDrawing.current = false
    if (sigHasDrawing.current) {
      setOrgSignature(sigCanvasRef.current.toDataURL('image/png'))
    }
  }

  function clearSigCanvas() {
    const canvas = sigCanvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    sigHasDrawing.current = false
    setSigIsEmpty(true)
    setOrgSignature(null)
  }

  const saveOrg = useMutation({
    mutationFn: () => updateOrganization(orgId, {
      ...form,
      website: form.website && !/^https?:\/\//i.test(form.website) ? `https://${form.website}` : form.website,
      ...(orgSignature !== null && { signature: orgSignature }),
    }),
    onSuccess: () => {
      qc.invalidateQueries(['organization', orgId])
      toast('Organización actualizada', 'success')
      onClose()
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al guardar', 'error')
  })

  const uploadLogo = useMutation({
    mutationFn: (file) => uploadOrgLogo(orgId, file),
    onSuccess: (res) => {
      qc.invalidateQueries(['organization', orgId])
      const filename = res.data.data?.logo
      if (filename) setLogoPreview(`${API_BASE}/uploads/${filename}`)
      toast('Logo actualizado', 'success')
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al subir logo', 'error')
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
              <input type="text" value={form.address} placeholder="Av. Corrientes 1234"
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Provincia</label>
              <ProvinceSelect
                value={form.province}
                onChange={v => setForm(f => ({ ...f, province: v }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Ciudad</label>
              <input type="text" value={form.city} placeholder="Rosario"
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Código postal</label>
              <input type="text" value={form.postalCode} placeholder="2000"
                onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between px-3 py-2.5 bg-raised rounded-md border border-line-soft">
              <span className="text-xs text-fg-muted">Moneda de trabajo</span>
              <span className="text-xs font-semibold text-fg">
                {orgData?.defaultCurrency === 'ARS' ? 'ARS — Peso argentino' : 'USD — Dólar'}
              </span>
            </div>

            {/* ── Firma ─────────────────────────────────────────── */}
            <div className="sm:col-span-2 pt-2 border-t border-line-soft">
              <p className="text-xs font-semibold text-fg mb-3">Firma de la organización</p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Nombre del firmante</label>
              <input type="text" value={form.signatureOwnerName} placeholder="Ej: Juan García"
                onChange={e => setForm(f => ({ ...f, signatureOwnerName: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Firma</label>
              {/* Firma guardada actualmente */}
              {orgData?.signature && orgSignature !== '' && (
                <div className="mb-2 flex items-center gap-3 p-2.5 bg-raised rounded-lg border border-line-soft">
                  <img src={orgData.signature} alt="Firma guardada" className="max-h-10 object-contain flex-1 min-w-0" />
                  <button
                    type="button"
                    onClick={() => setOrgSignature('')}
                    className="shrink-0 text-xs text-danger hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              )}
              {orgSignature === '' && (
                <p className="text-xs text-danger mb-2">La firma se eliminará al guardar.</p>
              )}
              {/* Canvas para nueva firma */}
              <div className="relative rounded-lg overflow-hidden border border-line-soft bg-white">
                <canvas
                  ref={sigCanvasRef}
                  width={560}
                  height={130}
                  className="w-full touch-none cursor-crosshair block"
                  onMouseDown={onSigStart}
                  onMouseMove={onSigMove}
                  onMouseUp={onSigEnd}
                  onMouseLeave={onSigEnd}
                  onTouchStart={onSigStart}
                  onTouchMove={onSigMove}
                  onTouchEnd={onSigEnd}
                />
                <div className="absolute bottom-6 left-5 right-5 h-px bg-zinc-200 pointer-events-none" />
                {sigIsEmpty && (
                  <p className="absolute inset-0 flex items-center justify-center text-xs text-zinc-300 pointer-events-none select-none">
                    {orgData?.signature ? 'Dibujá aquí para reemplazar la firma' : 'Dibujá tu firma aquí'}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={clearSigCanvas}
                disabled={sigIsEmpty}
                className="mt-1.5 flex items-center gap-1 text-xs text-fg-muted hover:text-fg disabled:opacity-40 transition-colors"
              >
                <TrashIcon className="w-3 h-3" />
                Limpiar canvas
              </button>
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
