import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { register as registerApi } from '../../api/auth'
import { isValidPhoneNumber } from 'libphonenumber-js'
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'

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
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search)
  )

  const digits = phoneNumber.replace(/\D/g, '')
  const isPhoneValid = checkPhone(digits, countryCode)

  const hasError = touched && (digits.length === 0 || !isPhoneValid)
  const errorMsg = digits.length === 0
    ? 'El teléfono es obligatorio'
    : `Número inválido para ${selected.name}`

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
      <label className="block text-xs font-sans tracking-wide text-cyan-300/80 mb-2">
        Teléfono
      </label>
      <div className="flex">
        <button
          ref={btnRef}
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-950/70 border border-r-0 border-slate-700/50 rounded-l-lg hover:bg-slate-900/60 transition-colors shrink-0"
        >
          <span className="text-base leading-none text-cyan-400">{selected.flag}</span>
          <span className="text-white/80 text-xs font-mono">{selected.dial}</span>
          <ChevronDownIcon className={`w-3 h-3 text-slate-600 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        <input
          type="tel"
          value={phoneNumber}
          onChange={e => onChangeNumber(formatPhoneNumber(e.target.value))}
          onBlur={() => setTouched(true)}
          placeholder="11 1234-5678"
          className={`flex-1 px-3 py-2.5 bg-slate-950/70 border rounded-r-lg text-sm text-white placeholder-slate-600 focus:outline-none transition-all ${
            hasError
              ? 'border-red-500/60 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20'
              : digits.length > 0 && touched && isPhoneValid
                ? 'border-teal-500/50 focus:border-teal-500/70 focus:ring-1 focus:ring-teal-500/20'
                : 'border-slate-700/50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20'
          }`}
        />
      </div>

      {hasError && (
        <p className="mt-1.5 text-[11px] text-red-400 flex items-center gap-1">
          <ExclamationCircleIcon className="w-3.5 h-3.5 shrink-0" />
          {errorMsg}
        </p>
      )}
      {touched && digits.length > 0 && isPhoneValid && (
        <p className="mt-1.5 text-[11px] text-teal-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Número válido
        </p>
      )}

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            style={{ top: dropPos.top, left: dropPos.left, width: '220px' }}
            className="fixed z-[9999] bg-[#0d1524] border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-slate-800">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar país..."
                className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onChangeCountry(c.code); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                    c.code === countryCode
                      ? 'bg-cyan-500/10 text-cyan-300'
                      : 'text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-base leading-none text-cyan-400">{c.flag}</span>
                  <span className="flex-1 text-left">{c.name}</span>
                  <span className="font-mono text-white/60">{c.dial}</span>
                </button>
              ))}
              {!filtered.length && (
                <p className="px-3 py-4 text-xs text-slate-600 text-center">Sin resultados</p>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

const fields = [
  { key: 'name',            label: 'Tu nombre',           type: 'text',     icon: UserIcon,       placeholder: 'Juan García' },
  { key: 'email',           label: 'Tu email',            type: 'email',    icon: EnvelopeIcon,   placeholder: 'tu@email.com' },
  { key: 'password',        label: 'Contraseña',          type: 'password', icon: LockClosedIcon, placeholder: '••••••••' },
  { key: 'passwordConfirm', label: 'Confirmar contraseña', type: 'password', icon: LockClosedIcon, placeholder: '••••••••' },
]

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', passwordConfirm: '' })
  const [userCountry, setUserCountry] = useState('AR')
  const [userPhoneNumber, setUserPhoneNumber] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      const res = await registerApi({ ...formData, userPhone })
      login(res.data.data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  function renderField({ key, label, type, icon: Icon, placeholder }) {
    const isPassword = type === 'password'
    const isConfirm = key === 'passwordConfirm'
    const visible = isConfirm ? showPasswordConfirm : showPassword
    const inputType = isPassword ? (visible ? 'text' : 'password') : type
    const mismatch = isConfirm && form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm
    const matched  = isConfirm && form.passwordConfirm.length > 0 && form.password === form.passwordConfirm

    return (
      <div key={key}>
        <label className="block text-xs font-sans tracking-wide text-cyan-300/80 mb-2">
          {label}
        </label>
        <div className="relative group">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/40 group-focus-within:text-cyan-400/70 pointer-events-none transition-colors" />
          <input
            type={inputType}
            required
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
            className={`w-full pl-9 pr-9 py-2.5 bg-slate-950/70 border rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${
              mismatch
                ? 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20'
                : matched
                  ? 'border-teal-500/50 focus:border-teal-500/70 focus:ring-teal-500/20'
                  : 'border-slate-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/20'
            }`}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => isConfirm ? setShowPasswordConfirm(v => !v) : setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-cyan-400 transition-colors"
            >
              {visible ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          )}
        </div>
        {mismatch && (
          <p className="mt-1.5 text-[11px] text-red-400 flex items-center gap-1">
            <ExclamationCircleIcon className="w-3.5 h-3.5 shrink-0" />
            Las contraseñas no coinciden
          </p>
        )}
        {matched && (
          <p className="mt-1.5 text-[11px] text-teal-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Las contraseñas coinciden
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="relative max-w-sm mx-auto">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-500/20 via-transparent to-teal-500/10 blur-sm pointer-events-none" />

      <div className="relative bg-[#080e1a]/30 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-[0_0_60px_rgba(6,182,212,0.07),inset_0_1px_0_rgba(6,182,212,0.08)] p-8">

        <p className="text-[10px] font-mono tracking-[0.25em] text-cyan-400 uppercase mb-4">
          ◈ &nbsp;Nuevo registro
        </p>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white leading-tight">Crear cuenta</h2>
          <p className="text-sm text-slate-500 mt-1">Empezá gratis, sin tarjeta requerida</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(renderField)}
          <PhoneInputField
            countryCode={userCountry}
            phoneNumber={userPhoneNumber}
            onChangeCountry={setUserCountry}
            onChangeNumber={setUserPhoneNumber}
          />

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/8 border border-red-500/20 rounded-lg">
              <ExclamationCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-2.5 px-4 mt-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed bg-teal-500 hover:bg-teal-400 text-white shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_35px_rgba(20,184,166,0.45)]"
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
        </form>

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
