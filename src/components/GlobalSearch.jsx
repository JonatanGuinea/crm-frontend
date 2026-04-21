import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { globalSearch } from '../api/search'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const SECTION_LABELS = {
  clients: 'Clientes',
  projects: 'Proyectos',
  quotes: 'Presupuestos',
  invoices: 'Facturas',
}

const SECTION_ICONS = {
  clients: '👤',
  projects: '📁',
  quotes: '📄',
  invoices: '🧾',
}

const SECTION_PATHS = {
  clients: (item) => `/clients/${item.id}`,
  projects: (item) => `/projects/${item.id}`,
  quotes: () => '/quotes',
  invoices: () => '/invoices',
}

function itemLabel(section, item) {
  if (section === 'clients') return item.name + (item.company ? ` — ${item.company}` : '')
  if (section === 'projects') return item.title + (item.client ? ` · ${item.client.name}` : '')
  if (section === 'quotes') return `${item.number} ${item.title || ''}`.trim() + (item.client ? ` · ${item.client.name}` : '')
  if (section === 'invoices') return `${item.number} ${item.title || ''}`.trim() + (item.client ? ` · ${item.client.name}` : '')
  return ''
}

function isMac() {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debouncedQuery = useDebounce(query, 280)
  const inputRef = useRef()
  const navigate = useNavigate()

  // Flatten results for keyboard navigation
  const flatItems = results
    ? Object.entries(SECTION_LABELS).flatMap(([section]) =>
        (results[section] || []).map(item => ({ section, item }))
      )
    : []

  const openModal = useCallback(() => {
    setOpen(true)
    setQuery('')
    setResults(null)
    setActiveIndex(-1)
  }, [])

  const closeModal = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults(null)
    setActiveIndex(-1)
  }, [])

  // Cmd+K / Ctrl+K shortcut
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

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Search
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null)
      setActiveIndex(-1)
      return
    }
    setLoading(true)
    globalSearch(debouncedQuery)
      .then(r => {
        setResults(r.data.data)
        setActiveIndex(-1)
      })
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
      e.preventDefault()
      setActiveIndex(i => (i + 1) % flatItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => (i <= 0 ? flatItems.length - 1 : i - 1))
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
      {/* Trigger button in header */}
      <button
        onClick={openModal}
        className="flex items-center gap-2 w-full max-w-xs px-3 py-1.5 rounded-lg bg-raised border border-line text-fg-muted text-sm hover:border-line-soft hover:bg-overlay transition-colors group"
      >
        <MagnifyingGlassIcon className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Buscar...</span>
        <span className="hidden sm:flex items-center gap-0.5 text-xs text-fg-muted border border-line rounded px-1.5 py-0.5 font-mono group-hover:border-line-soft transition-colors">
          {mod}<span>K</span>
        </span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
          onClick={closeModal}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line">
              <MagnifyingGlassIcon className="w-5 h-5 text-fg-muted shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar clientes, proyectos, presupuestos..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-fg placeholder:text-fg-muted text-sm focus:outline-none"
              />
              {loading && (
                <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin shrink-0" />
              )}
              <button
                onClick={closeModal}
                className="text-xs text-fg-muted border border-line rounded px-1.5 py-0.5 font-mono hover:bg-raised transition-colors shrink-0"
              >
                Esc
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {!query || query.length < 2 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-fg-muted">Escribí al menos 2 caracteres para buscar</p>
                </div>
              ) : !hasResults && !loading ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-fg-muted">Sin resultados para <span className="text-fg font-medium">"{debouncedQuery}"</span></p>
                </div>
              ) : (
                <div className="py-2">
                  {Object.entries(SECTION_LABELS).map(([section, label]) => {
                    const items = results?.[section]
                    if (!items?.length) return null
                    return (
                      <div key={section} className="mb-1">
                        <div className="flex items-center gap-2 px-4 py-1.5">
                          <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">{label}</span>
                          <div className="flex-1 h-px bg-line" />
                        </div>
                        <ul>
                          {items.map(item => {
                            const globalIdx = flatItems.findIndex(f => f.section === section && f.item === item)
                            const isActive = globalIdx === activeIndex
                            return (
                              <li key={item.id}>
                                <button
                                  onClick={() => handleSelect(section, item)}
                                  onMouseEnter={() => setActiveIndex(globalIdx)}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                                    isActive ? 'bg-brand-subtle text-brand' : 'text-fg-soft hover:bg-raised'
                                  }`}
                                >
                                  <span className="text-base shrink-0">{SECTION_ICONS[section]}</span>
                                  <span className="truncate">{itemLabel(section, item)}</span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer hint */}
            {hasResults && (
              <div className="px-4 py-2 border-t border-line flex items-center gap-3 text-xs text-fg-muted">
                <span>↑↓ navegar</span>
                <span>↵ abrir</span>
                <span>Esc cerrar</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
