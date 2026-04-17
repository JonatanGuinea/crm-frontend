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

  // Cerrar al hacer click fuera
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
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500 text-sm pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          placeholder="Buscar..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white dark:focus:bg-gray-600 transition-colors"
        />
        {loading && (
          <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 dark:text-gray-500 text-xs">...</span>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 w-96 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-50 max-h-96 overflow-y-auto">
          {!hasResults ? (
            <p className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">Sin resultados para "{debouncedQuery}"</p>
          ) : (
            Object.entries(SECTION_LABELS).map(([section, label]) => {
              const items = results[section]
              if (!items?.length) return null
              return (
                <div key={section}>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
                  </div>
                  <ul>
                    {items.map(item => (
                      <li key={item.id}>
                        <button
                          onClick={() => handleSelect(section, item)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
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
