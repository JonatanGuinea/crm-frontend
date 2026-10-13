import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCashAccounts, createCashAccount, updateCashAccount, deleteCashAccount, setDefaultCashAccount } from '../../api/finances'
import TransferModal from './TransferModal'
import { getOrganizations } from '../../api/organizations'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { useAuth } from '../../context/AuthContext'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

// ── inline SVGs ────────────────────────────────────────────────────────────────

function CloseSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}
function ChevronLSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
}
function PlusSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}
function PencilSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function TrashSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
}
function WalletSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V22H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" /><path d="M20 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2v-6h-2z" /><circle cx="17" cy="15" r=".5" fill="currentColor" /></svg>
}
function BankSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" /></svg>
}
function PhoneSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
}
function TransferSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
}
function StarSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
}
function StarFillSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
}

const ACCOUNT_TYPE_ICONS  = { cash: WalletSvg, bank: BankSvg, virtual: PhoneSvg }
const ACCOUNT_TYPE_LABELS = { cash: 'Efectivo', bank: 'Cuenta bancaria', virtual: 'Billetera virtual' }
const fmt = (n) => Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function AccountModal({ account, currency, onClose, onSaved }) {
  const toast  = useToast()
  const isEdit = !!account
  const [form, setForm] = useState({
    name:           account?.name ?? '',
    type:           account?.type ?? 'cash',
    currency,
    initialBalance: account?.initialBalance ?? 0,
    description:    account?.description ?? '',
    status:         account?.status ?? 'active',
  })
  const [saving, setSaving] = useState(false)

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast('Ingresá un nombre', 'error')
    setSaving(true)
    try {
      const payload = { ...form, initialBalance: Number(form.initialBalance) }
      if (isEdit) await updateCashAccount(account.id, payload)
      else        await createCashAccount(payload)
      onSaved()
    } catch (err) {
      toast(err.response?.data?.error || err.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = { fontSize: 11, fontWeight: 500, color: C.piedra }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      className="items-end sm:items-center">
      <div style={{ width: '100%', maxWidth: 448, background: C.s1, borderRadius: '0 16px 0 0', border: `1px solid ${C.linea}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
        className="sm:rounded-[0_16px_16px_0]">

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}`, flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.crema }}>{isEdit ? 'Editar cuenta' : 'Nueva cuenta'}</span>
          <button onClick={onClose}
            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
            <CloseSvg style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Nombre</label>
            <input type="text" placeholder="Ej: Caja principal, Cuenta Santander…"
              value={form.name} onChange={e => set('name', e.target.value)}
              className="du-input" required autoFocus />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Tipo de cuenta</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, label]) => {
                const Icon    = ACCOUNT_TYPE_ICONS[k]
                const isSel   = form.type === k
                return (
                  <button key={k} type="button" onClick={() => set('type', k)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 8px', borderRadius: '0 10px 10px 0', border: `1px solid ${isSel ? C.crema : C.linea}`, background: isSel ? 'rgba(242,237,227,0.08)' : 'transparent', color: isSel ? C.crema : C.piedra, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                    <Icon style={{ width: 18, height: 18 }} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {!isEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>Saldo inicial</label>
              <div style={{ display: 'flex', overflow: 'hidden', border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0' }}>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', borderRight: `1px solid ${C.linea}`, background: C.s2, fontSize: 11, fontWeight: 500, color: C.piedra, flexShrink: 0 }}>{currency}</span>
                <input type="number" step="0.01" value={form.initialBalance} onChange={e => set('initialBalance', e.target.value)}
                  style={{ flex: 1, minWidth: 0, background: C.s2, color: C.crema, fontSize: 13, padding: '0 12px', height: 36, outline: 'none', border: 'none' }} />
              </div>
            </div>
          )}

          {isEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>Estado</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="du-input">
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Descripción <span style={{ fontWeight: 400, color: C.piedra }}>opcional</span></label>
            <input type="text" placeholder="Ej: Cuenta para gastos corrientes"
              value={form.description} onChange={e => set('description', e.target.value)} className="du-input" />
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4, paddingBottom: 8 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: `1px solid ${C.linea}`, background: 'none', color: C.piedra, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AccountsPage() {
  const toast   = useToast()
  const confirm = useConfirm()
  const qc      = useQueryClient()
  const { user } = useAuth()
  const [modal,         setModal]         = useState(null)
  const [transferModal, setTransferModal] = useState(false)

  const { data: orgData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations().then(r => r.data.data),
    select: (orgs) => orgs?.find(o => o.id === user?.org),
  })
  const orgCurrency  = orgData?.defaultCurrency      ?? 'ARS'
  const defaultAccId = orgData?.defaultCashAccountId ?? null

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['cash-accounts'],
    queryFn: () => getCashAccounts().then(r => r.data.data),
  })

  function invalidate() {
    qc.invalidateQueries(['cash-accounts'])
    qc.invalidateQueries(['finances-dashboard'])
    qc.invalidateQueries(['organizations'])
  }

  async function handleSetDefault(acc) {
    try {
      await setDefaultCashAccount(acc.id)
      toast(`"${acc.name}" es ahora la cuenta predeterminada`, 'success')
      invalidate()
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error')
    }
  }

  async function handleDelete(acc) {
    const ok = await confirm(
      `¿Eliminar "${acc.name}"? Solo se puede si no tiene movimientos asociados.`,
      { confirmLabel: 'Eliminar', danger: true }
    )
    if (!ok) return
    try {
      await deleteCashAccount(acc.id)
      toast('Cuenta eliminada', 'success')
      invalidate()
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error')
    }
  }

  return (
    <div style={{ padding: '20px 24px 40px', fontFamily: 'Geist, system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 12, color: C.piedra }}>{accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} configurada{accounts.length !== 1 ? 's' : ''}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={() => setTransferModal(true)} disabled={accounts.length < 2}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', background: 'none', color: C.piedra, fontSize: 13, fontWeight: 500, cursor: accounts.length < 2 ? 'not-allowed' : 'pointer', opacity: accounts.length < 2 ? 0.4 : 1 }}
            onMouseEnter={e => { if (accounts.length >= 2) { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena } }}
            onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
            <TransferSvg style={{ width: 14, height: 14 }} />
            <span className="hidden sm:inline">Transferir</span>
          </button>
          <button onClick={() => setModal({ create: true })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: C.crema, color: C.bg, borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <PlusSvg style={{ width: 13, height: 13 }} />
            <span className="hidden sm:inline">Nueva cuenta</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', fontSize: 13, color: C.piedra }}>Cargando…</div>
      ) : accounts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '60px 24px', border: `1px dashed ${C.linea}`, borderRadius: '0 16px 16px 0' }}>
          <WalletSvg style={{ width: 36, height: 36, color: C.piedra, opacity: 0.4 }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: C.crema }}>Sin cuentas aún</p>
            <p style={{ fontSize: 12, color: C.piedra, marginTop: 4 }}>Creá tu primera cuenta para empezar a registrar movimientos.</p>
          </div>
          <button onClick={() => setModal({ create: true })}
            style={{ padding: '9px 18px', borderRadius: '0 9px 9px 0', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Crear primera cuenta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const Icon       = ACCOUNT_TYPE_ICONS[acc.type] ?? WalletSvg
            const bal        = Number(acc.currentBalance)
            const isInactive = acc.status === 'inactive'
            const isDefault  = defaultAccId === acc.id
            return (
              <div key={acc.id}
                style={{ background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, opacity: isInactive ? 0.6 : 1 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '0 10px 10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isInactive ? C.s3 : 'rgba(242,237,227,0.08)' }}>
                      <Icon style={{ width: 18, height: 18, color: isInactive ? C.piedra : C.crema }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.crema, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</p>
                      <p style={{ fontSize: 11, color: C.piedra, textTransform: 'capitalize' }}>{ACCOUNT_TYPE_LABELS[acc.type]}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {isDefault ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, color: C.warn, background: 'rgba(226,182,99,0.1)', padding: '2px 8px', borderRadius: '0 6px 6px 0' }}>
                        <StarFillSvg style={{ width: 10, height: 10 }} /> Predeterminada
                      </span>
                    ) : (
                      <button onClick={() => handleSetDefault(acc)} title="Establecer como predeterminada"
                        style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex' }}
                        onMouseEnter={e => e.currentTarget.style.color = C.warn}
                        onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                        <StarSvg style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                    {isInactive && (
                      <span style={{ fontSize: 10.5, color: C.piedra, background: C.s3, padding: '1px 7px', borderRadius: '0 4px 4px 0' }}>Inactiva</span>
                    )}
                  </div>
                </div>

                {/* Saldo */}
                <div style={{ padding: '10px 14px', borderRadius: '0 10px 10px 0', background: C.s3, border: `1px solid ${C.linea}` }}>
                  <p style={{ fontSize: 11, color: C.piedra, marginBottom: 4 }}>Saldo actual</p>
                  <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: bal >= 0 ? C.crema : C.err }}>${fmt(bal)}</p>
                  {Number(acc.initialBalance) !== 0 && (
                    <p style={{ fontSize: 11, color: C.piedra, marginTop: 3 }}>Inicial: ${fmt(acc.initialBalance)}</p>
                  )}
                </div>

                {acc.description && (
                  <p style={{ fontSize: 11.5, color: C.piedra }}>{acc.description}</p>
                )}

                {/* Acciones */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: `1px solid ${C.linea}` }}>
                  <button onClick={() => setModal({ edit: acc })}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: '0 8px 8px 0', fontSize: 12, fontWeight: 500, color: C.piedra, border: `1px solid ${C.linea}`, background: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
                    <PencilSvg style={{ width: 12, height: 12 }} /> Editar
                  </button>
                  <button onClick={() => handleDelete(acc)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: '0 8px 8px 0', fontSize: 12, fontWeight: 500, color: C.err, border: `1px solid rgba(229,131,115,0.2)`, background: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,131,115,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <TrashSvg style={{ width: 12, height: 12 }} /> Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(modal?.create || modal?.edit) && (
        <AccountModal
          account={modal.edit}
          currency={orgCurrency}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); invalidate() }}
        />
      )}
      {transferModal && (
        <TransferModal
          accounts={accounts}
          onClose={() => setTransferModal(false)}
          onSaved={() => { setTransferModal(false); invalidate() }}
        />
      )}
    </div>
  )
}
