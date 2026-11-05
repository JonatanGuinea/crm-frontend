import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { getMemberships, deleteMembership } from '../../api/memberships'
import { getCashAccounts } from '../../api/finances'
import { getOrganizations } from '../../api/organizations'
import { MembresiaIcon, MasIcon } from '../../components/DuIcons'
import { fmt } from '../../utils/fmt'
import MembershipModal from './MembershipModal'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }
const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"
const card   = { background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0' }

const MEMBERSHIP_STATUS = {
  active:    { label: 'Activa',    bg: 'rgba(125,190,147,0.12)', color: C.ok },
  paused:    { label: 'Pausada',   bg: 'rgba(226,182,99,0.12)',  color: C.warn },
  cancelled: { label: 'Cancelada', bg: 'rgba(242,237,227,0.07)', color: C.piedra },
}

const TABS = [
  { value: '',          label: 'Todas' },
  { value: 'active',    label: 'Activas' },
  { value: 'paused',    label: 'Pausadas' },
  { value: 'cancelled', label: 'Canceladas' },
]

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  : '—'

function TrashSvg() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
}

function StatusBadge({ status }) {
  const s = MEMBERSHIP_STATUS[status] ?? MEMBERSHIP_STATUS.active
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '0 6px 6px 0', fontSize: 10.5, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function OverdueBadge({ count }) {
  if (!count) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '0 6px 6px 0', fontSize: 10.5, fontWeight: 600, background: 'rgba(229,131,115,0.12)', color: C.err, whiteSpace: 'nowrap' }}>
      {count} atrasado{count !== 1 ? 's' : ''}
    </span>
  )
}

function KpiCard({ label, value, sub, valueColor = C.crema, loading }) {
  return (
    <div className="p-3 md:p-5" style={{ ...card, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.piedra, lineHeight: 1.3 }}>{label}</p>
      {loading
        ? <div className="du-skeleton" style={{ height: 28, width: '60%' }} />
        : <p className="text-xl md:text-3xl" style={{ fontFamily: CIFRAS, fontWeight: 700, color: valueColor, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
      }
      {!loading && sub && <p style={{ fontSize: 12, color: C.piedra }}>{sub}</p>}
    </div>
  )
}

export default function MembershipsPage() {
  const qc      = useQueryClient()
  const toast   = useToast()
  const confirm = useConfirm()
  const { user } = useAuth()
  const [status, setStatus] = useState('')
  const [modal,  setModal]  = useState(null) // null | 'new' | membership

  const { data, isLoading } = useQuery({
    queryKey: ['memberships', status],
    queryFn: () => getMemberships(status ? { status } : {}).then(r => r.data.data),
  })
  const items   = data?.items ?? []
  const summary = data?.summary

  const { data: accounts = [] } = useQuery({
    queryKey: ['cash-accounts'],
    queryFn: () => getCashAccounts().then(r => r.data.data),
  })
  const activeAccounts = accounts.filter(a => a.status === 'active')

  const { data: orgData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations().then(r => r.data.data),
    select: (orgs) => orgs?.find(o => o.id === user?.org),
  })
  const currency = orgData?.defaultCurrency ?? 'ARS'

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['memberships'] })
    qc.invalidateQueries({ queryKey: ['finances-dashboard'] })
  }

  async function handleDelete(m) {
    const ok = await confirm(`¿Eliminar la membresía "${m.name}" de ${m.client?.name}? Se borran sus cobros pendientes; los ya cobrados quedan en Finanzas.`)
    if (!ok) return
    try {
      await deleteMembership(m.id)
      toast('Membresía eliminada', 'success')
      invalidate()
    } catch (err) {
      toast(err.response?.data?.error || 'Error al eliminar', 'error')
    }
  }

  const tdStyle = { padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, color: C.arena }

  return (
    <div style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* Header */}
      <div className="px-4 pt-5 pb-4 md:px-6 md:pt-7" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: `1px solid ${C.linea}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MembresiaIcon style={{ width: 18, height: 18, color: C.arena }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema, margin: 0 }}>Membresías</h2>
        </div>
        <button onClick={() => setModal('new')} disabled={activeAccounts.length === 0}
          title={activeAccounts.length === 0 ? 'Primero creá una cuenta en Finanzas' : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: C.crema, color: C.bg, borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: activeAccounts.length === 0 ? 'not-allowed' : 'pointer', opacity: activeAccounts.length === 0 ? 0.5 : 1 }}>
          <MasIcon style={{ width: 12, height: 12 }} />
          <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      <div className="px-4 pt-6 pb-10 md:px-6" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3" style={{ gap: 12 }}>
          <KpiCard loading={isLoading} label="Ingreso mensual recurrente" value={fmt(summary?.monthlyRevenue ?? 0, currency)} sub="Suma de membresías activas" />
          <KpiCard loading={isLoading} label="Membresías activas" value={summary?.activeCount ?? 0} />
          <KpiCard loading={isLoading} label="Cobros atrasados"
            value={fmt(summary?.overdueAmount ?? 0, currency)}
            sub={summary?.overdueCount ? `${summary.overdueCount} cobro${summary.overdueCount !== 1 ? 's' : ''} sin confirmar` : 'Todo al día'}
            valueColor={summary?.overdueCount ? C.err : C.crema} />
        </div>

        {/* Filtro de estado */}
        <div style={{ display: 'flex', gap: 3, padding: 4, height: 34, background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 10px 10px 0', alignSelf: 'flex-start', maxWidth: '100%', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.value} onClick={() => setStatus(t.value)}
              style={{ padding: '0 10px', borderRadius: '0 7px 7px 0', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: status === t.value ? C.s3 : 'transparent', color: status === t.value ? C.crema : C.piedra }}>
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="du-skeleton" style={{ height: 160, borderRadius: '0 16px 16px 0' }} />
        ) : items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '48px 0', border: `1px dashed ${C.linea}`, borderRadius: '0 12px 12px 0' }}>
            <MembresiaIcon style={{ width: 28, height: 28, color: C.piedra, opacity: 0.3 }} />
            <p style={{ fontSize: 13, color: C.piedra }}>
              {status ? 'No hay membresías con este estado.' : 'Todavía no hay membresías. Creá la primera con "Nueva".'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="flex flex-col md:hidden" style={{ gap: 10 }}>
              {items.map(m => (
                <div key={m.id} style={{ ...card, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.crema, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.client?.name}</p>
                      <p style={{ fontSize: 12, color: C.piedra, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                    </div>
                    <span style={{ fontFamily: CIFRAS, fontSize: 15, fontWeight: 700, color: C.crema, flexShrink: 0 }}>{fmt(m.amount, currency)}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <StatusBadge status={m.status} />
                    <OverdueBadge count={m.overdueCount} />
                    <span style={{ fontSize: 11.5, color: C.piedra }}>
                      {m.status === 'active' && m.nextChargeDate ? `Próximo cobro: ${fmtDate(m.nextChargeDate)}` : `Día ${m.billingDay} de cada mes`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: `1px solid ${C.linea}` }}>
                    <button onClick={() => setModal(m)}
                      style={{ flex: 1, padding: '6px 0', fontSize: 12, borderRadius: '0 7px 7px 0', border: 'none', background: C.linea, color: C.crema, cursor: 'pointer' }}>
                      Editar
                    </button>
                    <button onClick={() => handleDelete(m)}
                      style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0 7px 7px 0', border: 'none', background: C.s2, color: C.err, cursor: 'pointer' }}>
                      <TrashSvg />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: tabla */}
            <div className="hidden md:block" style={{ ...card, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Cliente', 'Membresía', 'Monto', 'Próximo cobro', 'Estado', ''].map(h => (
                      <th key={h} style={{ background: C.linea, color: C.crema, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 14px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(m => (
                    <tr key={m.id}
                      onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = C.s2)}
                      onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = 'transparent')}>
                      <td style={{ ...tdStyle, color: C.crema, fontWeight: 500 }}>
                        <Link to={`/clients/${m.client?.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{m.client?.name}</Link>
                      </td>
                      <td style={tdStyle}>
                        {m.name}
                        <p style={{ fontSize: 11, color: C.piedra, marginTop: 2 }}>Día {m.billingDay} · {m.account?.name}</p>
                      </td>
                      <td style={{ ...tdStyle, fontFamily: CIFRAS, fontWeight: 600, color: C.crema, whiteSpace: 'nowrap' }}>{fmt(m.amount, currency)}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{m.status === 'active' ? fmtDate(m.nextChargeDate) : '—'}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <StatusBadge status={m.status} />
                          <OverdueBadge count={m.overdueCount} />
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                          <button onClick={() => setModal(m)}
                            style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '0 7px 7px 0', background: C.linea, color: C.crema, fontSize: 11.5, border: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.background = C.s3}
                            onMouseLeave={e => e.currentTarget.style.background = C.linea}>
                            Editar
                          </button>
                          <button onClick={() => handleDelete(m)} title="Eliminar"
                            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderRadius: '0 6px 6px 0', color: C.piedra, cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.color = C.err; e.currentTarget.style.background = 'rgba(229,131,115,0.12)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.background = 'none' }}>
                            <TrashSvg />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {modal && (
        <MembershipModal
          membership={modal === 'new' ? null : modal}
          accounts={activeAccounts}
          defaultAccountId={orgData?.defaultCashAccountId}
          currency={currency}
          onClose={() => setModal(null)}
          onSaved={() => {
            toast(modal === 'new' ? 'Membresía creada' : 'Membresía actualizada', 'success')
            setModal(null)
            invalidate()
          }}
        />
      )}
    </div>
  )
}
