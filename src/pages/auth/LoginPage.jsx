import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { login as loginApi, forgotPassword as forgotPasswordApi } from '../../api/auth'

const C = {
  negro: '#0B0B0C', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E',
  linea: '#2C2C2F', grafito: '#1E1E20', err: '#E58373',
}

function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPasswordApi(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el email. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.65)', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ position: 'relative', width: '100%', maxWidth: 400, background: C.grafito, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', padding: 28 }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, padding: 4 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '0 16px 16px 0', background: '#1E1E20', border: `1px solid ${C.linea}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.crema} strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: C.crema, marginBottom: 8 }}>Revisá tu email</h3>
            <p style={{ fontSize: 14, color: C.arena, lineHeight: 1.55, marginBottom: 20 }}>
              Si ese email está registrado, te enviamos un enlace para restablecer tu contraseña. El enlace expira en 30 minutos.
            </p>
            <button onClick={onClose} className="du-btn-pri" style={{ height: 40 }}>Cerrar</button>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: C.crema, marginBottom: 6 }}>Olvidé mi contraseña</h3>
            <p style={{ fontSize: 14, color: C.piedra, marginBottom: 24, lineHeight: 1.5 }}>Ingresá tu email y te enviamos un enlace para crear una nueva contraseña.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: C.arena, fontWeight: 500, display: 'block', marginBottom: 7 }}>Email</label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="du-input"
                />
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(229,131,115,.08)', border: `1px solid rgba(229,131,115,.25)`, borderRadius: '0 10px 10px 0' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.err} strokeWidth={2} style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p style={{ fontSize: 13, color: C.err }}>{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="du-btn-pri" style={{ height: 40 }}>
                {loading && (
                  <svg style={{ animation: 'spin 1s linear infinite', width: 15, height: 15 }} viewBox="0 0 24 24" fill="none">
                    <circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                  </svg>
                )}
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginApi(form)
      login(res.data.data.token, remember)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div>
          <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1, color: C.crema }}>
            Ingresar
          </h2>
          <p style={{ fontSize: 15, color: C.piedra, marginTop: 6 }}>Con el email de tu cuenta.</p>
        </div>

        {/* Email */}
        <div>
          <label style={{ fontSize: 13, color: C.arena, fontWeight: 500, display: 'block', marginBottom: 7 }}>Email</label>
          <input
            type="email" required value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="tu@email.com"
            className="du-input"
          />
        </div>

        {/* Contraseña */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <label style={{ fontSize: 13, color: C.arena, fontWeight: 500 }}>Contraseña</label>
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              style={{ fontSize: 13, color: C.piedra, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
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

        {/* Recordarme */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div
            onClick={() => setRemember(v => !v)}
            style={{
              width: 16, height: 16, borderRadius: '0 5px 5px 0',
              border: `1px solid ${remember ? C.crema : C.linea}`,
              background: remember ? C.crema : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.15s', cursor: 'pointer',
            }}
          >
            {remember && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.negro} strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            )}
          </div>
          <span style={{ fontSize: 13, color: C.piedra }}>Recordarme</span>
        </label>

        {/* Error */}
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
          {loading ? 'Entrando...' : 'Ingresar'}
        </button>

        {/* Footer */}
        <div style={{ height: 1, background: C.linea }} />
        <p style={{ fontSize: 14.5, color: C.piedra, textAlign: 'center' }}>
          ¿Todavía no tenés cuenta?{' '}
          <Link to="/register" style={{ color: C.crema, textDecoration: 'none', fontWeight: 500 }}>
            Crear cuenta
          </Link>
        </p>
      </form>
    </>
  )
}
