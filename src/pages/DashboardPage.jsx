import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getProjectsDashboard } from '../api/projects'
import { getQuotesDashboard } from '../api/quotes'
import { getTopClients, getClientsDashboard } from '../api/clients'
import { getRecentActivity } from '../api/activity'
import { getProfile } from '../api/profile'
import { getOrganizations } from '../api/organizations'
import { useAuth } from '../context/AuthContext'
import {
  BanknotesIcon,
  FolderOpenIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'

// ── helpers ───────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOL = { USD: 'US$', ARS: '$' }

function fmt(n, currency) {
  if (n == null) return '-'
  const symbol = currency ? (CURRENCY_SYMBOL[currency] ?? currency + ' ') : '$'
  return symbol + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function greeting(name) {
  const h = new Date().getHours()
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  return `${saludo}, ${name?.split(' ')[0] || 'usuario'}`
}

function fmtDate() {
  return new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function fmtRelative(date) {
  const diff = Math.floor((new Date() - new Date(date)) / 1000)
  if (diff < 60) return 'Hace un momento'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)}d`
  return new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

// ── constants ─────────────────────────────────────────────────────────────────

const PROJECT_STATUS = {
  pending:     { label: 'Pendiente',  dot: 'bg-warning' },
  approved:    { label: 'Aprobado',   dot: 'bg-info' },
  in_progress: { label: 'En curso',   dot: 'bg-brand' },
  finished:    { label: 'Finalizado', dot: 'bg-brand opacity-60' },
  cancelled:   { label: 'Cancelado',  dot: 'bg-fg-muted' },
}

const PROJECT_STATUS_LABEL = {
  approved:    'Aprobado',
  in_progress: 'En curso',
}

const QUOTE_STATUS = {
  draft:    { label: 'Borrador',   cls: 'bg-raised text-fg-soft' },
  sent:     { label: 'Enviado',    cls: 'bg-info-subtle text-info' },
  approved: { label: 'Aprobado',  cls: 'bg-brand-subtle text-brand' },
  rejected: { label: 'Rechazado', cls: 'bg-danger-subtle text-danger' },
  expired:  { label: 'Vencido',   cls: 'bg-raised text-fg-muted' },
}

const ACTIVITY_CONFIG = {
  quote: {
    icon: DocumentTextIcon,
    iconBg: 'bg-info-subtle',
    iconColor: 'text-info',
    label: 'Presupuesto',
    to: '/quotes',
  },
  project: {
    icon: ClipboardDocumentListIcon,
    iconBg: 'bg-warning-subtle',
    iconColor: 'text-warning',
    label: 'Proyecto',
    to: '/projects',
  },
}

// ── sub-components ────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="bg-surface/60 backdrop-blur-xl border border-line rounded-xl p-3 md:p-5 flex items-start gap-2 md:gap-4">
      <div className={`p-2 md:p-2.5 rounded-xl shrink-0 ${iconBg}`}>
        <Icon className={`w-4 h-4 md:w-5 md:h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-fg-muted uppercase tracking-wide leading-tight">{label}</p>
        <p className="text-base md:text-2xl font-bold text-fg mt-0.5 truncate">{value}</p>
        {sub != null && <p className="hidden md:block text-xs text-fg-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function ProjectsPanel({ projects }) {
  const byStatus = projects?.byStatus ?? []
  const total = byStatus.reduce((acc, s) => acc + s.totalProjects, 0)

  return (
    <div className="bg-surface/60 backdrop-blur-xl border border-line rounded-xl p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fg">Proyectos por estado</h3>
        <Link to="/projects" className="flex items-center gap-1 text-xs text-brand hover:underline">
          Ver todos <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      {byStatus.length === 0 ? (
        <p className="text-sm text-fg-muted py-4 text-center">Sin proyectos aún</p>
      ) : (
        <ul className="space-y-3">
          {byStatus.map(s => {
            const info = PROJECT_STATUS[s._id] ?? { label: s._id, dot: 'bg-fg-muted' }
            const pct = total ? (s.totalProjects / total) * 100 : 0
            return (
              <li key={s._id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${info.dot}`} />
                    <span className="text-sm text-fg-soft">{info.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-fg">{s.totalProjects}</span>
                </div>
                <div className="h-1.5 rounded-full bg-raised overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand/40 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="pt-4 border-t border-line flex items-center justify-between">
        <p className="text-xs text-fg-muted">Total proyectos</p>
        <p className="text-sm font-semibold text-fg">{projects?.summary?.totalProjects ?? '-'}</p>
      </div>
    </div>
  )
}

function TopClientsPanel({ clients, currency }) {
  const list = clients ?? []
  const max = list[0]?.total ?? 1

  return (
    <div className="bg-surface/60 backdrop-blur-xl border border-line rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fg">Top clientes</h3>
        <Link to="/clients" className="flex items-center gap-1 text-xs text-brand hover:underline">
          Ver todos <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-fg-muted text-center py-4">Sin datos aún</p>
      ) : (
        <ul className="space-y-3">
          {list.map((entry, i) => {
            const pct = max ? (entry.total / max) * 100 : 0
            return (
              <li key={entry.client.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-fg-muted w-4 shrink-0">#{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-fg font-medium truncate">{entry.client.name}</p>
                      {entry.client.company && (
                        <p className="text-xs text-fg-muted truncate">{entry.client.company}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-fg shrink-0 ml-2">{fmt(entry.total, currency)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-raised overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand/50 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
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
    <div className="bg-surface/60 backdrop-blur-xl border border-line rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fg">Presupuestos por vencer</h3>
        <Link to="/quotes" className="flex items-center gap-1 text-xs text-brand hover:underline">
          Ver todos <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      {expiring.length === 0 ? (
        <p className="text-sm text-fg-muted text-center py-4">Sin presupuestos próximos a vencer</p>
      ) : (
        <ul className="divide-y divide-line">
          {expiring.map(q => {
            const daysLeft = Math.max(0, Math.ceil((new Date(q.validUntil) - new Date()) / (1000 * 60 * 60 * 24)))
            const urgent = daysLeft <= 2
            return (
              <li key={q.id} className="flex items-center gap-3 py-3">
                <div className={`p-1.5 rounded-lg shrink-0 ${urgent ? 'bg-danger-subtle' : 'bg-warning-subtle'}`}>
                  <ExclamationCircleIcon className={`w-4 h-4 ${urgent ? 'text-danger' : 'text-warning'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-fg truncate">#{q.number} {q.title}</p>
                  <p className="text-xs text-fg-muted truncate">{q.client?.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-fg">{fmt(q.total)}</p>
                  <p className={`text-xs font-medium ${urgent ? 'text-danger' : 'text-warning'}`}>
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
  const draft    = Number(quotes?.summary?.draft    ?? 0)
  const sent     = Number(quotes?.summary?.sent     ?? 0)
  const approved = Number(quotes?.summary?.approved ?? 0)
  const rejected = Number(quotes?.summary?.rejected ?? 0)
  const barTotal = draft + sent + approved + rejected
  const totalValue = Number(quotes?.summary?.totalValue ?? 0)

  const pct = (v) => barTotal ? (v / barTotal) * 100 : 0

  return (
    <div className="bg-surface/60 backdrop-blur-xl border border-line rounded-xl p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fg">Resumen de presupuestos</h3>
        <Link to="/quotes" className="flex items-center gap-1 text-xs text-brand hover:underline">
          Ver presupuestos <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <div className="min-w-0">
          <p className="text-xs text-fg-muted mb-1">Aprobados</p>
          <p className="text-sm md:text-xl font-bold text-brand truncate">{fmt(approved, currency)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-fg-muted mb-1">Enviados</p>
          <p className="text-sm md:text-xl font-bold text-info truncate">{fmt(sent, currency)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-fg-muted mb-1">Borradores</p>
          <p className="text-sm md:text-xl font-bold text-fg-soft truncate">{fmt(draft, currency)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-fg-muted mb-1">Rechazados</p>
          <p className="text-sm md:text-xl font-bold text-danger truncate">{fmt(rejected, currency)}</p>
        </div>
      </div>

      <div>
        {barTotal > 0 ? (
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-raised">
            {pct(approved) > 0 && <div style={{ width: `${pct(approved)}%` }} className="bg-brand transition-all duration-700" />}
            {pct(sent) > 0     && <div style={{ width: `${pct(sent)}%` }}     className="bg-info transition-all duration-700" />}
            {pct(draft) > 0    && <div style={{ width: `${pct(draft)}%` }}    className="bg-fg-muted/40 transition-all duration-700" />}
            {pct(rejected) > 0 && <div style={{ width: `${pct(rejected)}%` }} className="bg-danger transition-all duration-700" />}
          </div>
        ) : (
          <div className="h-2.5 rounded-full bg-raised" />
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5">
          {[
            { label: 'Aprobados',  color: 'bg-brand',       val: pct(approved) },
            { label: 'Enviados',   color: 'bg-info',         val: pct(sent) },
            { label: 'Borradores', color: 'bg-fg-muted/40',  val: pct(draft) },
            { label: 'Rechazados', color: 'bg-danger',       val: pct(rejected) },
          ].map(({ label, color, val }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-fg-muted">
              <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
              {label} <span className="text-fg-soft font-medium">{val.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-line flex items-center justify-between">
        <p className="text-xs text-fg-muted">Total presupuestado</p>
        <p className="text-sm font-semibold text-fg">{fmt(totalValue, currency)}</p>
      </div>
    </div>
  )
}

function IncomeExpensesBars({ months, currency }) {
  const [hovered, setHovered] = useState(null)
  const max = Math.max(...months.map(m => Math.max(m.approved ?? 0, m.expenses ?? 0)), 1)

  return (
    <div className="flex items-end gap-1.5 h-36">
      {months.map(m => {
        const incomePct  = max ? ((m.approved ?? 0) / max) * 100 : 0
        const expensePct = max ? ((m.expenses ?? 0) / max) * 100 : 0
        const balance    = (m.approved ?? 0) - (m.expenses ?? 0)
        const isHovered  = hovered === m.key

        return (
          <div
            key={m.key}
            className="flex-1 flex flex-col items-center gap-1 relative group"
            onMouseEnter={() => setHovered(m.key)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Tooltip */}
            {isHovered && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 w-40 bg-overlay border border-line rounded-xl p-3 shadow-xl pointer-events-none">
                <p className="text-xs font-semibold text-fg capitalize mb-2">{m.label}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-xs text-fg-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                      Ingresos
                    </span>
                    <span className="text-xs font-semibold text-brand">{fmt(m.approved ?? 0, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-xs text-fg-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                      Egresos
                    </span>
                    <span className="text-xs font-semibold text-danger">{fmt(m.expenses ?? 0)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-line flex items-center justify-between gap-2">
                    <span className="text-xs text-fg-muted">Balance</span>
                    <span className={`text-xs font-bold ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
                      {balance >= 0 ? '+' : ''}{fmt(balance, currency)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="w-full flex items-end gap-0.5 h-28">
              <div
                className={`flex-1 rounded-t-md transition-all duration-300 ${isHovered ? 'bg-brand' : 'bg-brand/60'}`}
                style={{ height: `${incomePct}%` }}
              />
              <div
                className={`flex-1 rounded-t-md transition-all duration-300 ${isHovered ? 'bg-danger' : 'bg-danger/60'}`}
                style={{ height: `${expensePct}%` }}
              />
            </div>
            <p className={`text-xs capitalize transition-colors ${isHovered ? 'text-fg' : 'text-fg-muted'}`}>{m.label}</p>
          </div>
        )
      })}
    </div>
  )
}

function IncomeExpensesChart({ data, currency }) {
  const allMonths = data ?? []
  const lastSix   = allMonths.slice(-6)

  const legend = (
    <div className="flex items-center gap-3 text-xs text-fg-muted">
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand inline-block" />Ingresos</span>
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger inline-block" />Egresos</span>
    </div>
  )

  const totals = (months) => {
    const totalIncome  = months.reduce((a, m) => a + (m.approved ?? 0), 0)
    const totalExpense = months.reduce((a, m) => a + (m.expenses ?? 0), 0)
    const balance      = totalIncome - totalExpense
    return (
      <div className="pt-4 border-t border-line grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-fg-muted mb-0.5">Ingresos</p>
          <p className="text-sm font-semibold text-brand">{fmt(totalIncome, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-fg-muted mb-0.5">Egresos</p>
          <p className="text-sm font-semibold text-danger">{fmt(totalExpense)}</p>
        </div>
        <div>
          <p className="text-xs text-fg-muted mb-0.5">Balance</p>
          <p className={`text-sm font-semibold ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
            {balance >= 0 ? '+' : ''}{fmt(balance, currency)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface/60 backdrop-blur-xl border border-line rounded-xl p-6 flex flex-col gap-4">
      <div className="md:hidden flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-fg">Ingresos y egresos — últimos 6 meses</h3>
          {legend}
        </div>
        <IncomeExpensesBars months={lastSix} currency={currency} />
        {totals(lastSix)}
      </div>
      <div className="hidden md:flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-fg">Ingresos y egresos — últimos 12 meses</h3>
          {legend}
        </div>
        <IncomeExpensesBars months={allMonths} currency={currency} />
        {totals(allMonths)}
      </div>
    </div>
  )
}

function RecentQuotes({ quotes }) {
  const list = quotes?.recent ?? []
  if (!list.length) {
    return <p className="text-sm text-fg-muted text-center py-6">Sin presupuestos recientes</p>
  }
  return (
    <ul className="divide-y divide-line">
      {list.map(q => {
        const st = QUOTE_STATUS[q.status] ?? { label: q.status, cls: 'bg-raised text-fg-muted' }
        return (
          <li key={q.id}>
            <Link
              to="/quotes"
              className="flex items-center gap-3 px-1 py-3 hover:bg-raised rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-raised flex items-center justify-center shrink-0">
                <DocumentTextIcon className="w-4 h-4 text-fg-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fg truncate">
                  #{q.number}{q.title ? ` · ${q.title}` : ''}
                </p>
                <p className="text-xs text-fg-muted truncate">{q.client?.name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-sm font-semibold text-fg">{fmt(q.total, q.currency)}</p>
                <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>
                  {st.label}
                </span>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function QuoteInstallmentsPanel({ quotes }) {
  const installments = quotes?.upcomingInstallments ?? []
  const fmt2 = (n) => Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="bg-surface/60 backdrop-blur-xl border border-line rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fg">Cuotas de presupuestos</h3>
        <Link to="/quotes" className="flex items-center gap-1 text-xs text-brand hover:underline">
          Ver presupuestos <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      {installments.length === 0 ? (
        <p className="text-sm text-fg-muted text-center py-4">Sin cuotas pendientes</p>
      ) : (
        <ul className="divide-y divide-line">
          {installments.map(inst => {
            const daysLeft = Math.ceil((new Date(inst.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
            const overdue = daysLeft < 0
            const urgent = !overdue && daysLeft <= 3
            return (
              <li key={inst.id} className="flex items-center gap-3 py-3">
                <div className={`p-1.5 rounded-lg shrink-0 ${overdue ? 'bg-danger-subtle' : urgent ? 'bg-warning-subtle' : 'bg-raised'}`}>
                  <BanknotesIcon className={`w-4 h-4 ${overdue ? 'text-danger' : urgent ? 'text-warning' : 'text-fg-muted'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-fg truncate">
                    {inst.quote?.client?.name}
                  </p>
                  <p className="text-xs text-fg-muted truncate">
                    Cuota {inst.number} · Pres. #{inst.quote?.number}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${overdue ? 'text-danger' : 'text-fg'}`}>
                    {inst.quote?.currency} ${fmt2(inst.amount)}
                  </p>
                  <p className={`text-xs ${overdue ? 'text-danger' : urgent ? 'text-warning' : 'text-fg-muted'}`}>
                    {overdue
                      ? `Vencida hace ${Math.abs(daysLeft)}d`
                      : daysLeft === 0 ? 'Vence hoy'
                      : `En ${daysLeft}d`}
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

function UpcomingProjectsPanel({ projects }) {
  const upcoming = projects?.upcomingProjects ?? []

  return (
    <div className="bg-surface/60 backdrop-blur-xl border border-line rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fg">Proyectos por vencer</h3>
        <Link to="/projects" className="flex items-center gap-1 text-xs text-brand hover:underline">
          Ver todos <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-fg-muted text-center py-4">Sin proyectos próximos a vencer</p>
      ) : (
        <ul className="divide-y divide-line">
          {upcoming.map(p => {
            const daysLeft = Math.max(0, Math.ceil((new Date(p.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
            const urgent = daysLeft <= 2
            return (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <div className={`p-1.5 rounded-lg shrink-0 ${urgent ? 'bg-danger-subtle' : 'bg-warning-subtle'}`}>
                  <CalendarDaysIcon className={`w-4 h-4 ${urgent ? 'text-danger' : 'text-warning'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-fg truncate">{p.title}</p>
                  <p className="text-xs text-fg-muted truncate">
                    {p.client?.name} · {PROJECT_STATUS_LABEL[p.status] ?? p.status}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {p.budget != null && <p className="text-sm font-semibold text-fg">{fmt(p.budget)}</p>}
                  <p className={`text-xs font-medium ${urgent ? 'text-danger' : 'text-warning'}`}>
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

function ActivityFeed({ activity }) {
  const items = activity ?? []

  return (
    <div className="bg-surface/60 backdrop-blur-xl border border-line rounded-xl p-6 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-fg">Actividad reciente</h3>

      {items.length === 0 ? (
        <p className="text-sm text-fg-muted text-center py-4">Sin actividad reciente</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item, i) => {
            const cfg = ACTIVITY_CONFIG[item.type]
            const Icon = cfg.icon
            const name = item.data.title ?? `#${item.data.number}`
            return (
              <li key={i}>
                <Link
                  to={cfg.to}
                  className="flex items-center gap-3 py-3 px-1 rounded-lg hover:bg-raised transition-colors"
                >
                  <div className={`p-2 rounded-lg shrink-0 ${cfg.iconBg}`}>
                    <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-fg truncate">
                      {item.data.number ? `#${item.data.number} · ` : ''}{name}
                    </p>
                    <p className="text-xs text-fg-muted truncate">
                      {cfg.label}{item.data.client ? ` · ${item.data.client.name}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {item.data.total != null && (
                      <p className="text-sm font-semibold text-fg">{fmt(item.data.total)}</p>
                    )}
                    <p className="text-xs text-fg-muted">{fmtRelative(item.createdAt)}</p>
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

// ── main ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const orgId = user?.org

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
  })

  const { data: topClients } = useQuery({
    queryKey: ['clients-top'],
    queryFn: () => getTopClients().then(r => r.data.data),
  })

  const { data: clientsStats } = useQuery({
    queryKey: ['clients-dashboard'],
    queryFn: () => getClientsDashboard().then(r => r.data.data),
  })

  const { data: recentActivity } = useQuery({
    queryKey: ['activity-recent'],
    queryFn: () => getRecentActivity().then(r => r.data.data),
  })

  const activeProjects = projects?.byStatus?.find(s => s._id === 'in_progress')?.totalProjects ?? 0
  const openQuotes     = quotes?.byStatus
    ?.filter(s => ['draft', 'sent'].includes(s.status))
    ?.reduce((acc, s) => acc + s.count, 0) ?? 0

  const currentMonthKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()
  const currentMonth  = quotes?.monthly?.find(m => m.key === currentMonthKey)
  const incomeMonth   = Number(currentMonth?.approved ?? 0)
  const expensesMonth = Number(currentMonth?.expenses ?? 0)

  return (
    <div className="p-4 md:p-8 max-w-5xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-fg">{greeting(profile?.name ?? user?.name)}</h1>
          <p className="text-sm text-fg-muted mt-0.5 capitalize">{fmtDate()}</p>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/clients"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-raised hover:bg-surface text-xs font-medium text-fg transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Cliente
          </Link>
          <Link
            to="/projects"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-raised hover:bg-surface text-xs font-medium text-fg transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Proyecto
          </Link>
          <Link
            to="/quotes"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white hover:opacity-90 text-xs font-medium transition-opacity"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Presupuesto
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={FolderOpenIcon}
          iconBg="bg-info-subtle"
          iconColor="text-info"
          label="Proyectos en curso"
          value={activeProjects}
          sub={`${openQuotes} presupuestos abiertos`}
        />
        <KpiCard
          icon={ArrowTrendingUpIcon}
          iconBg="bg-brand-subtle"
          iconColor="text-brand"
          label="Ingresos del mes"
          value={fmt(incomeMonth, currency)}
          sub="presupuestos aprobados"
        />
        <KpiCard
          icon={ArrowTrendingDownIcon}
          iconBg="bg-danger-subtle"
          iconColor="text-danger"
          label="Egresos del mes"
          value={fmt(expensesMonth, currency)}
          sub="gastos registrados"
        />
        <KpiCard
          icon={UserGroupIcon}
          iconBg="bg-success-subtle"
          iconColor="text-success"
          label="Clientes"
          value={clientsStats?.total ?? '-'}
          sub={clientsStats?.newThisMonth != null
            ? `+${clientsStats.newThisMonth} este mes`
            : undefined}
        />
      </div>

      {/* Quotes summary panel */}
      <div className="mb-6">
        <QuotesSummaryPanel quotes={quotes} currency={currency} />
      </div>

      {/* Income / Expenses chart */}
      <div className="mb-6">
        <IncomeExpensesChart data={quotes?.monthly} currency={currency} />
      </div>

      {/* Recent quotes + Quote installments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface/60 backdrop-blur-xl border border-line rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-fg">Presupuestos recientes</h3>
            <Link to="/quotes" className="flex items-center gap-1 text-xs text-brand hover:underline">
              Ver todos <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
          <RecentQuotes quotes={quotes} />
        </div>
        <QuoteInstallmentsPanel quotes={quotes} />
      </div>

      {/* Expiring quotes + Projects panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ExpiringQuotesPanel quotes={quotes} />
        <ProjectsPanel projects={projects} />
      </div>

      {/* Top clients + Upcoming projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <TopClientsPanel clients={topClients} currency={currency} />
        <UpcomingProjectsPanel projects={projects} />
      </div>

      {/* Activity feed */}
      <div className="mb-6">
        <ActivityFeed activity={recentActivity} />
      </div>

    </div>
  )
}
