import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCashAccounts } from '../api/finances'
import { CobroIcon } from '../components/DuIcons'
import MovementModal from '../pages/finances/MovementModal'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373' }

function ChevronLSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
}
function ChevronRSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
}
function PlusSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}

const NAV_TABS = [
  { label: 'Resumen',     to: '/finances',            exact: true },
  { label: 'Movimientos', to: '/finances/movements',  exact: false },
  { label: 'Cuentas',     to: '/finances/accounts',   exact: false },
  { label: 'Categorías',  to: '/finances/categories', exact: false },
]

export default function FinancesLayout() {
  const location = useLocation()
  const qc       = useQueryClient()
  const isResumen = location.pathname === '/finances'

  const [movementModal, setMovementModal] = useState(null)
  const _now = new Date()
  const [selectedMonth, setSelectedMonth] = useState({ year: _now.getFullYear(), month: _now.getMonth() + 1 })

  function prevMonth() {
    setSelectedMonth(({ year, month }) => month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 })
  }
  function nextMonth() {
    setSelectedMonth(({ year, month }) => month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 })
  }

  const isCurrentMonth = selectedMonth.year === _now.getFullYear() && selectedMonth.month === _now.getMonth() + 1
  const monthLabel = new Date(selectedMonth.year, selectedMonth.month - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  const { data: accounts = [] } = useQuery({
    queryKey: ['cash-accounts'],
    queryFn: () => getCashAccounts().then(r => r.data.data),
  })

  function invalidate() {
    qc.invalidateQueries(['finances-dashboard'])
    qc.invalidateQueries(['cash-movements'])
  }

  function isActive(tab) {
    return tab.exact
      ? location.pathname === tab.to
      : location.pathname.startsWith(tab.to)
  }

  return (
    <div style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-4 md:px-6 md:pt-7" style={{ display: 'flex', flexDirection: 'column', gap: 16, borderBottom: `1px solid ${C.linea}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CobroIcon style={{ width: 18, height: 18, color: C.arena }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema, margin: 0 }}>Finanzas</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {isResumen && (
              <div style={{ display: 'flex', alignItems: 'center', height: 34, background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 10px 10px 0', padding: '0 4px' }}>
                <button onClick={prevMonth}
                  style={{ padding: 5, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.crema}
                  onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                  <ChevronLSvg style={{ width: 14, height: 14 }} />
                </button>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.crema, textTransform: 'capitalize', padding: '0 8px', minWidth: 112, textAlign: 'center' }}>
                  {monthLabel}
                </span>
                <button onClick={nextMonth} disabled={isCurrentMonth}
                  style={{ padding: 5, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: isCurrentMonth ? 'not-allowed' : 'pointer', color: isCurrentMonth ? C.linea : C.piedra, display: 'flex' }}
                  onMouseEnter={e => { if (!isCurrentMonth) e.currentTarget.style.color = C.crema }}
                  onMouseLeave={e => { if (!isCurrentMonth) e.currentTarget.style.color = C.piedra }}>
                  <ChevronRSvg style={{ width: 14, height: 14 }} />
                </button>
              </div>
            )}
            <button onClick={() => setMovementModal('income')} disabled={accounts.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 5, height: 34, padding: '0 14px', background: C.crema, color: C.bg, borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: accounts.length === 0 ? 'not-allowed' : 'pointer', opacity: accounts.length === 0 ? 0.4 : 1 }}>
              <PlusSvg style={{ width: 13, height: 13 }} />
              Nuevo movimiento
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {NAV_TABS.map(tab => {
            const active = isActive(tab)
            return (
              <Link key={tab.to} to={tab.to}
                style={{ padding: '6px 14px', borderRadius: '0 8px 8px 0', border: `1px solid ${active ? C.linea : C.linea}`, background: active ? C.crema : 'transparent', color: active ? C.bg : C.piedra, fontSize: 13, fontWeight: active ? 600 : 500, textDecoration: 'none', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea } }}>
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Section title ── */}
      {!isResumen && (() => {
        const titles = {
          '/finances/movements':  'Movimientos',
          '/finances/accounts':   'Cuentas',
          '/finances/categories': 'Categorías',
        }
        const title = titles[location.pathname]
        return title ? (
          <div style={{ padding: '20px 24px 0' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', color: C.crema, margin: 0 }}>{title}</h3>
          </div>
        ) : null
      })()}

      {/* ── Content ── */}
      <Outlet context={{ selectedMonth, setSelectedMonth }} />

      {movementModal && (
        <MovementModal
          defaultType={movementModal}
          accounts={accounts}
          onClose={() => setMovementModal(null)}
          onSaved={() => { setMovementModal(null); invalidate() }}
        />
      )}
    </div>
  )
}
