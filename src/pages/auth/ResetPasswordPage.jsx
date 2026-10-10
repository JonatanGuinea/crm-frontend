import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { resetPassword as resetPasswordApi } from '../../api/auth'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

const C = {
  s1: '#141415', linea: '#2C2C2F',
  crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E',
  ok: '#7DBE93', err: '#E58373', info: '#8EB1DE',
}

const iconWrap = (bg, bd) => ({
  width: 56, height: 56, borderRadius: '50%',
  background: bg, border: `1px solid ${bd}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  margin: '0 auto 20px',
})

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) setError('El enlace no contiene un token válido.')
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      await resetPasswordApi(token, form.password)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'El enlace no es válido o ya fue usado.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{
        background: C.s1, border: `1px solid ${C.linea}`,
        borderRadius: '0 20px 20px 0', padding: '40px 32px', textAlign: 'center',
      }}>
        <div style={iconWrap('rgba(125,190,147,.1)', 'rgba(125,190,147,.2)')}>
          <svg style={{ width: 28, height: 28, color: C.ok }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 style={{ color: C.crema, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
          ¡Contraseña actualizada!
        </h2>
        <p style={{ color: C.arena, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Tu contraseña fue cambiada correctamente. Ya podés iniciar sesión.
        </p>
        <Link
          to="/login"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '10px 28px', background: C.crema, color: '#0B0B0C',
            fontSize: 13.5, fontWeight: 600, borderRadius: '0 10px 10px 0',
            textDecoration: 'none', fontFamily: 'inherit', transition: 'background 0.15s',
          }}
        >
          Iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Badge */}
      <div>
        <span style={{
          display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '2px',
          textTransform: 'uppercase', color: C.piedra,
          background: C.s1, border: `1px solid ${C.linea}`,
          padding: '4px 10px', borderRadius: '0 6px 6px 0',
        }}>
          Nueva contraseña
        </span>
      </div>

      {/* Heading */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, color: C.crema, marginBottom: 6 }}>
          Restablecer contraseña
        </h1>
        <p style={{ fontSize: 14.5, color: C.arena, lineHeight: 1.5 }}>
          Creá una nueva contraseña para tu cuenta.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Nueva contraseña */}
        <div>
          <label style={{ fontSize: 13, color: C.arena, fontWeight: 500, display: 'block', marginBottom: 7 }}>
            Nueva contraseña
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              className="du-input"
              style={{ paddingRight: 42 }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, color: C.piedra, cursor: 'pointer', display: 'flex' }}
            >
              {showPw
                ? <EyeSlashIcon style={{ width: 16, height: 16 }} />
                : <EyeIcon style={{ width: 16, height: 16 }} />
              }
            </button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div>
          <label style={{ fontSize: 13, color: C.arena, fontWeight: 500, display: 'block', marginBottom: 7 }}>
            Confirmar contraseña
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="Repetí la contraseña"
              className="du-input"
              style={{ paddingRight: 42 }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, color: C.piedra, cursor: 'pointer', display: 'flex' }}
            >
              {showConfirm
                ? <EyeSlashIcon style={{ width: 16, height: 16 }} />
                : <EyeIcon style={{ width: 16, height: 16 }} />
              }
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(229,131,115,.08)', border: '1px solid rgba(229,131,115,.25)', borderRadius: '0 8px 8px 0' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.err} strokeWidth={2} style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ fontSize: 13, color: C.err }}>{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !token}
          className="du-btn-pri"
          style={{ marginTop: 4 }}
        >
          {loading && (
            <svg style={{ width: 16, height: 16, animation: 'spin 1s linear infinite', flexShrink: 0 }} fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
          )}
          {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
        </button>
      </form>

      {/* Footer */}
      <div style={{ height: 1, background: C.linea }} />
      <p style={{ fontSize: 14.5, color: C.piedra, textAlign: 'center' }}>
        <Link to="/login" style={{ color: C.arena, textDecoration: 'none', fontWeight: 500 }}>
          ← Volver al inicio de sesión
        </Link>
      </p>
    </div>
  )
}
