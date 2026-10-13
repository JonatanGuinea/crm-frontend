import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { getOrganizations, updateOrganization, uploadOrgLogo } from '../api/organizations'
import ProvinceSelect from './ProvinceSelect'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }
const UPLOADS_BASE = import.meta.env.VITE_API_URL
const labelStyle   = { fontSize: 11, fontWeight: 500, color: C.piedra, display: 'block', marginBottom: 4 }

// ── SVGs ──────────────────────────────────────────────────────────────────────

function PhotoSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
}
function CloseSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}
function TrashSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" /></svg>
}
function AjustesSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function OrgSettingsModal({ onClose }) {
  const { user }  = useAuth()
  const toast     = useToast()
  const qc        = useQueryClient()
  const orgId     = user?.org

  const logoInputRef  = useRef(null)
  const sigCanvasRef  = useRef(null)
  const sigDrawing    = useRef(false)
  const sigHasDrawing = useRef(false)

  const [form, setForm] = useState({
    name: '', cuit: '', email: '', website: '', phone: '',
    address: '', province: '', city: '', postalCode: '', signatureOwnerName: '',
  })
  const [logoPreview,  setLogoPreview]  = useState(null)
  const [orgSignature, setOrgSignature] = useState(null)
  const [sigIsEmpty,   setSigIsEmpty]   = useState(true)

  const { data: orgData } = useQuery({
    queryKey: ['organization', orgId],
    queryFn:  () => getOrganizations().then(r => r.data.data?.find(o => o.id === orgId)),
    enabled:  Boolean(orgId),
  })

  useEffect(() => {
    if (!orgData) return
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
    setLogoPreview(orgData.logo ? `${UPLOADS_BASE}/uploads/${orgData.logo}` : null)
  }, [orgData])

  // ── canvas firma ──
  function getSigXY(e) {
    const canvas = sigCanvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const src    = e.touches ? e.touches[0] : e
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY }
  }
  function onSigStart(e) {
    e.preventDefault()
    const ctx = sigCanvasRef.current.getContext('2d')
    const { x, y } = getSigXY(e)
    ctx.beginPath(); ctx.moveTo(x, y)
    sigDrawing.current = true; sigHasDrawing.current = true; setSigIsEmpty(false)
  }
  function onSigMove(e) {
    if (!sigDrawing.current) return
    e.preventDefault()
    const ctx = sigCanvasRef.current.getContext('2d')
    const { x, y } = getSigXY(e)
    ctx.lineTo(x, y); ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.5
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke()
  }
  function onSigEnd(e) {
    if (!sigDrawing.current) return
    e.preventDefault(); sigDrawing.current = false
    if (sigHasDrawing.current) setOrgSignature(sigCanvasRef.current.toDataURL('image/png'))
  }
  function clearSigCanvas() {
    sigCanvasRef.current.getContext('2d').clearRect(0, 0, sigCanvasRef.current.width, sigCanvasRef.current.height)
    sigHasDrawing.current = false; setSigIsEmpty(true); setOrgSignature(null)
  }

  // ── mutations ──
  const saveOrg = useMutation({
    mutationFn: () => updateOrganization(orgId, {
      ...form,
      website: form.website && !/^https?:\/\//i.test(form.website) ? `https://${form.website}` : form.website,
      ...(orgSignature !== null && { signature: orgSignature }),
    }),
    onSuccess: () => { qc.invalidateQueries(['organization', orgId]); toast('Organización actualizada', 'success'); onClose() },
    onError:   (err) => toast(err.response?.data?.error || err.message || 'Error al guardar', 'error'),
  })

  const uploadLogo = useMutation({
    mutationFn: (file) => uploadOrgLogo(orgId, file),
    onSuccess: (res) => {
      qc.invalidateQueries(['organization', orgId])
      const fn = res.data.data?.logo
      if (fn) setLogoPreview(`${UPLOADS_BASE}/uploads/${fn}`)
      toast('Logo actualizado', 'success')
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al subir logo', 'error'),
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      className="items-end sm:items-center">
      <div style={{ position: 'relative', width: '100%', maxWidth: 500, background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 0 0', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90dvh' }}
        className="sm:rounded-[0_16px_16px_0]">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(140,135,126,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AjustesSvg style={{ width: 15, height: 15, color: C.arena }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.crema, margin: 0 }}>Configuración de la organización</p>
              {orgData?.name && <p style={{ fontSize: 11, color: C.piedra, margin: 0, marginTop: 1 }}>{orgData.name}</p>}
            </div>
          </div>
          <button onClick={onClose}
            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
            <CloseSvg style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={e => { e.preventDefault(); saveOrg.mutate() }}
          style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>

          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div onClick={() => logoInputRef.current?.click()}
                style={{ width: 64, height: 64, borderRadius: '0 12px 12px 0', border: `1px dashed ${C.linea}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0, background: C.s2 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.arena}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.linea}>
                {logoPreview
                  ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <PhotoSvg style={{ width: 24, height: 24, color: C.piedra }} />}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: C.crema, marginBottom: 5 }}>Logo de la organización</p>
                <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadLogo.isPending}
                  style={{ fontSize: 12, color: C.arena, background: 'none', border: 'none', cursor: uploadLogo.isPending ? 'not-allowed' : 'pointer', opacity: uploadLogo.isPending ? 0.5 : 1, padding: 0, fontFamily: 'inherit' }}
                  onMouseEnter={e => { if (!uploadLogo.isPending) e.currentTarget.style.color = C.crema }}
                  onMouseLeave={e => e.currentTarget.style.color = C.arena}>
                  {uploadLogo.isPending ? 'Subiendo…' : logoPreview ? 'Cambiar logo' : 'Subir logo'}
                </button>
                <p style={{ fontSize: 11, color: C.piedra, marginTop: 3 }}>PNG, JPG o WEBP</p>
                <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo.mutate(f) }} />
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: `1px solid ${C.linea}` }} />

            {/* Campos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label style={labelStyle}>Nombre *</label>
                <input type="text" required value={form.name} onChange={e => set('name', e.target.value)} className="du-input" />
              </div>
              <div>
                <label style={labelStyle}>CUIT</label>
                <input type="text" value={form.cuit} placeholder="20-12345678-9" onChange={e => set('cuit', e.target.value)} className="du-input" />
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input type="text" value={form.phone} placeholder="+54 11 1234-5678" onChange={e => set('phone', e.target.value)} className="du-input" />
              </div>
              <div>
                <label style={labelStyle}>Email de contacto</label>
                <input type="email" value={form.email} placeholder="info@empresa.com" onChange={e => set('email', e.target.value)} className="du-input" />
              </div>
              <div>
                <label style={labelStyle}>Sitio web</label>
                <input type="text" value={form.website} placeholder="empresa.com" onChange={e => set('website', e.target.value)} className="du-input" />
              </div>
              <div className="sm:col-span-2">
                <label style={labelStyle}>Dirección</label>
                <input type="text" value={form.address} placeholder="Av. Corrientes 1234" onChange={e => set('address', e.target.value)} className="du-input" />
              </div>
              <div>
                <label style={labelStyle}>Provincia</label>
                <ProvinceSelect value={form.province} onChange={v => set('province', v)} className="du-input" />
              </div>
              <div>
                <label style={labelStyle}>Ciudad</label>
                <input type="text" value={form.city} placeholder="Rosario" onChange={e => set('city', e.target.value)} className="du-input" />
              </div>
              <div>
                <label style={labelStyle}>Código postal</label>
                <input type="text" value={form.postalCode} placeholder="2000" onChange={e => set('postalCode', e.target.value)} className="du-input" />
              </div>
              <div className="sm:col-span-2">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 10px 10px 0' }}>
                  <span style={{ fontSize: 12, color: C.piedra }}>Moneda de trabajo</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.crema }}>
                    {orgData?.defaultCurrency === 'ARS' ? 'ARS — Peso argentino' : 'USD — Dólar'}
                  </span>
                </div>
              </div>
            </div>

            {/* Divider firma */}
            <div style={{ borderTop: `1px solid ${C.linea}` }} />

            {/* Firma */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Firma de la organización</p>
              <div>
                <label style={labelStyle}>Nombre del firmante</label>
                <input type="text" value={form.signatureOwnerName} placeholder="Ej: Juan García"
                  onChange={e => set('signatureOwnerName', e.target.value)} className="du-input" />
              </div>
              <div>
                <label style={labelStyle}>Firma</label>
                {orgData?.signature && orgSignature !== '' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: '#fff', borderRadius: '0 10px 10px 0', border: `1px solid ${C.linea}`, marginBottom: 8 }}>
                    <img src={orgData.signature} alt="Firma guardada" style={{ maxHeight: 40, objectFit: 'contain', flex: 1, minWidth: 0 }} />
                    <button type="button" onClick={() => setOrgSignature('')}
                      style={{ fontSize: 12, color: C.err, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
                      Eliminar
                    </button>
                  </div>
                )}
                {orgSignature === '' && (
                  <p style={{ fontSize: 12, color: C.err, marginBottom: 8 }}>La firma se eliminará al guardar.</p>
                )}
                <div style={{ position: 'relative', borderRadius: '0 10px 10px 0', overflow: 'hidden', border: `1px solid ${C.linea}`, background: '#fff' }}>
                  <canvas ref={sigCanvasRef} width={560} height={120}
                    style={{ width: '100%', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
                    onMouseDown={onSigStart} onMouseMove={onSigMove} onMouseUp={onSigEnd} onMouseLeave={onSigEnd}
                    onTouchStart={onSigStart} onTouchMove={onSigMove} onTouchEnd={onSigEnd} />
                  <div style={{ position: 'absolute', bottom: 24, left: 20, right: 20, height: 1, background: '#e4e4e7', pointerEvents: 'none' }} />
                  {sigIsEmpty && (
                    <p style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#d1d5db', pointerEvents: 'none', userSelect: 'none' }}>
                      {orgData?.signature ? 'Dibujá aquí para reemplazar la firma' : 'Dibujá tu firma aquí'}
                    </p>
                  )}
                </div>
                <button type="button" onClick={clearSigCanvas} disabled={sigIsEmpty}
                  style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.arena, background: 'none', border: 'none', cursor: sigIsEmpty ? 'not-allowed' : 'pointer', opacity: sigIsEmpty ? 0.4 : 1, padding: 0, fontFamily: 'inherit' }}>
                  <TrashSvg style={{ width: 12, height: 12 }} />
                  Limpiar canvas
                </button>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div style={{ position: 'sticky', bottom: 0, padding: '12px 20px', borderTop: `1px solid ${C.linea}`, background: C.s1, display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: `1px solid ${C.linea}`, background: 'none', color: C.piedra, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
              Cancelar
            </button>
            <button type="submit" disabled={saveOrg.isPending}
              style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, cursor: saveOrg.isPending ? 'not-allowed' : 'pointer', opacity: saveOrg.isPending ? 0.5 : 1, fontFamily: 'inherit' }}>
              {saveOrg.isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  )
}
