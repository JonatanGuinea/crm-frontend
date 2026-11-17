import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminInfra } from '../../api/admin'
import {
  C, CIFRAS, TD, TH, PageHeader, Card, Kpi, Row, Table, Loading, ErrorBox, Unavailable, GhostBtn, CapacityBar,
  fmtBytes, fmtNum, fmtDuration, fmtDateTime, fmtAgo, apiError,
} from './ui'

/* Monitoreo técnico. El backend cachea 20 s para no ejecutar consultas de catálogo en cada render. */

export default function AdminInfra() {
  const qc = useQueryClient()
  const { data, isLoading, error, refetch, isFetching } = useQuery({ queryKey: ['admin-infra'], queryFn: () => getAdminInfra(false), staleTime: 20_000 })
  const refresh = async () => { qc.setQueryData(['admin-infra'], await getAdminInfra(true)) }

  if (isLoading) return <><PageHeader title="Base de datos e infraestructura" /><Loading text="Consultando el servidor…" /></>
  if (error) return <><PageHeader title="Base de datos e infraestructura" /><ErrorBox error={apiError(error)} onRetry={refetch} /></>

  const { database: db, server, prisma, services } = data
  const tables = Array.isArray(data.tables) ? data.tables : []
  const indexes = Array.isArray(data.indexes) ? data.indexes : []
  const unusedIdx = indexes.filter(i => i.scans === 0 && !/_pkey$/.test(i.index))

  return (
    <div style={{ opacity: isFetching ? 0.7 : 1 }}>
      <PageHeader title="Base de datos e infraestructura" subtitle={`Datos reales del servidor · generado ${fmtAgo(data.generatedAt)} (caché ${data.cacheSeconds} s)`}
        actions={<GhostBtn onClick={refresh}>Actualizar ahora</GhostBtn>} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3" style={{ marginBottom: 16 }}>
        <Kpi label="PostgreSQL" value={db.ok ? 'En línea' : 'Caída'} color={db.ok ? C.ok : C.err} sub={db.ok ? db.version : db.error} />
        <Kpi label="Latencia" value={db.ok ? `${db.latencyMs} ms` : '—'} color={db.latencyMs > 1000 ? C.warn : C.crema} sub="SELECT 1 desde el backend" />
        <Kpi label="Tamaño" value={fmtBytes(db.sizeBytes)} sub={`${tables.length} tablas · ${indexes.length} índices`} />
        <Kpi label="Conexiones" value={db.ok ? `${db.connections.total} / ${db.connections.max ?? '?'}` : '—'} sub={db.ok ? `${db.connections.active} activas · ${db.connections.idle} idle · ${db.connections.idleInTransaction} idle en transacción` : null} />
        <Kpi label="Memoria (RSS)" value={fmtBytes(server.memory.rss)} sub={`Heap ${fmtBytes(server.memory.heapUsed)} / ${fmtBytes(server.memory.heapTotal)}`} />
        <Kpi label="CPU del proceso" value={server.cpuPercent == null ? 'Midiendo…' : `${server.cpuPercent}%`} sub={`${server.host.cpus} CPU · load ${server.host.loadAvg.map(l => l.toFixed(2)).join(' / ')}`} />
      </div>

      {db.ok && (
        <div style={{ marginBottom: 16 }}>
          <Card title="Ocupación y capacidad total"><CapacityBar capacity={db.capacity} /></Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ marginBottom: 16 }}>
        <Card title="Servicios">
          {services.map((s, i) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i === services.length - 1 ? 'none' : `1px solid ${C.linea}` }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: s.ok ? C.ok : C.warn, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, color: C.crema, margin: 0 }}>{s.name}</p>
                <p style={{ fontSize: 11, color: C.piedra, margin: 0 }}>{s.detail}</p>
              </div>
            </div>
          ))}
        </Card>
        <Card title="Servidor (backend)">
          <Row label="Node.js" value={server.node} />
          <Row label="Prisma" value={prisma.version} />
          <Row label="Entorno" value={server.env} />
          <Row label="Plataforma" value={server.platform} />
          <Row label="Proceso activo" value={fmtDuration(server.uptimeSeconds)} />
          <Row label="Host activo" value={fmtDuration(server.hostUptimeSeconds)} />
          <Row label="Memoria del host" value={`${fmtBytes(server.host.totalMem - server.host.freeMem)} usados de ${fmtBytes(server.host.totalMem)}`} last />
        </Card>
        <Card title="Prisma (desde el último reinicio)">
          {prisma.pool.available ? (
            <>
              <Row label="Pool: abiertas / ocupadas / libres" value={`${prisma.pool.open} / ${prisma.pool.busy} / ${prisma.pool.idle}`} />
              <Row label="Consultas esperando conexión" value={fmtNum(prisma.pool.waiting)} valueColor={prisma.pool.waiting ? C.warn : C.crema} />
              <Row label="Conexiones abiertas / cerradas (total)" value={`${prisma.pool.opened} / ${prisma.pool.closed}`} />
            </>
          ) : <Unavailable>Métricas del pool no disponibles: {prisma.pool.reason}</Unavailable>}
          <Row label="Consultas ejecutadas" value={fmtNum(prisma.queries)} />
          <Row label="Duración promedio" value={prisma.avgMs == null ? '—' : `${prisma.avgMs} ms`} />
          <Row label={`Consultas lentas (≥ ${prisma.slowThresholdMs} ms)`} value={fmtNum(prisma.slowQueries.length)} valueColor={prisma.slowQueries.length ? C.warn : C.crema} />
          <Row label="Errores del motor" value={fmtNum(prisma.errorCount)} valueColor={prisma.errorCount ? C.err : C.crema} last />
          <p style={{ fontSize: 11, color: C.piedra, margin: '8px 0 0' }}>Desde {fmtDateTime(prisma.since)}.</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
        <Card title="Consultas más lentas (pg_stat_statements)">
          {data.slowStatements.available ? (
            data.slowStatements.rows.length ? data.slowStatements.rows.map((r, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i === data.slowStatements.rows.length - 1 ? 'none' : `1px solid ${C.linea}` }}>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: C.arena, fontFamily: CIFRAS }}>
                  <span>prom {r.meanMs} ms</span><span>máx {r.maxMs} ms</span><span>{fmtNum(r.calls)} llamadas</span>
                </div>
                <code style={{ fontSize: 11, color: C.crema, display: 'block', overflowWrap: 'anywhere', marginTop: 3 }}>{r.query}</code>
              </div>
            )) : <Unavailable>Sin estadísticas todavía.</Unavailable>
          ) : <Unavailable>{data.slowStatements.reason} Se muestran en su lugar las consultas lentas medidas por Prisma.</Unavailable>}
        </Card>
        <Card title="Consultas lentas y errores medidos por Prisma">
          {prisma.slowQueries.length ? prisma.slowQueries.slice(0, 10).map((q, i) => (
            <div key={i} style={{ padding: '7px 0', borderBottom: `1px solid ${C.linea}` }}>
              <span style={{ fontSize: 12, color: C.warn, fontFamily: CIFRAS }}>{q.ms} ms · {fmtDateTime(q.at)}</span>
              <code style={{ fontSize: 11, color: C.arena, display: 'block', overflowWrap: 'anywhere', marginTop: 2 }}>{q.query}</code>
            </div>
          )) : <Unavailable>Sin consultas lentas desde el último reinicio.</Unavailable>}
          {prisma.errors.length > 0 && prisma.errors.slice(0, 5).map((e, i) => (
            <p key={i} style={{ fontSize: 11.5, color: C.err, margin: '8px 0 0', overflowWrap: 'anywhere' }}>{fmtDateTime(e.at)} · {e.message}</p>
          ))}
        </Card>
      </div>

      <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, margin: '0 0 8px' }}>Tablas</p>
      {data.tables?.error ? <Unavailable>{data.tables.error}</Unavailable> : (
        <Table minWidth={820}>
          <thead><tr>{['Tabla', 'Filas (estim.)', 'Datos', 'Índices', 'Total', 'Seq scans', 'Index scans', 'Último autovacuum'].map((h, i) => <th key={h} style={{ ...TH, textAlign: i ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
          <tbody>
            {tables.map(t => (
              <tr key={t.table}>
                <td style={{ ...TD, fontFamily: CIFRAS, fontSize: 12.5 }}>{t.table}</td>
                {[fmtNum(t.rowsEstimate), fmtBytes(t.tableBytes), fmtBytes(t.indexBytes), fmtBytes(t.totalBytes), fmtNum(t.seqScans), fmtNum(t.idxScans), t.lastAutovacuum ? fmtDateTime(t.lastAutovacuum) : '—'].map((v, i) => (
                  <td key={i} style={{ ...TD, textAlign: 'right', fontSize: 12.5, fontFamily: CIFRAS, color: C.arena }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, margin: '18px 0 8px' }}>
        Índices ({indexes.length}{unusedIdx.length ? ` · ${unusedIdx.length} sin uso desde el último reset de estadísticas` : ''})
      </p>
      {data.indexes?.error ? <Unavailable>{data.indexes.error}</Unavailable> : (
        <Table minWidth={820}>
          <thead><tr>{['Tabla', 'Índice', 'Usos', 'Tamaño', 'Definición'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {indexes.map(i => (
              <tr key={i.index}>
                <td style={{ ...TD, fontSize: 12, color: C.arena }}>{i.table}</td>
                <td style={{ ...TD, fontSize: 12, fontFamily: CIFRAS }}>{i.index}</td>
                <td style={{ ...TD, fontSize: 12, fontFamily: CIFRAS, color: i.scans ? C.crema : C.warn }}>{fmtNum(i.scans)}</td>
                <td style={{ ...TD, fontSize: 12, fontFamily: CIFRAS, color: C.arena }}>{fmtBytes(i.bytes)}</td>
                <td style={{ ...TD, fontSize: 11, color: C.piedra, overflowWrap: 'anywhere' }}>{i.definition}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}
