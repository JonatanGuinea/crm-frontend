import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getAdminAudit, getAdminAuditFilters, getAdminAuditEvent, getAdminOrganizations } from '../../api/admin'
import {
  C, CIFRAS, TD, TH, PageHeader, FilterBar, DebouncedSearch, Select, DateInput, Table, Pager, Empty, Loading, ErrorBox, Badge, GhostBtn,
  ExportButtons, Unavailable, useUrlFilters, fmtDateTime, fmtNum, apiError,
} from './ui'

/* Auditoría centralizada (solo lectura: el panel no permite editar ni borrar eventos). */

function Diff({ before, after }) {
  const keys = [...new Set([...Object.keys(before || {}), ...Object.keys(after || {})])]
  if (!keys.length) return <Unavailable>Este evento no registra valores anteriores ni posteriores.</Unavailable>
  return (
    <Table minWidth={420}>
      <thead><tr>{['Campo', 'Antes', 'Después'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
      <tbody>
        {keys.map(k => {
          const b = JSON.stringify(before?.[k] ?? null), a = JSON.stringify(after?.[k] ?? null)
          const changed = b !== a
          return (
            <tr key={k}>
              <td style={{ ...TD, fontFamily: CIFRAS, fontSize: 12 }}>{k}</td>
              <td style={{ ...TD, fontSize: 12, color: changed ? C.err : C.arena, overflowWrap: 'anywhere' }}>{b}</td>
              <td style={{ ...TD, fontSize: 12, color: changed ? C.ok : C.arena, overflowWrap: 'anywhere' }}>{a}</td>
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}

function EventPanel({ id, onClose }) {
  const { data: ev, isLoading, error } = useQuery({ queryKey: ['admin-audit-event', id], queryFn: () => getAdminAuditEvent(id) })
  const field = (label, value) => (
    <div style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: `1px solid ${C.linea}`, fontSize: 12.5 }}>
      <span style={{ width: 120, flexShrink: 0, color: C.arena }}>{label}</span>
      <span style={{ color: C.crema, overflowWrap: 'anywhere', minWidth: 0 }}>{value ?? <span style={{ color: C.piedra }}>—</span>}</span>
    </div>
  )
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 560, height: '100%', background: C.s1, borderLeft: `1px solid ${C.linea}`, display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: C.linea, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.crema, margin: 0 }}>Evento de auditoría</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.arena, fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {isLoading ? <Loading /> : error ? <ErrorBox error={apiError(error)} /> : (
            <>
              {field('ID', <span style={{ fontFamily: CIFRAS }}>{ev.id}</span>)}
              {field('Fecha y hora', fmtDateTime(ev.createdAt))}
              {field('Acción', <span style={{ fontFamily: CIFRAS }}>{ev.action}</span>)}
              {field('Resultado', <span style={{ color: ev.success ? C.ok : C.err }}>{ev.success ? 'OK' : 'Error'}{ev.statusCode ? ` (${ev.statusCode})` : ''}</span>)}
              {field('Usuario', ev.actorId ? <Link to={`/admin/users/${ev.actorId}`} style={{ color: C.crema }}>{ev.actorName || ev.actorId}</Link> : (ev.actorEmail || 'Sistema / anónimo'))}
              {field('Email', ev.actorEmail)}
              {field('Empresa', ev.organizationId ? <Link to={`/admin/organizations/${ev.organizationId}`} style={{ color: C.crema }}>{ev.organizationName || ev.organizationId}</Link> : null)}
              {field('Entidad', ev.entity)}
              {field('ID del registro', ev.entityId && <span style={{ fontFamily: CIFRAS }}>{ev.entityId}</span>)}
              {field('IP', ev.ip)}
              {field('User-Agent', ev.userAgent)}
              {ev.meta && field('Datos', <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap' }}>{JSON.stringify(ev.meta, null, 2)}</pre>)}
              <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, margin: '18px 0 8px' }}>Cambios</p>
              <Diff before={ev.before} after={ev.after} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminAudit() {
  const [f, set] = useUrlFilters({ page: '1' })
  const [open, setOpen] = useState(null)
  const params = { q: f.q, actorId: f.actorId, orgId: f.orgId, action: f.action, entity: f.entity, entityId: f.entityId, result: f.result, from: f.from, to: f.to }
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-audit', params, f.page],
    queryFn: () => getAdminAudit({ ...params, page: f.page, pageSize: 50 }),
    placeholderData: keepPreviousData,
  })
  const { data: facets } = useQuery({ queryKey: ['admin-audit-facets'], queryFn: getAdminAuditFilters, staleTime: 60_000 })
  const { data: orgs } = useQuery({ queryKey: ['admin-orgs-options'], queryFn: () => getAdminOrganizations({ pageSize: 100, sort: 'name', order: 'asc' }), staleTime: 300_000 })
  const hasFilters = Object.values(params).some(Boolean)
  const actionOptions = [['', 'Todas las acciones'], ['auth.', 'auth.* (accesos)'], ['admin.', 'admin.* (administración)'], ...(facets?.actions || []).map(a => [a.value, `${a.value} (${fmtNum(a.count)})`])]

  return (
    <div>
      <PageHeader title="Auditoría" subtitle="Registro de operaciones de la plataforma. Solo lectura: los eventos no se pueden editar ni borrar desde el panel."
        actions={<ExportButtons dataset="audit" params={params} />} />

      <FilterBar>
        <DebouncedSearch value={f.q} onChange={q => set({ q })} placeholder="Buscar acción, entidad, email, IP o id…" />
        <Select value={f.action || ''} onChange={action => set({ action })} style={{ maxWidth: 260 }} options={actionOptions.some(o => o[0] === f.action) || !f.action ? actionOptions : [...actionOptions, [f.action, f.action]]} />
        <Select value={f.entity || ''} onChange={entity => set({ entity })} options={[['', 'Todas las entidades'], ...(facets?.entities || []).map(e => [e.value, `${e.value} (${fmtNum(e.count)})`])]} />
        <Select value={f.orgId || ''} onChange={orgId => set({ orgId })} style={{ maxWidth: 220 }} options={[['', 'Todas las empresas'], ...(orgs?.items || []).map(o => [o.id, o.name])]} />
        <Select value={f.result || ''} onChange={result => set({ result })} options={[['', 'Todos los resultados'], ['ok', 'OK'], ['error', 'Con error']]} />
        <DateInput value={f.from || ''} onChange={from => set({ from })} title="Desde" />
        <DateInput value={f.to || ''} onChange={to => set({ to })} title="Hasta" />
        {hasFilters && <GhostBtn onClick={() => set(Object.fromEntries(Object.keys(params).map(k => [k, ''])))}>Limpiar</GhostBtn>}
      </FilterBar>
      {(f.actorId || f.entityId) && (
        <p style={{ fontSize: 12, color: C.arena, margin: '-4px 0 10px' }}>
          {f.actorId && <>Usuario: <code>{f.actorId}</code> </>}{f.entityId && <>Registro: <code>{f.entityId}</code></>}
        </p>
      )}

      {isLoading ? <Loading /> : error ? <ErrorBox error={apiError(error)} onRetry={refetch} /> : !data.items.length ? <Empty text="No hay eventos que coincidan." /> : (
        <div style={{ opacity: isFetching ? 0.6 : 1 }}>
          <Table minWidth={940}>
            <thead><tr>{['Fecha', 'Usuario', 'Empresa', 'Acción', 'Entidad / registro', 'Resultado', 'IP'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {data.items.map(ev => (
                <tr key={ev.id} onClick={() => setOpen(ev.id)} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.s2} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...TD, whiteSpace: 'nowrap', color: C.arena, fontSize: 12.5 }}>{fmtDateTime(ev.createdAt)}</td>
                  <td style={{ ...TD, fontSize: 12.5 }}>{ev.actorName || ev.actorEmail || <span style={{ color: C.piedra }}>Sistema</span>}</td>
                  <td style={{ ...TD, fontSize: 12.5, color: C.arena }}>{ev.organizationName || '—'}</td>
                  <td style={{ ...TD, fontSize: 12.5, fontFamily: CIFRAS }}>{ev.action}</td>
                  <td style={{ ...TD, fontSize: 12, color: C.arena }}>{ev.entity || '—'}{ev.entityId ? <span style={{ color: C.piedra }}> · {ev.entityId.slice(0, 12)}…</span> : ''}</td>
                  <td style={TD}>{ev.success ? <Badge bg="rgba(125,190,147,0.12)" color={C.ok} label={ev.statusCode || 'OK'} /> : <Badge bg="rgba(229,131,115,0.12)" color={C.err} label={ev.statusCode || 'Error'} />}</td>
                  <td style={{ ...TD, fontSize: 12, color: C.piedra }}>{ev.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pager data={data} onPage={page => set({ page }, { resetPage: false })} />
        </div>
      )}
      <p style={{ fontSize: 11, color: C.piedra, marginTop: 14 }}>
        Se registran: accesos (login, logout, intentos fallidos), toda escritura de la API (creación, modificación, eliminación),
        acciones administrativas con valores antes/después, backups y exportaciones. El registro empezó el 17/11/2026.
      </p>
      {open && <EventPanel id={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
