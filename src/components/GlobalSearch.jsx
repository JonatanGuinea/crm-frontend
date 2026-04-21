import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { globalSearch } from '../api/search'

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
  invoices: 'Facturas'
}

const SECTION_PATHS = {
  clients: (item) => `/clients/${item.id}`,
  projects: (item) => `/projects/${item.id}`,
  quotes: () => '/quotes',
  invoices: () => '/invoices'
}

function itemLabel(section, item) {
  if (section === 'clients') return item.name + (item.company ? ` — ${item.company}` : '')
  if (section === 'projects') return item.title + (item.client ? ` · ${item.client.name}` : '')
  if (section === 'quotes') return `${item.number} ${item.title || ''}`.trim() + (item.client ? ` · ${item.client.name}` : '')
  if (section === 'invoices') return `${item.number} ${item.title || ''}`.trim() + (item.client ? ` · ${item.client.name}` : '')
  return ''
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const containerRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null)
      setOpen(false)
      return
    }
    setLoading(true)
    globalSearch(debouncedQuery)
      .then(r => {
        setResults(r.data.data)
        setOpen(true)
      })
      .catch(() => setResults(null))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(section, item) {
    navigate(SECTION_PATHS[section](item))
    setQuery('')
    setOpen(false)
    setResults(null)
  }

  const hasResults = results && (
    results.clients?.length || results.projects?.length ||
    results.quotes?.length || results.invoices?.length
  )

  return (
    <div ref={containerRef} className="relative w-72">
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-fg-muted text-sm pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          placeholder="Buscar..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          className="w-full pl-8 pr-3 py-1.5 text-sm border border-line rounded-lg bg-raised text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-brand focus:bg-surface transition-colors"
        />
        {loading && (
          <span className="absolute inset-y-0 right-3 flex items-center text-fg-muted text-xs">...</span>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 w-96 bg-surface rounded-xl border border-line shadow-lg z-50 max-h-96 overflow-y-auto">
          {!hasResults ? (
            <p className="px-4 py-3 text-sm text-fg-muted">Sin resultados para "{debouncedQuery}"</p>
          ) : (
            Object.entries(SECTION_LABELS).map(([section, label]) => {
              const items = results[section]
              if (!items?.length) return null
              return (
                <div key={section}>
                  <div className="px-4 py-2 bg-raised border-b border-line">
                    <span className="text-xs font-semibold text-fg-soft uppercase tracking-wide">{label}</span>
                  </div>
                  <ul>
                    {items.map(item => (
                      <li key={item.id}>
                        <button
                          onClick={() => handleSelect(section, item)}
                          className="w-full text-left px-4 py-2.5 text-sm text-fg-soft hover:bg-brand-subtle hover:text-brand transition-colors"
                        >
                          {itemLabel(section, item)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
