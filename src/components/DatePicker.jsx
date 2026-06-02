import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'

const DAYS   = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function parseValue(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toValue(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toDisplay(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function startOf(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function buildCells(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev  = new Date(year, month, 0).getDate()
  const rawFirst    = new Date(year, month, 1).getDay()
  const firstDay    = (rawFirst + 6) % 7 // Mon = 0

  const cells = []
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ d: daysInPrev - i, m: month - 1, y: month === 0 ? year - 1 : year, out: true })
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ d, m: month, y: year, out: false })
  const fill = 42 - cells.length
  for (let d = 1; d <= fill; d++)
    cells.push({ d, m: month + 1, y: month === 11 ? year + 1 : year, out: true })

  return cells
}

export default function DatePicker({ value, onChange, className, placeholder = 'Seleccionar fecha' }) {
  const [open, setOpen]         = useState(false)
  const [pos,  setPos]          = useState({ top: 0, left: 0 })
  const [view, setView]         = useState(() => {
    const d = parseValue(value)
    return d ? new Date(d.getFullYear(), d.getMonth(), 1)
             : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })
  const btnRef = useRef(null)
  const today  = startOf(new Date())

  useEffect(() => {
    const d = parseValue(value)
    if (d) setView(new Date(d.getFullYear(), d.getMonth(), 1))
  }, [value])

  const handleOpen = useCallback(() => {
    if (!btnRef.current) return
    const r    = btnRef.current.getBoundingClientRect()
    const calW = 280
    const calH = 320
    let top  = r.bottom + 4
    let left = r.left
    if (left + calW > window.innerWidth  - 8) left = r.right - calW
    if (top  + calH > window.innerHeight - 8) top  = r.top - calH - 4
    top  = Math.max(8, Math.min(top,  window.innerHeight - calH - 8))
    left = Math.max(8, Math.min(left, window.innerWidth  - calW - 8))
    setPos({ top, left })
    setOpen(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function select(date) {
    onChange({ target: { value: toValue(date) } })
    setOpen(false)
  }

  const year  = view.getFullYear()
  const month = view.getMonth()
  const cells = buildCells(year, month)

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        onClick={handleOpen}
        className={`${className} flex items-center justify-between gap-2`}
      >
        <span className={value ? 'text-fg' : 'text-fg-muted'}>
          {value ? toDisplay(value) : placeholder}
        </span>
        <CalendarDaysIcon className="w-4 h-4 text-fg-muted shrink-0" />
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-[9999] w-[280px] bg-surface/90 backdrop-blur-xl border border-line rounded-xl shadow-2xl p-3 select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setView(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-lg hover:bg-raised text-fg-muted hover:text-fg transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-fg capitalize">
                {MONTHS[month]} {year}
              </span>
              <button
                type="button"
                onClick={() => setView(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-lg hover:bg-raised text-fg-muted hover:text-fg transition-colors"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[11px] font-medium text-fg-muted py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((cell, i) => {
                const cellDate  = startOf(new Date(cell.y, cell.m, cell.d))
                const cellVal   = toValue(cellDate)
                const isSelected = cellVal === (value || '')
                const isToday    = cellDate.getTime() === today.getTime()

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => select(cellDate)}
                    className={[
                      'w-full aspect-square flex items-center justify-center rounded-lg text-xs transition-colors',
                      isSelected
                        ? 'bg-brand text-white font-semibold'
                        : isToday
                          ? 'ring-1 ring-brand text-brand font-medium hover:bg-brand-subtle'
                          : cell.out
                            ? 'text-fg-muted hover:bg-raised'
                            : 'text-fg hover:bg-raised',
                    ].join(' ')}
                  >
                    {cell.d}
                  </button>
                )
              })}
            </div>

            {/* Hoy shortcut */}
            <div className="mt-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => select(today)}
                className="w-full text-xs text-brand hover:bg-brand-subtle rounded-lg py-1.5 transition-colors font-medium"
              >
                Hoy
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
