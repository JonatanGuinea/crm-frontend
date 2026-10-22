import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getFinancesDashboard } from '../../api/finances'
import { getQuotesDashboard } from '../../api/quotes'
import { getProjectsDashboard } from '../../api/projects'
import { getStockDashboard, getProducts } from '../../api/stock'
import { getTopClients } from '../../api/clients'
import { getOrganizations } from '../../api/organizations'
import { useAuth } from '../../context/AuthContext'
import { ReporteIcon, CobroIcon, RecorridoIcon, RecorridoDownIcon, PresupuestoIcon, CarpetaIcon, StockIcon } from '../../components/DuIcons'
import { fmt } from '../../utils/fmt'
import { generateFullReportPDF } from '../../utils/generateReport'

const C      = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }
const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"


function WarnSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
}
function XCircleSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
}
function CheckCircleSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
}
function ClockSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
}
function ChevronLeftSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
}
function ChevronRightSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
}
function DownloadSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
}

// ── helpers ───────────────────────────────────────────────────────────────────

const fmtN = (n) => Number(n ?? 0).toLocaleString('es-AR')

function periodLabel(year, month) {
  return new Date(year, month - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}
function shortPeriodLabel(year, month) {
  return new Date(year, month - 1, 1)
    .toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
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

// ── chart ─────────────────────────────────────────────────────────────────────

function IncomeExpensesBars({ months, currency }) {
  const [hovered, setHovered] = useState(null)
  const [tapped,  setTapped]  = useState(null)
  const ptrType = useRef('mouse')
  const max   = Math.max(...months.map(m => Math.max(Number(m.income ?? 0), Number(m.expense ?? 0))), 1)
  const total = months.length

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
        const label      = new Date(...m.month.split('-').map((v, j) => j === 1 ? parseInt(v) - 1 : parseInt(v)))
          .toLocaleDateString('es-AR', { month: 'short' })

        const isFirst = i === 0
        const isLast  = i === total - 1
        const tipAlign = isFirst
          ? { left: 0, transform: 'none' }
          : isLast
          ? { right: 0, left: 'auto', transform: 'none' }
          : { left: '50%', transform: 'translateX(-50%)' }

        return (
          <div key={m.month}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative', cursor: 'pointer' }}
            onPointerDown={e => { ptrType.current = e.pointerType }}
            onMouseEnter={() => setHovered(m.month)}
            onMouseLeave={() => setHovered(null)}
            onClick={e => {
              if (ptrType.current === 'mouse') return
              e.stopPropagation()
              setTapped(prev => prev === m.month ? null : m.month)
            }}>

            {isActive && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 10px)', ...tipAlign, width: 200, background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 14px 14px 0', padding: '14px 16px', boxShadow: '0 16px 40px rgba(0,0,0,.65)', zIndex: 20, pointerEvents: 'none' }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: C.piedra, marginBottom: 12 }}>{label}</p>
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
                      <span style={{ fontSize: 13, fontWeight: 600, color: row.color, fontFamily: CIFRAS, textAlign: 'right' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.linea}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: C.piedra }}>Balance</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: balance >= 0 ? C.ok : C.err, fontFamily: CIFRAS }}>
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

// ── sub-components ────────────────────────────────────────────────────────────

function KpiCard({ Icon, iconBg, iconColor, label, value, sub, loading = false }) {
  return (
    <div style={{
      background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0',
      padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ padding: 7, borderRadius: '0 7px 7px 0', background: iconBg, flexShrink: 0 }}>
          <Icon style={{ width: 14, height: 14, color: iconColor, display: 'block' }} />
        </div>
        <p style={{ fontSize: 10, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0, lineHeight: 1.4 }}>{label}</p>
      </div>
      {loading
        ? <div className="du-skeleton" style={{ height: 22, width: '65%' }} />
        : <p style={{ fontSize: 15, fontWeight: 500, color: C.crema, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{value}</p>
      }
      {loading
        ? <div className="du-skeleton" style={{ height: 9, width: '45%', opacity: 0.6 }} />
        : sub && <p style={{ fontSize: 11, color: C.piedra, margin: 0 }}>{sub}</p>
      }
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${C.linea}`, paddingBottom: 8, marginBottom: 12, marginTop: 0 }}>
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
              <div className="flex-1 rounded-t-sm" style={{ height: `${pctA}%`, background: colorA }} />
              <div className="flex-1 rounded-t-sm" style={{ height: `${pctB}%`, background: colorB }} />
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
            ? <div key={color} style={{ width: `${pct}%`, background: color }} className="transition-all" />
            : null
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {items.map(({ label, color, value, formatted }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-fg-muted">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
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

function FinancesTab({ data, year, month, currency, loading = false }) {
  if (!data && !loading) return <Spinner />

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
          <KpiCard loading={loading} Icon={CobroIcon} iconBg={C.s2} iconColor={C.piedra}
            label="Saldo inicial (estimado)" value={fmt(estimatedInitial, currency)} />
          <KpiCard loading={loading} Icon={CobroIcon} iconBg="rgba(242,237,227,0.08)" iconColor={C.crema}
            label="Saldo final en caja" value={fmt(totalBalance, currency)} />
          <KpiCard loading={loading} Icon={CobroIcon}
            iconBg={netMonth >= 0 ? 'rgba(125,190,147,0.12)' : 'rgba(229,131,115,0.12)'}
            iconColor={netMonth >= 0 ? C.ok : C.err}
            label="Resultado del mes" value={fmt(netMonth, currency)} />
          <KpiCard loading={loading} Icon={RecorridoIcon} iconBg="rgba(125,190,147,0.12)" iconColor={C.ok}
            label="Ingresos confirmados" value={fmt(incomeMonth, currency)} />
          <KpiCard loading={loading} Icon={RecorridoDownIcon} iconBg="rgba(229,131,115,0.12)" iconColor={C.err}
            label="Egresos confirmados" value={fmt(expenseMonth, currency)} />
          <KpiCard loading={loading} Icon={RecorridoIcon} iconBg="rgba(242,237,227,0.08)" iconColor={C.crema}
            label="Margen operativo" value={operatingMargin !== null ? `${operatingMargin}%` : '—'} />
          <KpiCard loading={loading} Icon={CobroIcon} iconBg="rgba(142,177,222,0.12)" iconColor={C.info}
            label="Ratio de cobertura" value={coverageRatio !== null ? `${coverageRatio}x` : '—'} />
          <KpiCard loading={loading} Icon={ClockSvg} iconBg={C.s2} iconColor={C.piedra}
            label="Movimientos del mes" value={`${incomeCount + expenseCount} ops`} />
          <KpiCard loading={loading} Icon={RecorridoDownIcon} iconBg="rgba(226,182,99,0.12)" iconColor={C.warn}
            label="Categoría con mayor gasto" value={topCategory} />
        </div>
      </div>

      {/* Liquidez y proyecciones */}
      <div>
        <SectionTitle>Liquidez y proyecciones</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiCard loading={loading} Icon={RecorridoIcon} iconBg="rgba(125,190,147,0.12)" iconColor={C.ok}
            label="A cobrar (pendiente)" value={fmt(pendingIncome, currency)} />
          <KpiCard loading={loading} Icon={RecorridoDownIcon} iconBg="rgba(229,131,115,0.12)" iconColor={C.err}
            label="A pagar (pendiente)" value={fmt(pendingExpense, currency)} />
          <KpiCard loading={loading} Icon={CobroIcon}
            iconBg={resultadoPendiente >= 0 ? 'rgba(125,190,147,0.12)' : 'rgba(229,131,115,0.12)'}
            iconColor={resultadoPendiente >= 0 ? C.ok : C.err}
            label="Resultado pendiente" value={fmt(resultadoPendiente, currency)} />
          <KpiCard loading={loading} Icon={CobroIcon} iconBg="rgba(242,237,227,0.08)" iconColor={C.crema}
            label="Saldo proyectado" value={fmt(saldoProyectado, currency)} />
          <KpiCard loading={loading} Icon={ClockSvg} iconBg="rgba(142,177,222,0.12)" iconColor={C.info}
            label="Cash runway" value={cashRunway !== null ? `${cashRunway} meses` : '∞'} />
          <KpiCard loading={loading} Icon={RecorridoIcon} iconBg="rgba(242,237,227,0.08)" iconColor={C.crema}
            label="Eficiencia de cobro" value={`${eficienciaCobro}%`} />
        </div>
      </div>

      {/* Indicadores del mes */}
      <div>
        <SectionTitle>Indicadores del mes</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiCard loading={loading} Icon={RecorridoIcon} iconBg="rgba(125,190,147,0.12)" iconColor={C.ok}
            label="Ingresos — cantidad" value={`${incomeCount} movimientos`} />
          <KpiCard loading={loading} Icon={RecorridoDownIcon} iconBg="rgba(229,131,115,0.12)" iconColor={C.err}
            label="Egresos — cantidad" value={`${expenseCount} movimientos`} />
          <KpiCard loading={loading} Icon={CobroIcon} iconBg={C.s2} iconColor={C.piedra}
            label="Ticket promedio ingreso" value={fmt(ticketIngreso, currency)} />
          <KpiCard loading={loading} Icon={CobroIcon} iconBg={C.s2} iconColor={C.piedra}
            label="Ticket promedio egreso" value={fmt(ticketEgreso, currency)} />
          <KpiCard loading={loading} Icon={RecorridoIcon} iconBg="rgba(125,190,147,0.12)" iconColor={C.ok}
            label="Mayor ingreso del mes" value={fmt(mayorIngreso, currency)} />
          <KpiCard loading={loading} Icon={RecorridoDownIcon} iconBg="rgba(229,131,115,0.12)" iconColor={C.err}
            label="Mayor egreso del mes" value={fmt(mayorEgreso, currency)} />
        </div>
      </div>

      {/* Evolución mensual */}
      <div>
        <SectionTitle>Evolución últimos 6 meses</SectionTitle>

        {/* Chart card */}
        <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', padding: 16, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, fontSize: 11, color: C.piedra }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.crema }} />Ingresos
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.arena }} />Egresos
            </span>
          </div>

          <IncomeExpensesBars months={evolution} currency={currency} />

          <div style={{ paddingTop: 14, borderTop: `1px solid ${C.linea}`, marginTop: 4, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { label: 'Ingresos', value: fmt(totalEvo.income, currency),  color: C.crema },
              { label: 'Egresos',  value: fmt(totalEvo.expense, currency), color: C.arena },
              { label: 'Balance',  value: `${totalEvo.income - totalEvo.expense >= 0 ? '+' : ''}${fmt(totalEvo.income - totalEvo.expense, currency)}`, color: totalEvo.income - totalEvo.expense >= 0 ? C.ok : C.err },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p style={{ fontSize: 10, color: C.piedra, marginBottom: 3 }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color, fontFamily: CIFRAS }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detail table */}
        <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.linea}`, background: C.s3 }}>
                {['Mes', 'Ingresos', 'Egresos', 'Neto', 'Var. MoM'].map((h, i) => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evolution.map((m, i) => {
                const neto   = m.income - m.expense
                const prev   = i > 0 ? evolution[i - 1] : null
                const momPct = prev && prev.income > 0
                  ? ((m.income - prev.income) / prev.income) * 100 : null
                const [y, mo] = m.month.split('-')
                const label = new Date(parseInt(y), parseInt(mo) - 1, 1)
                  .toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
                return (
                  <tr key={m.month} style={{ borderBottom: `1px solid ${C.linea}` }}>
                    <td style={{ padding: '10px 16px', color: C.crema, textTransform: 'capitalize' }}>{label}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: C.crema }}>{fmt(m.income, currency)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: C.arena }}>{fmt(m.expense, currency)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: neto >= 0 ? C.ok : C.err }}>{fmt(neto, currency)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12 }}>
                      {momPct === null
                        ? <span style={{ color: C.piedra }}>—</span>
                        : <span style={{ color: momPct >= 0 ? C.ok : C.err }}>{momPct >= 0 ? '+' : ''}{momPct.toFixed(1)}%</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.s3, borderTop: `1px solid ${C.linea}` }}>
                <td style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase' }}>Total período</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: C.crema }}>{fmt(totalEvo.income, currency)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: C.arena }}>{fmt(totalEvo.expense, currency)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: totalEvo.income - totalEvo.expense >= 0 ? C.ok : C.err }}>
                  {fmt(totalEvo.income - totalEvo.expense, currency)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Egresos por categoría */}
      {data?.categoryBreakdown?.length > 0 && (
        <div>
          <SectionTitle>Egresos por categoría — {periodLabel(year, month)}</SectionTitle>
          <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'hidden', overflowX: 'auto' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.linea}`, background: C.s3 }}>
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
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: C.err }}>{fmt(c.total, currency)}</td>
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
          <KpiCard Icon={PresupuestoIcon} iconBg="rgba(242,237,227,0.08)" iconColor={C.crema}
            label="Total emitidos" value={`${totalCount} presupuestos`} />
          <KpiCard Icon={CobroIcon} iconBg="rgba(242,237,227,0.08)" iconColor={C.crema}
            label="Monto total" value={fmt(totalValue, currency)} />
          <KpiCard Icon={RecorridoIcon} iconBg="rgba(125,190,147,0.12)" iconColor={C.ok}
            label="Tasa de aprobación" value={approvalRate !== null ? `${approvalRate}%` : '—'}
            sub="enviados → aprobados" />
          <KpiCard Icon={CheckCircleSvg} iconBg="rgba(125,190,147,0.12)" iconColor={C.ok}
            label="Aprobados" value={`${approvedCount} — ${fmt(approvedValue, currency)}`} />
          <KpiCard Icon={XCircleSvg}
            iconBg={rejectedCount > 0 ? 'rgba(229,131,115,0.12)' : C.s2}
            iconColor={rejectedCount > 0 ? C.err : C.piedra}
            label="Rechazados" value={`${rejectedCount}${rejectionRate !== null ? ` (${rejectionRate}%)` : ''}`} />
          <KpiCard Icon={ClockSvg} iconBg="rgba(142,177,222,0.12)" iconColor={C.info}
            label="Enviados / Pendientes" value={`${sentCount} en espera`} />
        </div>
      </div>

      {/* Distribución por estado */}
      {byStatus.length > 0 && (
        <div>
          <SectionTitle>Distribución por estado</SectionTitle>
          <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'clip' }}>
            <div style={{ padding: 20, borderBottom: `1px solid ${C.linea}` }}>
              <StatusBar total={totalAmt} items={[
                { label: 'Aprobados',  color: C.crema,  value: approvedValue, formatted: fmt(approvedValue, currency) },
                { label: 'Enviados',   color: C.info,   value: sentAmt,       formatted: fmt(sentAmt,       currency) },
                { label: 'Borradores', color: C.piedra, value: draftAmt,      formatted: fmt(draftAmt,      currency) },
                { label: 'Rechazados', color: C.err,    value: rejectedAmt,   formatted: fmt(rejectedAmt,   currency) },
              ]} />
            </div>
            <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-sm" style={{ minWidth: 400 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.linea}`, background: C.s3 }}>
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
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: C.crema }}>{fmt(s.total, currency)}</td>
                      <td className="px-4 py-3 text-right text-fg-muted">{pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Causas de rechazo */}
      {reasons.length > 0 && (
        <div>
          <SectionTitle>Causas de rechazo ({rejectedCount} rechazados)</SectionTitle>
          <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'hidden', overflowX: 'auto' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.linea}`, background: C.s3 }}>
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
          <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'clip' }}>
            <div style={{ padding: 16, borderBottom: `1px solid ${C.linea}` }}>
              <div className="flex items-center gap-4 text-xs text-fg-muted mb-4">
                <span className="flex items-center gap-1">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.crema, display: 'inline-block' }} />Aprobados
                </span>
                <span className="flex items-center gap-1">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.piedra, display: 'inline-block' }} />Emitidos
                </span>
              </div>
              <MiniBarChart
                data={monthlyWithData.map(m => ({ month: m.key, income: m.approvedCount ?? 0, expense: m.issuedCount ?? 0 }))}
                keyA="income" keyB="expense"
                colorA="rgba(242,237,227,0.7)" colorB="rgba(140,135,126,0.3)"
              />
            </div>
            <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-sm" style={{ minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.linea}`, background: C.s3 }}>
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
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: C.crema }}>{approved}</td>
                      <td className="px-4 py-3 text-right" style={{ color: C.err }}>{rejected}</td>
                      <td className="px-4 py-3 text-right text-fg-muted">{pct}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Próximos a vencer */}
      {data?.expiringSoon?.length > 0 && (
        <div>
          <SectionTitle>Próximos a vencer (7 días)</SectionTitle>
          <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'hidden', overflowX: 'auto' }}>
            <table className="w-full text-sm" style={{ minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.linea}`, background: C.s3 }}>
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
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: C.crema }}>{fmt(q.total, currency)}</td>
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
          <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'hidden', overflowX: 'auto' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.linea}`, background: C.s3 }}>
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
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: C.crema }}>{fmt(entry.total, currency)}</td>
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
    pending:     { label: 'Pendiente',  color: C.warn },
    approved:    { label: 'Aprobado',   color: C.info },
    in_progress: { label: 'En curso',   color: C.crema },
    finished:    { label: 'Finalizado', color: C.ok },
    cancelled:   { label: 'Cancelado',  color: C.piedra },
  }

  const inProgress = byStatus.find(s => s._id === 'in_progress')?.totalProjects ?? 0
  const finished   = byStatus.find(s => s._id === 'finished')?.totalProjects   ?? 0
  const cancelled  = byStatus.find(s => s._id === 'cancelled')?.totalProjects  ?? 0

  return (
    <div className="flex flex-col gap-8">

      <div>
        <SectionTitle>Resumen general</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard Icon={CarpetaIcon} iconBg="rgba(242,237,227,0.08)" iconColor={C.crema}
            label="Total proyectos" value={fmtN(total)} />
          <KpiCard Icon={RecorridoIcon} iconBg="rgba(142,177,222,0.12)" iconColor={C.info}
            label="En curso" value={fmtN(inProgress)} />
          <KpiCard Icon={CheckCircleSvg} iconBg="rgba(125,190,147,0.12)" iconColor={C.ok}
            label="Finalizados" value={fmtN(finished)} />
          <KpiCard Icon={XCircleSvg} iconBg={C.s2} iconColor={C.piedra}
            label="Cancelados" value={fmtN(cancelled)} />
        </div>
      </div>

      <div>
        <SectionTitle>Distribución por estado</SectionTitle>
        <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', padding: 20 }}>
          <StatusBar total={total} items={byStatus.map(s => ({
            label: STATUS[s._id]?.label ?? s._id,
            color: STATUS[s._id]?.color ?? C.piedra,
            value: s.totalProjects,
          }))} />
        </div>
      </div>

      <div>
        <SectionTitle>Detalle por estado</SectionTitle>
        <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'hidden', overflowX: 'auto' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.linea}`, background: C.s3 }}>
                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Cantidad</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">%</th>
              </tr>
            </thead>
            <tbody>
              {byStatus.map(s => {
                const info = STATUS[s._id] ?? { label: s._id, color: C.piedra }
                const pct  = total ? ((s.totalProjects / total) * 100).toFixed(1) : '—'
                return (
                  <tr key={s._id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: info.color, display: 'inline-block', flexShrink: 0 }} />
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
          <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'hidden', overflowX: 'auto' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.linea}`, background: C.s3 }}>
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
                      {new Date(p.endDate.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard Icon={StockIcon} iconBg="rgba(242,237,227,0.08)" iconColor={C.crema}
            label="Total productos" value={fmtN(summary?.totalProducts)} sub={`${summary?.activeProducts ?? 0} activos`} />
          <KpiCard Icon={XCircleSvg}
            iconBg={summary?.outOfStock > 0 ? 'rgba(229,131,115,0.12)' : C.s2}
            iconColor={summary?.outOfStock > 0 ? C.err : C.piedra}
            label="Sin stock" value={fmtN(summary?.outOfStock)} />
          <KpiCard Icon={WarnSvg}
            iconBg={summary?.lowStock > 0 ? 'rgba(226,182,99,0.12)' : C.s2}
            iconColor={summary?.lowStock > 0 ? C.warn : C.piedra}
            label="Stock bajo" value={fmtN(summary?.lowStock)} />
          <KpiCard Icon={StockIcon} iconBg={C.s2} iconColor={C.piedra}
            label="Valor total" value={`$${Number(summary?.totalInventoryValue ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} sub="stock × costo" />
        </div>
      </div>

      {(summary?.productsByType || summary?.valueByType) && (
        <div>
          <SectionTitle>Por tipo de inventario</SectionTitle>
          <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'hidden', overflowX: 'auto' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.linea}`, background: C.s3 }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Tipo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Productos activos</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Valor en stock</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'sale',         label: 'Para venta',    color: C.crema },
                  { key: 'internal',     label: 'Interno',       color: C.warn },
                  { key: 'raw_material', label: 'Materia prima', color: C.ok },
                ].map(row => (
                  <tr key={row.key} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <span style={{ fontSize: 14, fontWeight: 500, color: row.color }}>{row.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-fg">
                      {fmtN(summary?.productsByType?.[row.key] ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-fg">
                      ${Number(summary?.valueByType?.[row.key] ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {outOfStock?.length > 0 && (
        <div>
          <SectionTitle>Productos sin stock</SectionTitle>
          <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'hidden', overflowX: 'auto' }}>
            <table className="w-full text-sm" style={{ minWidth: 440 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.linea}`, background: C.s3 }}>
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
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: C.err }}>
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
          <div style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'hidden', overflowX: 'auto' }}>
            <table className="w-full text-sm" style={{ minWidth: 440 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.linea}`, background: C.s3 }}>
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
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: C.warn }}>
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
  { key: 'finances',  label: 'Finanzas',     icon: CobroIcon },
  { key: 'quotes',    label: 'Presupuestos',  icon: PresupuestoIcon },
  { key: 'projects',  label: 'Proyectos',     icon: CarpetaIcon },
  { key: 'stock',     label: 'Stock',         icon: StockIcon },
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
    <div style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-4 md:px-6 md:pt-7" style={{ borderBottom: `1px solid ${C.linea}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ReporteIcon style={{ width: 18, height: 18, color: C.arena }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema, margin: 0 }}>Reportes</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Selector de período */}
          <div style={{ display: 'flex', alignItems: 'center', height: 34, background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', padding: '0 4px' }}>
            <button onClick={prevMonth}
              style={{ padding: 6, borderRadius: '0 5px 5px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = C.crema}
              onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
              <ChevronLeftSvg style={{ width: 14, height: 14 }} />
            </button>
            <span className="sm:hidden" style={{ fontSize: 13, fontWeight: 500, color: C.crema, textTransform: 'capitalize', padding: '0 6px', minWidth: 56, textAlign: 'center' }}>
              {shortPeriodLabel(period.year, period.month)}
            </span>
            <span className="hidden sm:inline" style={{ fontSize: 13, fontWeight: 500, color: C.crema, textTransform: 'capitalize', padding: '0 6px', minWidth: 115, textAlign: 'center' }}>
              {periodLabel(period.year, period.month)}
            </span>
            <button onClick={nextMonth} disabled={isCurrentMonth}
              style={{ padding: 6, borderRadius: '0 5px 5px 0', background: 'none', border: 'none', cursor: isCurrentMonth ? 'not-allowed' : 'pointer', color: C.piedra, display: 'flex', opacity: isCurrentMonth ? 0.3 : 1 }}
              onMouseEnter={e => { if (!isCurrentMonth) e.currentTarget.style.color = C.crema }}
              onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
              <ChevronRightSvg style={{ width: 14, height: 14 }} />
            </button>
          </div>

          <button onClick={handleDownload} disabled={isLoadingAll}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: '0 9px 9px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, cursor: isLoadingAll ? 'not-allowed' : 'pointer', opacity: isLoadingAll ? 0.5 : 1 }}>
            <DownloadSvg style={{ width: 14, height: 14 }} />
            <span className="hidden sm:inline">{isLoadingAll ? 'Preparando…' : 'Reporte Completo'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-6" style={{ paddingTop: 14, display: 'flex', gap: 4, borderBottom: `1px solid ${C.linea}`, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {TABS.map(t => {
          const isActive = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: '7px 16px', flexShrink: 0, borderRadius: '0 8px 0 0', fontSize: 13, fontWeight: 500, background: isActive ? C.s2 : 'transparent', color: isActive ? C.crema : C.piedra, borderTop: isActive ? `1px solid ${C.linea}` : '1px solid transparent', borderLeft: isActive ? `1px solid ${C.linea}` : '1px solid transparent', borderRight: isActive ? `1px solid ${C.linea}` : '1px solid transparent', borderBottom: 'none', cursor: 'pointer', transition: 'color 0.15s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = C.crema }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = C.piedra }}>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Contenido */}
      <div className="px-4 pt-6 pb-10 md:px-6">
        {tab === 'finances' && <FinancesTab data={finData} loading={finLoading} year={period.year} month={period.month} currency={currency} />}
        {tab === 'quotes'   && <QuotesTab   data={quotesData}  topClients={topClients} currency={currency} />}
        {tab === 'projects' && <ProjectsTab data={projectsData} />}
        {tab === 'stock'    && <StockTab    summary={stockSummary} outOfStock={outOfStockProducts} lowStock={lowStockProducts} />}
      </div>
    </div>
  )
}
