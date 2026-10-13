import { useState } from 'react'
import { AR_PROVINCES } from '../utils/arProvinces'

const C = {
  bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A',
  linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E',
  ok: '#7DBE93',
}

function ChevronSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
function CloseSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function CheckSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function ProvinceSelect({ value, onChange, className = '', placeholder = 'Seleccionar provincia...' }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')

  const filtered = AR_PROVINCES.filter(p =>
    !search || p.toLowerCase().includes(search.toLowerCase())
  )

  function select(p) { onChange(p); setOpen(false); setSearch('') }
  function close()   { setOpen(false); setSearch('') }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${className} flex items-center justify-between gap-2 text-left`}
      >
        <span style={{ color: value ? C.crema : C.piedra }}>
          {value || placeholder}
        </span>
        <ChevronSvg style={{ width: 14, height: 14, color: C.piedra, flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          className="sm:items-center"
        >
          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }}
            onClick={close}
          />

          {/* Panel */}
          <div style={{
            position: 'relative', width: '100%', maxWidth: 380,
            background: C.s1, border: `1px solid ${C.linea}`,
            borderRadius: '0 16px 0 0', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', maxHeight: '70vh',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
            fontFamily: 'Geist, system-ui, sans-serif',
          }}
            className="sm:rounded-[0_16px_16px_0] sm:shadow-2xl"
          >
            {/* Header */}
            <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${C.linea}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.crema }}>Provincia</p>
                <button
                  type="button"
                  onClick={close}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, padding: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = C.arena}
                  onMouseLeave={e => e.currentTarget.style.color = C.piedra}
                >
                  <CloseSvg style={{ width: 16, height: 16 }} />
                </button>
              </div>
              <input
                autoFocus
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', height: 36, padding: '0 12px',
                  background: C.s2, border: `1px solid ${C.linea}`,
                  borderRadius: '0 9px 9px 0', color: C.crema,
                  fontSize: 13, outline: 'none', boxSizing: 'border-box',
                }}
                className="placeholder:text-[#8C877E] focus:border-[#B9B4AA]"
              />
            </div>

            {/* Lista */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.length === 0 && (
                <p style={{ padding: '16px 18px', fontSize: 13, color: C.piedra }}>Sin resultados</p>
              )}
              {filtered.map(p => {
                const isSelected = value === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => select(p)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '11px 18px', background: isSelected ? 'rgba(242,237,227,0.05)' : 'none',
                      border: 'none', borderBottom: `1px solid ${C.linea}`,
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                      color: isSelected ? C.crema : C.arena,
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.s2 }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'none' }}
                  >
                    <span>{p}</span>
                    {isSelected && <CheckSvg style={{ width: 14, height: 14, color: C.ok, flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
