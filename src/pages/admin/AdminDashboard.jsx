import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAdminDashboard } from '../../api/admin'
import {
  C, CIFRAS, PageHeader, Card, Kpi, Row, Badge, StyleBadge, Loading, ErrorBox, Select, BarChart, Distribution, ActivityList,
  PLAN_STYLE, ORG_STATUS_STYLE, PROJECT_STATUS, fmtNum, fmtMoney, fmtDate, fmtAgo, fmtDuration, fmtBytes, apiError, GhostBtn, CapacityBar,
} from './ui'

const PERIODS = [['30d', 'Últimos 30 días'], ['90d', 'Últimos 90 días'], ['12m', 'Últimos 12 meses']]
const ALERT_COLOR = { err: C.err, warn: C.warn, info: C.info }

const moneyList = (obj, empty = '—') => {
  const entries = Object.entries(obj || {}).filter(([, v]) => v)
  return entries.length ? entries.map(([cur, v]) => fmtMoney(v, cur)).join(' · ') : empty
}
const pendingList = arr => (arr?.length ? arr.map(x => fmtMoney(x.total, x.currency)).join(' · ') : '—')

export default function AdminDashboard() {
  const [period, setPeriod] = useState('30d')
  const [cur, setCur] = useState(null)
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-dashboard', period],
    queryFn: () => getAdminDashboard(period),
    staleTime: 60_000,
  })

  if (isLoading) return <><PageHeader title="Dashboard" /><Loading text="Calculando indicadores…" /></>
  if (error) return <><PageHeader title="Dashboard" /><ErrorBox error={apiError(error)} onRetry={refetch} /></>

  const { kpis, charts, latest, alerts, platform, unit } = data
  const currencies = Object.keys(charts.cash)
  const currency = cur && currencies.includes(cur) ? cur : currencies[0]
  const pendCount = (kpis.pendingPayments.installments.reduce((a, x) => a + x.count, 0)) + (kpis.pendingPayments.cash.reduce((a, x) => a + x.count, 0))

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Datos reales de toda la plataforma · actualizado ${fmtAgo(data.generatedAt)}`}
        actions={<>
          <Select value={period} onChange={setPeriod} options={PERIODS} />
          <GhostBtn onClick={() => refetch()} disabled={isFetching}>{isFetching ? 'Actualizando…' : 'Actualizar'}</GhostBtn>
        </>}
      />

      {/* Alertas */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
          {alerts.map((a, i) => (
            <Link key={i} to={a.to} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: C.s1, border: `1px solid ${C.linea}`, borderLeft: `3px solid ${ALERT_COLOR[a.level]}`, borderRadius: '0 10px 10px 0', textDecoration: 'none', fontSize: 13, color: C.crema }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: ALERT_COLOR[a.level], flexShrink: 0 }} />
              {a.text}
              <span style={{ marginLeft: 'auto', color: C.piedra, fontSize: 12 }}>Ver →</span>
            </Link>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3" style={{ marginBottom: 20 }}>
        <Kpi label="Empresas" value={fmtNum(kpis.organizations.total)} to="/admin/organizations"
          sub={`${kpis.organizations.active} activas · ${kpis.organizations.suspended} suspendidas · +${kpis.organizations.inPeriod} en el período`} />
        <Kpi label="Usuarios" value={fmtNum(kpis.users.total)} to="/admin/users"
          sub={`${kpis.users.active30} con actividad en 30 d · ${kpis.users.inactive30} sin actividad · ${kpis.users.disabled} deshabilitados`} />
        <Kpi label="Clientes" value={fmtNum(kpis.clients)} to="/admin/explorer?entity=Client" sub="registrados por todas las empresas" />
        <Kpi label="Proyectos" value={fmtNum(kpis.projects)} to="/admin/explorer?entity=Project" />
        <Kpi label="Presupuestos emitidos" value={fmtNum(kpis.quotes.emitted)} to="/admin/explorer?entity=Quote"
          sub={`+${kpis.quotes.inPeriod} en el período · no borradores`} />
        <Kpi label="Monto presupuestado" value={moneyList(kpis.quotes.amountByCurrency)} to="/admin/finances"
          sub="Suma de presupuestos emitidos. No es dinero cobrado." />
        <Kpi label="Facturación registrada" value={moneyList(kpis.invoices.amountByCurrency, fmtMoney(0))}
          sub={`${kpis.invoices.count} facturas emitidas${kpis.invoices.count ? '' : ' · módulo sin uso'}`} />
        <Kpi label="Pagos pendientes" value={pendCount ? fmtNum(pendCount) : '0'} to="/admin/finances" color={pendCount ? C.warn : C.crema}
          sub={`Cuotas: ${pendingList(kpis.pendingPayments.installments)} · Caja: ${pendingList(kpis.pendingPayments.cash)}`} />
        <Kpi label="Productos" value={fmtNum(kpis.products)} to="/admin/explorer?entity=Product" />
        <Kpi label="Movimientos de stock" value={fmtNum(kpis.stockMovements)} to="/admin/explorer?entity=StockMovement" />
        <Kpi label="Base de datos" value={platform.database.ok ? 'En línea' : 'Sin conexión'} color={platform.database.ok ? C.ok : C.err} to="/admin/infra"
          sub={platform.database.ok ? `${platform.database.latencyMs} ms · ${fmtBytes(platform.database.sizeBytes)} · ${platform.database.connections.total}/${platform.database.connections.max ?? '?'} conexiones` : platform.database.error} />
        <Kpi label="Último backup" to="/admin/backups"
          value={platform.lastBackup ? fmtAgo(platform.lastBackup.at) : 'Ninguno'}
          color={!platform.lastBackup ? C.err : platform.lastBackup.ageHours > 30 ? C.warn : C.ok}
          sub={platform.lastBackup ? `${fmtBytes(platform.lastBackup.sizeBytes)} · servidor activo hace ${fmtDuration(platform.uptimeSeconds)} · crons ${platform.cronsEnabled ? 'activos' : 'desactivados'}` : 'No hay backups en el bucket'} />
      </div>

      {/* Crecimiento y actividad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
        <Card title="Crecimiento: altas de empresas y usuarios">
          <BarChart unit={unit} data={charts.organizations.map((o, i) => ({ bucket: o.bucket, orgs: o.n, users: charts.users[i]?.n || 0 }))}
            series={[{ key: 'orgs', label: 'Empresas', color: C.crema }, { key: 'users', label: 'Usuarios', color: C.info }]} />
        </Card>
        <Card title="Actividad del sistema (eventos)">
          <BarChart unit={unit} data={charts.activity} series={[{ key: 'n', label: 'Eventos', color: C.arena }]} />
        </Card>
        <Card title="Evolución de presupuestos (cantidad)">
          <BarChart unit={unit} data={charts.quotes}
            series={[{ key: 'emitted', label: 'Emitidos', color: C.info }, { key: 'approved', label: 'Aprobados/firmados', color: C.ok }, { key: 'lost', label: 'Rechazados/vencidos', color: C.err }]} />
        </Card>
        <Card title="Evolución financiera (caja confirmada)"
          action={currencies.length > 1 && <select value={currency} onChange={e => setCur(e.target.value)} className="du-input" style={{ height: 28, width: 'auto', fontSize: 12 }}>{currencies.map(c => <option key={c}>{c}</option>)}</select>}>
          {currency
            ? <BarChart unit={unit} data={charts.cash[currency]} format={v => fmtMoney(v, currency)}
                series={[{ key: 'income', label: `Ingresos ${currency}`, color: C.ok }, { key: 'expense', label: `Egresos ${currency}`, color: C.err }]} />
            : <BarChart data={[]} series={[]} />}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
        <Card title="Proyectos por estado">
          <Distribution items={Object.entries(PROJECT_STATUS).map(([k, label]) => ({ label, value: charts.projectsByStatus[k] || 0, color: { finished: C.ok, cancelled: C.err, in_progress: C.info, approved: C.crema, pending: C.piedra }[k] }))} />
        </Card>
        <Card title="Empresas por plan">
          <Distribution items={Object.entries(PLAN_STYLE).map(([k, s]) => ({ label: s.label, value: charts.orgsByPlan[k] || 0, color: s.color }))} />
          <p style={{ fontSize: 11, color: C.piedra, margin: '12px 0 0' }}>El plan hoy es informativo: no habilita ni limita funciones ni se cobra desde DanteUP.</p>
        </Card>
      </div>

      {/* Últimos registros y actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Últimas empresas" action={<Link to="/admin/organizations" style={{ fontSize: 11.5, color: C.arena }}>Ver todas</Link>}>
          {latest.organizations.map((o, i) => (
            <Link key={o.id} to={`/admin/organizations/${o.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderBottom: i === latest.organizations.length - 1 ? 'none' : `1px solid ${C.linea}`, textDecoration: 'none' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 13, color: C.crema, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</p>
                <p style={{ fontSize: 11, color: C.piedra, margin: 0 }}>{o.owner?.name} · {fmtDate(o.createdAt)}</p>
              </div>
              {o.status === 'suspended' && <StyleBadge map={ORG_STATUS_STYLE} value={o.status} />}
              <StyleBadge map={PLAN_STYLE} value={o.plan} />
            </Link>
          ))}
        </Card>
        <Card title="Últimos usuarios" action={<Link to="/admin/users" style={{ fontSize: 11.5, color: C.arena }}>Ver todos</Link>}>
          {latest.users.map((u, i) => (
            <Link key={u.id} to={`/admin/users/${u.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderBottom: i === latest.users.length - 1 ? 'none' : `1px solid ${C.linea}`, textDecoration: 'none' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 13, color: C.crema, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                <p style={{ fontSize: 11, color: C.piedra, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email} · {fmtDate(u.createdAt)}</p>
              </div>
              {u.disabledAt && <Badge bg="rgba(229,131,115,0.12)" color={C.err} label="Deshabilitado" />}
              {!u.emailVerified && <Badge bg="rgba(226,182,99,0.12)" color={C.warn} label="Sin verificar" />}
            </Link>
          ))}
        </Card>
        <Card title="Últimas actividades" action={<Link to="/admin/audit" style={{ fontSize: 11.5, color: C.arena }}>Auditoría</Link>}>
          <ActivityList items={latest.activity} />
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        <Card title="Estado de la plataforma">
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ columnGap: 32 }}>
            <div>
              <Row label="PostgreSQL" value={platform.database.ok ? `${platform.database.version} · ${platform.database.latencyMs} ms` : 'Sin conexión'} valueColor={platform.database.ok ? C.crema : C.err} />
              <Row label="Tamaño de la base" value={fmtBytes(platform.database.sizeBytes)} />
              <Row label="Conexiones" value={platform.database.ok ? `${platform.database.connections.active} activas / ${platform.database.connections.total} abiertas / máx. ${platform.database.connections.max ?? '?'}` : '—'} />
              <div style={{ paddingTop: 10 }}><CapacityBar capacity={platform.database.capacity} compact /></div>
            </div>
            <div>
              <Row label="Servidor activo" value={fmtDuration(platform.uptimeSeconds)} />
              <Row label="Tareas programadas" value={platform.cronsEnabled ? 'Activas' : 'Desactivadas'} valueColor={platform.cronsEnabled ? C.ok : C.warn} />
              <Row label="Último backup" value={platform.lastBackup ? `${fmtAgo(platform.lastBackup.at)} (${platform.lastBackup.name})` : 'Ninguno'} last />
            </div>
          </div>
          <p style={{ fontSize: 11, color: C.piedra, margin: '10px 0 0', fontFamily: CIFRAS }}>Detalle técnico en Base de datos.</p>
        </Card>
      </div>
    </div>
  )
}
