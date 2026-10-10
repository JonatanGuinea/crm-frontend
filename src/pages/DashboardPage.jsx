import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getProjectsDashboard } from '../api/projects'
import { getQuotesDashboard } from '../api/quotes'
import { getTopClients } from '../api/clients'
import { getRecentActivity } from '../api/activity'
import { getTasks } from '../api/tasks'
import { getProfile } from '../api/profile'
import { getOrganizations } from '../api/organizations'
import { getFinancesDashboard } from '../api/finances'
import { useAuth } from '../context/AuthContext'
import { fmt } from '../utils/fmt'
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import {
  AgendaIcon,
  CarpetaIcon,
  ClienteIcon,
  CobroIcon,
  MasIcon,
  PresupuestoIcon,
  ProyectoIcon,
  RecorridoIcon,
  RecorridoDownIcon,
} from '../components/DuIcons'

// ── palette ───────────────────────────────────────────────────────────────────

const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"
const MONO   = "'Geist Mono', monospace"

const C = {
  bg:    '#0B0B0C',
  s1:    '#141415',
  s2:    '#1E1E20',
  s3:    '#26262A',
  linea: '#2C2C2F',
  crema: '#F2EDE3',
  arena: '#B9B4AA',
  piedra:'#8C877E',
  ok:    '#7DBE93',
  warn:  '#E2B663',
  err:   '#E58373',
  info:  '#8EB1DE',
}

const card = {
  background: C.s1,
  border: `1px solid ${C.linea}`,
  borderRadius: '0 16px 16px 0',
}

// ── helpers ───────────────────────────────────────────────────────────────────

function greeting(name) {
  const h = new Date().getHours()
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  return `${saludo}, ${name?.split(' ')[0] || 'usuario'}`
}

function fmtDate() {
  return new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function fmtRelative(date) {
  const diff = Math.floor((new Date() - new Date(date)) / 1000)
  if (diff < 60)     return 'Hace un momento'
  if (diff < 3600)   return `Hace ${Math.floor(diff / 60)}m`
  if (diff < 86400)  return `Hace ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)}d`
  return new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function monthLabel(key) {
  const [year, month] = key.split('-')
  return new Date(parseInt(year), parseInt(month) - 1, 1)
    .toLocaleDateString('es-AR', { month: 'short' })
}

function buildMonthlyEvolution(apiData) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const found = apiData?.find(m => m.month === key)
    return { month: key, income: Number(found?.income ?? 0), expense: Number(found?.expense ?? 0) }
  })
}

// ── constants ─────────────────────────────────────────────────────────────────

const PROJECT_STATUS = {
  pending:     { label: 'Pendiente',  color: C.warn },
  approved:    { label: 'Aprobado',   color: C.info },
  in_progress: { label: 'En curso',   color: C.ok },
  finished:    { label: 'Finalizado', color: 'rgba(125,190,147,0.5)' },
  cancelled:   { label: 'Cancelado',  color: C.piedra },
}

const PROJECT_STATUS_LABEL = {
  approved:    'Aprobado',
  in_progress: 'En curso',
}

const QUOTE_STATUS = {
  draft:     { label: 'Borrador',   bg: 'rgba(242,237,227,0.07)', color: C.piedra },
  sent:      { label: 'Enviado',    bg: 'rgba(142,177,222,0.12)', color: C.info },
  approved:  { label: 'Aprobado',  bg: 'rgba(125,190,147,0.12)', color: C.ok },
  signed:    { label: 'Firmado',   bg: 'rgba(125,190,147,0.18)', color: C.ok },
  rejected:  { label: 'Rechazado', bg: 'rgba(229,131,115,0.12)', color: C.err },
  cancelled: { label: 'Cancelado', bg: 'rgba(229,131,115,0.08)', color: C.err },
  expired:   { label: 'Vencido',   bg: 'rgba(242,237,227,0.05)', color: C.piedra },
}

const MOVEMENT_TYPE = {
  income:       { label: 'Ingreso',       color: C.ok },
  expense:      { label: 'Egreso',        color: C.err },
  transfer_in:  { label: 'Transferencia', color: C.info },
  transfer_out: { label: 'Transferencia', color: C.info },
}

const MOVEMENT_STATUS = {
  pending:   { label: 'Pendiente',  bg: 'rgba(226,182,99,0.12)',  color: C.warn },
  confirmed: { label: 'Confirmado', bg: 'rgba(125,190,147,0.12)', color: C.ok },
}

const ACTIVITY_CONFIG = {
  quote: {
    icon: PresupuestoIcon,
    iconBg:    'rgba(142,177,222,0.1)',
    iconColor: C.info,
    label: 'Presupuesto',
    to: '/quotes',
  },
  project: {
    icon: ProyectoIcon,
    iconBg:    'rgba(226,182,99,0.1)',
    iconColor: C.warn,
    label: 'Proyecto',
    to: '/projects',
  },
}

// ── shared atoms ──────────────────────────────────────────────────────────────

function SeeAllLink({ to, label = 'Ver todos' }) {
  return (
    <Link
      to={to}
      style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.piedra, fontSize: 12, textDecoration: 'none', transition: 'color 0.12s', flexShrink: 0 }}
      onMouseEnter={e => e.currentTarget.style.color = C.arena}
      onMouseLeave={e => e.currentTarget.style.color = C.piedra}
    >
      {label} <ArrowRightIcon style={{ width: 11, height: 11 }} />
    </Link>
  )
}

const SECTION_TITLE = {
  fontSize: 10.5, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  color: C.arena,
}

function PanelHead({ title, to, linkLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h3 style={SECTION_TITLE}>{title}</h3>
      {to && <SeeAllLink to={to} label={linkLabel} />}
    </div>
  )
}

function Track({ pct, color = C.crema, opacity = 0.3 }) {
  return (
    <div style={{ height: 3, background: C.s3, borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
      <div style={{
        height: '100%', background: color, opacity,
        width: `${pct}%`, borderRadius: 2,
        transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  )
}

function Badge({ bg, color, label }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '2px 8px',
      borderRadius: '0 5px 5px 0', background: bg, color,
    }}>
      {label}
    </span>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, iconBg, iconColor, label, value, sub, valueColor }) {
  return (
    <div style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        width: 38, height: 38, flexShrink: 0, alignSelf: 'flex-start',
        background: iconBg, borderRadius: '0 10px 10px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ width: 18, height: 18, color: iconColor }} />
      </div>
      <div className="min-w-0">
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.piedra }}>
          {label}
        </p>
        <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: valueColor || C.crema, marginTop: 4, fontFamily: CIFRAS }} className="truncate">
          {value}
        </p>
        {sub != null && <p style={{ fontSize: 11, color: C.piedra, marginTop: 3 }} className="truncate">{sub}</p>}
      </div>
    </div>
  )
}

function ProjectsPanel({ projects }) {
  const byStatus = projects?.byStatus ?? []
  const total = byStatus.reduce((acc, s) => acc + s.totalProjects, 0)

  return (
    <div style={{ ...card, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHead title="Proyectos por estado" to="/projects" />

      {byStatus.length === 0 ? (
        <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '16px 0' }}>Sin proyectos aún</p>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {byStatus.map(s => {
            const info = PROJECT_STATUS[s._id] ?? { label: s._id, color: C.piedra }
            const pct = total ? (s.totalProjects / total) * 100 : 0
            return (
              <li key={s._id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: info.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: C.arena }}>{info.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.crema }}>{s.totalProjects}</span>
                </div>
                <Track pct={pct} color={info.color} opacity={0.4} />
              </li>
            )
          })}
        </ul>
      )}

      <div style={{ paddingTop: 14, borderTop: `1px solid ${C.linea}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 11, color: C.piedra }}>Total proyectos</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.crema }}>{projects?.summary?.totalProjects ?? '-'}</p>
      </div>
    </div>
  )
}

function TopClientsPanel({ clients, currency }) {
  const list = clients ?? []
  const max = list[0]?.total ?? 1

  return (
    <div style={{ ...card, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PanelHead title="Top clientes" to="/clients" />

      {list.length === 0 ? (
        <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '16px 0' }}>Sin datos aún</p>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((entry, i) => {
            const pct = max ? (entry.total / max) * 100 : 0
            return (
              <li key={entry.client.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.piedra, width: 16, flexShrink: 0 }}>#{i + 1}</span>
                    <div className="min-w-0">
                      <p style={{ fontSize: 13, color: C.crema, fontWeight: 500 }} className="truncate">{entry.client.name}</p>
                      {entry.client.company && (
                        <p style={{ fontSize: 11, color: C.piedra }} className="truncate">{entry.client.company}</p>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.crema, flexShrink: 0, marginLeft: 8, fontFamily: CIFRAS }}>
                    {fmt(entry.total, currency)}
                  </span>
                </div>
                <Track pct={pct} color={C.crema} opacity={0.2} />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ExpiringQuotesPanel({ quotes }) {
  const expiring = quotes?.expiringSoon ?? []

  return (
    <div style={{ ...card, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PanelHead title="Presupuestos por vencer" to="/quotes" />

      {expiring.length === 0 ? (
        <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '16px 0' }}>Sin presupuestos próximos a vencer</p>
      ) : (
        <ul>
          {expiring.map(q => {
            const daysLeft = Math.max(0, Math.ceil((new Date(q.validUntil) - new Date()) / (1000 * 60 * 60 * 24)))
            const urgent = daysLeft <= 2
            const stateColor = urgent ? C.err : C.warn
            return (
              <li key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: `1px solid ${C.linea}` }}>
                <div style={{ padding: 8, background: urgent ? 'rgba(229,131,115,0.1)' : 'rgba(226,182,99,0.1)', borderRadius: '0 8px 8px 0', flexShrink: 0 }}>
                  <AgendaIcon style={{ width: 15, height: 15, color: stateColor }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: C.crema }} className="truncate">#{q.number} {q.title}</p>
                  <p style={{ fontSize: 11, color: C.piedra }} className="truncate">{q.client?.name}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.crema, fontFamily: CIFRAS }}>{fmt(q.total)}</p>
                  <p style={{ fontSize: 11, fontWeight: 600, color: stateColor }}>
                    {daysLeft === 0 ? 'Vence hoy' : `${daysLeft}d`}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function QuotesSummaryPanel({ quotes, currency }) {
  const totalValue = Number(quotes?.summary?.totalValue ?? 0)

  const items = [
    { label: 'Borradores',  count: Number(quotes?.summary?.draftCount    ?? 0), bg: 'rgba(140,135,126,0.15)', color: C.piedra },
    { label: 'Enviados',    count: Number(quotes?.summary?.sentCount     ?? 0), bg: 'rgba(142,177,222,0.12)', color: C.info },
    { label: 'Aprobados',   count: Number(quotes?.summary?.approvedCount ?? 0), bg: 'rgba(125,190,147,0.12)', color: C.ok },
    { label: 'Rechazados',  count: Number(quotes?.summary?.rejectedCount ?? 0), bg: 'rgba(229,131,115,0.12)', color: C.err },
  ]

  return (
    <div style={{ ...card, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 0, height: '100%', boxSizing: 'border-box' }}>
      <PanelHead title="Presupuestos" to="/quotes" />

      <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18, flex: 1 }}>
        {items.map(({ label, count, bg, color }) => (
          <li key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: 12, fontWeight: 500,
              padding: '3px 12px',
              borderRadius: '0 6px 6px 0',
              background: bg, color,
            }}>
              {label}
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.crema, letterSpacing: '-0.02em' }}>{count}</span>
          </li>
        ))}
      </ul>

      <div style={{ paddingTop: 16, borderTop: `1px solid ${C.linea}`, marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <p style={{ fontSize: 11, color: C.piedra }}>Total presupuestado</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: C.crema, letterSpacing: '-0.03em', fontFamily: CIFRAS }}>{fmt(totalValue, currency)}</p>
      </div>
    </div>
  )
}

function IncomeExpensesBars({ months, currency }) {
  const [hovered, setHovered] = useState(null)
  const [tapped,  setTapped]  = useState(null)
  const ptrType = useRef('mouse')
  const max = Math.max(...months.map(m => Math.max(Number(m.income ?? 0), Number(m.expense ?? 0))), 1)
  const total = months.length

  // Cierra el tooltip al hacer click en cualquier parte fuera del chart (solo touch)
  useEffect(() => {
    if (!tapped) return
    const handler = () => setTapped(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [tapped])

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 144 }}>
      {months.map((m, i) => {
        const incomePct  = max ? (Number(m.income  ?? 0) / max) * 100 : 0
        const expensePct = max ? (Number(m.expense ?? 0) / max) * 100 : 0
        const balance    = Number(m.income ?? 0) - Number(m.expense ?? 0)
        const isActive   = hovered === m.month || tapped === m.month
        const label      = monthLabel(m.month)

        // Evitar que el tooltip se corte en los extremos
        const isFirst = i === 0
        const isLast  = i === total - 1
        const tipAlign = isFirst
          ? { left: 0, transform: 'none' }
          : isLast
          ? { right: 0, left: 'auto', transform: 'none' }
          : { left: '50%', transform: 'translateX(-50%)' }

        return (
          <div
            key={m.month}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative', cursor: 'pointer' }}
            onPointerDown={(e) => { ptrType.current = e.pointerType }}
            onMouseEnter={() => setHovered(m.month)}
            onMouseLeave={() => setHovered(null)}
            onClick={(e) => {
              if (ptrType.current === 'mouse') return
              e.stopPropagation()
              setTapped(prev => prev === m.month ? null : m.month)
            }}
          >
            {isActive && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 10px)',
                ...tipAlign,
                width: 200,
                background: C.s2,
                border: `1px solid ${C.linea}`,
                borderRadius: '0 14px 14px 0',
                padding: '14px 16px',
                boxShadow: '0 16px 40px rgba(0,0,0,.65)',
                zIndex: 20, pointerEvents: 'none',
              }}>

                {/* Mes */}
                <p style={{
                  fontSize: 10, fontWeight: 600,
                  letterSpacing: '1.4px', textTransform: 'uppercase',
                  color: C.piedra, marginBottom: 12,
                }}>
                  {label}
                </p>

                {/* Filas Ingresos / Egresos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { dot: C.crema, label: 'Ingresos', value: fmt(m.income  ?? 0, currency), color: C.crema },
                    { dot: C.arena, label: 'Egresos',  value: fmt(m.expense ?? 0, currency), color: C.arena },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.arena, flexShrink: 0 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.dot, flexShrink: 0 }} />
                        {row.label}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: row.color, fontFamily: CIFRAS, textAlign: 'right' }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Balance */}
                <div style={{
                  marginTop: 12, paddingTop: 12,
                  borderTop: `1px solid ${C.linea}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 11, color: C.piedra }}>Balance</span>
                  <span style={{
                    fontSize: 15, fontWeight: 700,
                    color: balance >= 0 ? C.ok : C.err,
                    fontFamily: CIFRAS,
                  }}>
                    {balance >= 0 ? '+' : ''}{fmt(balance, currency)}
                  </span>
                </div>

              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 112 }}>
              <div style={{ width: 16, borderRadius: '2px 2px 0 0', background: C.crema, opacity: isActive ? 1 : 0.85, height: `${incomePct}%`, transition: 'opacity 0.2s' }} />
              <div style={{ width: 16, borderRadius: '2px 2px 0 0', background: C.crema, opacity: isActive ? 0.38 : 0.25, height: `${expensePct}%`, transition: 'opacity 0.2s' }} />
            </div>
            <p style={{ fontSize: 10, textTransform: 'capitalize', color: isActive ? C.arena : C.piedra, transition: 'color 0.2s' }}>{label}</p>
          </div>
        )
      })}
    </div>
  )
}

function IncomeExpensesChart({ data, currency }) {
  const months = data ?? []
  const totalIncome  = months.reduce((a, m) => a + Number(m.income  ?? 0), 0)
  const totalExpense = months.reduce((a, m) => a + Number(m.expense ?? 0), 0)
  const balance      = totalIncome - totalExpense

  return (
    <div style={{ ...card, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ ...SECTION_TITLE }}>Ingresos y egresos — últimos 6 meses</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: C.piedra }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.crema }} />Ingresos
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.arena }} />Egresos
            </span>
          </div>
          <SeeAllLink to="/finances" label="Ver finanzas" />
        </div>
      </div>

      {months.length === 0 ? (
        <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '32px 0' }}>Sin movimientos registrados</p>
      ) : (
        <IncomeExpensesBars months={months} currency={currency} />
      )}

      <div style={{ paddingTop: 14, borderTop: `1px solid ${C.linea}`, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Ingresos', value: fmt(totalIncome,  currency), color: C.crema },
          { label: 'Egresos',  value: fmt(totalExpense, currency), color: C.arena },
          { label: 'Balance',  value: `${balance >= 0 ? '+' : ''}${fmt(balance, currency)}`, color: balance >= 0 ? C.ok : C.err },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <p style={{ fontSize: 10, color: C.piedra, marginBottom: 3 }}>{label}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color, fontFamily: CIFRAS }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentQuotes({ quotes }) {
  const list = quotes?.recent ?? []
  if (!list.length) return <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '24px 0' }}>Sin presupuestos recientes</p>
  return (
    <ul>
      {list.map(q => {
        const st = QUOTE_STATUS[q.status] ?? { label: q.status, bg: 'rgba(242,237,227,0.07)', color: C.piedra }
        return (
          <li key={q.id}>
            <Link
              to="/quotes"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.linea}`, textDecoration: 'none', transition: 'opacity 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <div style={{ width: 30, height: 30, background: C.s2, borderRadius: '0 7px 7px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PresupuestoIcon style={{ width: 14, height: 14, color: C.piedra }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: C.crema }} className="truncate">#{q.number}{q.title ? ` · ${q.title}` : ''}</p>
                <p style={{ fontSize: 11, color: C.piedra }} className="truncate">{q.client?.name}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.crema, fontFamily: CIFRAS }}>{fmt(q.total, q.currency)}</p>
                <Badge bg={st.bg} color={st.color} label={st.label} />
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function RecentMovementsPanel({ movements, currency }) {
  const list = movements ?? []

  return (
    <div style={{ ...card, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PanelHead title="Últimos movimientos" to="/finances/movements" />

      {list.length === 0 ? (
        <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '16px 0' }}>Sin movimientos registrados</p>
      ) : (
        <ul>
          {list.map(m => {
            const typeInfo   = MOVEMENT_TYPE[m.type]    ?? { label: m.type,   color: C.crema }
            const statusInfo = MOVEMENT_STATUS[m.status] ?? { label: m.status, bg: C.s2, color: C.piedra }
            const isIncome   = m.type === 'income' || m.type === 'transfer_in'
            return (
              <li key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: `1px solid ${C.linea}` }}>
                <div style={{ padding: 8, background: isIncome ? 'rgba(125,190,147,0.1)' : 'rgba(229,131,115,0.1)', borderRadius: '0 8px 8px 0', flexShrink: 0 }}>
                  <CobroIcon style={{ width: 14, height: 14, color: isIncome ? C.ok : C.err }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: C.crema }} className="truncate">{m.description || typeInfo.label}</p>
                  <p style={{ fontSize: 11, color: C.piedra }} className="truncate">
                    {m.account?.name}{m.client ? ` · ${m.client.name}` : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: typeInfo.color, fontFamily: CIFRAS }}>
                    {isIncome ? '+' : '-'}{fmt(m.amount, currency)}
                  </p>
                  <Badge bg={statusInfo.bg} color={statusInfo.color} label={statusInfo.label} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function UpcomingProjectsPanel({ projects }) {
  const upcoming = projects?.upcomingProjects ?? []

  return (
    <div style={{ ...card, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PanelHead title="Proyectos por vencer" to="/projects" />

      {upcoming.length === 0 ? (
        <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '16px 0' }}>Sin proyectos próximos a vencer</p>
      ) : (
        <ul>
          {upcoming.map(p => {
            const daysLeft = Math.max(0, Math.ceil((new Date(p.endDate.slice(0, 10) + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24)))
            const urgent = daysLeft <= 2
            const stateColor = urgent ? C.err : C.warn
            return (
              <li key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: `1px solid ${C.linea}` }}>
                <div style={{ padding: 8, background: urgent ? 'rgba(229,131,115,0.1)' : 'rgba(226,182,99,0.1)', borderRadius: '0 8px 8px 0', flexShrink: 0 }}>
                  <AgendaIcon style={{ width: 14, height: 14, color: stateColor }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: C.crema }} className="truncate">{p.title}</p>
                  <p style={{ fontSize: 11, color: C.piedra }} className="truncate">
                    {p.client?.name} · {PROJECT_STATUS_LABEL[p.status] ?? p.status}
                  </p>
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: stateColor, flexShrink: 0 }}>
                  {daysLeft === 0 ? 'Vence hoy' : `${daysLeft}d`}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ActivityFeed({ activity }) {
  const items = activity ?? []

  return (
    <div style={{ ...card, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ ...SECTION_TITLE }}>Actividad reciente</h3>

      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '16px 0' }}>Sin actividad reciente</p>
      ) : (
        <ul>
          {items.map((item, i) => {
            const cfg = ACTIVITY_CONFIG[item.type]
            const Icon = cfg.icon
            const name = item.data.title ?? `#${item.data.number}`
            return (
              <li key={i}>
                <Link
                  to={cfg.to}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.linea}`, textDecoration: 'none', transition: 'opacity 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <div style={{ padding: 8, background: cfg.iconBg, borderRadius: '0 8px 8px 0', flexShrink: 0 }}>
                    <Icon style={{ width: 14, height: 14, color: cfg.iconColor }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: C.crema }} className="truncate">
                      {item.data.number ? `#${item.data.number} · ` : ''}{name}
                    </p>
                    <p style={{ fontSize: 11, color: C.piedra }} className="truncate">
                      {cfg.label}{item.data.client ? ` · ${item.data.client.name}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {item.data.total != null && <p style={{ fontSize: 13, fontWeight: 600, color: C.crema, fontFamily: CIFRAS }}>{fmt(item.data.total)}</p>}
                    <p style={{ fontSize: 11, color: C.piedra }}>{fmtRelative(item.createdAt)}</p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function PendingMovementsPanel({ movements, currency }) {
  const now = new Date()
  const [sel, setSel] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })

  const maxYear  = now.getFullYear()
  const maxMonth = now.getMonth() + 1
  const isMax    = sel.year === maxYear && sel.month === maxMonth

  function prev() {
    setSel(s => s.month === 1 ? { year: s.year - 1, month: 12 } : { year: s.year, month: s.month - 1 })
  }
  function next() {
    if (isMax) return
    setSel(s => s.month === 12 ? { year: s.year + 1, month: 1 } : { year: s.year, month: s.month + 1 })
  }

  const monthKey = `${sel.year}-${String(sel.month).padStart(2, '0')}`
  const list     = (movements ?? []).filter(m => m.date?.slice(0, 7) === monthKey)

  const isOverdue = (m) => m.status === 'pending' && m.date?.slice(0, 10) < new Date().toISOString().slice(0, 10)

  const monthTitle = new Date(sel.year, sel.month - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  const pendingIncome  = list.filter(m => m.type === 'income').reduce((a, m)  => a + Number(m.amount), 0)
  const pendingExpense = list.filter(m => m.type === 'expense').reduce((a, m) => a + Number(m.amount), 0)

  const navBtn = (disabled) => ({
    padding: 4, background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? C.linea : C.piedra, display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 6, transition: 'color 0.12s',
  })

  return (
    <div style={{ ...card, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ ...SECTION_TITLE }}>Movimientos pendientes</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button onClick={prev} style={navBtn(false)}
            onMouseEnter={e => e.currentTarget.style.color = C.arena}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
            <ChevronLeftIcon style={{ width: 14, height: 14 }} />
          </button>
          <span style={{ fontSize: 11.5, fontWeight: 500, color: C.crema, textTransform: 'capitalize', minWidth: 120, textAlign: 'center' }}>
            {monthTitle}
          </span>
          <button onClick={next} disabled={isMax} style={navBtn(isMax)}
            onMouseEnter={e => !isMax && (e.currentTarget.style.color = C.arena)}
            onMouseLeave={e => !isMax && (e.currentTarget.style.color = C.piedra)}>
            <ChevronRightIcon style={{ width: 14, height: 14 }} />
          </button>
          <div style={{ marginLeft: 8 }}>
            <SeeAllLink to="/finances/movements" />
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <p style={{ fontSize: 13, color: C.piedra, textAlign: 'center', padding: '16px 0' }}>Sin movimientos pendientes este mes.</p>
      ) : (
        <>
          <ul>
            {list.map(m => {
              const typeInfo = MOVEMENT_TYPE[m.type] ?? { label: m.type, color: C.crema }
              const isIncome = m.type === 'income'
              const overdue  = isOverdue(m)
              return (
                <li key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: `1px solid ${C.linea}` }}>
                  <div style={{ padding: 8, background: 'rgba(226,182,99,0.1)', borderRadius: '0 8px 8px 0', flexShrink: 0 }}>
                    <CobroIcon style={{ width: 14, height: 14, color: C.warn }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: C.crema }} className="truncate">{m.description || typeInfo.label}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                      <p style={{ fontSize: 11, color: C.piedra }}>
                        {m.date
                          ? new Date(m.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
                          : ''}
                        {m.client ? ` · ${m.client.name}` : ''}
                      </p>
                      {overdue && (
                        <Badge bg="rgba(229,131,115,0.12)" color={C.err} label="Atrasado" />
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.warn, flexShrink: 0, fontFamily: CIFRAS }}>
                    {isIncome ? '+' : '-'}{fmt(m.amount, currency)}
                  </p>
                </li>
              )
            })}
          </ul>

          {(pendingIncome > 0 || pendingExpense > 0) && (
            <div style={{ paddingTop: 12, borderTop: `1px solid ${C.linea}`, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              {pendingIncome > 0 && (
                <div>
                  <p style={{ fontSize: 10, color: C.piedra, marginBottom: 3 }}>Ingresos pendientes</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.warn, fontFamily: CIFRAS }}>{fmt(pendingIncome, currency)}</p>
                </div>
              )}
              {pendingExpense > 0 && (
                <div>
                  <p style={{ fontSize: 10, color: C.piedra, marginBottom: 3 }}>Egresos pendientes</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.warn, fontFamily: CIFRAS }}>{fmt(pendingExpense, currency)}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const orgId    = user?.org
  const isMember = user?.role === 'member'

  const now = new Date()

  const { data: orgData } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganizations().then(r => r.data.data?.find(o => o.id === orgId)),
    enabled: Boolean(orgId),
    staleTime: 5 * 60 * 1000,
  })

  const currency = orgData?.defaultCurrency ?? 'USD'

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile().then(r => r.data.data),
  })

  const { data: projects } = useQuery({
    queryKey: ['projects-dashboard'],
    queryFn: () => getProjectsDashboard().then(r => r.data.data),
  })

  const { data: quotes } = useQuery({
    queryKey: ['quotes-dashboard', currency],
    queryFn: () => getQuotesDashboard(currency).then(r => r.data.data),
    enabled: !isMember,
  })

  const { data: topClients } = useQuery({
    queryKey: ['clients-top'],
    queryFn: () => getTopClients().then(r => r.data.data),
    enabled: !isMember,
  })

  const { data: finData } = useQuery({
    queryKey: ['finances-dashboard-main', now.getFullYear(), now.getMonth() + 1],
    queryFn: () => getFinancesDashboard({ year: now.getFullYear(), month: now.getMonth() + 1 })
      .then(r => r.data.data),
    enabled: !isMember,
  })

  const { data: recentActivity } = useQuery({
    queryKey: ['activity-recent'],
    queryFn: () => getRecentActivity().then(r => r.data.data),
    enabled: !isMember,
  })

  const { data: myTasks } = useQuery({
    queryKey: ['tasks-assigned', user?.uid],
    queryFn: () => getTasks({ assignedToId: user?.uid }).then(r => r.data.data),
    enabled: isMember && Boolean(user?.uid),
  })
  const myPendingTasks = (myTasks ?? []).length

  const activeProjects = projects?.byStatus?.find(s => s._id === 'in_progress')?.totalProjects ?? 0
  const totalBalance   = Number(finData?.totalBalance  ?? 0)
  const incomeMonth    = Number(finData?.incomeMonth   ?? 0)
  const expenseMonth   = Number(finData?.expenseMonth  ?? 0)

  const actionBtnBase = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: '0 8px 8px 0',
    fontSize: 12.5, fontWeight: 500, textDecoration: 'none', flexShrink: 0,
    transition: 'background-color 0.12s, color 0.12s',
  }

  return (
    <div style={{ padding: '28px 24px 40px', maxWidth: 1080, fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em', color: C.crema, lineHeight: 1.2 }}>
            {greeting(profile?.name ?? user?.name)}
          </h1>
          <p style={{ fontSize: 13, color: C.piedra, marginTop: 5, textTransform: 'capitalize' }}>{fmtDate()}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {!isMember && (
            <Link
              to="/clients"
              style={{ ...actionBtnBase, background: C.s2, border: `1px solid ${C.linea}`, color: C.arena }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.s3; e.currentTarget.style.color = C.crema }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.s2; e.currentTarget.style.color = C.arena }}
            >
              <MasIcon style={{ width: 13, height: 13 }} />Cliente
            </Link>
          )}
          <Link
            to="/projects"
            style={{ ...actionBtnBase, background: C.s2, border: `1px solid ${C.linea}`, color: C.arena }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.s3; e.currentTarget.style.color = C.crema }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.s2; e.currentTarget.style.color = C.arena }}
          >
            <MasIcon style={{ width: 13, height: 13 }} />Proyecto
          </Link>
          {!isMember && (
            <Link
              to="/quotes"
              style={{ ...actionBtnBase, background: C.crema, color: C.bg, border: 'none', fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E8E3D9'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = C.crema}
            >
              <MasIcon style={{ width: 13, height: 13 }} />Presupuesto
            </Link>
          )}
        </div>
      </div>

      {/* KPIs */}
      {isMember ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: 24 }}>
          <KpiCard icon={CarpetaIcon}  iconBg="rgba(142,177,222,0.1)" iconColor={C.info} label="Proyectos en curso" value={activeProjects} />
          <KpiCard icon={ProyectoIcon} iconBg="rgba(226,182,99,0.1)"  iconColor={C.warn} label="Tareas asignadas"   value={myPendingTasks} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 24 }}>
          <KpiCard
            icon={CarpetaIcon}
            iconBg="rgba(142,177,222,0.1)" iconColor={C.info}
            label="Proyectos en curso" value={activeProjects}
            sub={`${quotes?.byStatus?.filter(s => ['draft','sent'].includes(s.status))?.reduce((a,s)=>a+s.count,0)??0} presupuestos abiertos`}
          />
          <KpiCard
            icon={CobroIcon}
            iconBg="rgba(242,237,227,0.09)" iconColor={C.crema}
            label="Saldo en caja" value={fmt(totalBalance, currency)} valueColor={C.crema}
            sub={finData?.accounts?.length ? `${finData.accounts.length} cuenta${finData.accounts.length !== 1 ? 's' : ''}` : undefined}
          />
          <KpiCard
            icon={RecorridoIcon}
            iconBg="rgba(125,190,147,0.1)" iconColor={C.ok}
            label="Ingresos del mes" value={fmt(incomeMonth, currency)} valueColor={C.ok}
            sub="movimientos confirmados"
          />
          <KpiCard
            icon={RecorridoDownIcon}
            iconBg="rgba(229,131,115,0.1)" iconColor={C.err}
            label="Egresos del mes" value={fmt(expenseMonth, currency)} valueColor={C.err}
            sub="movimientos confirmados"
          />
        </div>
      )}

      {/* Paneles owner/admin */}
      {!isMember && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4" style={{ marginBottom: 20 }}>
            <div className="md:col-span-3" style={{ display: 'flex', flexDirection: 'column' }}>
              <IncomeExpensesChart data={buildMonthlyEvolution(finData?.monthlyEvolution)} currency={currency} />
            </div>
            <div className="md:col-span-2" style={{ display: 'flex', flexDirection: 'column' }}>
              <QuotesSummaryPanel quotes={quotes} currency={currency} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 20 }}>
            <div style={{ ...card, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <PanelHead title="Presupuestos recientes" to="/quotes" />
              <RecentQuotes quotes={quotes} />
            </div>
            <RecentMovementsPanel movements={finData?.recentMovements} currency={currency} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <PendingMovementsPanel movements={finData?.pendingMovements} currency={currency} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 20 }}>
            <ExpiringQuotesPanel quotes={quotes} />
            <ProjectsPanel projects={projects} />
          </div>
        </>
      )}

      {/* Paneles todos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 20 }}>
        {!isMember && <TopClientsPanel clients={topClients} currency={currency} />}
        <UpcomingProjectsPanel projects={projects} />
      </div>

      {isMember && (
        <div style={{ marginBottom: 20 }}>
          <ProjectsPanel projects={projects} />
        </div>
      )}

      {!isMember && (
        <div style={{ marginBottom: 20 }}>
          <ActivityFeed activity={recentActivity} />
        </div>
      )}

    </div>
  )
}
