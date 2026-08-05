/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { ChevronDownIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { isValidPhoneNumber } from 'libphonenumber-js'

export const PHONE_COUNTRIES = [
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

export function formatPhoneNumber(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 12)
  if (d.length <= 2)  return d
  if (d.length <= 6)  return `${d.slice(0,2)} ${d.slice(2)}`
  if (d.length <= 10) return `${d.slice(0,2)} ${d.slice(2,6)}-${d.slice(6)}`
  return `${d.slice(0,3)} ${d.slice(3,7)}-${d.slice(7)}`
}

export function checkPhone(digits, countryCode) {
  if (!digits) return false
  try { return isValidPhoneNumber(digits, countryCode) } catch { return false }
}

/**
 * Props:
 *   countryCode       string   — e.g. 'AR'
 *   phoneNumber       string   — formatted local number
 *   onChangeCountry   fn(code) — country changed
 *   onChangeNumber    fn(str)  — number changed (formatted)
 *   onValidChange     fn(bool) — validity changed
 *   label             string   — optional, default 'Teléfono'
 */
export default function PhoneInput({
  countryCode,
  phoneNumber,
  onChangeCountry,
  onChangeNumber,
  onValidChange,
  label = 'Teléfono',
}) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const [touched, setTouched] = useState(false)

  const selected = PHONE_COUNTRIES.find(c => c.code === countryCode) || PHONE_COUNTRIES[0]
  const filtered = PHONE_COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
  )

  const digits      = phoneNumber.replace(/\D/g, '')
  const isValid     = checkPhone(digits, countryCode)
  const hasError    = touched && !isValid
  const hasSuccess  = touched && digits.length > 0 && isValid

  function handleCountry(code) {
    onChangeCountry(code)
    const d = phoneNumber.replace(/\D/g, '')
    onValidChange?.(checkPhone(d, code))
    setOpen(false)
    setSearch('')
  }

  function handleNumber(e) {
    const formatted = formatPhoneNumber(e.target.value)
    onChangeNumber(formatted)
    const d = formatted.replace(/\D/g, '')
    onValidChange?.(checkPhone(d, countryCode))
  }

  function handleBlur() {
    setTouched(true)
    onValidChange?.(isValid)
  }

  function close() { setOpen(false); setSearch('') }

  const borderCls = hasError
    ? 'border-red-400 focus-within:ring-red-300'
    : hasSuccess
      ? 'border-emerald-500 focus-within:ring-emerald-200'
      : 'border-zinc-200 dark:border-zinc-700 focus-within:ring-slate-200 dark:focus-within:ring-slate-600'

  return (
    <div>
      {label && <label className="block text-xs font-semibold text-zinc-500 mb-1">{label}</label>}

      <div className={`flex rounded-xl border overflow-hidden focus-within:ring-2 transition-all ${borderCls} bg-white dark:bg-zinc-800`}>
        {/* Selector de país */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-700/60 border-r border-zinc-200 dark:border-zinc-700 shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="text-xs text-zinc-600 dark:text-zinc-300 font-mono">{selected.dial}</span>
          <ChevronDownIcon className="w-3 h-3 text-zinc-400" />
        </button>

        {/* Input de número */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handleNumber}
          onBlur={handleBlur}
          placeholder="11 1234-5678"
          className="flex-1 px-3 py-2.5 bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
        />
      </div>

      {/* Mensajes de validación */}
      {hasError && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <ExclamationCircleIcon className="w-3.5 h-3.5 shrink-0" />
          {digits.length === 0 ? 'El teléfono es obligatorio' : `Número inválido para ${selected.name}`}
        </p>
      )}
      {hasSuccess && (
        <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
          <CheckIcon className="w-3.5 h-3.5 shrink-0" />
          Número válido
        </p>
      )}

      {/* Dropdown de países — bottom-sheet en mobile */}
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full sm:max-w-sm bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
            <div className="shrink-0 px-4 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-zinc-800 dark:text-zinc-100">Código de área</p>
                <button type="button" onClick={close} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <input
                autoFocus
                type="text"
                placeholder="Buscar país..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-slate-500 placeholder:text-zinc-400"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 && (
                <p className="px-5 py-4 text-sm text-zinc-400">Sin resultados</p>
              )}
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountry(c.code)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-sm border-b border-zinc-50 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className={`flex-1 text-left ${c.code === countryCode ? 'font-semibold text-emerald-600' : 'text-zinc-700 dark:text-zinc-200'}`}>
                    {c.name}
                  </span>
                  <span className="font-mono text-xs text-zinc-400">{c.dial}</span>
                  {c.code === countryCode && <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
