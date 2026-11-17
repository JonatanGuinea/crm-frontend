import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getAdminOrganizations } from '../../api/admin'
import { PlanSelect, usePlanChange } from './plan'
import {
  C, CIFRAS, TD, card, PageHeader, FilterBar, DebouncedSearch, Select, DateInput, Table, SortTh, Pager, Empty, Loading, ErrorBox,
  StyleBadge, RowLink, ExportButtons, GhostBtn, useUrlFilters, PLAN_STYLE, ORG_STATUS_STYLE, fmtDate, fmtAgo, fmtNum, apiError,
} from './ui'

function TeamCell({ team }) {
  return (
    <span style={{ fontFamily: CIFRAS, fontWeight: 600 }}>
      {team.active}
      {team.invited > 0 && <span style={{ fontFamily: 'inherit', fontWeight: 400, fontSize: 11, color: C.warn }}> +{team.invited} inv.</span>}
    </span>
  )
}

const PLANS = Object.keys(PLAN_STYLE)

export default function AdminOrganizations() {
  const [f, set] = useUrlFilters({ sort: 'createdAt', order: 'desc', page: '1' })
  const params = { q: f.q, status: f.status, plan: f.plan, from: f.from, to: f.to, sort: f.sort, order: f.order }
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-orgs', params, f.page],
    queryFn: () => getAdminOrganizations({ ...params, page: f.page, pageSize: 25 }),
    placeholderData: keepPreviousData,
  })
  const plan = usePlanChange([['admin-orgs'], ['admin-dashboard']])
  const sortProps = { sort: f.sort, order: f.order, onSort: (sort, order) => set({ sort, order }) }
  const hasFilters = f.q || f.status || f.plan || f.from || f.to

  return (
    <div>
      <PageHeader title="Empresas" subtitle="Todas las organizaciones registradas"
        actions={<ExportButtons dataset="organizations" params={params} />} />

      <FilterBar>
        <DebouncedSearch value={f.q} onChange={q => set({ q })} placeholder="Buscar por nombre, slug, id o dueño…" />
        <Select value={f.status || ''} onChange={status => set({ status })} options={[['', 'Todos los estados'], ['active', 'Activas'], ['suspended', 'Suspendidas']]} />
        <Select value={f.plan || ''} onChange={p => set({ plan: p })} options={[['', 'Todos los planes'], ...PLANS.map(p => [p, PLAN_STYLE[p].label])]} />
        <DateInput value={f.from || ''} onChange={from => set({ from })} title="Creadas desde" />
        <DateInput value={f.to || ''} onChange={to => set({ to })} title="Creadas hasta" />
        {hasFilters && <GhostBtn onClick={() => set({ q: '', status: '', plan: '', from: '', to: '' })}>Limpiar</GhostBtn>}
      </FilterBar>

      {isLoading ? <Loading /> : error ? <ErrorBox error={apiError(error)} onRetry={refetch} /> : !data.items.length ? <Empty text="No hay empresas que coincidan." /> : (
        <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .15s' }}>
          {/* Desktop */}
          <div className="hidden md:block">
            <Table minWidth={980}>
              <thead>
                <tr>
                  <SortTh label="Empresa" field="name" {...sortProps} />
                  <th style={{ background: C.linea, color: C.crema, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 14px', textAlign: 'left' }}>Dueño</th>
                  <SortTh label="Estado" field="status" {...sortProps} />
                  <SortTh label="Equipo" field="members" align="right" {...sortProps} />
                  <SortTh label="Clientes" field="clients" align="right" {...sortProps} />
                  <SortTh label="Proyectos" field="projects" align="right" {...sortProps} />
                  <SortTh label="Presup." field="quotes" align="right" {...sortProps} />
                  <SortTh label="Alta" field="createdAt" {...sortProps} />
                  <SortTh label="Últ. actividad" {...sortProps} />
                  <SortTh label="Plan" field="plan" {...sortProps} />
                  <SortTh label="" {...sortProps} />
                </tr>
              </thead>
              <tbody>
                {data.items.map(o => (
                  <tr key={o.id}>
                    <td style={TD}>
                      <p style={{ fontWeight: 500, margin: 0 }}>{o.name}</p>
                      <p style={{ fontSize: 11, color: C.piedra, margin: 0 }}>{o.id}</p>
                    </td>
                    <td style={TD}>
                      <p style={{ margin: 0 }}>{o.owner?.name || '—'}</p>
                      <p style={{ fontSize: 11, color: C.piedra, margin: 0 }}>{o.owner?.email}</p>
                    </td>
                    <td style={TD}><StyleBadge map={ORG_STATUS_STYLE} value={o.status} /></td>
                    <td style={{ ...TD, textAlign: 'right' }}><TeamCell team={o.team} /></td>
                    <td style={{ ...TD, textAlign: 'right', fontFamily: CIFRAS }}>{fmtNum(o.clients)}</td>
                    <td style={{ ...TD, textAlign: 'right', fontFamily: CIFRAS }}>{fmtNum(o.projects)}</td>
                    <td style={{ ...TD, textAlign: 'right', fontFamily: CIFRAS }}>{fmtNum(o.quotes)}</td>
                    <td style={{ ...TD, color: C.arena, whiteSpace: 'nowrap' }}>{fmtDate(o.createdAt)}</td>
                    <td style={{ ...TD, color: C.arena, whiteSpace: 'nowrap' }}>{fmtAgo(o.lastActivityAt)}</td>
                    <td style={TD}><PlanSelect org={o} onChange={plan.request} disabled={plan.busyId === o.id} /></td>
                    <td style={{ ...TD, textAlign: 'right' }}><RowLink to={`/admin/organizations/${o.id}`}>Ver →</RowLink></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.items.map(o => (
                <div key={o.id} style={{ ...card, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.crema, margin: 0 }}>{o.name}</p>
                      <p style={{ fontSize: 11, color: C.piedra, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.owner?.name} · {o.owner?.email}</p>
                    </div>
                    <PlanSelect org={o} onChange={plan.request} disabled={plan.busyId === o.id} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 12, borderTop: `1px solid ${C.linea}`, paddingTop: 10 }}>
                    {[['Equipo', <TeamCell key="t" team={o.team} />], ['Clientes', o.clients], ['Presup.', o.quotes], ['Proy.', o.projects]].map(([l, v]) => (
                      <div key={l}>
                        <p style={{ fontSize: 10, color: C.piedra, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</p>
                        <p style={{ fontSize: 14, color: C.crema, margin: '2px 0 0', fontFamily: CIFRAS, fontWeight: 600 }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <StyleBadge map={ORG_STATUS_STYLE} value={o.status} />
                    <span style={{ fontSize: 11, color: C.piedra }}>Alta {fmtDate(o.createdAt)} · act. {fmtAgo(o.lastActivityAt)}</span>
                    <span style={{ marginLeft: 'auto' }}><RowLink to={`/admin/organizations/${o.id}`}>Ver →</RowLink></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Pager data={data} onPage={page => set({ page }, { resetPage: false })} />
        </div>
      )}
      {plan.modal}
    </div>
  )
}
