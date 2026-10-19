import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { getOrganizations, updateOrganization, uploadOrgLogo, deleteOrganization } from '../../api/organizations'
import { AjustesIcon } from '../../components/DuIcons'
import ProvinceSelect from '../../components/ProvinceSelect'
import DefaultTasksSection from './DefaultTasksSection'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }
const UPLOADS_BASE   = import.meta.env.VITE_API_URL
const labelStyle     = { fontSize: 11, fontWeight: 500, color: C.piedra, display: 'block', marginBottom: 4 }

// ── SVGs ──────────────────────────────────────────────────────────────────────

function PhotoSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
}
function TrashSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
}
function WarnSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
}
function CloseSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHead({ children }) {
  return (
    <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderLeft: `3px solid ${C.arena}`, borderRadius: '0 8px 8px 0', padding: '8px 14px', marginBottom: 16, marginTop: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: C.arena, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
        {children}
      </p>
    </div>
  )
}

function Divider() {
  return <div style={{ width: '90%', margin: '28px auto', borderTop: `1px solid ${C.linea}` }} />
}

function SaveRow({ label = 'Guardar', isPending }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
      <button type="submit" disabled={isPending}
        style={{ height: 34, padding: '0 18px', borderRadius: '0 9px 9px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.5 : 1 }}>
        {isPending ? 'Guardando…' : label}
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrgSettingsPage() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const qc    = useQueryClient()
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
  const [logoPreview,   setLogoPreview]   = useState(null)
  const [orgSignature,  setOrgSignature]  = useState(null)
  const [sigIsEmpty,    setSigIsEmpty]    = useState(true)
  const [deleteModal,   setDeleteModal]   = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

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
      brandPrimary:       orgData.brandPrimary       || DEFAULT_PRIMARY,
      brandSecondary:     orgData.brandSecondary     || DEFAULT_SECONDARY,
    })
    setLogoPreview(orgData.logo ? `${UPLOADS_BASE}/uploads/${orgData.logo}` : null)
  }, [orgData])

  // ── signature canvas ──
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
  const deleteOrg = useMutation({
    mutationFn: () => deleteOrganization(orgId),
    onSuccess:  () => { toast('Organización eliminada', 'success'); logout() },
    onError:    (err) => toast(err.response?.data?.error || err.message || 'Error al eliminar', 'error'),
  })

  const saveGeneral  = useMutation({
    mutationFn: () => updateOrganization(orgId, {
      name: form.name, cuit: form.cuit, phone: form.phone, email: form.email,
      website: form.website && !/^https?:\/\//i.test(form.website) ? `https://${form.website}` : form.website,
    }),
    onSuccess: () => { qc.invalidateQueries(['organization', orgId]); toast('Información guardada', 'success') },
    onError:   (err) => toast(err.response?.data?.error || err.message || 'Error al guardar', 'error'),
  })

  const saveDireccion = useMutation({
    mutationFn: () => updateOrganization(orgId, {
      address: form.address, province: form.province, city: form.city, postalCode: form.postalCode,
    }),
    onSuccess: () => { qc.invalidateQueries(['organization', orgId]); toast('Dirección guardada', 'success') },
    onError:   (err) => toast(err.response?.data?.error || err.message || 'Error al guardar', 'error'),
  })

  const saveFirma = useMutation({
    mutationFn: () => updateOrganization(orgId, {
      signatureOwnerName: form.signatureOwnerName,
      ...(orgSignature !== null && { signature: orgSignature }),
    }),
    onSuccess: () => { qc.invalidateQueries(['organization', orgId]); toast('Firma guardada', 'success') },
    onError:   (err) => toast(err.response?.data?.error || err.message || 'Error al guardar', 'error'),
  })

  const saveBrand = useMutation({
    mutationFn: () => updateOrganization(orgId, {
      brandPrimary:   form.brandPrimary   || null,
      brandSecondary: form.brandSecondary || null,
    }),
    onSuccess: () => { qc.invalidateQueries(['organization', orgId]); toast('Identidad de marca guardada', 'success') },
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

  return (
    <div style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.linea}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <AjustesIcon style={{ width: 18, height: 18, color: C.crema }} />
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.crema, margin: 0, lineHeight: 1.2 }}>Organización</h1>
          {orgData?.name && <p style={{ fontSize: 12, color: C.piedra, margin: 0, marginTop: 2 }}>{orgData.name}</p>}
        </div>
      </div>

      <div style={{ padding: '24px 24px 40px', maxWidth: 580 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div onClick={() => logoInputRef.current?.click()}
            style={{ width: 80, height: 80, borderRadius: '0 16px 16px 0', border: `1px dashed ${C.linea}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0, background: C.s2 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.arena}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.linea}>
            {logoPreview
              ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <PhotoSvg style={{ width: 28, height: 28, color: C.piedra }} />}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.crema, marginBottom: 6 }}>Logo de la organización</p>
            <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadLogo.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', background: 'none', border: `1px solid ${C.linea}`, borderRadius: '0 8px 8px 0', fontSize: 12, fontWeight: 500, color: C.arena, cursor: uploadLogo.isPending ? 'not-allowed' : 'pointer', opacity: uploadLogo.isPending ? 0.6 : 1 }}
              onMouseEnter={e => { if (!uploadLogo.isPending) e.currentTarget.style.borderColor = C.arena }}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.linea}>
              {uploadLogo.isPending ? 'Subiendo…' : logoPreview ? 'Cambiar logo' : 'Subir logo'}
            </button>
            <p style={{ fontSize: 11, color: C.piedra, marginTop: 5 }}>PNG, JPG o WEBP</p>
            <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo.mutate(f) }} />
          </div>
        </div>

        {/* Información general */}
        <form onSubmit={e => { e.preventDefault(); saveGeneral.mutate() }}>
          <section>
            <SectionHead>Información general</SectionHead>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 10px 10px 0' }}>
                  <span style={{ fontSize: 13, color: C.piedra }}>Moneda de trabajo</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.crema }}>
                    {orgData?.defaultCurrency === 'ARS' ? 'ARS — Peso argentino' : 'USD — Dólar'}
                  </span>
                </div>
              </div>
            </div>
            <SaveRow label="Guardar información" isPending={saveGeneral.isPending} />
          </section>
        </form>

        <Divider />

        {/* Dirección */}
        <form onSubmit={e => { e.preventDefault(); saveDireccion.mutate() }}>
          <section>
            <SectionHead>Dirección</SectionHead>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
            <SaveRow label="Guardar dirección" isPending={saveDireccion.isPending} />
          </section>
        </form>

        <Divider />

        {/* Firma */}
        <form onSubmit={e => { e.preventDefault(); saveFirma.mutate() }}>
          <section>
            <SectionHead>Firma de la organización</SectionHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nombre del firmante</label>
                <input type="text" value={form.signatureOwnerName} placeholder="Ej: Juan García"
                  onChange={e => set('signatureOwnerName', e.target.value)} className="du-input" />
              </div>
              <div>
                <label style={labelStyle}>Firma</label>
                {orgData?.signature && orgSignature !== '' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#fff', borderRadius: '0 10px 10px 0', border: `1px solid ${C.linea}`, marginBottom: 10 }}>
                    <img src={orgData.signature} alt="Firma guardada" style={{ maxHeight: 48, objectFit: 'contain', flex: 1, minWidth: 0 }} />
                    <button type="button" onClick={() => setOrgSignature('')}
                      style={{ fontSize: 12, color: C.err, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                      Eliminar
                    </button>
                  </div>
                )}
                {orgSignature === '' && (
                  <p style={{ fontSize: 12, color: C.err, marginBottom: 10 }}>La firma se eliminará al guardar.</p>
                )}
                <div style={{ position: 'relative', borderRadius: '0 10px 10px 0', overflow: 'hidden', border: `1px solid ${C.linea}`, background: '#fff' }}>
                  <canvas ref={sigCanvasRef} width={700} height={140}
                    style={{ width: '100%', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
                    onMouseDown={onSigStart} onMouseMove={onSigMove} onMouseUp={onSigEnd} onMouseLeave={onSigEnd}
                    onTouchStart={onSigStart} onTouchMove={onSigMove} onTouchEnd={onSigEnd} />
                  <div style={{ position: 'absolute', bottom: 28, left: 20, right: 20, height: 1, background: '#e4e4e7', pointerEvents: 'none' }} />
                  {sigIsEmpty && (
                    <p style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#d1d5db', pointerEvents: 'none', userSelect: 'none' }}>
                      {orgData?.signature ? 'Dibujá aquí para reemplazar la firma' : 'Dibujá tu firma aquí'}
                    </p>
                  )}
                </div>
                <button type="button" onClick={clearSigCanvas} disabled={sigIsEmpty}
                  style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.arena, background: 'none', border: 'none', cursor: sigIsEmpty ? 'not-allowed' : 'pointer', opacity: sigIsEmpty ? 0.4 : 1, padding: 0 }}>
                  <TrashSvg style={{ width: 13, height: 13 }} />
                  Limpiar canvas
                </button>
              </div>
            </div>
            <SaveRow label="Guardar firma" isPending={saveFirma.isPending} />
          </section>
        </form>

        <Divider />

        {/* Identidad de marca */}
        <form onSubmit={e => { e.preventDefault(); saveBrand.mutate() }}>
          <section>
            <SectionHead>Identidad de marca</SectionHead>
            <p style={{ fontSize: 12, color: C.piedra, marginBottom: 16, marginTop: -8 }}>
              Se usan como fondo de la página del presupuesto.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 20 }}>
              {[
                { key: 'brandPrimary', label: 'Color primario', def: DEFAULT_PRIMARY },
                { key: 'brandSecondary', label: 'Color secundario', def: DEFAULT_SECONDARY },
              ].map(({ key, label, def }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <input type="color" value={form[key]} onChange={e => set(key, e.target.value)}
                      style={{ width: 40, height: 40, borderRadius: '0 8px 8px 0', cursor: 'pointer', border: `1px solid ${C.linea}`, padding: 2, background: C.s2 }} />
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: C.piedra }}>{form[key]}</span>
                    <button type="button" onClick={() => set(key, def)}
                      style={{ fontSize: 11, color: C.piedra, background: 'none', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.color = C.arena}
                      onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                      Reset
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Preview — fondo de página con gradiente + card blanca interna */}
            <div style={{ borderRadius: '0 12px 12px 0', overflow: 'hidden', background: `linear-gradient(145deg, ${form.brandPrimary} 0%, ${form.brandSecondary} 100%)`, padding: '14px 12px' }}>
              <div style={{ background: '#ffffff', borderRadius: 5, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
                {/* Datos empresa */}
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{form.name || 'Nombre de empresa'}</p>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', margin: 0, whiteSpace: 'nowrap' }}>Presupuesto #001</p>
                </div>
                {/* Título */}
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #E5E7EB' }}>
                  <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '-0.02em', color: '#1A1A1A', margin: 0 }}>Nombre del proyecto</p>
                </div>
                {/* Total */}
                <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#1A1A1A' }}>Total</span>
                  <div style={{ background: '#1A1A1A', borderRadius: 4, padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 200, lineHeight: 1 }}>[</span>
                    <span style={{ color: '#ffffff', fontFamily: "'DanteUP Cifras', Geist, sans-serif", fontSize: 13, fontWeight: 700, lineHeight: 1 }}>$10.000,00</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 200, lineHeight: 1 }}>]</span>
                  </div>
                </div>
              </div>
            </div>
            <SaveRow label="Guardar colores" isPending={saveBrand.isPending} />
          </section>
        </form>

        <Divider />

        <DefaultTasksSection />

        {/* Zona de peligro */}
        <div style={{ marginTop: 48, border: `1px solid rgba(229,131,115,0.3)`, borderRadius: '0 16px 16px 0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: 'rgba(229,131,115,0.05)', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid rgba(229,131,115,0.2)` }}>
            <WarnSvg style={{ width: 16, height: 16, color: C.err, flexShrink: 0 }} />
            <h2 style={{ fontSize: 12, fontWeight: 600, color: C.err, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Zona de peligro</h2>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.crema, margin: 0 }}>Eliminar organización</p>
              <p style={{ fontSize: 12, color: C.piedra, marginTop: 4 }}>Elimina permanentemente la organización y todos sus datos. Esta acción no se puede deshacer.</p>
            </div>
            <button type="button" onClick={() => { setDeleteConfirm(''); setDeleteModal(true) }}
              style={{ flexShrink: 0, height: 34, padding: '0 14px', fontSize: 13, fontWeight: 500, color: C.err, border: `1px solid rgba(229,131,115,0.4)`, borderRadius: '0 9px 9px 0', background: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,131,115,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          className="items-end sm:items-center">
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setDeleteModal(false)} />
          <div style={{ position: 'relative', background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 0 0', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', width: '100%', maxWidth: 448 }}
            className="sm:rounded-[0_16px_16px_0]">

            {/* Header modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(229,131,115,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <WarnSvg style={{ width: 15, height: 15, color: C.err }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: C.crema, margin: 0 }}>Eliminar organización</p>
                  <p style={{ fontSize: 11, color: C.piedra, margin: 0, marginTop: 1 }}>Esta acción es permanente e irreversible</p>
                </div>
              </div>
              <button onClick={() => setDeleteModal(false)}
                style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
                onMouseEnter={e => e.currentTarget.style.color = C.crema}
                onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                <CloseSvg style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 13, color: C.piedra, lineHeight: 1.6, margin: 0 }}>
                Se eliminarán todos los datos de <strong style={{ color: C.crema }}>{orgData?.name}</strong>: clientes, proyectos, presupuestos, tareas, stock y movimientos financieros.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: C.piedra }}>
                  Escribí <span style={{ fontWeight: 700, color: C.crema }}>{orgData?.name}</span> para confirmar
                </label>
                <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder={orgData?.name} className="du-input" />
              </div>

              <div style={{ display: 'flex', gap: 10, paddingBottom: 4 }}>
                <button type="button" onClick={() => setDeleteModal(false)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: `1px solid ${C.linea}`, background: 'none', color: C.piedra, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
                  Cancelar
                </button>
                <button type="button"
                  disabled={deleteConfirm !== orgData?.name || deleteOrg.isPending}
                  onClick={() => deleteOrg.mutate()}
                  style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: 'none', background: C.err, color: C.bg, fontSize: 13, fontWeight: 600, cursor: deleteConfirm !== orgData?.name || deleteOrg.isPending ? 'not-allowed' : 'pointer', opacity: deleteConfirm !== orgData?.name || deleteOrg.isPending ? 0.4 : 1 }}>
                  {deleteOrg.isPending ? 'Eliminando…' : 'Eliminar organización'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
