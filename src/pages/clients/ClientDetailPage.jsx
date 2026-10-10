import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { getClientById, getClientHistory } from '../../api/clients'
import { getProjects } from '../../api/projects'
import { getQuotes } from '../../api/quotes'
import ClientModal from './ClientModal'
import AttachmentsPanel from '../../components/AttachmentsPanel'
import {
  ClienteIcon,
  AgendaIcon,
  ProyectoIcon,
  PresupuestoIcon,
  AjustesIcon,
} from '../../components/DuIcons'

// ── tokens ────────────────────────────────────────────────────────────────────

const C = {
  bg:    '#0B0B0C',
  s1:    '#141415',
  s2:    '#1E1E20',
  s3:    '#26262A',
  linea: '#2C2C2F',
  crema: '#F2EDE3',
  arena: '#B9B4AA',
  piedra:'#8C877E',
  ok:    '#7DBE93',
  warn:  '#E2B663',
  err:   '#E58373',
  info:  '#8EB1DE',
}

const card = {
  background: C.s1,
  border: `1px solid ${C.linea}`,
  borderRadius: '0 16px 16px 0',
}

const SECTION_TITLE = {
  fontSize: 10.5, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  color: C.arena,
}

// ── estado de proyectos ───────────────────────────────────────────────────────

const PROJECT_STATUS = {
  pending:     { label: 'Pendiente',  bg: 'rgba(226,182,99,0.12)',  color: C.warn },
  approved:    { label: 'Aprobado',   bg: 'rgba(142,177,222,0.12)', color: C.info },
  in_progress: { label: 'En curso',   bg: 'rgba(125,190,147,0.12)', color: C.ok },
  finished:    { label: 'Finalizado', bg: 'rgba(125,190,147,0.07)', color: C.ok },
  cancelled:   { label: 'Cancelado',  bg: 'rgba(242,237,227,0.05)', color: C.piedra },
}

const QUOTE_STATUS = {
  draft:     { label: 'Borrador',          bg: 'rgba(242,237,227,0.07)', color: C.piedra },
  sent:      { label: 'Enviado',           bg: 'rgba(142,177,222,0.12)', color: C.info },
  approved:  { label: 'Aprobado',          bg: 'rgba(125,190,147,0.12)', color: C.ok },
  signed:    { label: 'Firmado',           bg: 'rgba(125,190,147,0.18)', color: C.ok },
  rejected:  { label: 'Rechazado',         bg: 'rgba(229,131,115,0.12)', color: C.err },
  cancelled: { label: 'Cancelado',         bg: 'rgba(229,131,115,0.08)', color: C.err },
  expired:   { label: 'Vencido',           bg: 'rgba(242,237,227,0.05)', color: C.piedra },
  pending:   { label: 'Pendiente',         bg: 'rgba(226,182,99,0.12)',  color: C.warn },
  paid:      { label: 'Pagado',            bg: 'rgba(125,190,147,0.12)', color: C.ok },
  overdue:   { label: 'Vencido',           bg: 'rgba(229,131,115,0.12)', color: C.err },
  partial:   { label: 'Cuotas pendientes', bg: 'rgba(226,182,99,0.12)',  color: C.warn },
}

// ── atoms ─────────────────────────────────────────────────────────────────────

function Badge({ bg, color, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '0 6px 6px 0',
      fontSize: 10.5, fontWeight: 600,
      background: bg, color,
    }}>
      {label}
    </span>
  )
}

function PanelHead({ title, count, to, linkLabel = 'Ver todos' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <h3 style={SECTION_TITLE}>{title}</h3>
        {count != null && (
          <span style={{ fontSize: 11, color: C.piedra, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            ({count})
          </span>
        )}
      </div>
      {to && (
        <Link
          to={to}
          style={{ fontSize: 11, color: C.piedra, textDecoration: 'none', transition: 'color 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.color = C.arena}
          onMouseLeave={e => e.currentTarget.style.color = C.piedra}
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canWrite = user?.role !== 'member'
  const qc = useQueryClient()
  const [tab, setTab]           = useState('info')
  const [editOpen, setEditOpen] = useState(false)
  const [historyVisible, setHistoryVisible] = useState(25)

  const { data: clientRes, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => getClientById(id).then(r => r.data.data)
  })

  const { data: projectsRes } = useQuery({
    queryKey: ['projects', { clientId: id }],
    queryFn: () => getProjects({ clientId: id, limit: 100 }).then(r => r.data)
  })

  const { data: quotesRes } = useQuery({
    queryKey: ['quotes', { clientId: id }],
    queryFn: () => getQuotes({ clientId: id, limit: 100 }).then(r => r.data)
  })

  const { data: historyData = [] } = useQuery({
    queryKey: ['client-history', id],
    queryFn: () => getClientHistory(id).then(r => r.data.data),
  })

  if (isLoading) return <div style={{ padding: '40px 24px', fontSize: 13, color: C.piedra, fontFamily: 'Geist, system-ui, sans-serif' }}>Cargando...</div>
  if (!clientRes) return <div style={{ padding: '40px 24px', fontSize: 13, color: C.piedra, fontFamily: 'Geist, system-ui, sans-serif' }}>Cliente no encontrado</div>

  const client   = clientRes
  const projects = projectsRes?.data || []
  const quotes   = quotesRes?.data || []
  const initials = client.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const tabBtn = (active) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '5px 12px', borderRadius: '0 7px 7px 0',
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    background: active ? C.s3 : 'transparent',
    color: active ? C.crema : C.piedra,
    border: 'none', transition: 'color 0.12s, background 0.12s',
  })

  return (
    <div style={{ padding: '28px 24px 40px', maxWidth: 1080, fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* Back */}
      <button
        onClick={() => navigate('/clients')}
        style={{
          fontSize: 12, color: C.piedra, background: 'none', border: 'none',
          cursor: 'pointer', marginBottom: 20, padding: 0, transition: 'color 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = C.arena}
        onMouseLeave={e => e.currentTarget.style.color = C.piedra}
      >
        ← Clientes
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, flexShrink: 0,
            background: C.s2, border: `1px solid ${C.linea}`,
            borderRadius: '0 12px 12px 0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: C.arena,
          }}>
            {initials}
          </div>
          <div className="min-w-0">
            <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema }}>{client.name}</h1>
            {client.company && <p style={{ fontSize: 13, color: C.piedra, marginTop: 2 }}>{client.company}</p>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          {canWrite && (
            <button
              onClick={() => setEditOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: '0 8px 8px 0',
                background: C.crema, color: C.bg,
                fontSize: 12.5, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#E8E3D9'}
              onMouseLeave={e => e.currentTarget.style.background = C.crema}
            >
              <AjustesIcon style={{ width: 12, height: 12 }} />
              Editar
            </button>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            padding: 4, background: C.s2, border: `1px solid ${C.linea}`,
            borderRadius: '0 10px 10px 0',
          }}>
            <button onClick={() => setTab('info')} style={tabBtn(tab === 'info')}>
              <ClienteIcon style={{ width: 11, height: 11 }} />
              Info
            </button>
            <button onClick={() => setTab('history')} style={tabBtn(tab === 'history')}>
              <AgendaIcon style={{ width: 11, height: 11 }} />
              Historial
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab: Info ────────────────────────────────────────────── */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Columna izquierda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Datos del cliente */}
            <div style={{ ...card, padding: '20px 24px' }}>
              <div style={{ marginBottom: 16 }}>
                <PanelHead title="Información" />
              </div>
              <dl style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Email',         value: client.email },
                  { label: 'Teléfono',      value: client.phone },
                  { label: 'Empresa',       value: client.company },
                  { label: 'CUIL / CUIT',   value: client.cuit },
                  { label: 'Dirección',     value: client.address },
                  { label: 'Provincia',     value: client.province },
                  { label: 'Ciudad',        value: client.city },
                  { label: 'Código postal', value: client.postalCode },
                ].map(({ label, value }) => value && (
                  <div key={label}>
                    <dt style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.piedra, marginBottom: 3 }}>
                      {label}
                    </dt>
                    <dd style={{ fontSize: 13, color: C.arena }}>{value}</dd>
                  </div>
                ))}
                {client.notes && (
                  <div>
                    <dt style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.piedra, marginBottom: 3 }}>
                      Notas
                    </dt>
                    <dd style={{ fontSize: 13, color: C.arena, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{client.notes}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Adjuntos */}
            <div style={{ ...card, padding: '20px 24px' }}>
              <AttachmentsPanel entityType="client" entityId={id} />
            </div>
          </div>

          {/* Columna principal */}
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Proyectos */}
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.linea}` }}>
                <PanelHead
                  title="Proyectos"
                  count={projects.length}
                  to={`/projects?clientId=${id}`}
                />
              </div>
              {projects.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px' }}>
                  <ProyectoIcon style={{ width: 14, height: 14, color: C.linea }} />
                  <p style={{ fontSize: 13, color: C.piedra }}>Sin proyectos</p>
                </div>
              ) : (
                <ul>
                  {projects.slice(0, 5).map((p, i) => {
                    const st = PROJECT_STATUS[p.status] ?? { label: p.status, bg: 'rgba(242,237,227,0.05)', color: C.piedra }
                    return (
                      <li
                        key={p.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                          padding: '11px 20px',
                          borderBottom: i < Math.min(projects.length, 5) - 1 ? `1px solid ${C.linea}` : 'none',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = C.s2}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ minWidth: 0 }}>
                          <Link
                            to={`/projects/${p.id}`}
                            style={{ fontSize: 13, fontWeight: 500, color: C.crema, textDecoration: 'none', transition: 'color 0.12s' }}
                            onMouseEnter={e => e.currentTarget.style.color = C.arena}
                            onMouseLeave={e => e.currentTarget.style.color = C.crema}
                          >
                            {p.title}
                          </Link>
                          {p.budget != null && (
                            <p style={{ fontSize: 11, color: C.piedra, marginTop: 2 }}>
                              ${Number(p.budget).toLocaleString('es-AR')}
                            </p>
                          )}
                        </div>
                        <Badge bg={st.bg} color={st.color} label={st.label} />
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Presupuestos */}
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.linea}` }}>
                <PanelHead
                  title="Presupuestos"
                  count={quotes.length}
                  to="/quotes"
                />
              </div>
              {quotes.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px' }}>
                  <PresupuestoIcon style={{ width: 14, height: 14, color: C.linea }} />
                  <p style={{ fontSize: 13, color: C.piedra }}>Sin presupuestos</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.s2, borderBottom: `1px solid ${C.linea}` }}>
                      {['N°', 'Estado', 'Total'].map(h => (
                        <th key={h} style={{ ...SECTION_TITLE, textAlign: 'left', padding: '10px 20px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.slice(0, 5).map((q, i) => {
                      const st = QUOTE_STATUS[q.status] ?? { label: q.status, bg: 'rgba(242,237,227,0.07)', color: C.piedra }
                      return (
                        <tr
                          key={q.id}
                          style={{ borderBottom: i < Math.min(quotes.length, 5) - 1 ? `1px solid ${C.linea}` : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = C.s2}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '11px 20px', fontWeight: 500, color: C.crema }}>{q.number}</td>
                          <td style={{ padding: '11px 20px' }}>
                            <Badge bg={st.bg} color={st.color} label={st.label} />
                          </td>
                          <td style={{
                            padding: '11px 20px', color: C.arena,
                            fontFamily: "'DanteUP Cifras', Geist, sans-serif",
                            fontWeight: 600,
                          }}>
                            {q.total != null ? `$${Number(q.total).toLocaleString('es-AR')}` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Tab: Historial ───────────────────────────────────────── */}
      {tab === 'history' && (
        <div style={{ ...card, overflow: 'hidden', maxWidth: 640 }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.linea}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AgendaIcon style={{ width: 14, height: 14, color: C.arena }} />
            <span style={SECTION_TITLE}>Historial</span>
            <span style={{ fontSize: 11, color: C.piedra }}>({historyData.length})</span>
          </div>
          {historyData.length === 0 ? (
            <p style={{ padding: '24px 20px', fontSize: 13, color: C.piedra }}>Sin movimientos registrados.</p>
          ) : (
            <div style={{ padding: '20px' }}>
              {historyData.slice(0, historyVisible).map((entry, i) => {
                const initials = entry.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                const date    = new Date(entry.createdAt)
                const dateStr = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
                const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                const shown   = historyData.slice(0, historyVisible)
                return (
                  <div key={entry.id} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: 28, height: 28, flexShrink: 0,
                        background: C.s3, border: `1px solid ${C.linea}`,
                        borderRadius: '0 7px 7px 0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: C.arena,
                      }}>
                        {initials}
                      </div>
                      {i < shown.length - 1 && (
                        <div style={{ width: 1, flex: 1, background: C.linea, margin: '3px 0', minHeight: 12 }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: 14, flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0 6px' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.crema }}>{entry.user.name}</span>
                        <span style={{ fontSize: 13, color: C.piedra }}>
                          {entry.action === 'created' ? 'creó el cliente' : 'actualizó'}
                          {entry.detail && <span style={{ color: C.arena }}> · {entry.detail}</span>}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: C.piedra, marginTop: 2 }}>{dateStr} · {timeStr}</p>
                    </div>
                  </div>
                )
              })}
              {historyData.length > historyVisible && (
                <button
                  onClick={() => setHistoryVisible(v => v + 25)}
                  style={{
                    marginTop: 4, width: '100%', padding: '10px 0',
                    fontSize: 12, color: C.piedra,
                    border: `1px dashed ${C.linea}`,
                    borderRadius: '0 12px 12px 0',
                    background: 'none', cursor: 'pointer',
                  }}
                >
                  Mostrar más ({historyData.length - historyVisible} restante{historyData.length - historyVisible !== 1 ? 's' : ''})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {editOpen && (
        <ClientModal
          client={client}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false)
            qc.invalidateQueries(['client', id])
            qc.invalidateQueries(['clients'])
          }}
        />
      )}
    </div>
  )
}
