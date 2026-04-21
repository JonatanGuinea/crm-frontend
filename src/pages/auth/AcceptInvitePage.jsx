import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { acceptInvite } from '../../api/auth'

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setError('No se encontró el token de invitación en el enlace.')
      setStatus('error')
      return
    }

    acceptInvite(token)
      .then(res => {
        login(res.data.data.token)
        setStatus('success')
        setTimeout(() => navigate('/'), 2000)
      })
      .catch(err => {
        setError(err.response?.data?.error || 'El token de invitación es inválido o ya expiró.')
        setStatus('error')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-line p-8 text-center">
      {status === 'loading' && (
        <>
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-fg-soft text-sm">Procesando invitación...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-12 h-12 bg-brand-subtle rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-fg mb-1">¡Invitación aceptada!</h2>
          <p className="text-sm text-fg-soft">Redirigiendo al dashboard...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-12 h-12 bg-danger-subtle rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-fg mb-1">No se pudo aceptar la invitación</h2>
          <p className="text-sm text-danger mb-6">{error}</p>
          <Link
            to="/login"
            className="inline-block px-4 py-2 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand-hover transition-colors"
          >
            Ir al login
          </Link>
        </>
      )}
    </div>
  )
}
