import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getAdminFinance, getAdminOrganizations } from '../../api/admin'
import {
  C, CIFRAS, TD, TH, PageHeader, Card, Kpi, Row, FilterBar, Select, DateInput, Table, Loading, ErrorBox, Empty, Unavailable, GhostBtn,
  ExportButtons, BarChart, useUrlFilters, fmtMoney, fmtNum, apiError, QUOTE_STATUS,
} from './ui'

/* Finanzas globales. Separa:
   1) Finanzas internas de las empresas (presupuestos, facturas, cuotas, caja), siempre por moneda.
   2) Ingresos propios de DanteUP como plataforma (hoy sin modelo: se informa como no disponible). */

export default function AdminFinance() {
  const [f, set] = useUrlFilters({})
  const params = { orgId: f.orgId, from: f.from, to: f.to }
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-finance', params], queryFn: () => getAdminFinance(params), placeholderData: keepPreviousData,
  })
  const { data: orgs } = useQuery({ queryKey: ['admin-orgs-options'], queryFn: () => getAdminOrganizations({ pageSize: 100, sort: 'name', order: 'asc' }), staleTime: 300_000 })
  const [cur, setCur] = useState(null)

  const header = (
    <>
      <PageHeader title="Finanzas globales" subtitle="Finanzas internas de las empresas que usan el CRM, consolidadas por moneda"
        actions={<ExportButtons dataset="finance" params={params} />} />
      <FilterBar>
        <Select value={f.orgId || ''} onChange={orgId => set({ orgId })} style={{ maxWidth: 240 }} options={[['', 'Todas las empresas'], ...(orgs?.items || []).map(o => [o.id, o.name])]} />
        <DateInput value={f.from || ''} onChange={from => set({ from })} title="Desde" />
        <DateInput value={f.to || ''} onChange={to => set({ to })} title="Hasta" />
        {(f.orgId || f.from || f.to) && <GhostBtn onClick={() => set({ orgId: '', from: '', to: '' })}>Limpiar</GhostBtn>}
      </FilterBar>
    </>
  )
  if (isLoading) return <>{header}<Loading /></>
  if (error) return <>{header}<ErrorBox error={apiError(error)} onRetry={refetch} /></>

  const t = data.tenantFinance
  const currencies = [...new Set([...Object.keys(t.quotes), ...Object.keys(t.invoices), ...t.cash.map(c => c.currency), ...t.installments.map(c => c.currency)])].sort()
  const currency = cur && currencies.includes(cur) ? cur : currencies[0]
  const q = t.quotes[currency] || {}
  const inv = t.invoices[currency] || {}
  const cash = t.cash.find(c => c.currency === currency) || {}
  const inst = t.installments.find(c => c.currency === currency) || {}
  const periodLabel = f.from || f.to ? 'en el período' : 'histórico'
  const linkParams = new URLSearchParams(Object.fromEntries(Object.entries({ orgId: f.orgId, from: f.from, to: f.to }).filter(([, v]) => v))).toString()

  return (
    <div style={{ opacity: isFetching ? 0.7 : 1 }}>
      {header}

      {!currencies.length ? <Empty text="No hay movimientos financieros con estos filtros." /> : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: C.arena }}>Moneda:</span>
            {currencies.map(c => (
              <button key={c} onClick={() => setCur(c)}
                style={{ height: 28, padding: '0 12px', border: `1px solid ${C.linea}`, borderRadius: '0 7px 7px 0', background: c === currency ? C.s3 : 'transparent', color: c === currency ? C.crema : C.piedra, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{c}</button>
            ))}
            <span style={{ fontSize: 11, color: C.piedra }}>Las monedas no se suman entre sí.</span>
          </div>

          <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, margin: '6px 0 8px' }}>Finanzas internas de las empresas · {currency}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3" style={{ marginBottom: 16 }}>
            <Kpi label="Total presupuestado" value={fmtMoney(q.total, currency)} sub={`${fmtNum(q.count || 0)} presupuestos emitidos (${periodLabel}) · no es dinero cobrado`} />
            <Kpi label="Presupuestos aprobados" value={fmtMoney(q.approved, currency)} color={C.ok} sub={`${fmtNum(q.approvedCount || 0)} aprobados o firmados`} />
            <Kpi label="Presupuestos pendientes" value={fmtMoney(q.pending, currency)} color={C.info} sub={`${fmtNum(q.pendingCount || 0)} enviados sin respuesta`} />
            <Kpi label="Facturación emitida" value={fmtMoney(inv.issued, currency)} sub={inv.issuedCount ? `${fmtNum(inv.issuedCount)} facturas` : 'El módulo de facturas no tiene registros'} />
            <Kpi label="Cobrado (caja confirmada)" value={fmtMoney(cash.collected, currency)} color={C.ok} sub={`Ingresos confirmados ${periodLabel} · cuotas pagadas: ${fmtMoney(inst.paid, currency)}`} />
            <Kpi label="Pagos pendientes" value={fmtMoney((inst.pending || 0) + (cash.pendingIncome || 0), currency)} color={C.warn}
              sub={`Cuotas ${fmtMoney(inst.pending, currency)} (${inst.pendingCount || 0}) · caja ${fmtMoney(cash.pendingIncome, currency)} (${cash.pendingIncomeCount || 0})`} />
            <Kpi label="Deuda vencida" value={fmtMoney((inst.overdue || 0) + (cash.overdueIncome || 0) + (inv.overdue || 0), currency)} color={C.err}
              sub={`Cuotas vencidas ${fmtMoney(inst.overdue, currency)} (${inst.overdueCount || 0}) · cobros de caja vencidos ${fmtMoney(cash.overdueIncome, currency)}`} />
            <Kpi label="Egresos (caja confirmada)" value={fmtMoney(cash.spent, currency)} sub={`Pagos confirmados ${periodLabel}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
            <Card title={`Evolución mensual de caja · ${currency} (12 meses)`}>
              <BarChart unit="month" data={t.monthly.cash[currency] || []} format={v => fmtMoney(v, currency)}
                series={[{ key: 'income', label: 'Cobrado', color: C.ok }, { key: 'expense', label: 'Pagado', color: C.err }]} />
            </Card>
            <Card title={`Evolución mensual de presupuestos · ${currency} (12 meses)`}>
              <BarChart unit="month" data={t.monthly.quotes[currency] || []} format={v => fmtMoney(v, currency)}
                series={[{ key: 'approved', label: 'Aprobados', color: C.crema }, { key: 'pending', label: 'Enviados pendientes', color: C.info }]} />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ marginBottom: 16 }}>
            <Card title="Presupuestos por estado">
              {Object.entries(QUOTE_STATUS).map(([k, label], i, arr) => (
                <Row key={k} label={`${label} (${fmtNum(q.byStatus?.[k]?.count || 0)})`} value={fmtMoney(q.byStatus?.[k]?.total || 0, currency)} last={i === arr.length - 1} />
              ))}
            </Card>
            <Card title="Consultar registros">
              {[
                ['Movimientos de caja', 'CashMovement'], ['Cuotas (pagos)', 'Installment'], ['Facturas', 'Invoice'],
                ['Presupuestos', 'Quote'], ['Membresías de clientes', 'ClientMembership'], ['Gastos', 'Expense'],
              ].map(([label, ent], i, arr) => (
                <Link key={ent} to={`/admin/explorer?entity=${ent}${linkParams ? '&' + linkParams : ''}`} style={{ textDecoration: 'none' }}>
                  <Row label={label} value="Abrir →" last={i === arr.length - 1} />
                </Link>
              ))}
            </Card>
            <Card title="Ingresos propios de la plataforma">
              <Unavailable>{data.platformRevenue.reason}</Unavailable>
            </Card>
          </div>

          <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, margin: '6px 0 8px' }}>Distribución por empresa · {currency}</p>
          {(() => {
            const rows = t.byOrganization.filter(r => r.currency === currency)
            return rows.length ? (
              <Table minWidth={760}>
                <thead><tr>{['Empresa', 'Aprobado', 'Pendiente (presup.)', 'Cobrado', 'Pagado', 'A cobrar (caja)', ''].map(h => <th key={h} style={{ ...TH, textAlign: h === 'Empresa' || !h ? 'left' : 'right' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.organizationId}>
                      <td style={TD}>{r.organizationName}</td>
                      {['approved', 'quotePending', 'collected', 'spent', 'pendingIncome'].map(k => (
                        <td key={k} style={{ ...TD, textAlign: 'right', fontFamily: CIFRAS }}>{fmtMoney(r[k], currency)}</td>
                      ))}
                      <td style={{ ...TD, textAlign: 'right' }}><button onClick={() => set({ orgId: r.organizationId })} style={{ background: C.linea, color: C.crema, fontSize: 11.5, border: 'none', borderRadius: '0 7px 7px 0', padding: '4px 10px', cursor: 'pointer' }}>Filtrar</button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : <Unavailable>Sin datos para esta moneda.</Unavailable>
          })()}

          <div style={{ marginTop: 16 }}>
            {data.notes.map(n => <p key={n} style={{ fontSize: 11, color: C.piedra, margin: '0 0 3px' }}>· {n}</p>)}
          </div>
        </>
      )}
    </div>
  )
}
