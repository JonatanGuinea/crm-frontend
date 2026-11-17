import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { getAdminOverview, updateOrganizationPlan } from '../../api/admin'
import { ClienteIcon, EquipoIcon, AjustesIcon, ModulosIcon, BuscarIcon } from '../../components/DuIcons'

/* Panel de sistema — solo administradores del sistema (User.isSystemAdmin).
   Estado de la base, usuarios registrados y empresas. El backend valida el permiso en cada pedido. */

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }
const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"
const CTRL_H = 34

const card = { background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0' }
const SECTION_TITLE = { fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, margin: 0 }
const TH = { background: C.linea, color: C.crema, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 14px', textAlign: 'left', whiteSpace: 'nowrap' }
const TD = { padding: '10px 14px', borderBottom: `1px solid ${C.linea}`, fontSize: 13, color: C.crema, verticalAlign: 'middle' }

const PLANS = ['free', 'pro', 'enterprise']
const PLAN_STYLE = {
  free:       { label: 'Free',       bg: 'rgba(242,237,227,0.07)', color: C.piedra },
  pro:        { label: 'Pro',        bg: 'rgba(142,177,222,0.12)', color: C.info },
  enterprise: { label: 'Enterprise', bg: 'rgba(125,190,147,0.12)', color: C.ok },
}
const ROLE_LABEL = { owner: 'Dueño', admin: 'Admin', member: 'Miembro' }
const STATUS_LABEL = { invited: 'invitado', disabled: 'deshabilitado' }

const TABS = [
  { key: 'summary', label: 'Resumen' },
  { key: 'orgs',    label: 'Empresas' },
  { key: 'users',   label: 'Usuarios' },
]

/* ── helpers ─────────────────────────────────────────────────────────────── */

function fmtBytes(n) {
  if (n == null) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(2)} GB`
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
}
function fmtDateTime(d) {
  return d ? new Date(d).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
}
function norm(s = '') {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function Badge({ bg, color, label, title }) {
  return (
    <span title={title} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '0 6px 6px 0', fontSize: 10.5, fontWeight: 600, background: bg, color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function RefreshSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
}
function DbSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
}

/* ── controles ───────────────────────────────────────────────────────────── */

function TabSwitcher({ tab, setTab }) {
  return (
    <div style={{ height: CTRL_H, display: 'flex', alignItems: 'center', gap: 3, padding: 4, background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 10px 10px 0' }}>
      {TABS.map(t => {
        const active = t.key === tab
        return (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ height: '100%', padding: '0 12px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, borderRadius: '0 7px 7px 0', background: active ? C.s3 : 'transparent', color: active ? C.crema : C.piedra }}>
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

function RefreshBtn({ onClick, spinning }) {
  return (
    <button onClick={onClick} title="Actualizar" disabled={spinning}
      style={{ height: CTRL_H, width: CTRL_H, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', color: C.piedra, cursor: spinning ? 'wait' : 'pointer', transition: 'color 0.12s, border-color 0.12s' }}
      onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
      onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
      <RefreshSvg style={{ width: 15, height: 15, animation: spinning ? 'du-spin 0.9s linear infinite' : 'none' }} />
    </button>
  )
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
      <BuscarIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: C.piedra, pointerEvents: 'none' }} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="du-input" style={{ height: CTRL_H, width: '100%', paddingLeft: 34, fontSize: 13 }} />
    </div>
  )
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="du-input"
      style={{ height: CTRL_H, width: 'auto', fontSize: 13, paddingRight: 28, flex: '0 0 auto' }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

function ResultCount({ shown, total }) {
  return <p style={{ fontSize: 11, color: C.piedra, margin: '0 0 10px' }}>{shown === total ? `${total} en total` : `${shown} de ${total}`}</p>
}

function Empty({ text }) {
  return <div style={{ ...card, padding: '28px 20px', textAlign: 'center', fontSize: 13, color: C.piedra }}>{text}</div>
}

/* ── Resumen ─────────────────────────────────────────────────────────────── */

function Kpi({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
      <Icon style={{ width: 19, height: 19, color: C.arena, flexShrink: 0, marginTop: 1 }} />
      <div style={{ minWidth: 0 }}>
        <p style={SECTION_TITLE}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', fontFamily: CIFRAS, color: color || C.crema, margin: '6px 0 2px' }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: C.piedra, margin: 0 }}>{sub}</p>}
      </div>
    </div>
  )
}

function Row({ label, value, last, valueColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${C.linea}` }}>
      <span style={{ fontSize: 13, color: C.arena }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: CIFRAS, color: valueColor || C.crema, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function SummaryTab({ data }) {
  const { database: db, backups, summary } = data
  const lastBackup = backups.files[0]
  const backupAgeH = lastBackup ? (new Date(data.generatedAt) - new Date(lastBackup.createdAt)) / 36e5 : null
  const backupColor = backupAgeH == null ? C.err : backupAgeH > 30 ? C.warn : C.ok
  const plans = summary.organizations.plans

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={DbSvg} label="Base de datos"
          value={db.ok ? 'En línea' : 'Sin conexión'} color={db.ok ? C.ok : C.err}
          sub={db.ok ? `${db.latencyMs} ms · ${fmtBytes(db.sizeBytes)}` : db.error} />
        <Kpi icon={ClienteIcon} label="Usuarios" value={summary.users.total}
          sub={`${summary.users.verified} verificados · ${summary.users.withoutOrg} sin empresa`} />
        <Kpi icon={ModulosIcon} label="Empresas" value={summary.organizations.total}
          sub={PLANS.map(p => `${plans[p] || 0} ${PLAN_STYLE[p].label}`).join(' · ')} />
        <Kpi icon={EquipoIcon} label="Altas 30 días" value={summary.users.last30}
          sub={`usuarios · ${summary.organizations.last30} empresas · ${summary.users.last7} en 7 días`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3" style={{ ...card, padding: '20px 20px' }}>
          <p style={{ ...SECTION_TITLE, marginBottom: 6 }}>Registros por tabla</p>
          {db.ok
            ? db.tables.map((t, i) => <Row key={t.label} label={t.label} value={t.rows.toLocaleString('es-AR')} last={i === db.tables.length - 1} />)
            : <p style={{ fontSize: 13, color: C.err, margin: '10px 0 0' }}>{db.error}</p>}
        </div>

        <div className="md:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ ...card, padding: '20px 20px' }}>
            <p style={{ ...SECTION_TITLE, marginBottom: 6 }}>Servidor</p>
            {db.ok ? (
              <>
                <Row label="Estado" value="En línea" valueColor={C.ok} />
                <Row label="Latencia" value={`${db.latencyMs} ms`} valueColor={db.latencyMs > 1000 ? C.warn : C.crema} />
                <Row label="Tamaño" value={fmtBytes(db.sizeBytes)} />
                <Row label="Conexiones" value={`${db.connections.active} activas / ${db.connections.total}`} />
                <Row label="Motor" value={db.version} last />
              </>
            ) : <Row label="Estado" value="Sin conexión" valueColor={C.err} last />}
          </div>

          <div style={{ ...card, padding: '20px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={SECTION_TITLE}>Backups</p>
              <Badge bg="rgba(242,237,227,0.06)" color={backupColor}
                label={lastBackup ? `Último hace ${backupAgeH < 1 ? '<1' : Math.round(backupAgeH)} h` : 'Sin backups'} />
            </div>
            {!backups.ok && <p style={{ fontSize: 12, color: C.err, margin: '8px 0 0' }}>{backups.error}</p>}
            {backups.files.map((f, i) => (
              <Row key={f.name} label={fmtDateTime(f.createdAt)} value={fmtBytes(f.sizeBytes)} last={i === backups.files.length - 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Empresas ────────────────────────────────────────────────────────────── */

function PlanSelect({ org, onChange, disabled }) {
  const st = PLAN_STYLE[org.plan] || PLAN_STYLE.free
  return (
    <select value={org.plan} disabled={disabled} onChange={e => onChange(org, e.target.value)} title="Cambiar plan"
      style={{ appearance: 'none', padding: '3px 10px', borderRadius: '0 6px 6px 0', border: `1px solid ${C.linea}`, background: st.bg, color: st.color, fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: disabled ? 'wait' : 'pointer' }}>
      {PLANS.map(p => <option key={p} value={p} style={{ background: C.s2, color: C.crema }}>{PLAN_STYLE[p].label}</option>)}
    </select>
  )
}

function TeamCell({ team }) {
  return (
    <span style={{ fontFamily: CIFRAS, fontWeight: 600 }}>
      {team.active}
      {team.invited > 0 && <span style={{ fontFamily: 'inherit', fontWeight: 400, fontSize: 11, color: C.warn }}> +{team.invited} inv.</span>}
    </span>
  )
}

const ORG_SORTS = {
  recent:  (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  name:    (a, b) => a.name.localeCompare(b.name, 'es'),
  team:    (a, b) => b.team.active - a.team.active,
  clients: (a, b) => b.clients - a.clients,
  quotes:  (a, b) => b.quotes - a.quotes,
}

function OrgsTab({ orgs }) {
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [q, setQ] = useState('')
  const [plan, setPlan] = useState('all')
  const [sort, setSort] = useState('recent')

  const mutation = useMutation({
    mutationFn: ({ id, plan }) => updateOrganizationPlan(id, plan),
    onSuccess: (_, { name, plan }) => {
      toast(`${name}: plan ${PLAN_STYLE[plan].label}`, 'success')
      qc.invalidateQueries({ queryKey: ['admin-overview'] })
    },
    onError: err => toast(err.response?.data?.error || 'No se pudo cambiar el plan', 'error'),
  })

  async function handlePlan(org, newPlan) {
    if (newPlan === org.plan) return
    const ok = await confirm(
      `¿Cambiar el plan de ${org.name} de ${PLAN_STYLE[org.plan].label} a ${PLAN_STYLE[newPlan].label}?`,
      { confirmLabel: 'Cambiar plan' }
    )
    if (ok) mutation.mutate({ id: org.id, plan: newPlan, name: org.name })
  }

  const list = useMemo(() => {
    const term = norm(q.trim())
    return orgs
      .filter(o => plan === 'all' || o.plan === plan)
      .filter(o => !term || norm(`${o.name} ${o.slug} ${o.owner?.name} ${o.owner?.email}`).includes(term))
      .sort(ORG_SORTS[sort])
  }, [orgs, q, plan, sort])

  const busyId = mutation.isPending ? mutation.variables?.id : null

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar empresa o dueño…" />
        <FilterSelect value={plan} onChange={setPlan} options={[['all', 'Todos los planes'], ...PLANS.map(p => [p, PLAN_STYLE[p].label])]} />
        <FilterSelect value={sort} onChange={setSort} options={[['recent', 'Más recientes'], ['name', 'Nombre'], ['team', 'Más equipo'], ['clients', 'Más clientes'], ['quotes', 'Más presupuestos']]} />
      </div>
      <ResultCount shown={list.length} total={orgs.length} />

      {list.length === 0 ? <Empty text="No hay empresas que coincidan." /> : (
        <>
          {/* Desktop */}
          <div className="hidden md:block">
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={TH}>Empresa</th>
                      <th style={TH}>Dueño</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Equipo</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Clientes</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Presup.</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Proyectos</th>
                      <th style={TH}>Alta</th>
                      <th style={TH}>Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(o => (
                      <tr key={o.id}>
                        <td style={TD}>
                          <p style={{ fontWeight: 500, margin: 0 }}>{o.name}</p>
                          <p style={{ fontSize: 11, color: C.piedra, margin: 0 }}>{o.slug}</p>
                        </td>
                        <td style={TD}>
                          <p style={{ margin: 0 }}>{o.owner?.name || '—'}</p>
                          <p style={{ fontSize: 11, color: C.piedra, margin: 0 }}>{o.owner?.email}</p>
                        </td>
                        <td style={{ ...TD, textAlign: 'right' }}><TeamCell team={o.team} /></td>
                        <td style={{ ...TD, textAlign: 'right', fontFamily: CIFRAS }}>{o.clients}</td>
                        <td style={{ ...TD, textAlign: 'right', fontFamily: CIFRAS }}>{o.quotes}</td>
                        <td style={{ ...TD, textAlign: 'right', fontFamily: CIFRAS }}>{o.projects}</td>
                        <td style={{ ...TD, color: C.arena, whiteSpace: 'nowrap' }}>{fmtDate(o.createdAt)}</td>
                        <td style={TD}><PlanSelect org={o} onChange={handlePlan} disabled={busyId === o.id} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.map(o => (
              <div key={o.id} style={{ ...card, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.crema, margin: 0 }}>{o.name}</p>
                    <p style={{ fontSize: 11, color: C.piedra, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.owner?.name} · {o.owner?.email}
                    </p>
                  </div>
                  <PlanSelect org={o} onChange={handlePlan} disabled={busyId === o.id} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 12, borderTop: `1px solid ${C.linea}`, paddingTop: 10 }}>
                  {[['Equipo', <TeamCell key="t" team={o.team} />], ['Clientes', o.clients], ['Presup.', o.quotes], ['Proy.', o.projects]].map(([l, v]) => (
                    <div key={l}>
                      <p style={{ fontSize: 10, color: C.piedra, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</p>
                      <p style={{ fontSize: 14, color: C.crema, margin: '2px 0 0', fontFamily: CIFRAS, fontWeight: 600 }}>{v}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: C.piedra, margin: '10px 0 0' }}>Alta {fmtDate(o.createdAt)}</p>
              </div>
            ))}
          </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Usuarios ────────────────────────────────────────────────────────────── */

function OrgChips({ orgs }) {
  if (!orgs.length) return <span style={{ fontSize: 12, color: C.piedra }}>Sin empresa</span>
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {orgs.map(o => (
        <Badge key={o.id}
          bg={o.status === 'active' ? 'rgba(242,237,227,0.07)' : 'rgba(226,182,99,0.1)'}
          color={o.status === 'active' ? C.arena : C.warn}
          label={`${o.name} · ${ROLE_LABEL[o.role] || o.role}${STATUS_LABEL[o.status] ? ` (${STATUS_LABEL[o.status]})` : ''}`} />
      ))}
    </div>
  )
}

function UserBadges({ u }) {
  return (
    <>
      {u.isSystemAdmin && <Badge bg="rgba(142,177,222,0.12)" color={C.info} label="Sistema" />}
      {!u.emailVerified && <Badge bg="rgba(226,182,99,0.12)" color={C.warn} label="Sin verificar" />}
    </>
  )
}

function UsersTab({ users }) {
  const [q, setQ] = useState('')
  const [verified, setVerified] = useState('all')
  const [withOrg, setWithOrg] = useState('all')

  const list = useMemo(() => {
    const term = norm(q.trim())
    return users
      .filter(u => verified === 'all' || (verified === 'yes' ? u.emailVerified : !u.emailVerified))
      .filter(u => {
        if (withOrg === 'all') return true
        const has = u.organizations.some(o => o.status === 'active')
        return withOrg === 'yes' ? has : !has
      })
      .filter(u => !term || norm(`${u.name} ${u.email} ${u.organizations.map(o => o.name).join(' ')}`).includes(term))
  }, [users, q, verified, withOrg])

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar nombre, email o empresa…" />
        <FilterSelect value={verified} onChange={setVerified} options={[['all', 'Todos'], ['yes', 'Email verificado'], ['no', 'Sin verificar']]} />
        <FilterSelect value={withOrg} onChange={setWithOrg} options={[['all', 'Con y sin empresa'], ['yes', 'Con empresa'], ['no', 'Sin empresa']]} />
      </div>
      <ResultCount shown={list.length} total={users.length} />

      {list.length === 0 ? <Empty text="No hay usuarios que coincidan." /> : (
        <>
          {/* Desktop */}
          <div className="hidden md:block">
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={TH}>Usuario</th>
                      <th style={TH}>Empresas</th>
                      <th style={TH}>Alta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(u => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.map(u => (
              <div key={u.id} style={{ ...card, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.crema }}>{u.name}</span>
                  <UserBadges u={u} />
                </div>
                <p style={{ fontSize: 11, color: C.piedra, margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</p>
                <OrgChips orgs={u.organizations} />
                <p style={{ fontSize: 11, color: C.piedra, margin: '10px 0 0' }}>Alta {fmtDate(u.createdAt)}</p>
              </div>
            ))}
          </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Página ──────────────────────────────────────────────────────────────── */

export default function SystemAdminPage() {
  const [tab, setTab] = useState('summary')
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => getAdminOverview().then(r => r.data.data),
    staleTime: 60_000,
  })

  return (
    <div style={{ padding: '28px 24px 40px', maxWidth: 1080, fontFamily: 'Geist, system-ui, sans-serif' }}>
      <style>{'@keyframes du-spin { to { transform: rotate(360deg) } }'}</style>

      {/* Fila 1 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <AjustesIcon style={{ width: 18, height: 18, color: C.arena, flexShrink: 0 }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, color: C.crema, margin: 0 }}>Sistema</h2>
        </div>
        <div className="hidden sm:block">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TabSwitcher tab={tab} setTab={setTab} />
            <RefreshBtn onClick={() => refetch()} spinning={isFetching} />
          </div>
        </div>
        <div className="sm:hidden">
          <RefreshBtn onClick={() => refetch()} spinning={isFetching} />
        </div>
      </div>

      {/* Fila 2 — solo mobile */}
      <div className="sm:hidden" style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <TabSwitcher tab={tab} setTab={setTab} />
        </div>
      </div>

      <p style={{ fontSize: 11, color: C.piedra, margin: '0 0 20px' }}>
        Solo visible para administradores del sistema{data ? ` · actualizado ${fmtDateTime(data.generatedAt)}` : ''}
      </p>

      {isLoading ? (
        <Empty text="Cargando datos del sistema…" />
      ) : error ? (
        <Empty text={error.response?.status === 403 ? 'No tenés acceso a este panel.' : (error.response?.data?.error || 'No se pudieron cargar los datos.')} />
      ) : (
        <>
          {tab === 'summary' && <SummaryTab data={data} />}
          {tab === 'orgs' && <OrgsTab orgs={data.organizations} />}
          {tab === 'users' && <UsersTab users={data.users} />}
        </>
      )}
    </div>
  )
}
