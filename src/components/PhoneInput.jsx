/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { isValidPhoneNumber } from 'libphonenumber-js'

// ── tokens ────────────────────────────────────────────────────────────────────

const C = {
  bg:    '#0B0B0C',
  s1:    '#141415',
  s2:    '#1E1E20',
  s3:    '#26262A',
  linea: '#2C2C2F',
  crema: '#F2EDE3',
  arena: '#B9B4AA',
  piedra:'#8C877E',
  err:   '#E58373',
  ok:    '#7DB99A',
}

// ── iconos inline ─────────────────────────────────────────────────────────────

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 11, height: 11, flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 18, height: 18 }}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function CheckMarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 13, height: 13, flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 13, height: 13, flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

// ── data ──────────────────────────────────────────────────────────────────────

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
 *   countryCode       string        — e.g. 'AR'
 *   phoneNumber       string        — formatted local number
 *   onChangeCountry   fn(code)      — country changed
 *   onChangeNumber    fn(str)       — number changed (formatted)
 *   onValidChange     fn(bool)      — validity changed
 *   label             string|null   — label text; pass null to suppress
 */
export default function PhoneInput({
  countryCode,
  phoneNumber,
  onChangeCountry,
  onChangeNumber,
  onValidChange,
  label = 'Teléfono',
}) {
  const [open, setOpen]       = useState(false)
  const [search, setSearch]   = useState('')
  const [touched, setTouched] = useState(false)
  const [focused, setFocused] = useState(false)

  const selected = PHONE_COUNTRIES.find(c => c.code === countryCode) || PHONE_COUNTRIES[0]
  const filtered = PHONE_COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
  )

  const digits     = phoneNumber.replace(/\D/g, '')
  const isValid    = checkPhone(digits, countryCode)
  const hasError   = touched && !isValid
  const hasSuccess = touched && digits.length > 0 && isValid

  const borderColor = hasError ? C.err : hasSuccess ? C.ok : focused ? C.arena : C.linea

  function handleCountry(code) {
    onChangeCountry(code)
    onValidChange?.(checkPhone(phoneNumber.replace(/\D/g, ''), code))
    setOpen(false)
    setSearch('')
  }

  function handleNumber(e) {
    const formatted = formatPhoneNumber(e.target.value)
    onChangeNumber(formatted)
    onValidChange?.(checkPhone(formatted.replace(/\D/g, ''), countryCode))
  }

  function handleBlur() {
    setTouched(true)
    setFocused(false)
    onValidChange?.(isValid)
  }

  function close() { setOpen(false); setSearch('') }

  return (
    <div style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.arena, marginBottom: 6 }}>
          {label}
        </label>
      )}

      {/* Input row */}
      <div style={{
        display: 'flex', height: 42,
        background: C.bg,
        border: `1px solid ${borderColor}`,
        borderRadius: '0 10px 10px 0',
        overflow: 'hidden',
        transition: 'border-color 0.12s',
        boxSizing: 'border-box',
      }}>
        {/* Country selector */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 10px',
            background: C.s1,
            borderRight: `1px solid ${C.linea}`,
            color: C.arena,
            border: 'none',
            borderRight: `1px solid ${C.linea}`,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.s2}
          onMouseLeave={e => e.currentTarget.style.background = C.s1}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>{selected.flag}</span>
          <span style={{ fontSize: 12, color: C.arena, fontFamily: 'monospace' }}>{selected.dial}</span>
          <ChevronIcon />
        </button>

        {/* Number input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handleNumber}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder="11 1234-5678"
          style={{
            flex: 1, height: '100%',
            background: 'transparent',
            border: 'none', outline: 'none',
            padding: '0 14px',
            fontSize: 13,
            color: C.crema,
            boxSizing: 'border-box',
          }}
          className="placeholder:text-[#8C877E]"
        />
      </div>

      {/* Validation messages */}
      {hasError && (
        <p style={{ marginTop: 6, fontSize: 11, color: C.err, display: 'flex', alignItems: 'center', gap: 5 }}>
          <WarnIcon />
          {digits.length === 0 ? 'El teléfono es obligatorio' : `Número inválido para ${selected.name}`}
        </p>
      )}
      {hasSuccess && (
        <p style={{ marginTop: 6, fontSize: 11, color: C.ok, display: 'flex', alignItems: 'center', gap: 5 }}>
          <CheckMarkIcon />
          Número válido
        </p>
      )}

      {/* Country dropdown */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0,
          zIndex: 200,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }}
            onClick={close}
          />
          <div style={{
            position: 'relative',
            width: '100%', maxWidth: 380,
            background: C.s2,
            border: `1px solid ${C.linea}`,
            borderRadius: '0 16px 0 0',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            maxHeight: '65vh',
          }}>
            {/* Dropdown header */}
            <div style={{
              flexShrink: 0,
              padding: '14px 16px 12px',
              borderBottom: `1px solid ${C.linea}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.crema }}>Código de área</span>
                <button
                  type="button"
                  onClick={close}
                  style={{
                    background: 'none', border: 'none',
                    color: C.piedra, cursor: 'pointer', padding: '2px',
                    display: 'flex', alignItems: 'center',
                    transition: 'color 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = C.arena}
                  onMouseLeave={e => e.currentTarget.style.color = C.piedra}
                >
                  <CloseIcon />
                </button>
              </div>
              <input
                autoFocus
                type="text"
                placeholder="Buscar país..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', height: 36,
                  background: C.s3,
                  border: `1px solid ${C.linea}`,
                  borderRadius: '0 8px 8px 0',
                  color: C.crema, fontSize: 12,
                  padding: '0 12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                className="focus:border-[#B9B4AA] placeholder:text-[#8C877E]"
              />
            </div>

            {/* Country list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.length === 0 && (
                <p style={{ padding: '14px 16px', fontSize: 12, color: C.piedra }}>Sin resultados</p>
              )}
              {filtered.map(c => (
                <CountryRow
                  key={c.code}
                  country={c}
                  selected={c.code === countryCode}
                  onSelect={() => handleCountry(c.code)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CountryRow({ country: c, selected, onSelect }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px',
        background: selected || hovered ? C.s3 : 'transparent',
        border: 'none',
        borderBottom: `1px solid ${C.linea}`,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.1s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>{c.flag}</span>
      <span style={{
        flex: 1, fontSize: 12,
        color: selected ? C.crema : C.arena,
        fontWeight: selected ? 600 : 400,
      }}>
        {c.name}
      </span>
      <span style={{ fontSize: 11, color: C.piedra, fontFamily: 'monospace' }}>{c.dial}</span>
      {selected && (
        <span style={{ color: C.ok, display: 'flex' }}>
          <CheckMarkIcon />
        </span>
      )}
    </button>
  )
}
