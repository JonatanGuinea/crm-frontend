import { useState, useEffect } from 'react'
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

const personalFields = [
  { key: 'name',     label: 'Tu nombre',   type: 'text',     icon: UserIcon,       placeholder: 'Juan García' },
  { key: 'email',    label: 'Tu email',    type: 'email',    icon: EnvelopeIcon,   placeholder: 'tu@email.com' },
  { key: 'password', label: 'Contraseña',  type: 'password', icon: LockClosedIcon, placeholder: '••••••••' },
  { key: 'address',  label: 'Dirección',   type: 'text',     icon: MapPinIcon,     placeholder: 'Av. Corrientes 1234, CABA', required: false },
]

const companyFields = [
  { key: 'organizationName',  label: 'Nombre de la empresa', type: 'text',  icon: BuildingOfficeIcon, placeholder: 'Mi empresa S.A.' },
  { key: 'organizationEmail', label: 'Email de la empresa',  type: 'email', icon: EnvelopeIcon,       placeholder: 'info@miempresa.com' },
  { key: 'phone',             label: 'Teléfono de contacto', type: 'text',  icon: PhoneIcon,          placeholder: '+54 11 1234-5678' },
  { key: 'orgAddress',        label: 'Dirección de la empresa', type: 'text', icon: MapPinIcon,        placeholder: 'Av. Corrientes 1234, CABA', required: false },
]

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-sans tracking-wide text-cyan-300/80 mt-1 mb-3">
      ◈ &nbsp;{children}
    </p>
  )
}

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [visible, setVisible] = useState(true)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '', organizationName: '', organizationEmail: '', phone: '', orgAddress: '', defaultCurrency: 'USD' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function goToStep(next) {
    const dir = next > step ? 1 : -1
    setDirection(dir)
    setVisible(false)
    setTimeout(() => {
      setStep(next)
      setVisible(true)
    }, 180)
  }

  const PHONE_RE = /^\+?[\d\s\-(). ]{7,20}$/

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.phone && !PHONE_RE.test(form.phone.trim())) {
      setError('Formato de teléfono inválido. Ej: +54 11 1234-5678')
      return
    }
    setLoading(true)
    try {
      const res = await registerApi({ ...form, address: form.orgAddress || form.address })
      login(res.data.data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  function handleContinue(e) {
    e.preventDefault()
    setError('')
    goToStep(2)
  }

  function renderField({ key, label, type, icon: Icon, placeholder, required = true, span = false }) {
    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type
    const isPhoneInvalid = key === 'phone' && form.phone && !PHONE_RE.test(form.phone.trim())
    return (
      <div key={key} className={span ? 'md:col-span-2' : ''}>
        <label className="block text-xs font-sans tracking-wide text-cyan-300/80 mb-2">
          {label}{!required && <span className="ml-1.5 normal-case tracking-normal text-slate-600 font-sans">(opcional)</span>}
        </label>
        <div className="relative group">
          <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${isPhoneInvalid ? 'text-red-400/70' : 'text-cyan-500/40 group-focus-within:text-cyan-400/70'}`} />
          <input
            type={inputType}
            required={required}
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
            className={`w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none transition-all ${
              isPhoneInvalid
                ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/20'
                : 'border-slate-700/50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20'
            }`}
          />
          {isPhoneInvalid && (
            <p className="mt-1 text-[10px] text-red-400 font-mono">Ej: +54 11 1234-5678</p>
          )}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-cyan-400 transition-colors"
            >
              {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative max-w-sm md:max-w-3xl mx-auto">
      {/* Glow detrás de la card */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-500/20 via-transparent to-teal-500/10 blur-sm pointer-events-none" />

      <div className="relative bg-[#080e1a]/95 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-[0_0_60px_rgba(6,182,212,0.07),inset_0_1px_0_rgba(6,182,212,0.08)] p-8">

        {/* Badge + steps */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-mono tracking-[0.25em] text-cyan-400 uppercase">
            ◈ &nbsp;Nuevo registro
          </p>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-cyan-400' : 'bg-slate-700'}`} />
            <div className={`w-6 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-cyan-400' : 'bg-slate-700'}`} />
          </div>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white leading-tight">
            {step === 1 ? 'Crear cuenta' : 'Tu empresa'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {step === 1 ? 'Empezá gratis, sin tarjeta requerida' : 'Últimos datos para configurar tu espacio'}
          </p>
        </div>

        {/* Steps */}
        <div
          className="transition-all duration-180"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? 'translateX(0)'
              : direction > 0 ? 'translateX(-16px)' : 'translateX(16px)',
            transition: 'opacity 180ms ease, transform 180ms ease',
          }}
        >

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={handleContinue} className="space-y-1">
            <SectionLabel>Datos personales</SectionLabel>
            <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
              {personalFields.map(renderField)}
            </div>
            <button
              type="submit"
              className="relative w-full py-2.5 px-4 mt-6 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 overflow-hidden group bg-teal-500 hover:bg-teal-400 text-white shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_35px_rgba(20,184,166,0.45)]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
              Continuar →
            </button>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-1">
            <SectionLabel>Datos de la empresa</SectionLabel>
            <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
              {companyFields.map(renderField)}
            </div>

            <div className="mt-4">
              <label className="block text-xs font-sans tracking-wide text-cyan-300/80 mb-2">
                Moneda de trabajo
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['USD', 'ARS'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, defaultCurrency: c }))}
                    className={`py-2.5 px-4 rounded-lg text-sm font-semibold border transition-all ${
                      form.defaultCurrency === c
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-950/70 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                    }`}
                  >
                    {c === 'USD' ? 'USD — Dólar' : 'ARS — Peso'}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-slate-600 font-mono">
                Esta elección no podrá modificarse después.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/8 border border-red-500/20 rounded-lg mt-4">
                <ExclamationCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 border border-slate-700/60 hover:border-slate-600 hover:text-slate-300 transition-all"
              >
                ← Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="relative flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed bg-teal-500 hover:bg-teal-400 text-white shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_35px_rgba(20,184,166,0.45)]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                {loading && (
                  <svg className="animate-spin w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                )}
                {loading ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </div>
          </form>
        )}

        </div>{/* end animated wrapper */}

        {/* Divider */}
        <div className="mt-7 pt-6 border-t border-slate-800">
          <p className="text-sm text-center text-slate-600">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
