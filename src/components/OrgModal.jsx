import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { createOrganization } from '../api/auth'
import { isValidPhoneNumber } from 'libphonenumber-js'
import {
  BuildingOffice2Icon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { AR_PROVINCES } from '../utils/arProvinces'

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

function formatPhone(raw) {
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

function OrgPhoneInput({ countryCode, phoneNumber, onChangeCountry, onChangeNumber }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [touched, setTouched] = useState(false)
  const btnRef = useRef()
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })

  const selected = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0]
  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
  )
  const digits = phoneNumber.replace(/\D/g, '')
  const isValid = checkPhone(digits, countryCode)
  const hasError = touched && (digits.length === 0 || !isValid)
  const errorMsg = digits.length === 0 ? 'El teléfono es obligatorio' : `Número inválido para ${selected.name}`

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
      <div className="flex">
        <button
          ref={btnRef}
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-surface border border-r-0 border-line rounded-l-lg hover:bg-raised transition-colors shrink-0"
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="text-fg text-xs font-mono">{selected.dial}</span>
          <ChevronDownIcon className={`w-3 h-3 text-fg-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <input
          type="tel"
          value={phoneNumber}
          onChange={e => onChangeNumber(formatPhone(e.target.value))}
          onBlur={() => setTouched(true)}
          placeholder="11 1234-5678"
          className={`flex-1 px-3 py-2.5 bg-surface border rounded-r-lg text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 transition-all ${
            hasError
              ? 'border-danger focus:ring-danger/20'
              : digits.length > 0 && touched && isValid
                ? 'border-brand focus:ring-brand/20'
                : 'border-line focus:ring-brand'
          }`}
        />
      </div>
      {hasError && (
        <p className="mt-1.5 text-[11px] text-danger flex items-center gap-1">
          <ExclamationCircleIcon className="w-3.5 h-3.5 shrink-0" />
          {errorMsg}
        </p>
      )}
      {touched && digits.length > 0 && isValid && (
        <p className="mt-1.5 text-[11px] text-brand flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Número válido
        </p>
      )}
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[10000]" onClick={() => setOpen(false)} />
          <div
            style={{ top: dropPos.top, left: dropPos.left, width: '220px' }}
            className="fixed z-[10001] bg-overlay border border-line rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-line">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar país..."
                className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-lg text-xs text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-brand transition-all"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onChangeCountry(c.code); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                    c.code === countryCode ? 'bg-brand-subtle text-brand' : 'text-fg hover:bg-raised'
                  }`}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="flex-1 text-left">{c.name}</span>
                  <span className="font-mono text-fg-muted">{c.dial}</span>
                </button>
              ))}
              {!filtered.length && <p className="px-3 py-4 text-xs text-fg-muted text-center">Sin resultados</p>}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

const inputCls = "w-full px-3 py-2.5 bg-surface border border-line rounded-lg text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-brand transition-all"
const labelCls = "block text-xs text-fg-muted mb-1.5"

export function SetupOrgModal({ onCreated, onClose }) {
  const { logout } = useAuth()
  const [form, setForm] = useState({ name: '', cuit: '', email: '', address: '', province: 'Santa Fe', city: '', postalCode: '', defaultCurrency: 'ARS' })
  const [orgCountry, setOrgCountry] = useState('AR')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const phoneDigits = phoneNumber.replace(/\D/g, '')
  const phoneValid = checkPhone(phoneDigits, orgCountry)
  const allFilled = form.name.trim() && form.cuit.trim() && phoneDigits && phoneValid && form.email.trim() && form.address.trim() && form.province

  async function handleSubmit(e) {
    e.preventDefault()
    if (!phoneDigits || !phoneValid) {
      const name = COUNTRIES.find(c => c.code === orgCountry)?.name || orgCountry
      setError(phoneDigits ? `Teléfono inválido para ${name}` : 'El teléfono es obligatorio')
      return
    }
    setError('')
    setLoading(true)
    try {
      const countryData = COUNTRIES.find(c => c.code === orgCountry)
      const phone = `${countryData.dial} ${phoneNumber.trim()}`
      const res = await createOrganization({ ...form, phone })
      onCreated(res.data.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la empresa')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="w-full sm:max-w-lg bg-surface border-t sm:border border-line rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[calc(100vh-2rem)]">

        {/* Header */}
        <div className="px-4 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-line shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-subtle text-brand text-xs font-medium">
              <BuildingOffice2Icon className="w-3.5 h-3.5" />
              {onClose ? 'Nueva organización' : 'Configuración inicial'}
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md text-fg-muted hover:bg-raised hover:text-fg transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-danger transition-colors"
              >
                <ArrowRightStartOnRectangleIcon className="w-3.5 h-3.5" />
                Cerrar sesión
              </button>
            )}
          </div>
          <h2 className="text-xl font-bold text-fg">Agregá tu empresa</h2>
          <p className="text-sm text-fg-muted mt-1">
            {onClose
              ? 'Completá los datos de la nueva organización.'
              : 'Para usar el CRM necesitás al menos una organización.'}
          </p>
        </div>

        {/* Body */}
        <form id="setup-org-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 min-h-0 px-4 py-3 sm:px-6 sm:py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nombre de la empresa *</label>
              <input
                autoFocus
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls}
                placeholder="Mi empresa S.A."
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>CUIT *</label>
              <input
                type="text"
                required
                value={form.cuit}
                onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))}
                className={inputCls}
                placeholder="30-12345678-9"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Teléfono *</label>
              <OrgPhoneInput
                countryCode={orgCountry}
                phoneNumber={phoneNumber}
                onChangeCountry={setOrgCountry}
                onChangeNumber={setPhoneNumber}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Email de contacto *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputCls}
                placeholder="info@empresa.com"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Dirección *</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className={inputCls}
                placeholder="Av. Corrientes 1234"
              />
            </div>
            <div>
              <label className={labelCls}>Provincia</label>
              <select
                value={form.province}
                onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                className={inputCls}
              >
                <option value="">Seleccionar provincia</option>
                {AR_PROVINCES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className={inputCls}
                placeholder="Rosario"
              />
            </div>
            <div>
              <label className={labelCls}>Código postal</label>
              <input
                type="text"
                value={form.postalCode}
                onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                className={inputCls}
                placeholder="2000"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Moneda de trabajo *</label>
              <div className="grid grid-cols-2 gap-3">
                {['ARS', 'USD'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, defaultCurrency: c }))}
                    className={`py-2.5 px-4 rounded-lg text-sm font-semibold border transition-all ${
                      form.defaultCurrency === c
                        ? 'bg-brand-subtle border-brand text-brand shadow-sm'
                        : 'bg-surface border-line text-fg-soft hover:border-line-soft hover:text-fg'
                    }`}
                  >
                    {c === 'ARS' ? 'ARS — Peso' : 'USD — Dólar'}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-fg-muted">Esta elección no podrá modificarse después.</p>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-danger bg-danger-subtle px-3 py-2 rounded-lg">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-line shrink-0">
          <button
            type="submit"
            form="setup-org-form"
            disabled={loading || !allFilled}
            className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {loading ? 'Creando empresa...' : 'Continuar →'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
