import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams, Link } from 'react-router-dom'
import { register as registerApi } from '../../api/auth'
import { isValidPhoneNumber } from 'libphonenumber-js'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

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

function formatPhoneNumber(raw) {
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

function PhoneInputField({ countryCode, phoneNumber, onChangeCountry, onChangeNumber }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [touched, setTouched] = useState(false)
  const btnRef = useRef()
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })

  const selected = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0]
  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
  )
  const digits = phoneNumber.replace(/\D/g, '')
  const isPhoneValid = checkPhone(digits, countryCode)
  const hasError = touched && (digits.length === 0 || !isPhoneValid)

  function handleOpen() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(v => !v)
    setSearch('')
  }

  return (
    <div>
      <label style={{ fontSize: 13, color: '#B9B4AA', fontWeight: 500, display: 'block', marginBottom: 7 }}>
        Teléfono
      </label>
      <div style={{ display: 'flex' }}>
        <button
          ref={btnRef}
          type="button"
          onClick={handleOpen}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 12px', height: 42,
            background: '#0B0B0C', border: '1px solid #2C2C2F', borderRight: 'none',
            borderRadius: '0 0 0 0', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>{selected.flag}</span>
          <span style={{ color: '#B9B4AA', fontSize: 13, fontFamily: 'Geist Mono, monospace' }}>{selected.dial}</span>
          <ChevronDownIcon style={{ width: 12, height: 12, color: '#8C877E', transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
        </button>
        <input
          type="tel"
          value={phoneNumber}
          onChange={e => onChangeNumber(formatPhoneNumber(e.target.value))}
          onBlur={() => setTouched(true)}
          placeholder="11 1234-5678"
          className={`du-input${hasError ? ' du-error' : digits.length > 0 && touched && isPhoneValid ? ' du-ok' : ''}`}
          style={{ borderRadius: '0 10px 10px 0' }}
        />
      </div>
      {hasError && (
        <p style={{ marginTop: 6, fontSize: 12, color: '#E58373', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {digits.length === 0 ? 'El teléfono es obligatorio' : `Número inválido para ${selected.name}`}
        </p>
      )}
      {touched && digits.length > 0 && isPhoneValid && (
        <p style={{ marginTop: 6, fontSize: 12, color: '#7DBE93', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
          Número válido
        </p>
      )}

      {open && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: 220, zIndex: 9999, background: '#141415', border: '1px solid #2C2C2F', borderRadius: '0 10px 10px 10px', boxShadow: '0 8px 32px rgba(0,0,0,.6)', overflow: 'hidden' }}>
            <div style={{ padding: 8, borderBottom: '1px solid #2C2C2F' }}>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar país..."
                className="du-input"
                style={{ height: 34, fontSize: 13, borderRadius: '0 7px 7px 0' }}
              />
            </div>
            <div style={{ maxHeight: 210, overflowY: 'auto' }}>
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onChangeCountry(c.code); setOpen(false) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', background: c.code === countryCode ? 'rgba(242,237,227,.08)' : 'transparent',
                    border: 'none', cursor: 'pointer', fontSize: 13,
                    color: c.code === countryCode ? '#F2EDE3' : '#B9B4AA',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{c.flag}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{c.name}</span>
                  <span style={{ fontFamily: 'Geist Mono, monospace', color: '#8C877E', fontSize: 12 }}>{c.dial}</span>
                </button>
              ))}
              {!filtered.length && (
                <p style={{ padding: '16px 12px', fontSize: 13, color: '#8C877E', textAlign: 'center' }}>Sin resultados</p>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

function decodeJwtPayload(token) {
  try { return JSON.parse(atob(token.split('.')[1])) } catch { return null }
}

const C = {
  negro: '#0B0B0C', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E',
  linea: '#2C2C2F', grafito: '#1E1E20', ok: '#7DBE93', err: '#E58373',
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('inviteToken')
  const invitePayload = inviteToken ? decodeJwtPayload(inviteToken) : null

  const [form, setForm] = useState({ name: '', email: invitePayload?.email || '', password: '', passwordConfirm: '' })
  const [userCountry, setUserCountry] = useState('AR')
  const [userPhoneNumber, setUserPhoneNumber] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.passwordConfirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    const userDigits = userPhoneNumber.replace(/\D/g, '')
    if (!userDigits || !checkPhone(userDigits, userCountry)) {
      const countryName = COUNTRIES.find(c => c.code === userCountry)?.name || userCountry
      setError(userDigits ? `Teléfono inválido para ${countryName}` : 'El teléfono es obligatorio')
      return
    }

    setLoading(true)
    try {
      const userCountryData = COUNTRIES.find(c => c.code === userCountry)
      const userPhone = `${userCountryData.dial} ${userPhoneNumber.trim()}`
      const { passwordConfirm: _, ...formData } = form
      await registerApi({ ...formData, userPhone, ...(inviteToken ? { inviteToken } : {}) })
      setRegisteredEmail(form.email)
      setRegistered(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '0 18px 18px 0', background: C.grafito, border: `1px solid ${C.linea}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.crema} strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', color: C.crema }}>Revisá tu email</h2>
          <p style={{ fontSize: 14.5, color: C.arena, marginTop: 8, lineHeight: 1.5 }}>
            Te enviamos un enlace de confirmación a
          </p>
          <p style={{ fontSize: 14.5, fontWeight: 600, color: C.crema, marginTop: 4 }}>{registeredEmail}</p>
        </div>
        <p style={{ fontSize: 13, color: C.piedra, lineHeight: 1.6 }}>
          Hacé clic en el enlace del email para activar tu cuenta. Si no lo ves, revisá la carpeta de spam.
        </p>
        <div style={{ height: 1, background: C.linea }} />
        <p style={{ fontSize: 14.5, color: C.piedra }}>
          ¿Ya confirmaste?{' '}
          <Link to="/login" style={{ color: C.crema, textDecoration: 'none', fontWeight: 500 }}>
            Iniciar sesión
          </Link>
        </p>
      </div>
    )
  }

  const mismatch = form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm
  const matched  = form.passwordConfirm.length > 0 && form.password === form.passwordConfirm

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1, color: C.crema }}>
          Crear cuenta
        </h2>
        {invitePayload ? (
          <div style={{ marginTop: 14, padding: '12px 14px', background: C.grafito, border: `1px solid ${C.linea}`, borderRadius: '0 10px 10px 0', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.arena} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p style={{ fontSize: 13, color: C.arena }}>Fuiste invitado a unirte a</p>
              <p style={{ fontSize: 14.5, fontWeight: 600, color: C.crema, marginTop: 2 }}>{invitePayload.orgName}</p>
              <p style={{ fontSize: 12, color: C.piedra, marginTop: 2 }}>Rol: {invitePayload.role === 'admin' ? 'Administrador' : 'Miembro'}</p>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 15, color: C.piedra, marginTop: 6 }}>Empezá gratis, sin tarjeta requerida.</p>
        )}
      </div>

      {/* Nombre */}
      <div>
        <label style={{ fontSize: 13, color: C.arena, fontWeight: 500, display: 'block', marginBottom: 7 }}>Tu nombre</label>
        <input
          type="text" required value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Juan García"
          className="du-input"
        />
      </div>

      {/* Email */}
      <div>
        <label style={{ fontSize: 13, color: C.arena, fontWeight: 500, display: 'block', marginBottom: 7 }}>
          Tu email
          {invitePayload && <span style={{ marginLeft: 8, fontSize: 12, color: C.piedra }}>(pre-completado)</span>}
        </label>
        <input
          type="email" required
          readOnly={Boolean(invitePayload)}
          value={form.email}
          onChange={invitePayload ? undefined : e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="tu@email.com"
          className="du-input"
        />
      </div>

      {/* Contraseña */}
      <div>
        <label style={{ fontSize: 13, color: C.arena, fontWeight: 500, display: 'block', marginBottom: 7 }}>Contraseña</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'} required
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="••••••••"
            className="du-input"
            style={{ paddingRight: 40 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, padding: 0 }}
          >
            {showPassword
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            }
          </button>
        </div>
      </div>

      {/* Confirmar contraseña */}
      <div>
        <label style={{ fontSize: 13, color: C.arena, fontWeight: 500, display: 'block', marginBottom: 7 }}>Confirmar contraseña</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPasswordConfirm ? 'text' : 'password'} required
            value={form.passwordConfirm}
            onChange={e => setForm(f => ({ ...f, passwordConfirm: e.target.value }))}
            placeholder="••••••••"
            className={`du-input${mismatch ? ' du-error' : matched ? ' du-ok' : ''}`}
            style={{ paddingRight: 40 }}
          />
          <button
            type="button"
            onClick={() => setShowPasswordConfirm(v => !v)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, padding: 0 }}
          >
            {showPasswordConfirm
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            }
          </button>
        </div>
        {mismatch && (
          <p style={{ marginTop: 6, fontSize: 12, color: C.err, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Las contraseñas no coinciden
          </p>
        )}
        {matched && (
          <p style={{ marginTop: 6, fontSize: 12, color: C.ok, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
            Las contraseñas coinciden
          </p>
        )}
      </div>

      {/* Teléfono */}
      <PhoneInputField
        countryCode={userCountry}
        phoneNumber={userPhoneNumber}
        onChangeCountry={setUserCountry}
        onChangeNumber={setUserPhoneNumber}
      />

      {/* Error general */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(229,131,115,.08)', border: `1px solid rgba(229,131,115,.25)`, borderRadius: '0 10px 10px 0' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.err} strokeWidth={2} style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p style={{ fontSize: 13, color: C.err }}>{error}</p>
        </div>
      )}

      {/* Submit */}
      <button type="submit" disabled={loading} className="du-btn-pri">
        {loading && (
          <svg style={{ animation: 'spin 1s linear infinite', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none">
            <circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
          </svg>
        )}
        {loading ? 'Registrando...' : invitePayload ? 'Crear cuenta y unirme' : 'Crear cuenta'}
      </button>

      {/* Footer */}
      <div style={{ height: 1, background: C.linea }} />
      <p style={{ fontSize: 14.5, color: C.piedra, textAlign: 'center' }}>
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" style={{ color: C.crema, textDecoration: 'none', fontWeight: 500 }}>
          Iniciar sesión
        </Link>
      </p>
    </form>
  )
}
