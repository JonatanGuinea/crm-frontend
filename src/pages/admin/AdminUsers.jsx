import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getAdminUsers, getAdminOrganizations } from '../../api/admin'
import {
  C, TD, TH, card, PageHeader, FilterBar, DebouncedSearch, Select, Table, SortTh, Pager, Empty, Loading, ErrorBox, Badge, RowLink,
  ExportButtons, GhostBtn, useUrlFilters, USER_KIND, ROLE_LABEL, MEMBERSHIP_STATUS, fmtDate, fmtAgo, apiError,
} from './ui'

export function UserBadges({ u }) {
  const kind = USER_KIND[u.kind]
  return (
    <>
      {kind && <Badge {...kind} />}
      {u.isSystemAdmin && <Badge bg="rgba(142,177,222,0.12)" color={C.info} label="Sistema" title="Administrador del sistema (rol global)" />}
      {u.disabledAt && <Badge bg="rgba(229,131,115,0.12)" color={C.err} label="Deshabilitado" />}
      {!u.emailVerified && <Badge bg="rgba(226,182,99,0.12)" color={C.warn} label="Sin verificar" />}
    </>
  )
}

function OrgChips({ orgs }) {
  if (!orgs.length) return <span style={{ fontSize: 12, color: C.piedra }}>—</span>
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {orgs.map(o => (
        <Badge key={o.id}
          bg={o.status === 'active' ? 'rgba(242,237,227,0.07)' : 'rgba(226,182,99,0.1)'}
          color={o.status === 'active' ? C.arena : C.warn}
          title={o.orgStatus === 'suspended' ? 'Empresa suspendida' : undefined}
          label={`${o.name} · ${ROLE_LABEL[o.role] || o.role}${o.status !== 'active' ? ` (${MEMBERSHIP_STATUS[o.status]})` : ''}${o.orgStatus === 'suspended' ? ' ⏸' : ''}`} />
      ))}
    </div>
  )
}

export default function AdminUsers() {
  const [f, set] = useUrlFilters({ sort: 'createdAt', order: 'desc', page: '1' })
  const params = { q: f.q, status: f.status, verified: f.verified, kind: f.kind, orgId: f.orgId, sort: f.sort, order: f.order }
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-users', params, f.page],
    queryFn: () => getAdminUsers({ ...params, page: f.page, pageSize: 25 }),
    placeholderData: keepPreviousData,
  })
  // Lista de empresas para el filtro (nombre e id; hasta 100)
  const { data: orgs } = useQuery({ queryKey: ['admin-orgs-options'], queryFn: () => getAdminOrganizations({ pageSize: 100, sort: 'name', order: 'asc' }), staleTime: 300_000 })
  const sortProps = { sort: f.sort, order: f.order, onSort: (sort, order) => set({ sort, order }) }
  const hasFilters = f.q || f.status || f.verified || f.kind || f.orgId

  return (
    <div>
      <PageHeader title="Usuarios" subtitle="Cuentas de toda la plataforma. El rol global (Sistema) es independiente de los roles dentro de cada empresa."
        actions={<ExportButtons dataset="users" params={params} />} />

      <FilterBar>
        <DebouncedSearch value={f.q} onChange={q => set({ q })} placeholder="Buscar nombre, email, id o empresa…" />
        <Select value={f.orgId || ''} onChange={orgId => set({ orgId })} style={{ maxWidth: 220 }}
          options={[['', 'Todas las empresas'], ...(orgs?.items || []).map(o => [o.id, o.name])]} />
        <Select value={f.kind || ''} onChange={kind => set({ kind })} options={[['', 'Todos los tipos'], ['owner', 'Dueños de empresa'], ['team', 'Solo equipo (empresas ajenas)'], ['none', 'Sin empresa']]} />
        <Select value={f.status || ''} onChange={status => set({ status })} options={[['', 'Habilitados y deshabilitados'], ['enabled', 'Habilitados'], ['disabled', 'Deshabilitados']]} />
        <Select value={f.verified || ''} onChange={verified => set({ verified })} options={[['', 'Verificados o no'], ['yes', 'Email verificado'], ['no', 'Sin verificar']]} />
        {hasFilters && <GhostBtn onClick={() => set({ q: '', status: '', verified: '', kind: '', orgId: '' })}>Limpiar</GhostBtn>}
      </FilterBar>

      {isLoading ? <Loading /> : error ? <ErrorBox error={apiError(error)} onRetry={refetch} /> : !data.items.length ? <Empty text="No hay usuarios que coincidan." /> : (
        <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .15s' }}>
          <div className="hidden md:block">
            <Table minWidth={900}>
              <thead>
                <tr>
                  <SortTh label="Usuario" field="name" {...sortProps} />
                  <th style={TH}>Empresas y roles</th>
                  <SortTh label="Alta" field="createdAt" {...sortProps} />
                  <SortTh label="Últ. acceso" field="lastLoginAt" {...sortProps} />
                  <th style={TH}>Últ. actividad</th>
                  <th style={TH}></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map(u => (
                  <tr key={u.id}>
                    <td style={TD}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                        <UserBadges u={u} />
                      </div>
                      <p style={{ fontSize: 11, color: C.piedra, margin: 0 }}>{u.email}</p>
                    </td>
                    <td style={TD}><OrgChips orgs={u.organizations} /></td>
                    <td style={{ ...TD, color: C.arena, whiteSpace: 'nowrap' }}>{fmtDate(u.createdAt)}</td>
                    <td style={{ ...TD, color: C.arena, whiteSpace: 'nowrap' }}>{u.lastLoginAt ? fmtAgo(u.lastLoginAt) : 'Sin registro'}</td>
                    <td style={{ ...TD, color: C.arena, whiteSpace: 'nowrap' }}>{fmtAgo(u.lastActivityAt)}</td>
                    <td style={{ ...TD, textAlign: 'right' }}><RowLink to={`/admin/users/${u.id}`}>Ver →</RowLink></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="md:hidden">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.items.map(u => (
                <div key={u.id} style={{ ...card, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.crema }}>{u.name}</span>
                    <UserBadges u={u} />
                  </div>
                  <p style={{ fontSize: 11, color: C.piedra, margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</p>
                  <OrgChips orgs={u.organizations} />
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
                    <span style={{ fontSize: 11, color: C.piedra }}>Alta {fmtDate(u.createdAt)} · acceso {u.lastLoginAt ? fmtAgo(u.lastLoginAt) : '—'}</span>
                    <span style={{ marginLeft: 'auto' }}><RowLink to={`/admin/users/${u.id}`}>Ver →</RowLink></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Pager data={data} onPage={page => set({ page }, { resetPage: false })} />
        </div>
      )}
      <p style={{ fontSize: 11, color: C.piedra, marginTop: 14 }}>"Último acceso" se registra desde el 17/11/2026, cuando se agregó el seguimiento de logins.</p>
    </div>
  )
}
