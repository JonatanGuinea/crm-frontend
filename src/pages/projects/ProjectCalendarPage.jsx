import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getProjects } from '../../api/projects'
import { AgendaIcon } from '../../components/DuIcons'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

const STATUS_LABELS = {
  pending:     'Pendiente',
  approved:    'Aprobado',
  in_progress: 'En curso',
  cancelled:   'Cancelado',
}


const STATUS_BAR = {
  pending:     { bg: C.warn,    color: C.bg,    fw: 600 },
  approved:    { bg: C.info,    color: C.bg,    fw: 600 },
  in_progress: { bg: C.crema,   color: C.bg,    fw: 600 },
  cancelled:   { bg: C.s3,      color: C.piedra, fw: 400 },
}

const DAY_W = 44
const ROW_H = 56
const HEADER_H = 72

function ChevronLSvg() {
  return (
    <svg style={{ display: 'block', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
function ChevronRSvg() {
  return (
    <svg style={{ display: 'block', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

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
  const [windowW, setWindowW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    const h = () => setWindowW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const LEFT_W = windowW < 768 ? 130 : 208

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

  const centerToday = useCallback(() => {
    const el = scrollRef.current
    if (!el || todayIdx < 0) return
    const containerW  = el.getBoundingClientRect().width
    const todayCenter = LEFT_W + todayIdx * DAY_W + DAY_W / 2
    el.scrollLeft = Math.max(0, todayCenter - containerW / 2)
  }, [todayIdx, LEFT_W])

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
    return all.filter(p => p.status !== 'cancelled' && p.status !== 'finished')
  }, [data, statusFilter])

  const monthGroups = useMemo(() => {
    const groups = []
    let cur = null
    days.forEach((d) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (!cur || cur.key !== key) {
        cur = { key, label: d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }), count: 1 }
        groups.push(cur)
      } else {
        cur.count++
      }
    })
    return groups
  }, [days])

  const totalW = days.length * DAY_W

  return (
    <div className="px-4 pt-5 pb-10 md:px-6 md:pt-7" style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AgendaIcon style={{ width: 18, height: 18, color: C.arena }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema, margin: 0 }}>Agenda de Proyectos</h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ height: 34, padding: '0 12px', background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', color: C.crema, fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer' }}
          >
            <option value="">Solo activos</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setMonthOffset(m => m - 1)}
              style={{ padding: 6, border: `1px solid ${C.linea}`, borderRadius: '0 8px 8px 0', background: 'none', color: C.piedra, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.piedra }}
            >
              <ChevronLSvg />
            </button>
            <button onClick={() => { setMonthOffset(0); requestAnimationFrame(centerToday) }}
              style={{ padding: '6px 14px', border: `1px solid ${C.linea}`, borderRadius: '0 8px 8px 0', fontSize: 13, color: C.arena, background: 'none', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.crema }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.arena }}
            >
              Hoy
            </button>
            <button onClick={() => setMonthOffset(m => m + 1)}
              style={{ padding: 6, border: `1px solid ${C.linea}`, borderRadius: '0 8px 8px 0', background: 'none', color: C.piedra, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.piedra }}
            >
              <ChevronRSvg />
            </button>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {Object.entries(STATUS_LABELS).filter(([v]) => v !== 'cancelled').map(([v, l]) => {
          const bar = STATUS_BAR[v]
          return (
            <span key={v} style={{ padding: '2px 10px', borderRadius: '0 6px 6px 0', fontSize: 11, fontWeight: bar.fw, background: bar.bg, color: bar.color }}>
              {l}
            </span>
          )
        })}
        <span style={{ padding: '2px 10px', borderRadius: '0 6px 6px 0', fontSize: 11, fontWeight: 600, background: C.err, color: C.bg }}>
          Vencido
        </span>
      </div>

      {isLoading ? (
        <p style={{ fontSize: 13, color: C.piedra }}>Cargando...</p>
      ) : (
        <>
          {/* Gantt */}
          <div style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'hidden' }}>
            <div ref={scrollRef} style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', minWidth: LEFT_W + totalW }}>

                {/* Sticky left */}
                <div style={{ position: 'sticky', left: 0, zIndex: 20, background: C.s1, borderRight: `1px solid ${C.linea}`, flexShrink: 0, width: LEFT_W }}>
                  <div style={{ height: HEADER_H, background: C.s2, borderBottom: `1px solid ${C.linea}`, display: 'flex', alignItems: 'flex-end', padding: windowW < 768 ? '0 10px 8px' : '0 16px 8px' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena }}>Proyecto</span>
                  </div>
                  {projects.length === 0 ? (
                    <div style={{ height: ROW_H, display: 'flex', alignItems: 'center', padding: windowW < 768 ? '0 10px' : '0 16px', fontSize: 13, color: C.piedra }}>
                      Sin proyectos
                    </div>
                  ) : (
                    projects.map(p => (
                      <div key={p.id} style={{ height: ROW_H, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: windowW < 768 ? '0 10px' : '0 16px', borderBottom: `1px solid ${C.linea}` }}>
                        <Link to={`/projects/${p.id}`}
                          style={{ fontSize: windowW < 768 ? 11 : 13, fontWeight: 500, color: C.crema, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}
                          onMouseEnter={e => e.currentTarget.style.color = C.arena}
                          onMouseLeave={e => e.currentTarget.style.color = C.crema}
                        >
                          {p.title}
                        </Link>
                        {p.client?.name && (
                          <p style={{ fontSize: 10, color: C.piedra, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{p.client.name}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Timeline */}
                <div style={{ width: totalW }}>
                  {/* Mes */}
                  <div style={{ display: 'flex', background: C.s2, borderBottom: `1px solid ${C.linea}`, height: 36 }}>
                    {monthGroups.map(g => (
                      <div key={g.key} style={{ width: g.count * DAY_W, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 12px', borderRight: `1px solid ${C.linea}`, fontSize: 12, fontWeight: 600, color: C.crema, overflow: 'hidden' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{g.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Días */}
                  <div style={{ display: 'flex', background: C.s2, borderBottom: `1px solid ${C.linea}`, height: 36 }}>
                    {days.map((d, i) => {
                      const isToday   = isSameDay(d, today)
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6
                      return (
                        <div key={i} style={{ width: DAY_W, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${C.linea}`, userSelect: 'none', background: isToday ? C.crema : 'transparent', color: isToday ? C.bg : isWeekend ? C.piedra : C.arena }}>
                          <span style={{ fontSize: 9, textTransform: 'uppercase', lineHeight: 1 }}>
                            {d.toLocaleDateString('es-AR', { weekday: 'short' }).slice(0, 2)}
                          </span>
                          <span style={{ fontSize: 12, lineHeight: 1.4, fontWeight: isToday ? 700 : 400 }}>{d.getDate()}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Filas de proyectos */}
                  {projects.length === 0 ? (
                    <div style={{ height: ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: C.piedra }}>
                      Sin proyectos para mostrar
                    </div>
                  ) : (
                    projects.map(p => {
                      const start = parseDate(p.startDate)
                      const end   = parseDate(p.endDate)
                      let barLeft = -1, barWidth = -1

                      if (start && end && end >= start) {
                        const startIdx = Math.round((start - rangeStart) / 86400000)
                        const endIdx   = Math.round((end   - rangeStart) / 86400000)
                        const cStart   = Math.max(0, startIdx)
                        const cEnd     = Math.min(days.length - 1, endIdx)
                        if (cEnd >= 0 && cStart <= days.length - 1 && cEnd >= cStart) {
                          barLeft  = cStart * DAY_W + 3
                          barWidth = (cEnd - cStart + 1) * DAY_W - 6
                        }
                      }

                      const isOD = end && end < today && p.status !== 'finished' && p.status !== 'cancelled'
                      const bar = isOD ? { bg: C.err, color: C.bg } : { bg: STATUS_BAR[p.status]?.bg || C.s3, color: STATUS_BAR[p.status]?.color || C.piedra }

                      return (
                        <div key={p.id} style={{ position: 'relative', height: ROW_H, width: totalW, borderBottom: `1px solid ${C.linea}` }}>
                          {days.map((d, i) => {
                            const isToday   = isSameDay(d, today)
                            const isWeekend = d.getDay() === 0 || d.getDay() === 6
                            if (!isToday && !isWeekend) return null
                            return (
                              <div key={i} style={{ position: 'absolute', top: 0, left: i * DAY_W, width: DAY_W, height: '100%', borderRight: `1px solid ${C.linea}`, pointerEvents: 'none', background: isToday ? 'rgba(242,237,227,0.04)' : 'rgba(44,44,47,0.3)' }} />
                            )
                          })}
                          {days.map((d, i) => {
                            const isToday   = isSameDay(d, today)
                            const isWeekend = d.getDay() === 0 || d.getDay() === 6
                            if (isToday || isWeekend) return null
                            return (
                              <div key={`line-${i}`} style={{ position: 'absolute', top: 0, left: (i + 1) * DAY_W - 1, width: 1, height: '100%', background: C.linea, pointerEvents: 'none', opacity: 0.6 }} />
                            )
                          })}

                          {barLeft >= 0 && barWidth > 0 && (
                            <Link to={`/projects/${p.id}`}
                              style={{ position: 'absolute', left: barLeft, width: barWidth, top: 10, bottom: 10, borderRadius: '0 6px 6px 0', padding: '0 8px', display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 600, overflow: 'hidden', textDecoration: 'none', background: bar.bg, color: bar.color, transition: 'opacity 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                            </Link>
                          )}

                          {!start && !end && (
                            <div style={{ position: 'absolute', left: 4, top: 14, bottom: 14, padding: '0 8px', display: 'flex', alignItems: 'center', borderRadius: '0 6px 6px 0', fontSize: 11, color: C.piedra, border: `1px dashed ${C.linea}`, background: C.s2 }}>
                              Sin fechas
                            </div>
                          )}

                          {((start && !end) || (!start && end)) && (
                            <div style={{ position: 'absolute', left: 4, top: 14, bottom: 14, padding: '0 8px', display: 'flex', alignItems: 'center', borderRadius: '0 6px 6px 0', fontSize: 11, color: C.warn, border: `1px dashed rgba(226,182,99,0.4)`, background: 'rgba(226,182,99,0.06)' }}>
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
