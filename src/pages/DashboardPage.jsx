import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getProjectsDashboard } from '../api/projects'
import { getInvoicesDashboard, getInvoices } from '../api/invoices'
import { getQuotesDashboard } from '../api/quotes'
import { getProfile } from '../api/profile'
import { useAuth } from '../context/AuthContext'
import {
  BanknotesIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  ArrowRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return '-'
  return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

// ── constants ─────────────────────────────────────────────────────────────────

const PROJECT_STATUS = {
  pending:    { label: 'Pendiente',  dot: 'bg-warning' },
  approved:   { label: 'Aprobado',   dot: 'bg-info' },
  in_progress:{ label: 'En curso',   dot: 'bg-brand' },
  finished:   { label: 'Finalizado', dot: 'bg-brand opacity-60' },
  cancelled:  { label: 'Cancelado',  dot: 'bg-fg-muted' },
}

const INV_STATUS = {
  draft:     { label: 'Borrador', cls: 'bg-raised text-fg-soft' },
  sent:      { label: 'Enviada',  cls: 'bg-info-subtle text-info' },
  paid:      { label: 'Pagada',   cls: 'bg-brand-subtle text-brand' },
  overdue:   { label: 'Vencida',  cls: 'bg-danger-subtle text-danger' },
  cancelled: { label: 'Cancelada',cls: 'bg-raised text-fg-muted' },
}

// ── sub-components ────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-3 md:p-5 flex items-start gap-2 md:gap-4">
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

function IncomePanel({ invoices }) {
  const paid    = Number(invoices?.summary?.paid    ?? 0)
  const sent    = Number(invoices?.summary?.sent    ?? 0)
  const overdue = Number(invoices?.summary?.overdue ?? 0)
  const total   = paid + sent + overdue

  const paidPct    = total ? (paid    / total) * 100 : 0
  const sentPct    = total ? (sent    / total) * 100 : 0
  const overduePct = total ? (overdue / total) * 100 : 0

  return (
    <div className="bg-surface border border-line rounded-xl p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fg">Resumen de ingresos</h3>
        <Link to="/invoices" className="flex items-center gap-1 text-xs text-brand hover:underline">
          Ver facturas <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      {/* Numbers */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="min-w-0">
          <p className="text-xs text-fg-muted mb-1">Cobrado</p>
          <p className="text-sm md:text-xl font-bold text-brand truncate">{fmt(paid)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-fg-muted mb-1">Enviadas</p>
          <p className="text-sm md:text-xl font-bold text-info truncate">{fmt(sent)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-fg-muted mb-1">Vencido</p>
          <p className="text-sm md:text-xl font-bold text-danger truncate">{fmt(overdue)}</p>
        </div>
      </div>

      {/* Stacked bar */}
      <div>
        {total > 0 ? (
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-raised">
            {paidPct > 0 && (
              <div style={{ width: `${paidPct}%` }} className="bg-brand transition-all duration-700" />
            )}
            {sentPct > 0 && (
              <div style={{ width: `${sentPct}%` }} className="bg-info transition-all duration-700" />
            )}
            {overduePct > 0 && (
              <div style={{ width: `${overduePct}%` }} className="bg-danger transition-all duration-700" />
            )}
          </div>
        ) : (
          <div className="h-2.5 rounded-full bg-raised" />
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5">
          {[
            { label: 'Cobrado',  color: 'bg-brand',  pct: paidPct },
            { label: 'Enviadas', color: 'bg-info',    pct: sentPct },
            { label: 'Vencido',  color: 'bg-danger',  pct: overduePct },
          ].map(({ label, color, pct }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-fg-muted">
              <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
              {label} <span className="text-fg-soft font-medium">{pct.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="pt-4 border-t border-line flex items-center justify-between">
        <p className="text-xs text-fg-muted">Total facturado</p>
        <p className="text-sm font-semibold text-fg">{fmt(total)}</p>
      </div>
    </div>
  )
}

function ProjectsPanel({ projects }) {
  const byStatus = projects?.byStatus ?? []
  const total = byStatus.reduce((acc, s) => acc + s.totalProjects, 0)

  return (
    <div className="bg-surface border border-line rounded-xl p-6 flex flex-col gap-5">
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

function RecentInvoices({ invoices }) {
  if (!invoices?.length) {
    return (
      <p className="text-sm text-fg-muted text-center py-6">Sin facturas recientes</p>
    )
  }
  return (
    <ul className="divide-y divide-line">
      {invoices.map(inv => {
        const st = INV_STATUS[inv.status] ?? { label: inv.status, cls: 'bg-raised text-fg-muted' }
        return (
          <li key={inv.id}>
            <Link
              to={`/invoices`}
              className="flex items-center gap-3 px-1 py-3 hover:bg-raised rounded-lg transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-raised flex items-center justify-center shrink-0">
                <DocumentTextIcon className="w-4 h-4 text-fg-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fg truncate">
                  {inv.number}{inv.title ? ` · ${inv.title}` : ''}
                </p>
                <p className="text-xs text-fg-muted truncate">{inv.client?.name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-sm font-semibold text-fg">{fmt(inv.total)}</p>
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

// ── main ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile().then(r => r.data.data),
  })

  const { data: projects } = useQuery({
    queryKey: ['projects-dashboard'],
    queryFn: () => getProjectsDashboard().then(r => r.data.data),
  })

  const { data: invoices } = useQuery({
    queryKey: ['invoices-dashboard'],
    queryFn: () => getInvoicesDashboard().then(r => r.data.data),
  })

  const { data: quotes } = useQuery({
    queryKey: ['quotes-dashboard'],
    queryFn: () => getQuotesDashboard().then(r => r.data.data),
  })

  const { data: recentInvoices } = useQuery({
    queryKey: ['invoices-recent'],
    queryFn: () => getInvoices({ limit: 5 }).then(r => r.data.data.data),
  })

  const activeProjects = projects?.byStatus?.find(s => s._id === 'in_progress')?.totalProjects ?? 0
  const openQuotes = quotes?.byStatus
    ?.filter(s => ['draft', 'sent'].includes(s.status))
    ?.reduce((acc, s) => acc + s.count, 0) ?? 0

  return (
    <div className="p-4 md:p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-fg">{greeting(profile?.name ?? user?.name)}</h1>
        <p className="text-sm text-fg-muted mt-0.5 capitalize">{fmtDate()}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={BanknotesIcon}
          iconBg="bg-brand-subtle"
          iconColor="text-brand"
          label="Cobrado"
          value={fmt(invoices?.summary?.paid)}
          sub={`de ${invoices?.summary?.totalInvoices ?? 0} facturas`}
        />
        <KpiCard
          icon={ClockIcon}
          iconBg="bg-info-subtle"
          iconColor="text-info"
          label="Enviadas"
          value={fmt(invoices?.summary?.sent)}
        />
        <KpiCard
          icon={ExclamationTriangleIcon}
          iconBg="bg-danger-subtle"
          iconColor="text-danger"
          label="Vencido"
          value={fmt(invoices?.summary?.overdue)}
        />
        <KpiCard
          icon={FolderOpenIcon}
          iconBg="bg-info-subtle"
          iconColor="text-info"
          label="En curso"
          value={activeProjects}
          sub={`${openQuotes} presupuestos abiertos`}
        />
      </div>

      {/* Middle panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <IncomePanel invoices={invoices} />
        </div>
        <div className="md:col-span-1">
          <ProjectsPanel projects={projects} />
        </div>
      </div>

      {/* Recent invoices */}
      <div className="bg-surface border border-line rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-fg">Facturas recientes</h3>
          <Link to="/invoices" className="flex items-center gap-1 text-xs text-brand hover:underline">
            Ver todas <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>
        <RecentInvoices invoices={recentInvoices} />
      </div>

    </div>
  )
}
