import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getClients, getAllClientsHistory } from '../../api/clients'
import ClientModal from './ClientModal'
import { useAuth } from '../../context/AuthContext'
import {
  ClienteIcon,
  BuscarIcon,
  MasIcon,
  AgendaIcon,
  ProyectoIcon,
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

const PAGE_SIZE = 15

// ── component ─────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { user } = useAuth()
  const canWrite = user?.role !== 'member'
  const qc = useQueryClient()
  const [tab, setTab]         = useState('table')
  const [search, setSearch]   = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [modalOpen, setModalOpen] = useState(false)
  const [historyVisible, setHistoryVisible] = useState(25)

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => getClients({ ...(search ? { name: search } : {}), limit: 500 }).then(r => r.data)
  })

  const { data: historyData = [] } = useQuery({
    queryKey: ['clients-history'],
    queryFn: () => getAllClientsHistory().then(r => r.data.data),
    enabled: tab === 'history',
  })

  function handleSearch(val) { setSearch(val); setVisible(PAGE_SIZE) }

  const allClients  = data?.data ?? []
  const shownClients = allClients.slice(0, visible)
  const hasMore     = allClients.length > visible

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

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ClienteIcon style={{ width: 18, height: 18, color: C.arena }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema }}>Clientes</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            padding: 4, background: C.s2, border: `1px solid ${C.linea}`,
            borderRadius: '0 10px 10px 0',
          }}>
            <button onClick={() => setTab('table')} style={tabBtn(tab === 'table')}>
              <ProyectoIcon style={{ width: 11, height: 11 }} />
              Tabla
            </button>
            <button onClick={() => setTab('history')} style={tabBtn(tab === 'history')}>
              <AgendaIcon style={{ width: 11, height: 11 }} />
              Historial
            </button>
          </div>

          {canWrite && tab === 'table' && (
            <button
              onClick={() => setModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '0 14px', borderRadius: '0 8px 8px 0',
                alignSelf: 'stretch',
                background: C.crema, color: C.bg,
                fontSize: 12.5, fontWeight: 600,
                border: 'none', cursor: 'pointer', flexShrink: 0,
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#E8E3D9'}
              onMouseLeave={e => e.currentTarget.style.background = C.crema}
            >
              <MasIcon style={{ width: 12, height: 12 }} />
              Nuevo cliente
            </button>
          )}
        </div>
      </div>

      {/* ── Historial ─────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div style={{ maxWidth: 580 }}>
          {historyData.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 12 }}>
              <AgendaIcon style={{ width: 36, height: 36, color: C.linea }} />
              <p style={{ fontSize: 13, color: C.piedra }}>Sin movimientos registrados.</p>
            </div>
          ) : (
            <div>
              {historyData.slice(0, historyVisible).map((entry, i) => {
                const initials = entry.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                const date     = new Date(entry.createdAt)
                const dateStr  = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
                const timeStr  = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                const shown    = historyData.slice(0, historyVisible)
                return (
                  <div key={entry.id} style={{ display: 'flex', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: 32, height: 32, flexShrink: 0,
                        background: C.s2, border: `1px solid ${C.linea}`,
                        borderRadius: '0 8px 8px 0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10.5, fontWeight: 700, color: C.arena,
                      }}>
                        {initials}
                      </div>
                      {i < shown.length - 1 && (
                        <div style={{ width: 1, flex: 1, background: C.linea, margin: '4px 0', minHeight: 16 }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: 16, flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0 6px' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.crema }}>{entry.user.name}</span>
                        <span style={{ fontSize: 13, color: C.piedra }}>
                          {entry.action === 'created' ? 'creó el cliente' : 'actualizó'}
                          {entry.detail && <span style={{ color: C.arena }}> · {entry.detail}</span>}
                        </span>
                      </div>
                      <Link
                        to={`/clients/${entry.client.id}`}
                        style={{ fontSize: 12, color: C.info, textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                      >
                        {entry.client.name}
                      </Link>
                      <p style={{ fontSize: 11, color: C.piedra, marginTop: 2 }}>{dateStr} · {timeStr}</p>
                    </div>
                  </div>
                )
              })}
              {historyData.length > historyVisible && (
                <button
                  onClick={() => setHistoryVisible(v => v + 25)}
                  style={{
                    marginTop: 8, width: '100%', padding: '10px 0',
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

      {/* ── Tabla ─────────────────────────────────────────────────── */}
      {tab === 'table' && (
        <>
          {/* Búsqueda */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, maxWidth: 320 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <BuscarIcon style={{
                width: 13, height: 13, color: C.piedra,
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
                className="placeholder:text-[#8C877E]"
                style={{
                  width: '100%', height: 38, paddingLeft: 34, paddingRight: 12,
                  background: C.bg, border: `1px solid ${C.linea}`,
                  borderRadius: '0 10px 10px 0', color: C.crema,
                  fontSize: 13, boxSizing: 'border-box', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = C.arena}
                onBlur={e => e.target.style.borderColor = C.linea}
              />
            </div>
            {search && (
              <button
                onClick={() => handleSearch('')}
                style={{ fontSize: 11, color: C.err, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', flexShrink: 0 }}
              >
                Limpiar
              </button>
            )}
          </div>

          {isLoading ? (
            <p style={{ fontSize: 13, color: C.piedra }}>Cargando...</p>
          ) : (
            <>
              {/* Desktop: tabla */}
              <div className="hidden md:block" style={{ ...card, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: C.linea }}>
                        {['Cliente', 'Email', 'Empresa', 'Teléfono', ''].map((h, i) => (
                          <th key={i} style={{
                            textAlign: 'left', padding: '11px 20px',
                            fontSize: 11, fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            color: C.crema,
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shownClients.map(c => (
                        <tr
                          key={c.id}
                          style={{ borderBottom: `1px solid ${C.linea}` }}
                          onMouseEnter={e => e.currentTarget.style.background = C.s2}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 30, height: 30, flexShrink: 0,
                                background: C.s3, borderRadius: '0 7px 7px 0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10.5, fontWeight: 700, color: C.arena,
                              }}>
                                {c.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 500, color: C.crema }}>{c.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 20px', color: C.piedra }}>{c.email || '—'}</td>
                          <td style={{ padding: '12px 20px', color: C.piedra }}>{c.company || '—'}</td>
                          <td style={{ padding: '12px 20px', color: C.piedra }}>{c.phone || '—'}</td>
                          <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                            <Link
                              to={`/clients/${c.id}`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '5px 12px', borderRadius: '0 7px 7px 0',
                                background: C.linea, color: C.crema,
                                fontSize: 12, fontWeight: 600,
                                textDecoration: 'none', transition: 'background 0.12s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = C.s3}
                              onMouseLeave={e => e.currentTarget.style.background = C.linea}
                            >
                              Ver →
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {!allClients.length && (
                        <tr>
                          <td colSpan={5} style={{ padding: '32px 20px', textAlign: 'center', color: C.piedra, fontSize: 13 }}>
                            Sin clientes
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile: cards */}
              <div className="md:hidden">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {shownClients.map(c => (
                  <div key={c.id} style={{ ...card, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{
                        width: 38, height: 38, flexShrink: 0,
                        background: C.s2, border: `1px solid ${C.linea}`,
                        borderRadius: '0 10px 10px 0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11.5, fontWeight: 700, color: C.arena,
                      }}>
                        {c.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: C.crema }}>{c.name}</p>
                        {c.company && <p style={{ fontSize: 11, color: C.piedra }}>{c.company}</p>}
                      </div>
                    </div>
                    {(c.email || c.phone) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                        {c.email && <p style={{ fontSize: 12, color: C.piedra }}>{c.email}</p>}
                        {c.phone && <p style={{ fontSize: 12, color: C.piedra }}>{c.phone}</p>}
                      </div>
                    )}
                    <div style={{ borderTop: `1px solid ${C.linea}`, paddingTop: 12 }}>
                      <Link
                        to={`/clients/${c.id}`}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '8px 0', borderRadius: '0 8px 8px 0',
                          background: C.s2, border: `1px solid ${C.linea}`,
                          color: C.arena, fontSize: 12, fontWeight: 500,
                          textDecoration: 'none',
                        }}
                      >
                        Ver detalle →
                      </Link>
                    </div>
                  </div>
                ))}
                {!allClients.length && (
                  <p style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: C.piedra }}>Sin clientes</p>
                )}
              </div>
              </div>

              {hasMore && (
                <button
                  onClick={() => setVisible(v => v + PAGE_SIZE)}
                  style={{
                    marginTop: 16, width: '100%', padding: '10px 0',
                    fontSize: 13, color: C.piedra,
                    border: `1px dashed ${C.linea}`,
                    borderRadius: '0 12px 12px 0',
                    background: 'none', cursor: 'pointer',
                  }}
                >
                  Ver más ({allClients.length - visible} restante{allClients.length - visible !== 1 ? 's' : ''})
                </button>
              )}
            </>
          )}
        </>
      )}

      {modalOpen && (
        <ClientModal
          client={null}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); qc.invalidateQueries(['clients']) }}
        />
      )}
    </div>
  )
}
