import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { confirmPasswordChange } from '../../api/profile'

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

export default function ConfirmPasswordChangePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('El enlace no contiene un token válido.')
      return
    }
    confirmPasswordChange(token)
      .then(() => setStatus('success'))
      .catch(err => {
        setStatus('error')
        setErrorMsg(err.response?.data?.error || 'El enlace no es válido o ya fue usado.')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{
      background: C.s1, border: `1px solid ${C.linea}`,
      borderRadius: '0 20px 20px 0', padding: '40px 32px', textAlign: 'center',
    }}>

      {status === 'loading' && (
        <>
          <div style={iconWrap('rgba(142,177,222,.1)', 'rgba(142,177,222,.2)')}>
            <svg style={{ width: 24, height: 24, color: C.info, animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
          </div>
          <h2 style={{ color: C.crema, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Verificando...
          </h2>
          <p style={{ color: C.piedra, fontSize: 14 }}>Aplicando el cambio de contraseña.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={iconWrap('rgba(125,190,147,.1)', 'rgba(125,190,147,.2)')}>
            <svg style={{ width: 28, height: 28, color: C.ok }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 style={{ color: C.crema, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
            ¡Contraseña actualizada!
          </h2>
          <p style={{ color: C.arena, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Tu contraseña fue cambiada correctamente. Ya podés iniciar sesión con la nueva contraseña.
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
        </>
      )}

      {status === 'error' && (
        <>
          <div style={iconWrap('rgba(229,131,115,.1)', 'rgba(229,131,115,.2)')}>
            <svg style={{ width: 28, height: 28, color: C.err }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ color: C.crema, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Enlace inválido
          </h2>
          <p style={{ color: C.arena, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{errorMsg}</p>
          <Link
            to="/login"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: '10px 28px', background: C.crema, color: '#0B0B0C',
              fontSize: 13.5, fontWeight: 600, borderRadius: '0 10px 10px 0',
              textDecoration: 'none', fontFamily: 'inherit', transition: 'background 0.15s',
            }}
          >
            Ir al inicio de sesión
          </Link>
        </>
      )}
    </div>
  )
}
