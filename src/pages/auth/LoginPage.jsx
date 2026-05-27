import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { login as loginApi } from '../../api/auth'
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginApi(form)
      login(res.data.data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative max-w-sm mx-auto">
      {/* Glow detrás de la card */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-500/20 via-transparent to-teal-500/10 blur-sm pointer-events-none" />

      <div className="relative bg-[#080e1a]/95 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-[0_0_60px_rgba(6,182,212,0.07),inset_0_1px_0_rgba(6,182,212,0.08)] p-8">

        {/* Badge */}
        <p className="text-[10px] font-mono tracking-[0.25em] text-cyan-400 uppercase mb-4">
          ◈ &nbsp;Acceso al sistema
        </p>

        {/* Header */}
        <div className="mb-7">
          <h2 className="text-2xl font-bold text-white leading-tight">Bienvenido</h2>
          <p className="text-sm text-slate-500 mt-1">Ingresá tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-[10px] font-mono tracking-[0.2em] text-cyan-400/70 uppercase mb-2">
              Email
            </label>
            <div className="relative group">
              <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/40 group-focus-within:text-cyan-400/70 pointer-events-none transition-colors" />
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-[10px] font-mono tracking-[0.2em] text-cyan-400/70 uppercase mb-2">
              Contraseña
            </label>
            <div className="relative group">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/40 group-focus-within:text-cyan-400/70 pointer-events-none transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-cyan-400 transition-colors"
              >
                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/8 border border-red-500/20 rounded-lg">
              <ExclamationCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-2.5 px-4 mt-1 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed bg-teal-500 hover:bg-teal-400 text-white shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_35px_rgba(20,184,166,0.45)]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
            {loading && (
              <svg className="animate-spin w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
            )}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-7 pt-6 border-t border-slate-800">
          <p className="text-sm text-center text-slate-600">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Registrarse
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
