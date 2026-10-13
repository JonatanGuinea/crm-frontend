import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { createOrganization } from '../api/auth'
import { isValidPhoneNumber } from 'libphonenumber-js'
import ProvinceSelect from './ProvinceSelect'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

const labelStyle = { fontSize: 11, fontWeight: 500, color: C.piedra, display: 'block', marginBottom: 4 }

// ── SVGs ──────────────────────────────────────────────────────────────────────

function BuildingSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" /><path d="M9 21V13h6v8M9 7h1M14 7h1M9 11h1M14 11h1" /></svg>
}
function ChevronDownSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
}
function CloseSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}
function LogoutSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
}
function WarnCircleSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
}
function CheckSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.75l6 6 9-13.5" /></svg>
}

// ── Phone input ───────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: 'AR', name: 'Argentina',      dial: '+54',  flag: '🇦🇷' },
  { code: 'UY', name: 'Uruguay',        dial: '+598', flag: '🇺🇾' },
  { code: 'CL', name: 'Chile',          dial: '+56',  flag: '🇨🇱' },
  { code: 'BR', name: 'Brasil',         dial: '+55',  flag: '🇧🇷' },
  { code: 'PY', name: 'Paraguay',       dial: '+595', flag: '🇵🇾' },
  { code: 'BO', name: 'Bolivia',        dial: '+591', flag: '🇧🇴' },
  { code: 'PE', name: 'Perú',           dial: '+51',  flag: '🇵🇪' },
  { code: 'CO', name: 'Colombia',       dial: '+57',  flag: '🇨🇴' },
  { code: 'VE', name: 'Venezuela',      dial: '+58',  flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador',        dial: '+593', flag: '🇪🇨' },
  { code: 'MX', name: 'México',         dial: '+52',  flag: '🇲🇽' },
  { code: 'US', name: 'Estados Unidos', dial: '+1',   flag: '🇺🇸' },
  { code: 'ES', name: 'España',         dial: '+34',  flag: '🇪🇸' },
  { code: 'DE', name: 'Alemania',       dial: '+49',  flag: '🇩🇪' },
  { code: 'FR', name: 'Francia',        dial: '+33',  flag: '🇫🇷' },
  { code: 'IT', name: 'Italia',         dial: '+39',  flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal',       dial: '+351', flag: '🇵🇹' },
  { code: 'GB', name: 'Reino Unido',    dial: '+44',  flag: '🇬🇧' },
  { code: 'CA', name: 'Canadá',         dial: '+1',   flag: '🇨🇦' },
]

function formatPhone(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 12)
  if (d.length <= 2)  return d
  if (d.length <= 6)  return `${d.slice(0,2)} ${d.slice(2)}`
  if (d.length <= 10) return `${d.slice(0,2)} ${d.slice(2,6)}-${d.slice(6)}`
  return `${d.slice(0,3)} ${d.slice(3,7)}-${d.slice(7)}`
}

function checkPhone(digits, countryCode) {
  if (!digits) return false
  try { return isValidPhoneNumber(digits, countryCode) } catch { return false }
}

function OrgPhoneInput({ countryCode, phoneNumber, onChangeCountry, onChangeNumber }) {
  const [open,    setOpen]   = useState(false)
  const [search,  setSearch] = useState('')
  const [touched, setTouched] = useState(false)
  const btnRef   = useRef()
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })

  const selected  = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0]
  const filtered  = COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search))
  const digits    = phoneNumber.replace(/\D/g, '')
  const isValid   = checkPhone(digits, countryCode)
  const hasError  = touched && (digits.length === 0 || !isValid)
  const errorMsg  = digits.length === 0 ? 'El teléfono es obligatorio' : `Número inválido para ${selected.name}`

  function handleOpen() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(v => !v)
    setSearch('')
  }

  const borderColor = hasError ? C.err : (touched && digits.length > 0 && isValid) ? C.ok : C.linea

  return (
    <div>
      <div style={{ display: 'flex' }}>
        <button ref={btnRef} type="button" onClick={handleOpen}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', background: C.s2, border: `1px solid ${borderColor}`, borderRight: 'none', borderRadius: '0 0 0 0', cursor: 'pointer', flexShrink: 0, height: 38 }}
          className="rounded-l-lg">
          <span style={{ fontSize: 16, lineHeight: 1 }}>{selected.flag}</span>
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: C.arena }}>{selected.dial}</span>
          <ChevronDownSvg style={{ width: 12, height: 12, color: C.piedra, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </button>
        <input type="tel" value={phoneNumber}
          onChange={e => onChangeNumber(formatPhone(e.target.value))}
          onBlur={() => setTouched(true)}
          placeholder="11 1234-5678"
          style={{ flex: 1, height: 38, padding: '0 12px', background: C.s2, border: `1px solid ${borderColor}`, outline: 'none', fontSize: 13, color: C.crema, fontFamily: 'inherit' }}
          className="rounded-r-lg" />
      </div>
      {hasError && (
        <p style={{ marginTop: 5, fontSize: 11, color: C.err, display: 'flex', alignItems: 'center', gap: 4 }}>
          <WarnCircleSvg style={{ width: 13, height: 13, flexShrink: 0 }} />
          {errorMsg}
        </p>
      )}
      {touched && digits.length > 0 && isValid && (
        <p style={{ marginTop: 5, fontSize: 11, color: C.ok, display: 'flex', alignItems: 'center', gap: 4 }}>
          <CheckSvg style={{ width: 13, height: 13, flexShrink: 0 }} />
          Número válido
        </p>
      )}
      {open && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: 220, zIndex: 10001, background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 10px 10px 0', boxShadow: '0 12px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
            <div style={{ padding: 8, borderBottom: `1px solid ${C.linea}` }}>
              <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar país..."
                style={{ width: '100%', padding: '6px 10px', background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 6px 6px 0', fontSize: 12, color: C.crema, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {filtered.map(c => (
                <button key={c.code} type="button"
                  onClick={() => { onChangeCountry(c.code); setOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: c.code === countryCode ? 'rgba(242,237,227,0.07)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                  onMouseEnter={e => { if (c.code !== countryCode) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={e => { if (c.code !== countryCode) e.currentTarget.style.background = 'none' }}>
                  <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{c.flag}</span>
                  <span style={{ flex: 1, fontSize: 12, color: c.code === countryCode ? C.crema : C.arena, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: C.piedra }}>{c.dial}</span>
                </button>
              ))}
              {!filtered.length && <p style={{ padding: '16px 12px', fontSize: 12, color: C.piedra, textAlign: 'center' }}>Sin resultados</p>}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

// ── SetupOrgModal ─────────────────────────────────────────────────────────────

export function SetupOrgModal({ onCreated, onClose }) {
  const { logout } = useAuth()
  const [form, setForm] = useState({
    name: '', cuit: '', email: '', address: '', province: 'Santa Fe',
    city: '', postalCode: '', defaultCurrency: 'ARS',
  })
  const [orgCountry,  setOrgCountry]  = useState('AR')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)

  const phoneDigits = phoneNumber.replace(/\D/g, '')
  const phoneValid  = checkPhone(phoneDigits, orgCountry)
  const allFilled   = form.name.trim() && form.cuit.trim() && phoneDigits && phoneValid && form.email.trim() && form.address.trim() && form.province

  async function handleSubmit(e) {
    e.preventDefault()
    if (!phoneDigits || !phoneValid) {
      const name = COUNTRIES.find(c => c.code === orgCountry)?.name || orgCountry
      setError(phoneDigits ? `Teléfono inválido para ${name}` : 'El teléfono es obligatorio')
      return
    }
    setError('')
    setLoading(true)
    try {
      const countryData = COUNTRIES.find(c => c.code === orgCountry)
      const phone = `${countryData.dial} ${phoneNumber.trim()}`
      const res = await createOrganization({ ...form, phone })
      onCreated(res.data.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la empresa')
    } finally {
      setLoading(false)
    }
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      className="items-end sm:items-center">
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 0 0', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90dvh' }}
        className="sm:rounded-[0_16px_16px_0]">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(185,180,170,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BuildingSvg style={{ width: 15, height: 15, color: C.arena }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.crema, margin: 0 }}>
                {onClose ? 'Nueva organización' : 'Agregá tu empresa'}
              </p>
              <p style={{ fontSize: 11, color: C.piedra, margin: 0, marginTop: 1 }}>
                {onClose ? 'Completá los datos de la nueva organización.' : 'Para usar el CRM necesitás al menos una organización.'}
              </p>
            </div>
          </div>
          {onClose ? (
            <button type="button" onClick={onClose}
              style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
              onMouseEnter={e => e.currentTarget.style.color = C.crema}
              onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
              <CloseSvg style={{ width: 18, height: 18 }} />
            </button>
          ) : (
            <button type="button" onClick={logout}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.piedra, fontFamily: 'inherit' }}
              onMouseEnter={e => e.currentTarget.style.color = C.err}
              onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
              <LogoutSvg style={{ width: 14, height: 14 }} />
              Cerrar sesión
            </button>
          )}
        </div>

        {/* Body */}
        <form id="setup-org-form" onSubmit={handleSubmit}
          style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div className="sm:col-span-2">
              <label style={labelStyle}>Nombre de la empresa *</label>
              <input autoFocus type="text" required value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Mi empresa S.A." className="du-input" />
            </div>

            <div className="sm:col-span-2">
              <label style={labelStyle}>CUIT *</label>
              <input type="text" required value={form.cuit} onChange={e => set('cuit', e.target.value)}
                placeholder="30-12345678-9" className="du-input" />
            </div>

            <div className="sm:col-span-2">
              <label style={labelStyle}>Teléfono *</label>
              <OrgPhoneInput
                countryCode={orgCountry} phoneNumber={phoneNumber}
                onChangeCountry={setOrgCountry} onChangeNumber={setPhoneNumber} />
            </div>

            <div className="sm:col-span-2">
              <label style={labelStyle}>Email de contacto *</label>
              <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="info@empresa.com" className="du-input" />
            </div>

            <div className="sm:col-span-2">
              <label style={labelStyle}>Dirección *</label>
              <input type="text" required value={form.address} onChange={e => set('address', e.target.value)}
                placeholder="Av. Corrientes 1234" className="du-input" />
            </div>

            <div>
              <label style={labelStyle}>Provincia</label>
              <ProvinceSelect value={form.province} onChange={v => set('province', v)} className="du-input" />
            </div>

            <div>
              <label style={labelStyle}>Ciudad</label>
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
                placeholder="Rosario" className="du-input" />
            </div>

            <div>
              <label style={labelStyle}>Código postal</label>
              <input type="text" value={form.postalCode} onChange={e => set('postalCode', e.target.value)}
                placeholder="2000" className="du-input" />
            </div>

            <div className="sm:col-span-2">
              <label style={labelStyle}>Moneda de trabajo *</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['ARS', 'USD'].map(c => {
                  const active = form.defaultCurrency === c
                  return (
                    <button key={c} type="button" onClick={() => set('defaultCurrency', c)}
                      style={{ flex: 1, padding: '10px 0', borderRadius: '0 9px 9px 0', border: `1px solid ${active ? C.crema : C.linea}`, background: active ? 'rgba(242,237,227,0.08)' : 'none', color: active ? C.crema : C.piedra, fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}>
                      {c === 'ARS' ? 'ARS — Peso' : 'USD — Dólar'}
                    </button>
                  )
                })}
              </div>
              <p style={{ marginTop: 5, fontSize: 11, color: C.piedra }}>Esta elección no podrá modificarse después.</p>
            </div>

          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(229,131,115,0.08)', border: `1px solid rgba(229,131,115,0.25)`, borderRadius: '0 8px 8px 0' }}>
              <WarnCircleSvg style={{ width: 14, height: 14, color: C.err, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: C.err, margin: 0 }}>{error}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.linea}`, flexShrink: 0 }}>
          <button type="submit" form="setup-org-form" disabled={loading || !allFilled}
            style={{ width: '100%', height: 38, borderRadius: '0 10px 10px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, cursor: loading || !allFilled ? 'not-allowed' : 'pointer', opacity: loading || !allFilled ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
            {loading && (
              <svg style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {loading ? 'Creando empresa…' : 'Continuar →'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}
