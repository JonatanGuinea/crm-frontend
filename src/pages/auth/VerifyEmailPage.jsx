import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { verifyEmail } from '../../api/auth'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('loading') // loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('El enlace no contiene un token válido.')
      return
    }

    verifyEmail(token)
      .then(res => {
        login(res.data.data.token)
        setStatus('success')
        setTimeout(() => navigate('/'), 2000)
      })
      .catch(err => {
        setStatus('error')
        setErrorMsg(err.response?.data?.error || 'El enlace no es válido o ya fue usado.')
      })
  // solo al montar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative max-w-sm mx-auto">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-500/20 via-transparent to-teal-500/10 blur-sm pointer-events-none" />
      <div className="relative bg-[#080e1a]/30 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-[0_0_60px_rgba(6,182,212,0.07),inset_0_1px_0_rgba(6,182,212,0.08)] p-8 text-center">

        {status === 'loading' && (
          <>
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center mx-auto mb-5">
              <svg className="animate-spin w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verificando...</h2>
            <p className="text-sm text-slate-500">Confirmando tu dirección de email.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/25 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">¡Cuenta activada!</h2>
            <p className="text-sm text-slate-400">Tu email fue confirmado. Redirigiendo al inicio...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto mb-5">
              <ExclamationCircleIcon className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Enlace inválido</h2>
            <p className="text-sm text-slate-400 mb-6">{errorMsg}</p>
            <Link
              to="/login"
              className="inline-block px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Ir al inicio de sesión
            </Link>
          </>
        )}

      </div>
    </div>
  )
}
