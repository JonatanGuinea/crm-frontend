import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminOrganization, setOrganizationStatus } from '../../api/admin'
import { useToast } from '../../components/Toast'
import { PlanSelect, usePlanChange } from './plan'
import {
  C, TD, TH, PageHeader, Card, Row, Badge, StyleBadge, Loading, ErrorBox, Table, ActivityList, ReasonModal, GhostBtn, RowLink, Unavailable,
  ORG_STATUS_STYLE, ROLE_LABEL, MEMBERSHIP_STATUS, PROJECT_STATUS, QUOTE_STATUS, fmtDate, fmtDateTime, fmtAgo, fmtNum, fmtMoney, apiError,
} from './ui'

const COUNT_LABEL = { clients: 'Clientes', projects: 'Proyectos', quotes: 'Presupuestos', tasks: 'Tareas', products: 'Productos', stockMovements: 'Mov. de stock', cashMovements: 'Mov. de caja', clientMemberships: 'Membresías de clientes', suppliers: 'Proveedores' }
const COUNT_ENTITY = { clients: 'Client', projects: 'Project', quotes: 'Quote', tasks: 'Task', products: 'Product', stockMovements: 'StockMovement', cashMovements: 'CashMovement', clientMemberships: 'ClientMembership', suppliers: 'Supplier' }

export default function AdminOrganizationDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const { data: org, isLoading, error, refetch } = useQuery({ queryKey: ['admin-org', id], queryFn: () => getAdminOrganization(id) })
  const plan = usePlanChange([['admin-org', id], ['admin-orgs'], ['admin-dashboard']])

  const statusMut = useMutation({
    mutationFn: ({ status, reason }) => setOrganizationStatus(id, status, reason),
    onSuccess: (_, { status }) => {
      toast(status === 'suspended' ? 'Empresa suspendida' : 'Empresa reactivada', 'success')
      ;[['admin-org', id], ['admin-orgs'], ['admin-dashboard']].forEach(k => qc.invalidateQueries({ queryKey: k }))
      setModal(null)
    },
    onError: err => toast(apiError(err, 'No se pudo cambiar el estado'), 'error'),
  })

  if (isLoading) return <Loading />
  if (error) return <ErrorBox error={apiError(error)} onRetry={refetch} />

  const suspended = org.status === 'suspended'
  return (
    <div>
      <Link to="/admin/organizations" style={{ fontSize: 12, color: C.piedra, textDecoration: 'none' }}>← Empresas</Link>
      <div style={{ height: 8 }} />
      <PageHeader
        title={org.name}
        subtitle={`${org.id} · alta ${fmtDate(org.createdAt)} · última actividad ${fmtAgo(org.lastActivityAt)}`}
        actions={<>
          <StyleBadge map={ORG_STATUS_STYLE} value={org.status} />
          <PlanSelect org={org} onChange={plan.request} disabled={!!plan.busyId} />
          {suspended
            ? <GhostBtn onClick={() => setModal('reactivate')}>Reactivar</GhostBtn>
            : <GhostBtn danger onClick={() => setModal('suspend')}>Suspender</GhostBtn>}
        </>}
      />

      {suspended && (
        <div style={{ padding: '10px 14px', marginBottom: 16, background: 'rgba(229,131,115,0.08)', borderLeft: `3px solid ${C.err}`, borderRadius: '0 10px 10px 0', fontSize: 13, color: C.crema }}>
          Suspendida {fmtDateTime(org.suspendedAt)}{org.suspendedReason ? ` · Motivo: ${org.suspendedReason}` : ''}. Sus miembros no pueden operar hasta reactivarla.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4" style={{ marginBottom: 16 }}>
        <div className="md:col-span-2">
          <Card title="Datos">
            <Row label="Dueño" value={<Link to={`/admin/users/${org.owner.id}`} style={{ color: C.crema }}>{org.owner.name}</Link>} />
            <Row label="Email dueño" value={org.owner.email} />
            <Row label="Slug" value={org.slug} />
            <Row label="CUIT" value={org.cuit || '—'} />
            <Row label="Email / teléfono" value={[org.email, org.phone].filter(Boolean).join(' · ') || '—'} />
            <Row label="Ubicación" value={[org.city, org.province].filter(Boolean).join(', ') || '—'} />
            <Row label="Moneda por defecto" value={org.defaultCurrency} last />
          </Card>
        </div>
        <div className="md:col-span-3">
          <Card title="Volumen de datos" action={<Link to={`/admin/explorer?entity=Quote&orgId=${org.id}`} style={{ fontSize: 11.5, color: C.arena }}>Abrir en el explorador</Link>}>
            <div className="grid grid-cols-2 sm:grid-cols-3" style={{ columnGap: 20 }}>
              {Object.entries(COUNT_LABEL).map(([k, label]) => (
                <Link key={k} to={`/admin/explorer?entity=${COUNT_ENTITY[k]}&orgId=${org.id}`} style={{ textDecoration: 'none' }}>
                  <Row label={label} value={fmtNum(org.counts[k])} />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, margin: '0 0 8px' }}>Usuarios ({org.members.length})</p>
        <Table minWidth={640}>
          <thead><tr>{['Usuario', 'Rol', 'Estado', 'Último acceso', 'Desde', ''].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {org.members.map(m => (
              <tr key={m.id}>
                <td style={TD}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 500 }}>{m.user.name}</span>
                    {m.user.isSystemAdmin && <Badge bg="rgba(142,177,222,0.12)" color={C.info} label="Sistema" />}
                    {m.user.disabledAt && <Badge bg="rgba(229,131,115,0.12)" color={C.err} label="Cuenta deshabilitada" />}
                  </div>
                  <p style={{ fontSize: 11, color: C.piedra, margin: 0 }}>{m.user.email}</p>
                </td>
                <td style={TD}>{ROLE_LABEL[m.role]}</td>
                <td style={{ ...TD, color: m.status === 'active' ? C.ok : C.warn }}>{MEMBERSHIP_STATUS[m.status]}</td>
                <td style={{ ...TD, color: C.arena }}>{fmtAgo(m.user.lastLoginAt)}</td>
                <td style={{ ...TD, color: C.arena }}>{fmtDate(m.createdAt)}</td>
                <td style={{ ...TD, textAlign: 'right' }}><RowLink to={`/admin/users/${m.user.id}`}>Ver →</RowLink></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ marginBottom: 16 }}>
        <Card title="Últimos clientes">
          {org.recent.clients.length ? org.recent.clients.map((c, i) => (
            <Row key={c.id} label={c.name} value={fmtDate(c.createdAt)} last={i === org.recent.clients.length - 1} />
          )) : <Unavailable>Sin clientes.</Unavailable>}
        </Card>
        <Card title="Últimos proyectos">
          {org.recent.projects.length ? org.recent.projects.map((p, i) => (
            <Row key={p.id} label={p.title} value={PROJECT_STATUS[p.status]} last={i === org.recent.projects.length - 1} />
          )) : <Unavailable>Sin proyectos.</Unavailable>}
        </Card>
        <Card title="Últimos presupuestos">
          {org.recent.quotes.length ? org.recent.quotes.map((q, i) => (
            <Row key={q.id} label={`#${String(q.number).padStart(3, '0')} · ${QUOTE_STATUS[q.status]}`} value={fmtMoney(q.total, q.currency)} last={i === org.recent.quotes.length - 1} />
          )) : <Unavailable>Sin presupuestos.</Unavailable>}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Actividad histórica" action={<Link to={`/admin/audit?orgId=${org.id}`} style={{ fontSize: 11.5, color: C.arena }}>Auditoría de la empresa</Link>}>
          <ActivityList items={org.activity} showOrg={false} />
        </Card>
        <Card title="Acciones administrativas sobre la empresa">
          {org.adminHistory.length ? org.adminHistory.map((a, i) => (
            <Row key={a.id} label={`${a.action.replace('admin.organization.', '')}${a.meta?.reason ? ` · ${a.meta.reason}` : ''}`} value={fmtDateTime(a.createdAt)} last={i === org.adminHistory.length - 1} />
          )) : <Unavailable>Sin cambios administrativos registrados.</Unavailable>}
        </Card>
      </div>

      {modal === 'suspend' && (
        <ReasonModal title={`Suspender ${org.name}`} danger requireReason confirmLabel="Suspender"
          message="Sus miembros no podrán usar el CRM con esta empresa hasta que la reactives. No se borra ningún dato. El cambio aplica en menos de un minuto."
          busy={statusMut.isPending} onClose={() => setModal(null)} onConfirm={reason => statusMut.mutate({ status: 'suspended', reason })} />
      )}
      {modal === 'reactivate' && (
        <ReasonModal title={`Reactivar ${org.name}`} requireReason={false} confirmLabel="Reactivar"
          message="Sus miembros vuelven a tener acceso normal." busy={statusMut.isPending}
          onClose={() => setModal(null)} onConfirm={reason => statusMut.mutate({ status: 'active', reason })} />
      )}
      {plan.modal}
    </div>
  )
}
