import { useState } from 'react'
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { AR_PROVINCES } from '../utils/arProvinces'

export default function ProvinceSelect({ value, onChange, className = '', placeholder = 'Seleccionar provincia...' }) {
  const [open, setOpen]   = useState(false)
  const [search, setSearch] = useState('')

  const filtered = AR_PROVINCES.filter(p =>
    !search || p.toLowerCase().includes(search.toLowerCase())
  )

  function select(p) {
    onChange(p)
    setOpen(false)
    setSearch('')
  }

  function close() {
    setOpen(false)
    setSearch('')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${className} flex items-center justify-between gap-2 text-left`}
      >
        <span className={value ? '' : 'text-zinc-400 dark:text-zinc-500'}>
          {value || placeholder}
        </span>
        <ChevronDownIcon className="w-4 h-4 text-zinc-400 shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />

          {/* Panel */}
          <div className="relative w-full sm:max-w-sm bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
            {/* Header */}
            <div className="shrink-0 px-4 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-zinc-800 dark:text-zinc-100">Provincia</p>
                <button type="button" onClick={close} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <input
                autoFocus
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-slate-500 placeholder:text-zinc-400"
              />
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 && (
                <p className="px-5 py-4 text-sm text-zinc-400">Sin resultados</p>
              )}
              {filtered.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => select(p)}
                  className="w-full flex items-center justify-between px-5 py-3 text-sm border-b border-zinc-50 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className={value === p ? 'font-semibold text-emerald-600' : 'text-zinc-700 dark:text-zinc-200'}>
                    {p}
                  </span>
                  {value === p && <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
