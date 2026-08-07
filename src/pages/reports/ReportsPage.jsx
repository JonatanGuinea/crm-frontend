import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getFinancesDashboard } from '../../api/finances'
import { getQuotesDashboard } from '../../api/quotes'
import { getProjectsDashboard } from '../../api/projects'
import { getStockDashboard, getProducts } from '../../api/stock'
import { getTopClients } from '../../api/clients'
import { getOrganizations } from '../../api/organizations'
import { useAuth } from '../../context/AuthContext'
import { fmt } from '../../utils/fmt'
import { generateFullReportPDF } from '../../utils/generateReport'
import {
  ChevronLeftIcon, ChevronRightIcon, ArrowDownTrayIcon,
  BanknotesIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  DocumentTextIcon, FolderOpenIcon, CubeIcon,
  ExclamationTriangleIcon, XCircleIcon, CheckCircleIcon,
  ClockIcon, BuildingLibraryIcon,
} from '@heroicons/react/24/outline'

// ── helpers ───────────────────────────────────────────────────────────────────

const fmtN = (n) => Number(n ?? 0).toLocaleString('es-AR')

function periodLabel(year, month) {
  return new Date(year, month - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function shortMonth(key) {
  const [y, m] = key.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1)
    .toLocaleDateString('es-AR', { month: 'short' })
}

function buildEvolution(apiData) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const key = monthKey(d.getFullYear(), d.getMonth() + 1)
    const found = apiData?.find(m => m.month === key)
    return { month: key, income: Number(found?.income ?? 0), expense: Number(found?.expense ?? 0) }
  })
}

// ── sub-components ────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg shrink-0 ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-fg-muted uppercase tracking-wide">{label}</p>
        <p className="text-base md:text-lg font-bold text-fg mt-0.5 truncate" title={typeof value === 'string' ? value : undefined}>{value}</p>
        {sub && <p className="text-xs text-fg-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wide border-b border-line pb-2 mb-4">
      {children}
    </h2>
  )
}

function MiniBarChart({ data, keyA, keyB, colorA, colorB }) {
  const max = Math.max(...data.map(d => Math.max(Number(d[keyA] ?? 0), Number(d[keyB] ?? 0))), 1)
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map(d => {
        const pctA = (Number(d[keyA] ?? 0) / max) * 100
        const pctB = (Number(d[keyB] ?? 0) / max) * 100
        return (
          <div key={d.month ?? d.key} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end gap-px h-20">
              <div className={`flex-1 rounded-t-sm ${colorA}`} style={{ height: `${pctA}%` }} />
              <div className={`flex-1 rounded-t-sm ${colorB}`} style={{ height: `${pctB}%` }} />
            </div>
            <p className="text-xs text-fg-muted capitalize">{shortMonth(d.month ?? d.key)}</p>
          </div>
        )
      })}
    </div>
  )
}

function StatusBar({ items, total }) {
  return (
    <div>
      <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-raised mb-3">
        {items.map(({ color, value }) => {
          const pct = total ? (value / total) * 100 : 0
          return pct > 0
            ? <div key={color} style={{ width: `${pct}%` }} className={`${color} transition-all`} />
            : null
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {items.map(({ label, color, value, formatted }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-fg-muted">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            {label}: <span className="font-semibold text-fg">{formatted ?? value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="flex items-center justify-center py-24 text-fg-muted text-sm">Cargando…</div>
}

// ── tabs ──────────────────────────────────────────────────────────────────────

function FinancesTab({ data, year, month, currency }) {
  if (!data) return <Spinner />

  const evolution      = buildEvolution(data?.monthlyEvolution)
  const totalBalance   = Number(data?.totalBalance  ?? 0)
  const incomeMonth    = Number(data?.incomeMonth   ?? 0)
  const expenseMonth   = Number(data?.expenseMonth  ?? 0)
  const netMonth       = incomeMonth - expenseMonth
  const pendingIncome  = Number(data?.pendingIncome  ?? 0)
  const pendingExpense = Number(data?.pendingExpense ?? 0)
  const incomeCount    = Number(data?.incomeCount    ?? 0)
  const expenseCount   = Number(data?.expenseCount   ?? 0)

  // Resumen ejecutivo
  const estimatedInitial = totalBalance - netMonth
  const operatingMargin  = incomeMonth > 0 ? ((netMonth / incomeMonth) * 100).toFixed(1) : null
  const coverageRatio    = expenseMonth > 0 ? (incomeMonth / expenseMonth).toFixed(2) : null
  const topCategory      = data?.categoryBreakdown?.[0]?.name ?? '—'

  // Liquidez
  const resultadoPendiente = pendingIncome - pendingExpense
  const saldoProyectado    = totalBalance + resultadoPendiente
  const cashRunway         = expenseMonth > 0 ? (totalBalance / expenseMonth).toFixed(1) : null
  const eficienciaCobro    = (incomeMonth + pendingIncome) > 0
    ? ((incomeMonth / (incomeMonth + pendingIncome)) * 100).toFixed(1)
    : '0'

  // Indicadores
  const ticketIngreso = incomeCount > 0 ? incomeMonth / incomeCount : 0
  const ticketEgreso  = expenseCount > 0 ? expenseMonth / expenseCount : 0
  const topMovs       = data?.topMovementsMonth ?? []
  const mayorIngreso  = topMovs.find(m => m.type === 'income')?.amount ?? 0
  const mayorEgreso   = topMovs.find(m => m.type === 'expense')?.amount ?? 0

  const totalEvo = evolution.reduce((a, m) => ({
    income: a.income + m.income, expense: a.expense + m.expense,
  }), { income: 0, expense: 0 })

  return (
    <div className="flex flex-col gap-8">

      {/* Resumen ejecutivo */}
      <div>
        <SectionTitle>Resumen ejecutivo — {periodLabel(year, month)}</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiCard icon={BuildingLibraryIcon} iconBg="bg-raised" iconColor="text-fg-muted"
            label="Saldo inicial (estimado)" value={fmt(estimatedInitial, currency)} />
          <KpiCard icon={BuildingLibraryIcon} iconBg="bg-brand-subtle" iconColor="text-brand"
            label="Saldo final en caja" value={fmt(totalBalance, currency)} />
          <KpiCard icon={BanknotesIcon} iconBg={netMonth >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle'}
            iconColor={netMonth >= 0 ? 'text-success' : 'text-danger'}
            label="Resultado del mes" value={fmt(netMonth, currency)} />
          <KpiCard icon={ArrowTrendingUpIcon} iconBg="bg-success-subtle" iconColor="text-success"
            label="Ingresos confirmados" value={fmt(incomeMonth, currency)} />
          <KpiCard icon={ArrowTrendingDownIcon} iconBg="bg-danger-subtle" iconColor="text-danger"
            label="Egresos confirmados" value={fmt(expenseMonth, currency)} />
          <KpiCard icon={ArrowTrendingUpIcon} iconBg="bg-brand-subtle" iconColor="text-brand"
            label="Margen operativo" value={operatingMargin !== null ? `${operatingMargin}%` : '—'} />
          <KpiCard icon={BuildingLibraryIcon} iconBg="bg-info-subtle" iconColor="text-info"
            label="Ratio de cobertura" value={coverageRatio !== null ? `${coverageRatio}x` : '—'} />
          <KpiCard icon={ClockIcon} iconBg="bg-raised" iconColor="text-fg-muted"
            label="Movimientos del mes" value={`${incomeCount + expenseCount} ops`} />
          <KpiCard icon={ArrowTrendingDownIcon} iconBg="bg-warning-subtle" iconColor="text-warning"
            label="Categoría con mayor gasto" value={topCategory} />
        </div>
      </div>

      {/* Liquidez y proyecciones */}
      <div>
        <SectionTitle>Liquidez y proyecciones</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiCard icon={ArrowTrendingUpIcon} iconBg="bg-success-subtle" iconColor="text-success"
            label="A cobrar (pendiente)" value={fmt(pendingIncome, currency)} />
          <KpiCard icon={ArrowTrendingDownIcon} iconBg="bg-danger-subtle" iconColor="text-danger"
            label="A pagar (pendiente)" value={fmt(pendingExpense, currency)} />
          <KpiCard icon={BanknotesIcon} iconBg={resultadoPendiente >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle'}
            iconColor={resultadoPendiente >= 0 ? 'text-success' : 'text-danger'}
            label="Resultado pendiente" value={fmt(resultadoPendiente, currency)} />
          <KpiCard icon={BuildingLibraryIcon} iconBg="bg-brand-subtle" iconColor="text-brand"
            label="Saldo proyectado" value={fmt(saldoProyectado, currency)} />
          <KpiCard icon={ClockIcon} iconBg="bg-info-subtle" iconColor="text-info"
            label="Cash runway" value={cashRunway !== null ? `${cashRunway} meses` : '∞'} />
          <KpiCard icon={ArrowTrendingUpIcon} iconBg="bg-brand-subtle" iconColor="text-brand"
            label="Eficiencia de cobro" value={`${eficienciaCobro}%`} />
        </div>
      </div>

      {/* Indicadores del mes */}
      <div>
        <SectionTitle>Indicadores del mes</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiCard icon={ArrowTrendingUpIcon} iconBg="bg-success-subtle" iconColor="text-success"
            label="Ingresos — cantidad" value={`${incomeCount} movimientos`} />
          <KpiCard icon={ArrowTrendingDownIcon} iconBg="bg-danger-subtle" iconColor="text-danger"
            label="Egresos — cantidad" value={`${expenseCount} movimientos`} />
          <KpiCard icon={BanknotesIcon} iconBg="bg-raised" iconColor="text-fg-muted"
            label="Ticket promedio ingreso" value={fmt(ticketIngreso, currency)} />
          <KpiCard icon={BanknotesIcon} iconBg="bg-raised" iconColor="text-fg-muted"
            label="Ticket promedio egreso" value={fmt(ticketEgreso, currency)} />
          <KpiCard icon={ArrowTrendingUpIcon} iconBg="bg-success-subtle" iconColor="text-success"
            label="Mayor ingreso del mes" value={fmt(mayorIngreso, currency)} />
          <KpiCard icon={ArrowTrendingDownIcon} iconBg="bg-danger-subtle" iconColor="text-danger"
            label="Mayor egreso del mes" value={fmt(mayorEgreso, currency)} />
        </div>
      </div>

      {/* Evolución mensual */}
      <div>
        <SectionTitle>Evolución últimos 6 meses</SectionTitle>
        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          <div className="p-5 border-b border-line">
            <div className="flex items-center gap-4 text-xs text-fg-muted mb-4">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand inline-block" />Ingresos</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger inline-block" />Egresos</span>
            </div>
            <MiniBarChart data={evolution} keyA="income" keyB="expense" colorA="bg-brand/70" colorB="bg-danger/70" />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-raised/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Mes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Ingresos</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Egresos</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Neto</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Var. MoM</th>
              </tr>
            </thead>
            <tbody>
              {evolution.map((m, i) => {
                const neto = m.income - m.expense
                const prev = i > 0 ? evolution[i - 1] : null
                const momPct = (prev && prev.income > 0)
                  ? ((m.income - prev.income) / prev.income) * 100
                  : null
                const [y, mo] = m.month.split('-')
                const label = new Date(parseInt(y), parseInt(mo) - 1, 1)
                  .toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
                return (
                  <tr key={m.month} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 text-fg capitalize">{label}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand">{fmt(m.income, currency)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-danger">{fmt(m.expense, currency)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${neto >= 0 ? 'text-success' : 'text-danger'}`}>
                      {fmt(neto, currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      {momPct === null ? <span className="text-fg-muted">—</span> : (
                        <span className={momPct >= 0 ? 'text-success' : 'text-danger'}>
                          {momPct >= 0 ? '+' : ''}{momPct.toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-raised/60 border-t border-line">
                <td className="px-4 py-3 text-xs font-semibold text-fg-muted uppercase">Total período</td>
                <td className="px-4 py-3 text-right font-bold text-brand">{fmt(totalEvo.income, currency)}</td>
                <td className="px-4 py-3 text-right font-bold text-danger">{fmt(totalEvo.expense, currency)}</td>
                <td className={`px-4 py-3 text-right font-bold ${totalEvo.income - totalEvo.expense >= 0 ? 'text-success' : 'text-danger'}`}>
                  {fmt(totalEvo.income - totalEvo.expense, currency)}
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Egresos por categoría */}
      {data?.categoryBreakdown?.length > 0 && (
        <div>
          <SectionTitle>Egresos por categoría — {periodLabel(year, month)}</SectionTitle>
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-raised/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Categoría</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">%</th>
                </tr>
              </thead>
              <tbody>
                {data.categoryBreakdown.map((c, i) => {
                  const pct = expenseMonth ? ((c.total / expenseMonth) * 100).toFixed(1) : '—'
                  return (
                    <tr key={c.categoryId ?? i} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 text-fg">{c.name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-danger">{fmt(c.total, currency)}</td>
                      <td className="px-4 py-3 text-right text-fg-muted">{pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const QUOTE_STATUS_LABELS = {
  draft: 'Borrador', sent: 'Enviado', approved: 'Aprobado',
  signed: 'Firmado', rejected: 'Rechazado', cancelled: 'Cancelado',
}

function QuotesTab({ data, topClients, currency }) {
  if (!data) return <Spinner />

  const summary  = data?.summary          ?? {}
  const byStatus = data?.byStatus         ?? []
  const monthly  = data?.monthly          ?? []
  const reasons  = data?.rejectionReasons ?? []

  const totalCount    = Number(summary.totalQuotes   ?? 0)
  const approvedCount = Number(summary.approvedCount ?? 0)
  const sentCount     = Number(summary.sentCount     ?? 0)
  const rejectedCount = Number(summary.rejectedCount ?? 0)
  const totalValue    = Number(summary.totalValue    ?? 0)
  const approvedValue = Number(summary.approved      ?? 0)
  const sentAmt       = Number(summary.sent          ?? 0)
  const draftAmt      = Number(summary.draft         ?? 0)
  const rejectedAmt   = Number(summary.rejected      ?? 0)
  const totalAmt      = approvedValue + sentAmt + draftAmt + rejectedAmt

  const approvalRate  = (sentCount + approvedCount) > 0
    ? ((approvedCount / (sentCount + approvedCount)) * 100).toFixed(1) : null
  const rejectionRate = totalCount > 0
    ? ((rejectedCount / totalCount) * 100).toFixed(1) : null

  const monthlyWithData = monthly.filter(m => (m.issuedCount || 0) > 0)

  return (
    <div className="flex flex-col gap-8">

      {/* Resumen general */}
      <div>
        <SectionTitle>Resumen general</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiCard icon={DocumentTextIcon} iconBg="bg-brand-subtle" iconColor="text-brand"
            label="Total emitidos" value={`${totalCount} presupuestos`} />
          <KpiCard icon={BanknotesIcon} iconBg="bg-brand-subtle" iconColor="text-brand"
            label="Monto total" value={fmt(totalValue, currency)} />
          <KpiCard icon={ArrowTrendingUpIcon} iconBg="bg-success-subtle" iconColor="text-success"
            label="Tasa de aprobación" value={approvalRate !== null ? `${approvalRate}%` : '—'}
            sub="enviados → aprobados" />
          <KpiCard icon={CheckCircleIcon} iconBg="bg-success-subtle" iconColor="text-success"
            label="Aprobados" value={`${approvedCount} — ${fmt(approvedValue, currency)}`} />
          <KpiCard icon={XCircleIcon} iconBg={rejectedCount > 0 ? 'bg-danger-subtle' : 'bg-raised'}
            iconColor={rejectedCount > 0 ? 'text-danger' : 'text-fg-muted'}
            label="Rechazados" value={`${rejectedCount}${rejectionRate !== null ? ` (${rejectionRate}%)` : ''}`} />
          <KpiCard icon={ClockIcon} iconBg="bg-info-subtle" iconColor="text-info"
            label="Enviados / Pendientes" value={`${sentCount} en espera`} />
        </div>
      </div>

      {/* Distribución por estado */}
      {byStatus.length > 0 && (
        <div>
          <SectionTitle>Distribución por estado</SectionTitle>
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <div className="p-5 border-b border-line">
              <StatusBar total={totalAmt} items={[
                { label: 'Aprobados',  color: 'bg-brand',      value: approvedValue, formatted: fmt(approvedValue, currency) },
                { label: 'Enviados',   color: 'bg-info',        value: sentAmt,       formatted: fmt(sentAmt,       currency) },
                { label: 'Borradores', color: 'bg-fg-muted/40', value: draftAmt,      formatted: fmt(draftAmt,      currency) },
                { label: 'Rechazados', color: 'bg-danger',      value: rejectedAmt,   formatted: fmt(rejectedAmt,   currency) },
              ]} />
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-raised/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Cant.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Monto</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">% total</th>
                </tr>
              </thead>
              <tbody>
                {[...byStatus].sort((a, b) => b.count - a.count).map(s => {
                  const pct = totalCount ? ((s.count / totalCount) * 100).toFixed(1) : '—'
                  return (
                    <tr key={s.status} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 text-fg">{QUOTE_STATUS_LABELS[s.status] ?? s.status}</td>
                      <td className="px-4 py-3 text-right text-fg">{s.count}</td>
                      <td className="px-4 py-3 text-right font-semibold text-brand">{fmt(s.total, currency)}</td>
                      <td className="px-4 py-3 text-right text-fg-muted">{pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Causas de rechazo */}
      {reasons.length > 0 && (
        <div>
          <SectionTitle>Causas de rechazo ({rejectedCount} rechazados)</SectionTitle>
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-raised/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Motivo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Cantidad</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">% rechazados</th>
                </tr>
              </thead>
              <tbody>
                {reasons.map((r, i) => {
                  const pct = rejectedCount ? ((r.count / rejectedCount) * 100).toFixed(1) : '—'
                  return (
                    <tr key={i} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 text-fg">{r.reason}</td>
                      <td className="px-4 py-3 text-right text-fg">{r.count}</td>
                      <td className="px-4 py-3 text-right text-fg-muted">{pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Evolución mensual */}
      {monthlyWithData.length > 0 && (
        <div>
          <SectionTitle>Evolución mensual — últimos 12 meses</SectionTitle>
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <div className="p-5 border-b border-line">
              <div className="flex items-center gap-4 text-xs text-fg-muted mb-4">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand inline-block" />Aprobados</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-fg-muted/40 inline-block" />Emitidos</span>
              </div>
              <MiniBarChart
                data={monthlyWithData.map(m => ({ month: m.key, income: m.approvedCount ?? 0, expense: m.issuedCount ?? 0 }))}
                keyA="income" keyB="expense" colorA="bg-brand/70" colorB="bg-fg-muted/30"
              />
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-raised/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Mes</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Emitidos</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Aprobados</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Rechazados</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">% Aprob.</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map(m => {
                  const issued   = m.issuedCount   || 0
                  const approved = m.approvedCount || 0
                  const rejected = m.rejectedCount || 0
                  const pct      = issued > 0 ? `${((approved / issued) * 100).toFixed(0)}%` : '—'
                  const [y, mo] = m.key.split('-')
                  const label = new Date(parseInt(y), parseInt(mo) - 1, 1)
                    .toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
                  return (
                    <tr key={m.key} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 text-fg capitalize">{label}</td>
                      <td className="px-4 py-3 text-right text-fg">{issued}</td>
                      <td className="px-4 py-3 text-right font-semibold text-brand">{approved}</td>
                      <td className="px-4 py-3 text-right text-danger">{rejected}</td>
                      <td className="px-4 py-3 text-right text-fg-muted">{pct}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Próximos a vencer */}
      {data?.expiringSoon?.length > 0 && (
        <div>
          <SectionTitle>Próximos a vencer (7 días)</SectionTitle>
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-raised/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Título</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Cliente</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Vence</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Monto</th>
                </tr>
              </thead>
              <tbody>
                {data.expiringSoon.map(q => (
                  <tr key={q.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 text-fg-muted font-bold text-xs">#{q.number}</td>
                    <td className="px-4 py-3 text-fg">{q.title || '—'}</td>
                    <td className="px-4 py-3 text-fg-muted">{q.client?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-fg-muted text-xs">
                      {new Date(q.validUntil).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-brand">{fmt(q.total, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top clientes */}
      {topClients?.length > 0 && (
        <div>
          <SectionTitle>Top clientes por volumen aprobado</SectionTitle>
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-raised/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Cliente</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Total aprobado</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((entry, i) => (
                  <tr key={entry.client.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 text-fg-muted font-bold text-xs">#{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-fg">{entry.client.name}</p>
                      {entry.client.company && <p className="text-xs text-fg-muted">{entry.client.company}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-brand">{fmt(entry.total, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectsTab({ data }) {
  if (!data) return <Spinner />

  const byStatus = data?.byStatus ?? []
  const summary  = data?.summary  ?? {}
  const total    = Number(summary.totalProjects ?? 0)

  const STATUS = {
    pending:     { label: 'Pendiente',  color: 'bg-warning' },
    approved:    { label: 'Aprobado',   color: 'bg-info' },
    in_progress: { label: 'En curso',   color: 'bg-brand' },
    finished:    { label: 'Finalizado', color: 'bg-success' },
    cancelled:   { label: 'Cancelado',  color: 'bg-fg-muted' },
  }

  const inProgress = byStatus.find(s => s._id === 'in_progress')?.totalProjects ?? 0
  const finished   = byStatus.find(s => s._id === 'finished')?.totalProjects   ?? 0
  const cancelled  = byStatus.find(s => s._id === 'cancelled')?.totalProjects  ?? 0

  return (
    <div className="flex flex-col gap-8">

      <div>
        <SectionTitle>Resumen general</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={FolderOpenIcon} iconBg="bg-brand-subtle" iconColor="text-brand"
            label="Total proyectos" value={fmtN(total)} />
          <KpiCard icon={ArrowTrendingUpIcon} iconBg="bg-info-subtle" iconColor="text-info"
            label="En curso" value={fmtN(inProgress)} />
          <KpiCard icon={CheckCircleIcon} iconBg="bg-success-subtle" iconColor="text-success"
            label="Finalizados" value={fmtN(finished)} />
          <KpiCard icon={XCircleIcon} iconBg="bg-raised" iconColor="text-fg-muted"
            label="Cancelados" value={fmtN(cancelled)} />
        </div>
      </div>

      <div>
        <SectionTitle>Distribución por estado</SectionTitle>
        <div className="bg-surface border border-line rounded-xl p-5">
          <StatusBar total={total} items={byStatus.map(s => ({
            label: STATUS[s._id]?.label ?? s._id,
            color: STATUS[s._id]?.color ?? 'bg-fg-muted',
            value: s.totalProjects,
          }))} />
        </div>
      </div>

      <div>
        <SectionTitle>Detalle por estado</SectionTitle>
        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-raised/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Cantidad</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">%</th>
              </tr>
            </thead>
            <tbody>
              {byStatus.map(s => {
                const info = STATUS[s._id] ?? { label: s._id, color: 'bg-fg-muted' }
                const pct  = total ? ((s.totalProjects / total) * 100).toFixed(1) : '—'
                return (
                  <tr key={s._id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${info.color}`} />
                        <span className="text-fg">{info.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-fg">{s.totalProjects}</td>
                    <td className="px-4 py-3 text-right text-fg-muted">{pct}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {data?.upcomingProjects?.length > 0 && (
        <div>
          <SectionTitle>Proyectos próximos a vencer</SectionTitle>
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-raised/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Proyecto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Cliente</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {data.upcomingProjects.map(p => (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-fg">{p.title}</td>
                    <td className="px-4 py-3 text-fg-muted">{p.client?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-fg-muted text-xs">
                      {new Date(p.endDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StockTab({ summary, outOfStock, lowStock }) {
  if (!summary) return <Spinner />

  return (
    <div className="flex flex-col gap-8">

      <div>
        <SectionTitle>Resumen del inventario</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiCard icon={CubeIcon} iconBg="bg-brand-subtle" iconColor="text-brand"
            label="Total productos" value={fmtN(summary?.totalProducts)} sub={`${summary?.activeProducts ?? 0} activos`} />
          <KpiCard icon={XCircleIcon} iconBg={summary?.outOfStock > 0 ? 'bg-danger-subtle' : 'bg-raised'}
            iconColor={summary?.outOfStock > 0 ? 'text-danger' : 'text-fg-muted'}
            label="Sin stock" value={fmtN(summary?.outOfStock)} />
          <KpiCard icon={ExclamationTriangleIcon} iconBg={summary?.lowStock > 0 ? 'bg-warning-subtle' : 'bg-raised'}
            iconColor={summary?.lowStock > 0 ? 'text-warning' : 'text-fg-muted'}
            label="Stock bajo" value={fmtN(summary?.lowStock)} />
        </div>
      </div>

      {outOfStock?.length > 0 && (
        <div>
          <SectionTitle>Productos sin stock</SectionTitle>
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-raised/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Categoría</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Stock</th>
                </tr>
              </thead>
              <tbody>
                {outOfStock.map(p => (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-fg-muted">{p.sku}</td>
                    <td className="px-4 py-3 font-medium text-fg">{p.name}</td>
                    <td className="px-4 py-3 text-fg-muted">{p.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-danger">
                      {fmtN(p.stock)} <span className="text-xs font-normal text-fg-muted">{p.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lowStock?.length > 0 && (
        <div>
          <SectionTitle>Productos con stock bajo</SectionTitle>
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-raised/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Producto</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Stock actual</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(p => (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-fg-muted">{p.sku}</td>
                    <td className="px-4 py-3 font-medium text-fg">{p.name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-warning">
                      {fmtN(p.stock)} <span className="text-xs font-normal text-fg-muted">{p.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-fg-muted">
                      {fmtN(p.minStock)} <span className="text-xs">{p.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'finances',  label: 'Finanzas',    icon: BanknotesIcon },
  { key: 'quotes',    label: 'Presupuestos', icon: DocumentTextIcon },
  { key: 'projects',  label: 'Proyectos',   icon: FolderOpenIcon },
  { key: 'stock',     label: 'Stock',       icon: CubeIcon },
]

export default function ReportsPage() {
  const { user } = useAuth()
  const orgId = user?.org

  const now = new Date()
  const [tab,    setTab]    = useState('finances')
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })

  const isCurrentMonth = period.year === now.getFullYear() && period.month === now.getMonth() + 1

  function prevMonth() {
    setPeriod(p => p.month === 1 ? { year: p.year - 1, month: 12 } : { ...p, month: p.month - 1 })
  }
  function nextMonth() {
    setPeriod(p => p.month === 12 ? { year: p.year + 1, month: 1 } : { ...p, month: p.month + 1 })
  }

  // ── org ──
  const { data: orgData } = useQuery({
    queryKey: ['organization', orgId],
    queryFn:  () => getOrganizations().then(r => r.data.data?.find(o => o.id === orgId)),
    enabled:  Boolean(orgId),
    staleTime: 5 * 60 * 1000,
  })
  const currency = orgData?.defaultCurrency ?? 'USD'
  const orgName  = orgData?.name ?? 'CRM'

  // ── finances ──
  const { data: finData, isLoading: finLoading } = useQuery({
    queryKey: ['report-finances', period.year, period.month],
    queryFn:  () => getFinancesDashboard({ year: period.year, month: period.month }).then(r => r.data.data),
  })

  // ── quotes ──
  const { data: quotesData, isLoading: quotesLoading } = useQuery({
    queryKey: ['report-quotes', currency],
    queryFn:  () => getQuotesDashboard(currency).then(r => r.data.data),
  })
  const { data: topClients, isLoading: topClientsLoading } = useQuery({
    queryKey: ['report-top-clients'],
    queryFn:  () => getTopClients().then(r => r.data.data),
  })

  // ── projects ──
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['report-projects'],
    queryFn:  () => getProjectsDashboard().then(r => r.data.data),
  })

  // ── stock ──
  const { data: stockSummary, isLoading: stockLoading } = useQuery({
    queryKey: ['report-stock'],
    queryFn:  () => getStockDashboard().then(r => r.data.data),
  })
  const { data: outOfStockProducts, isLoading: outLoading } = useQuery({
    queryKey: ['report-stock-out'],
    queryFn:  () => getProducts({ outOfStock: 'true', limit: 200 }).then(r => r.data.data?.items ?? []),
  })
  const { data: lowStockProducts, isLoading: lowLoading } = useQuery({
    queryKey: ['report-stock-low'],
    queryFn:  () => getProducts({ lowStock: 'true', limit: 200 }).then(r => r.data.data?.items ?? []),
  })

  const isLoadingAll = finLoading || quotesLoading || topClientsLoading || projectsLoading || stockLoading || outLoading || lowLoading

  // ── PDF ──
  function handleDownload() {
    generateFullReportPDF({
      finData,
      quotesData,
      topClients,
      projectsData,
      stockSummary,
      outOfStock: outOfStockProducts,
      lowStock:   lowStockProducts,
      year:       period.year,
      month:      period.month,
      currency,
      orgName,
      userName:   user?.name ?? 'Administrador',
    })
  }

  const activeTab = TABS.find(t => t.key === tab)

  return (
    <div className="p-4 md:p-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-fg">Reportes</h1>
          <p className="text-sm text-fg-muted mt-0.5 capitalize">
            {activeTab?.label} · {periodLabel(period.year, period.month)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de período (siempre visible — afecta la sección de finanzas) */}
          <div className="flex items-center gap-1 bg-raised border border-line rounded-xl px-1 py-1">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-surface text-fg-muted hover:text-fg transition-colors">
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-fg capitalize px-2 min-w-[130px] text-center">
              {periodLabel(period.year, period.month)}
            </span>
            <button onClick={nextMonth} disabled={isCurrentMonth} className="p-1.5 rounded-lg hover:bg-surface text-fg-muted hover:text-fg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleDownload}
            disabled={isLoadingAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            {isLoadingAll ? 'Preparando…' : 'Reporte Completo'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-raised border border-line rounded-xl p-1 mb-6">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-surface text-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Contenido */}
      {tab === 'finances' && <FinancesTab data={finData}     year={period.year} month={period.month} currency={currency} />}
      {tab === 'quotes'   && <QuotesTab   data={quotesData}  topClients={topClients} currency={currency} />}
      {tab === 'projects' && <ProjectsTab data={projectsData} />}
      {tab === 'stock'    && <StockTab    summary={stockSummary} outOfStock={outOfStockProducts} lowStock={lowStockProducts} />}
    </div>
  )
}
