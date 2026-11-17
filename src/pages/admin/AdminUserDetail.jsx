import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminUser, setUserStatus } from '../../api/admin'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { UserBadges } from './AdminUsers'
import {
  C, TD, TH, PageHeader, Card, Row, StyleBadge, Loading, ErrorBox, Table, ActivityList, ReasonModal, GhostBtn, Unavailable, RowLink,
  ORG_STATUS_STYLE, ROLE_LABEL, MEMBERSHIP_STATUS, fmtDate, fmtDateTime, fmtAgo, fmtNum, apiError,
} from './ui'

const ACCESS_LABEL = { 'auth.login': 'Inicio de sesión', 'auth.logout': 'Cierre de sesión', 'auth.login_failed': 'Intento fallido' }
const FAIL_REASON = { bad_password: 'contraseña incorrecta', disabled: 'cuenta deshabilitada', unknown_email: 'email desconocido' }
const COUNT_LABEL = { clients: 'Clientes creados', projects: 'Proyectos creados', quotes: 'Presupuestos creados', createdTasks: 'Tareas creadas', assignedTasks: 'Tareas asignadas', cashMovements: 'Movimientos de caja', notifications: 'Notificaciones' }

export default function AdminUserDetail() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const { data: u, isLoading, error, refetch } = useQuery({ queryKey: ['admin-user', id], queryFn: () => getAdminUser(id) })

  const mut = useMutation({
    mutationFn: ({ disabled, reason }) => setUserStatus(id, disabled, reason),
    onSuccess: (_, { disabled }) => {
      toast(disabled ? 'Cuenta deshabilitada' : 'Cuenta habilitada', 'success')
      ;[['admin-user', id], ['admin-users'], ['admin-dashboard']].forEach(k => qc.invalidateQueries({ queryKey: k }))
      setModal(null)
    },
    onError: err => toast(apiError(err, 'No se pudo cambiar el estado'), 'error'),
  })

  if (isLoading) return <Loading />
  if (error) return <ErrorBox error={apiError(error)} onRetry={refetch} />

  const isMe = me?.uid === u.id
  const canDisable = !isMe && !u.isSystemAdmin
  return (
    <div>
      <Link to="/admin/users" style={{ fontSize: 12, color: C.piedra, textDecoration: 'none' }}>← Usuarios</Link>
      <div style={{ height: 8 }} />
      <PageHeader
        title={u.name}
        subtitle={`${u.email} · ${u.id}`}
        actions={<>
          <UserBadges u={u} />
          {u.disabledAt
            ? <GhostBtn onClick={() => setModal('enable')}>Habilitar cuenta</GhostBtn>
            : <GhostBtn danger disabled={!canDisable} title={isMe ? 'No podés deshabilitar tu propia cuenta' : u.isSystemAdmin ? 'No se puede deshabilitar a un administrador del sistema' : undefined} onClick={() => setModal('disable')}>Deshabilitar cuenta</GhostBtn>}
        </>}
      />

      {u.disabledAt && (
        <div style={{ padding: '10px 14px', marginBottom: 16, background: 'rgba(229,131,115,0.08)', borderLeft: `3px solid ${C.err}`, borderRadius: '0 10px 10px 0', fontSize: 13, color: C.crema }}>
          Deshabilitada {fmtDateTime(u.disabledAt)}{u.disabledReason ? ` · Motivo: ${u.disabledReason}` : ''}. No puede iniciar sesión y sus sesiones abiertas dejan de funcionar.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
        <Card title="Perfil">
          <Row label="Email" value={u.email} />
          <Row label="Teléfono" value={u.phone || '—'} />
          <Row label="Email verificado" value={u.emailVerified ? 'Sí' : 'No'} valueColor={u.emailVerified ? C.ok : C.warn} />
          <Row label="Rol global" value={u.isSystemAdmin ? 'Administrador del sistema' : 'Usuario'} />
          <Row label="Alta" value={fmtDateTime(u.createdAt)} />
          <Row label="Último acceso" value={u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : 'Sin registro'} />
          <Row label="Última actividad" value={fmtAgo(u.lastActivityAt)} last />
        </Card>
        <Card title="Registros creados">
          {Object.entries(COUNT_LABEL).map(([k, label], i, arr) => <Row key={k} label={label} value={fmtNum(u.counts[k])} last={i === arr.length - 1} />)}
        </Card>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, margin: '0 0 8px' }}>Membresías</p>
        {u.memberships.length ? (
          <Table minWidth={560}>
            <thead><tr>{['Empresa', 'Rol en la empresa', 'Estado', 'Desde', ''].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {u.memberships.map(m => (
                <tr key={m.id}>
                  <td style={TD}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>{m.organization.name}</span>
                      {m.organization.status === 'suspended' && <StyleBadge map={ORG_STATUS_STYLE} value="suspended" />}
                    </div>
                  </td>
                  <td style={TD}>{ROLE_LABEL[m.role]}</td>
                  <td style={{ ...TD, color: m.status === 'active' ? C.ok : C.warn }}>{MEMBERSHIP_STATUS[m.status]}</td>
                  <td style={{ ...TD, color: C.arena }}>{fmtDate(m.createdAt)}</td>
                  <td style={{ ...TD, textAlign: 'right' }}><RowLink to={`/admin/organizations/${m.organization.id}`}>Empresa →</RowLink></td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <Unavailable>No pertenece a ninguna empresa.</Unavailable>}
        <p style={{ fontSize: 11, color: C.piedra, margin: '8px 0 0' }}>Los roles dentro de cada empresa los gestionan sus dueños desde Equipo. Desde acá no se modifican, para respetar el aislamiento entre empresas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Historial de accesos" action={<Link to={`/admin/audit?actorId=${u.id}&action=auth.`} style={{ fontSize: 11.5, color: C.arena }}>Ver en auditoría</Link>}>
          {u.accesses.length ? u.accesses.map((a, i) => (
            <div key={a.id} style={{ padding: '8px 0', borderBottom: i === u.accesses.length - 1 ? 'none' : `1px solid ${C.linea}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 13, color: a.success ? C.crema : C.err }}>{ACCESS_LABEL[a.action] || a.action}{a.meta?.reason ? ` (${FAIL_REASON[a.meta.reason] || a.meta.reason})` : ''}</span>
                <span style={{ fontSize: 12, color: C.arena, whiteSpace: 'nowrap' }}>{fmtDateTime(a.createdAt)}</span>
              </div>
              <p style={{ fontSize: 11, color: C.piedra, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.ip || 'IP desconocida'} · {a.userAgent || '—'}</p>
            </div>
          )) : <Unavailable>Sin accesos registrados (el registro empezó el 17/11/2026).</Unavailable>}
        </Card>
        <Card title="Actividad" action={<Link to={`/admin/audit?actorId=${u.id}`} style={{ fontSize: 11.5, color: C.arena }}>Auditoría del usuario</Link>}>
          <ActivityList items={u.activity} showUser={false} />
        </Card>
      </div>

      {modal === 'disable' && (
        <ReasonModal title={`Deshabilitar a ${u.name}`} danger requireReason confirmLabel="Deshabilitar"
          message="No podrá iniciar sesión y sus sesiones abiertas dejan de funcionar en menos de un minuto. No se borra ningún dato y se puede revertir."
          busy={mut.isPending} onClose={() => setModal(null)} onConfirm={reason => mut.mutate({ disabled: true, reason })} />
      )}
      {modal === 'enable' && (
        <ReasonModal title={`Habilitar a ${u.name}`} requireReason={false} confirmLabel="Habilitar"
          message="Vuelve a poder iniciar sesión." busy={mut.isPending}
          onClose={() => setModal(null)} onConfirm={reason => mut.mutate({ disabled: false, reason })} />
      )}
    </div>
  )
}
