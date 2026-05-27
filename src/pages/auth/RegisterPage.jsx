import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { register as registerApi } from '../../api/auth'
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'

const fields = [
  { key: 'name',              label: 'Tu nombre',                 type: 'text',     icon: UserIcon,           placeholder: 'Juan García' },
  { key: 'email',             label: 'Tu email',                  type: 'email',    icon: EnvelopeIcon,       placeholder: 'tu@email.com' },
  { key: 'password',          label: 'Contraseña',                type: 'password', icon: LockClosedIcon,     placeholder: '••••••••' },
  { key: 'organizationName',  label: 'Nombre de la empresa',      type: 'text',     icon: BuildingOfficeIcon, placeholder: 'Mi empresa S.A.' },
  { key: 'organizationEmail', label: 'Email de la empresa',       type: 'email',    icon: EnvelopeIcon,       placeholder: 'info@miempresa.com' },
  { key: 'phone',             label: 'Teléfono de contacto',      type: 'text',     icon: PhoneIcon,          placeholder: '+54 11 1234-5678' },
  { key: 'address',           label: 'Dirección',                 type: 'text',     icon: MapPinIcon,         placeholder: 'Av. Corrientes 1234, CABA', required: false },
]

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', organizationName: '', organizationEmail: '', phone: '', address: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await registerApi(form)
      login(res.data.data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-teal-500/30 shadow-2xl p-8 max-w-sm md:max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-white">Crear cuenta</h2>
        <p className="text-sm text-slate-400 mt-1">Empezá gratis, sin tarjeta requerida</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="md:grid md:grid-cols-2 md:gap-4 md:space-y-0 space-y-4">
          {fields.map(({ key, label, type, icon: Icon, placeholder, required = true }) => {
            const isPassword = type === 'password'
            const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

            return (
              <div key={key} className={key === 'address' ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                  {label}{!required && <span className="ml-1 normal-case text-slate-600">(opcional)</span>}
                </label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type={inputType}
                    required={required}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                  />
                  {isPassword && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
            <ExclamationCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {loading && (
            <svg className="animate-spin w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
          )}
          {loading ? 'Registrando...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-slate-500">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
