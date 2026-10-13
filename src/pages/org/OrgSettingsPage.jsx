import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { getOrganizations, updateOrganization, uploadOrgLogo, deleteOrganization } from '../../api/organizations'
import ProvinceSelect from '../../components/ProvinceSelect'
import DefaultTasksSection from './DefaultTasksSection'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

function GearSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
}
function PhotoSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
}
function TrashSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
}
function WarnSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
}

const UPLOADS_BASE = import.meta.env.VITE_API_URL
const labelStyle = { fontSize: 11, fontWeight: 500, color: C.piedra, display: 'block', marginBottom: 4 }

export default function OrgSettingsPage() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const orgId = user?.org
  const logoInputRef  = useRef(null)
  const sigCanvasRef  = useRef(null)
  const sigDrawing    = useRef(false)
  const sigHasDrawing = useRef(false)

  const DEFAULT_PRIMARY   = '#0f172a'
  const DEFAULT_SECONDARY = '#334155'

  const [form, setForm] = useState({
    name: '', cuit: '', email: '', website: '', phone: '',
    address: '', province: '', city: '', postalCode: '', signatureOwnerName: '',
    brandPrimary: DEFAULT_PRIMARY, brandSecondary: DEFAULT_SECONDARY,
  })
  const [logoPreview,  setLogoPreview]  = useState(null)
  const [orgSignature, setOrgSignature] = useState(null)
  const [sigIsEmpty,   setSigIsEmpty]   = useState(true)
  const [deleteModal,  setDeleteModal]  = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const { data: orgData } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganizations().then(r => r.data.data?.find(o => o.id === orgId)),
    enabled: Boolean(orgId)
  })

  useEffect(() => {
    if (orgData) {
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
        brandPrimary:   orgData.brandPrimary   || DEFAULT_PRIMARY,
        brandSecondary: orgData.brandSecondary || DEFAULT_SECONDARY,
      })
      setLogoPreview(orgData.logo ? `${UPLOADS_BASE}/uploads/${orgData.logo}` : null)
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

  const deleteOrg = useMutation({
    mutationFn: () => deleteOrganization(orgId),
    onSuccess: () => {
      toast('Organización eliminada', 'success')
      logout()
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al eliminar', 'error')
  })

  const saveOrg = useMutation({
    mutationFn: () => updateOrganization(orgId, {
      ...form,
      website: form.website && !/^https?:\/\//i.test(form.website) ? `https://${form.website}` : form.website,
      brandPrimary:   form.brandPrimary   || null,
      brandSecondary: form.brandSecondary || null,
      ...(orgSignature !== null && { signature: orgSignature }),
    }),
    onSuccess: () => {
      qc.invalidateQueries(['organization', orgId])
      toast('Organización actualizada', 'success')
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al guardar', 'error')
  })

  const uploadLogo = useMutation({
    mutationFn: (file) => uploadOrgLogo(orgId, file),
    onSuccess: (res) => {
      qc.invalidateQueries(['organization', orgId])
      const filename = res.data.data?.logo
      if (filename) setLogoPreview(`${UPLOADS_BASE}/uploads/${filename}`)
      toast('Logo actualizado', 'success')
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al subir logo', 'error')
  })

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <GearSvg style={{ width: 18, height: 18, color: C.arena }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.crema, letterSpacing: '-0.02em', margin: 0 }}>Configuración de la organización</h2>
      </div>

      {/* Logo */}
      <div className="mb-8 flex items-center gap-5">
        <div
          onClick={() => logoInputRef.current?.click()}
          style={{ width: 80, height: 80, borderRadius: 12, border: `2px dashed ${C.linea}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0, background: C.s2 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.arena}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.linea}
        >
          {logoPreview
            ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
            : <PhotoSvg style={{ width: 32, height: 32, color: C.piedra }} />
          }
        </div>
        <div>
          <p className="text-sm font-medium text-fg">Logo de la organización</p>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadLogo.isPending}
            className="mt-1 px-3 py-1.5 border border-line-soft rounded-md text-sm text-fg-soft hover:bg-raised disabled:opacity-50 transition-colors"
          >
            {uploadLogo.isPending ? 'Subiendo...' : logoPreview ? 'Cambiar logo' : 'Subir logo'}
          </button>
          <p className="mt-1 text-xs text-fg-muted">PNG, JPG o WEBP</p>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo.mutate(f) }}
          />
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); saveOrg.mutate() }}>

        {/* Información general */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-fg mb-4">Información general</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label style={labelStyle}>Nombre *</label>
              <input type="text" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="du-input" />
            </div>
            <div>
              <label style={labelStyle}>CUIT</label>
              <input type="text" value={form.cuit} placeholder="20-12345678-9"
                onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))}
                className="du-input" />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input type="text" value={form.phone} placeholder="+54 11 1234-5678"
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="du-input" />
            </div>
            <div>
              <label style={labelStyle}>Email de contacto</label>
              <input type="email" value={form.email} placeholder="info@empresa.com"
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="du-input" />
            </div>
            <div>
              <label style={labelStyle}>Sitio web</label>
              <input type="text" value={form.website} placeholder="empresa.com"
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                className="du-input" />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between px-3 py-2.5 bg-raised rounded-md border border-line-soft">
              <span className="text-sm text-fg-muted">Moneda de trabajo</span>
              <span className="text-sm font-semibold text-fg">
                {orgData?.defaultCurrency === 'ARS' ? 'ARS — Peso argentino' : 'USD — Dólar'}
              </span>
            </div>
          </div>
        </section>

        <hr className="border-line mb-8" />

        {/* Dirección */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-fg mb-4">Dirección</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label style={labelStyle}>Dirección</label>
              <input type="text" value={form.address} placeholder="Av. Corrientes 1234"
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="du-input" />
            </div>
            <div>
              <label style={labelStyle}>Provincia</label>
              <ProvinceSelect
                value={form.province}
                onChange={v => setForm(f => ({ ...f, province: v }))}
                className="du-input"
              />
            </div>
            <div>
              <label style={labelStyle}>Ciudad</label>
              <input type="text" value={form.city} placeholder="Rosario"
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="du-input" />
            </div>
            <div>
              <label style={labelStyle}>Código postal</label>
              <input type="text" value={form.postalCode} placeholder="2000"
                onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                className="du-input" />
            </div>
          </div>
        </section>

        <hr className="border-line mb-8" />

        {/* Firma */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-fg mb-4">Firma de la organización</h2>
          <div className="space-y-4">
            <div>
              <label style={labelStyle}>Nombre del firmante</label>
              <input type="text" value={form.signatureOwnerName} placeholder="Ej: Juan García"
                onChange={e => setForm(f => ({ ...f, signatureOwnerName: e.target.value }))}
                className="du-input" />
            </div>
            <div>
              <label style={labelStyle}>Firma</label>
              {orgData?.signature && orgSignature !== '' && (
                <div className="mb-3 flex items-center gap-3 p-3 bg-white rounded-lg border border-line-soft">
                  <img src={orgData.signature} alt="Firma guardada" className="max-h-12 object-contain flex-1 min-w-0" />
                  <button
                    type="button"
                    onClick={() => setOrgSignature('')}
                    style={{ fontSize: 13, color: C.err, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                  >
                    Eliminar
                  </button>
                </div>
              )}
              {orgSignature === '' && (
                <p style={{ fontSize: 13, color: C.err, marginBottom: 12 }}>La firma se eliminará al guardar.</p>
              )}
              <div className="relative rounded-lg overflow-hidden border border-line-soft bg-white">
                <canvas
                  ref={sigCanvasRef}
                  width={700}
                  height={140}
                  className="w-full touch-none cursor-crosshair block"
                  onMouseDown={onSigStart}
                  onMouseMove={onSigMove}
                  onMouseUp={onSigEnd}
                  onMouseLeave={onSigEnd}
                  onTouchStart={onSigStart}
                  onTouchMove={onSigMove}
                  onTouchEnd={onSigEnd}
                />
                <div className="absolute bottom-7 left-5 right-5 h-px bg-zinc-200 pointer-events-none" />
                {sigIsEmpty && (
                  <p className="absolute inset-0 flex items-center justify-center text-sm text-zinc-300 pointer-events-none select-none">
                    {orgData?.signature ? 'Dibujá aquí para reemplazar la firma' : 'Dibujá tu firma aquí'}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={clearSigCanvas}
                disabled={sigIsEmpty}
                style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.arena, background: 'none', border: 'none', cursor: sigIsEmpty ? 'not-allowed' : 'pointer', opacity: sigIsEmpty ? 0.4 : 1, padding: 0 }}
              >
                <TrashSvg style={{ width: 14, height: 14 }} />
                Limpiar canvas
              </button>
            </div>
          </div>
        </section>

        <hr className="border-line mb-8" />

        {/* Identidad de marca */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-fg mb-1">Identidad de marca</h2>
          <p className="text-sm text-fg-muted mb-5">Se aplican al header y banda de total de los presupuestos.</p>
          <div className="flex flex-wrap gap-6 mb-5">
            <div>
              <label style={labelStyle}>Color primario</label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  value={form.brandPrimary}
                  onChange={e => setForm(f => ({ ...f, brandPrimary: e.target.value }))}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-line-soft p-0.5 bg-surface"
                />
                <span className="text-sm font-mono text-fg-muted">{form.brandPrimary}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, brandPrimary: DEFAULT_PRIMARY }))}
                  className="text-xs text-fg-muted hover:text-fg transition-colors">Reset</button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Color secundario</label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  value={form.brandSecondary}
                  onChange={e => setForm(f => ({ ...f, brandSecondary: e.target.value }))}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-line-soft p-0.5 bg-surface"
                />
                <span className="text-sm font-mono text-fg-muted">{form.brandSecondary}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, brandSecondary: DEFAULT_SECONDARY }))}
                  className="text-xs text-fg-muted hover:text-fg transition-colors">Reset</button>
              </div>
            </div>
          </div>
          {/* Preview */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${form.brandPrimary}, ${form.brandSecondary})` }}
          >
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Presupuesto</p>
                <p className="text-white font-bold text-base">{form.name || 'Nombre de empresa'}</p>
              </div>
              <p className="text-white font-bold text-2xl opacity-90">#001</p>
            </div>
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.25)' }}>
              <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>Total</span>
              <span className="text-white font-bold text-lg">$10.000,00</span>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saveOrg.isPending}
          style={{ padding: '10px 20px', borderRadius: '0 10px 10px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, cursor: saveOrg.isPending ? 'not-allowed' : 'pointer', opacity: saveOrg.isPending ? 0.5 : 1 }}
        >
          {saveOrg.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      <DefaultTasksSection />

      {/* Zona de peligro */}
      <div style={{ marginTop: 48, border: `1px solid rgba(229,131,115,0.3)`, borderRadius: '0 16px 16px 0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', background: 'rgba(229,131,115,0.05)', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid rgba(229,131,115,0.2)` }}>
          <WarnSvg style={{ width: 18, height: 18, color: C.err, flexShrink: 0 }} />
          <h2 style={{ fontSize: 13, fontWeight: 600, color: C.err, margin: 0 }}>Zona de peligro</h2>
        </div>
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-fg">Eliminar organización</p>
            <p className="text-xs text-fg-muted mt-0.5">Elimina permanentemente la organización y todos sus datos. Esta acción no se puede deshacer.</p>
          </div>
          <button
            type="button"
            onClick={() => { setDeleteConfirm(''); setDeleteModal(true) }}
            style={{ flexShrink: 0, padding: '8px 16px', fontSize: 13, fontWeight: 500, color: C.err, border: `1px solid rgba(229,131,115,0.4)`, borderRadius: '0 10px 10px 0', background: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,131,115,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Modal de confirmación */}
      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setDeleteModal(false)} />
          <div style={{ position: 'relative', background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', width: '100%', maxWidth: 448, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(229,131,115,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <WarnSvg style={{ width: 18, height: 18, color: C.err }} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: C.crema, margin: 0 }}>Eliminar organización</h3>
                <p style={{ fontSize: 12, color: C.piedra, marginTop: 2 }}>Esta acción es permanente e irreversible</p>
              </div>
            </div>

            <p className="text-sm text-fg-muted mb-4 leading-relaxed">
              Se eliminarán todos los datos de <strong className="text-fg">{orgData?.name}</strong>: clientes, proyectos, presupuestos, tareas, stock y movimientos financieros.
            </p>

            <div className="mb-5">
              <label style={{ display: 'block', fontSize: 12, color: C.piedra, marginBottom: 6 }}>
                Escribí <span style={{ fontWeight: 600, color: C.crema }}>{orgData?.name}</span> para confirmar
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={orgData?.name}
                className="du-input w-full"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-fg-muted border border-line rounded-md hover:bg-raised transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteConfirm !== orgData?.name || deleteOrg.isPending}
                onClick={() => deleteOrg.mutate()}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: C.bg, background: C.err, border: 'none', borderRadius: '0 10px 10px 0', cursor: deleteConfirm !== orgData?.name || deleteOrg.isPending ? 'not-allowed' : 'pointer', opacity: deleteConfirm !== orgData?.name || deleteOrg.isPending ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {deleteOrg.isPending && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                  </svg>
                )}
                {deleteOrg.isPending ? 'Eliminando...' : 'Eliminar organización'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
