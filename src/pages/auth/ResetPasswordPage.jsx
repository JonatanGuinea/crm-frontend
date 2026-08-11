import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { resetPassword as resetPasswordApi } from '../../api/auth'
import { LockClosedIcon, EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

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

  return (
    <div className="relative max-w-sm mx-auto">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-500/20 via-transparent to-teal-500/10 blur-sm pointer-events-none" />

      <div className="relative bg-[#080e1a]/30 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-[0_0_60px_rgba(6,182,212,0.07),inset_0_1px_0_rgba(6,182,212,0.08)] p-8">

        {success ? (
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/25 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">¡Contraseña actualizada!</h2>
            <p className="text-sm text-slate-400 mb-5">Tu contraseña fue cambiada correctamente. Ya podés iniciar sesión.</p>
            <Link
              to="/login"
              className="inline-block px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-mono tracking-[0.25em] text-cyan-400 uppercase mb-4">
              ◈ &nbsp;Nueva contraseña
            </p>
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-white leading-tight">Restablecer contraseña</h2>
              <p className="text-sm text-slate-500 mt-1">Creá una nueva contraseña para tu cuenta.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-sans tracking-wide text-cyan-300/80 mb-2">
                  Nueva contraseña
                </label>
                <div className="relative group">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/40 group-focus-within:text-cyan-400/70 pointer-events-none transition-colors" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-cyan-400 transition-colors"
                  >
                    {showPw ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans tracking-wide text-cyan-300/80 mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative group">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/40 group-focus-within:text-cyan-400/70 pointer-events-none transition-colors" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                    placeholder="Repetí la contraseña"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-cyan-400 transition-colors"
                  >
                    {showConfirm ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/8 border border-red-500/20 rounded-lg">
                  <ExclamationCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="relative w-full py-2.5 px-4 mt-1 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed bg-teal-500 hover:bg-teal-400 text-white shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_35px_rgba(20,184,166,0.45)]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                {loading && (
                  <svg className="animate-spin w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                )}
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <Link to="/login" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">
                Volver al inicio de sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
