import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { globalSearch } from '../api/search'
import { ClienteIcon, ProyectoIcon, PresupuestoIcon } from './DuIcons'

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
}

// ── iconos inline ─────────────────────────────────────────────────────────────

function SearchIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const SECTION_LABELS = {
  clients:  'Clientes',
  projects: 'Proyectos',
  quotes:   'Presupuestos',
}

const SECTION_ICON = {
  clients:  <ClienteIcon  style={{ width: 13, height: 13, flexShrink: 0 }} />,
  projects: <ProyectoIcon style={{ width: 13, height: 13, flexShrink: 0 }} />,
  quotes:   <PresupuestoIcon style={{ width: 13, height: 13, flexShrink: 0 }} />,
}

const SECTION_PATHS = {
  clients:  (item) => `/clients/${item.id}`,
  projects: (item) => `/projects/${item.id}`,
  quotes:   () => '/quotes',
}

function itemLabel(section, item) {
  if (section === 'clients')  return item.name + (item.company ? ` — ${item.company}` : '')
  if (section === 'projects') return item.title + (item.client ? ` · ${item.client.name}` : '')
  if (section === 'quotes')   return `${item.number} ${item.title || ''}`.trim() + (item.client ? ` · ${item.client.name}` : '')
  return ''
}

function isMac() {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
}

// ── component ─────────────────────────────────────────────────────────────────

export default function GlobalSearch() {
  const [open, setOpen]           = useState(false)
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debouncedQuery = useDebounce(query, 280)
  const inputRef  = useRef()
  const navigate  = useNavigate()

  const flatItems = results
    ? Object.entries(SECTION_LABELS).flatMap(([section]) =>
        (results[section] || []).map(item => ({ section, item }))
      )
    : []

  const openModal = useCallback(() => {
    setOpen(true); setQuery(''); setResults(null); setActiveIndex(-1)
  }, [])

  const closeModal = useCallback(() => {
    setOpen(false); setQuery(''); setResults(null); setActiveIndex(-1)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        open ? closeModal() : openModal()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, openModal, closeModal])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(null); setActiveIndex(-1); return
    }
    setLoading(true)
    globalSearch(debouncedQuery)
      .then(r => { setResults(r.data.data); setActiveIndex(-1) })
      .catch(() => setResults(null))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  function handleSelect(section, item) {
    navigate(SECTION_PATHS[section](item))
    closeModal()
  }

  function handleKeyDown(e) {
    if (!flatItems.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setActiveIndex(i => (i + 1) % flatItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setActiveIndex(i => (i <= 0 ? flatItems.length - 1 : i - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      const { section, item } = flatItems[activeIndex]
      handleSelect(section, item)
    }
  }

  const hasResults = results && Object.values(results).some(arr => arr?.length)
  const mod = isMac() ? '⌘' : 'Ctrl'

  return (
    <>
      {/* Trigger */}
      <button
        onClick={openModal}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', maxWidth: 260,
          padding: '6px 12px',
          background: C.s2, border: `1px solid ${C.linea}`,
          borderRadius: '0 10px 10px 0',
          color: C.piedra, fontSize: 13,
          cursor: 'pointer', transition: 'border-color 0.12s',
          fontFamily: 'Geist, system-ui, sans-serif',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = C.arena}
        onMouseLeave={e => e.currentTarget.style.borderColor = C.linea}
      >
        <SearchIcon style={{ width: 14, height: 14 }} />
        <span style={{ flex: 1, textAlign: 'left' }}>Buscar...</span>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 2,
          fontSize: 11, color: C.piedra,
          border: `1px solid ${C.linea}`,
          borderRadius: '0 4px 4px 0',
          padding: '1px 5px',
          fontFamily: 'monospace',
        }}>
          {mod}<span>K</span>
        </span>
      </button>

      {/* Modal */}
      {open && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '14vh', padding: '14vh 16px 0',
            fontFamily: 'Geist, system-ui, sans-serif',
          }}
          onClick={closeModal}
        >
          {/* Backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />

          {/* Panel */}
          <div
            style={{
              position: 'relative',
              width: '100%', maxWidth: 520,
              background: C.s2, border: `1px solid ${C.linea}`,
              borderRadius: '0 16px 16px 0',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Input row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              borderBottom: `1px solid ${C.linea}`,
            }}>
              <SearchIcon style={{ width: 16, height: 16, color: C.piedra }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar clientes, proyectos, presupuestos..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 13, color: C.crema,
                }}
                className="placeholder:text-[#8C877E]"
              />
              {loading && (
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: `2px solid ${C.linea}`,
                  borderTopColor: C.arena,
                  flexShrink: 0,
                  animation: 'spin 0.7s linear infinite',
                }} />
              )}
              <button
                onClick={closeModal}
                style={{
                  fontSize: 11, color: C.piedra,
                  border: `1px solid ${C.linea}`,
                  borderRadius: '0 4px 4px 0',
                  padding: '2px 6px',
                  background: 'none', cursor: 'pointer',
                  fontFamily: 'monospace',
                  transition: 'color 0.12s, border-color 0.12s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
                onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
              >
                Esc
              </button>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {!query || query.length < 2 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: C.piedra }}>Escribí al menos 2 caracteres para buscar</p>
                </div>
              ) : !hasResults && !loading ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: C.piedra }}>
                    Sin resultados para{' '}
                    <span style={{ color: C.arena, fontWeight: 500 }}>"{debouncedQuery}"</span>
                  </p>
                </div>
              ) : (
                <div style={{ padding: '6px 0' }}>
                  {Object.entries(SECTION_LABELS).map(([section, label]) => {
                    const items = results?.[section]
                    if (!items?.length) return null
                    return (
                      <div key={section} style={{ marginBottom: 4 }}>
                        {/* Section header */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 16px',
                        }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.1em', color: C.piedra,
                          }}>
                            {label}
                          </span>
                          <div style={{ flex: 1, height: 1, background: C.linea }} />
                        </div>
                        {/* Items */}
                        <ul>
                          {items.map(item => {
                            const globalIdx = flatItems.findIndex(f => f.section === section && f.item === item)
                            const isActive  = globalIdx === activeIndex
                            return (
                              <ResultItem
                                key={item.id}
                                section={section}
                                item={item}
                                isActive={isActive}
                                onSelect={() => handleSelect(section, item)}
                                onHover={() => setActiveIndex(globalIdx)}
                              />
                            )
                          })}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {hasResults && (
              <div style={{
                padding: '8px 16px',
                borderTop: `1px solid ${C.linea}`,
                display: 'flex', alignItems: 'center', gap: 14,
                fontSize: 11, color: C.piedra,
              }}>
                <span>↑↓ navegar</span>
                <span>↵ abrir</span>
                <span>Esc cerrar</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

// ── ResultItem ────────────────────────────────────────────────────────────────

function ResultItem({ section, item, isActive, onSelect, onHover }) {
  const [hovered, setHovered] = useState(false)
  const active = isActive || hovered

  return (
    <li>
      <button
        onClick={onSelect}
        onMouseEnter={() => { setHovered(true); onHover() }}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 16px',
          background: active ? C.s3 : 'transparent',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.1s',
        }}
      >
        <span style={{ color: active ? C.crema : C.piedra, display: 'flex', transition: 'color 0.1s' }}>
          {SECTION_ICON[section]}
        </span>
        <span style={{
          fontSize: 12.5, color: active ? C.crema : C.arena,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'color 0.1s',
        }}>
          {itemLabel(section, item)}
        </span>
      </button>
    </li>
  )
}
