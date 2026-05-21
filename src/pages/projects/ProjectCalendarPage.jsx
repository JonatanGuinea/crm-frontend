import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getProjects } from '../../api/projects'
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

const STATUS_LABELS = {
  pending:     'Pendiente',
  approved:    'Aprobado',
  in_progress: 'En curso',
  finished:    'Finalizado',
  cancelled:   'Cancelado',
}

const STATUS_COLORS = {
  pending:     'bg-warning-subtle text-warning',
  approved:    'bg-info-subtle text-info',
  in_progress: 'bg-brand-subtle text-brand',
  finished:    'bg-raised text-fg-soft',
  cancelled:   'bg-raised text-fg-muted',
}

const STATUS_BAR_COLORS = {
  pending:     'bg-warning text-fg font-semibold',
  approved:    'bg-info text-white',
  in_progress: 'bg-brand text-white',
  finished:    'bg-overlay text-fg-soft border border-line-soft',
  cancelled:   'bg-raised text-fg-muted opacity-60',
}

const DAY_W = 44        // px per day column
const ROW_H = 56        // px per project row
const HEADER_H = 72     // month row + day row combined
const LEFT_W = 208      // sticky left panel width

// Parse date safely from ISO string, avoiding timezone shift
function parseDate(d) {
  if (!d) return null
  if (d instanceof Date) return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const [y, m, day] = d.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, day)
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

export default function ProjectCalendarPage() {
  const today = useMemo(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }, [])

  const [monthOffset, setMonthOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const scrollRef = useRef(null)

  // Range: 3 months starting from (current month + offset)
  const rangeStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset]
  )
  const rangeEnd = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset + 3, 0),
    [today, monthOffset]
  )

  const days = useMemo(() => {
    const arr = []
    const d = new Date(rangeStart)
    while (d <= rangeEnd) {
      arr.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()))
      d.setDate(d.getDate() + 1)
    }
    return arr
  }, [rangeStart, rangeEnd])

  const todayIdx = useMemo(
    () => days.findIndex(d => isSameDay(d, today)),
    [days, today]
  )

  // Scroll so today is centered in the viewport (desktop)
  const centerToday = useCallback(() => {
    const el = scrollRef.current
    if (!el || todayIdx < 0) return
    const containerW  = el.getBoundingClientRect().width
    const todayCenter = todayIdx * DAY_W + DAY_W / 2
    el.scrollLeft = Math.max(0, todayCenter - containerW / 2)
  }, [todayIdx])

  useEffect(() => {
    const raf = requestAnimationFrame(centerToday)
    return () => cancelAnimationFrame(raf)
  }, [centerToday])

  const { data, isLoading } = useQuery({
    queryKey: ['projects', 'calendar'],
    queryFn: () => getProjects({ limit: 100 }).then(r => r.data),
    staleTime: 60_000,
  })

  const projects = useMemo(() => {
    const all = data?.data || []
    if (statusFilter) return all.filter(p => p.status === statusFilter)
    return all.filter(p => p.status !== 'cancelled')
  }, [data, statusFilter])

  const monthGroups = useMemo(() => {
    const groups = []
    let cur = null
    days.forEach((d) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (!cur || cur.key !== key) {
        cur = {
          key,
          label: d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
          count: 1,
        }
        groups.push(cur)
      } else {
        cur.count++
      }
    })
    return groups
  }, [days])

  const totalW = days.length * DAY_W

  return (
    <div className="p-4 md:p-8">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-fg">Agenda de Proyectos</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-line-soft rounded-md text-sm bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">Todos (sin cancelados)</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setMonthOffset(m => m - 1)}
              className="p-1.5 rounded-md border border-line-soft text-fg-soft hover:bg-raised transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setMonthOffset(0); requestAnimationFrame(centerToday) }}
              className="px-3 py-1.5 rounded-md border border-line-soft text-sm text-fg-soft hover:bg-raised transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={() => setMonthOffset(m => m + 1)}
              className="p-1.5 rounded-md border border-line-soft text-fg-soft hover:bg-raised transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(STATUS_LABELS)
          .filter(([v]) => v !== 'cancelled')
          .map(([v, l]) => (
            <span key={v} className={`px-2 py-0.5 rounded-full text-xs ${STATUS_BAR_COLORS[v]}`}>
              {l}
            </span>
          ))}
        <span className="px-2 py-0.5 rounded-full text-xs bg-danger text-white">
          Vencido
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-fg-soft">Cargando...</p>
      ) : (
        <>
        {/* ── Mobile: lista de proyectos ── */}
        <div className="md:hidden space-y-3">
          {projects.length === 0 ? (
            <p className="text-sm text-fg-muted text-center py-10">Sin proyectos para mostrar</p>
          ) : (
            [...projects]
              .sort((a, b) => {
                const ea = parseDate(a.endDate), eb = parseDate(b.endDate)
                if (!ea && !eb) return 0
                if (!ea) return 1
                if (!eb) return -1
                return ea - eb
              })
              .map(p => {
                const start    = parseDate(p.startDate)
                const end      = parseDate(p.endDate)
                const isOverdue = end && end < today && p.status !== 'finished' && p.status !== 'cancelled'
                const daysLeft  = end ? Math.ceil((end - today) / 86400000) : null

                let progress = null
                if (start && end && end > start) {
                  const total   = end - start
                  const elapsed = Math.min(Math.max(today - start, 0), total)
                  progress = Math.round((elapsed / total) * 100)
                }

                const fmtDate = d => d
                  ? d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'

                return (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="block bg-surface/60 backdrop-blur-xl rounded-xl border border-line p-4 hover:border-brand/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-fg truncate leading-snug">{p.title}</p>
                        {p.client?.name && (
                          <p className="text-xs text-fg-muted truncate">{p.client.name}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                        isOverdue ? 'bg-danger-subtle text-danger' : STATUS_COLORS[p.status]
                      }`}>
                        {isOverdue ? 'Vencido' : STATUS_LABELS[p.status]}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-fg-muted mb-3">
                      <CalendarDaysIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{fmtDate(start)}</span>
                      <span>→</span>
                      <span className={isOverdue ? 'text-danger font-medium' : ''}>{fmtDate(end)}</span>
                    </div>

                    {progress !== null && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-fg-muted">Progreso del período</span>
                          {daysLeft !== null && (
                            <span className={`text-[11px] font-medium flex items-center gap-1 ${
                              isOverdue ? 'text-danger' : daysLeft <= 7 ? 'text-warning' : 'text-fg-muted'
                            }`}>
                              {isOverdue
                                ? <><ExclamationCircleIcon className="w-3 h-3" />Vencido hace {Math.abs(daysLeft)}d</>
                                : daysLeft === 0 ? 'Vence hoy'
                                : `${daysLeft}d restantes`}
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 rounded-full bg-raised overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isOverdue ? 'bg-danger' : 'bg-brand'}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </Link>
                )
              })
          )}
        </div>

        {/* ── Desktop: Gantt ── */}
        <div className="hidden md:block bg-surface/60 backdrop-blur-xl rounded-xl border border-line overflow-hidden">
          <div ref={scrollRef} className="overflow-x-auto">
            <div className="flex" style={{ minWidth: LEFT_W + totalW }}>

              {/* ── Sticky left: project names ── */}
              <div
                className="sticky left-0 z-20 bg-surface border-r border-line shrink-0"
                style={{ width: LEFT_W }}
              >
                {/* Header spacer */}
                <div
                  className="bg-raised border-b border-line flex items-end px-4 pb-2"
                  style={{ height: HEADER_H }}
                >
                  <span className="text-xs font-semibold text-fg-soft uppercase tracking-wide">
                    Proyecto
                  </span>
                </div>

                {projects.length === 0 ? (
                  <div
                    className="flex items-center px-4 text-sm text-fg-muted"
                    style={{ height: ROW_H }}
                  >
                    Sin proyectos
                  </div>
                ) : (
                  projects.map(p => (
                    <div
                      key={p.id}
                      className="flex flex-col justify-center px-4 border-b border-line"
                      style={{ height: ROW_H }}
                    >
                      <Link
                        to={`/projects/${p.id}`}
                        className="text-sm font-medium text-fg hover:text-brand truncate leading-snug"
                      >
                        {p.title}
                      </Link>
                      {p.client?.name && (
                        <p className="text-xs text-fg-muted truncate">{p.client.name}</p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* ── Timeline ── */}
              <div style={{ width: totalW }}>

                {/* Month row */}
                <div className="flex bg-raised border-b border-line" style={{ height: 36 }}>
                  {monthGroups.map(g => (
                    <div
                      key={g.key}
                      style={{ width: g.count * DAY_W }}
                      className="shrink-0 flex items-center px-3 border-r border-line text-s font-semibold text-fg capitalize overflow-hidden"
                    >
                      <span className="truncate">{g.label}</span>
                    </div>
                  ))}
                </div>

                {/* Day row */}
                <div className="flex bg-raised border-b border-line" style={{ height: 36 }}>
                  {days.map((d, i) => {
                    const isToday   = isSameDay(d, today)
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6
                    return (
                      <div
                        key={i}
                        style={{ width: DAY_W }}
                        className={`shrink-0 flex flex-col items-center justify-center border-r border-line select-none ${
                          isToday
                            ? 'bg-brand text-white font-bold'
                            : isWeekend
                            ? 'text-fg-muted'
                            : 'text-fg-soft'
                        }`}
                      >
                        <span className="text-[9px] uppercase leading-none">
                          {d.toLocaleDateString('es-AR', { weekday: 'short' }).slice(0, 2)}
                        </span>
                        <span className="text-xs leading-snug">{d.getDate()}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Project rows */}
                {projects.length === 0 ? (
                  <div
                    className="flex items-center justify-center text-sm text-fg-muted"
                    style={{ height: ROW_H }}
                  >
                    Sin proyectos para mostrar
                  </div>
                ) : (
                  projects.map(p => {
                    const start = parseDate(p.startDate)
                    const end   = parseDate(p.endDate)

                    let barLeft  = -1
                    let barWidth = -1

                    if (start && end && end >= start) {
                      const startIdx    = Math.round((start - rangeStart) / 86400000)
                      const endIdx      = Math.round((end   - rangeStart) / 86400000)
                      const cStart      = Math.max(0, startIdx)
                      const cEnd        = Math.min(days.length - 1, endIdx)

                      if (cEnd >= 0 && cStart <= days.length - 1 && cEnd >= cStart) {
                        barLeft  = cStart * DAY_W + 3
                        barWidth = (cEnd - cStart + 1) * DAY_W - 6
                      }
                    }

                    const isOverdue =
                      end &&
                      end < today &&
                      p.status !== 'finished' &&
                      p.status !== 'cancelled'

                    return (
                      <div
                        key={p.id}
                        className="relative border-b border-line"
                        style={{ height: ROW_H, width: totalW }}
                      >
                        {/* Day column backgrounds */}
                        {days.map((d, i) => {
                          const isToday   = isSameDay(d, today)
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6
                          if (!isToday && !isWeekend) return null
                          return (
                            <div
                              key={i}
                              style={{ width: DAY_W, left: i * DAY_W }}
                              className={`absolute top-0 h-full border-r border-line pointer-events-none ${
                                isToday ? 'bg-brand-subtle/25' : 'bg-raised/50'
                              }`}
                            />
                          )
                        })}

                        {/* Transparent border lines for non-highlighted days */}
                        {days.map((d, i) => {
                          const isToday   = isSameDay(d, today)
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6
                          if (isToday || isWeekend) return null
                          return (
                            <div
                              key={`line-${i}`}
                              style={{ width: 1, left: (i + 1) * DAY_W - 1 }}
                              className="absolute top-0 h-full bg-line pointer-events-none opacity-60"
                            />
                          )
                        })}

                        {/* Project bar */}
                        {barLeft >= 0 && barWidth > 0 && (
                          <Link
                            to={`/projects/${p.id}`}
                            style={{ left: barLeft, width: barWidth, top: 10, bottom: 10 }}
                            className={`absolute rounded-md px-2 flex items-center text-xs font-medium shadow-sm overflow-hidden transition-opacity hover:opacity-80 ${
                              isOverdue
                                ? 'bg-danger text-white'
                                : STATUS_BAR_COLORS[p.status]
                            }`}
                          >
                            <span className="truncate">{p.title}</span>
                          </Link>
                        )}

                        {/* No dates — show a dashed pill at the start */}
                        {!start && !end && (
                          <div
                            style={{ left: 4, top: 14, bottom: 14 }}
                            className="absolute px-2 flex items-center rounded-md text-xs text-fg-muted border border-dashed border-line-soft bg-raised/60"
                          >
                            Sin fechas
                          </div>
                        )}

                        {/* Has start but no end (or vice versa) */}
                        {((start && !end) || (!start && end)) && (
                          <div
                            style={{ left: 4, top: 14, bottom: 14 }}
                            className="absolute px-2 flex items-center rounded-md text-xs text-fg-muted border border-dashed border-warning/50 bg-warning-subtle/40"
                          >
                            Fecha incompleta
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  )
}
