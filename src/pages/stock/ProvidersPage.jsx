import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../api/stock'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { useAuth } from '../../context/AuthContext'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

function PlusSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}
function PencilSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function TrashSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
}
function SearchSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
}
function CloseSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}
function StoreSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
}
function MailSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
}
function PhoneSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.55 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.17a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
}
function GlobeSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
}

const WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.531 5.847L.057 23.882l6.196-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.031-1.388l-.361-.214-3.736.873.936-3.629-.235-.373A9.775 9.775 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z'

function WhatsAppButton({ phone, name, toast }) {
  const icon = <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="currentColor"><path d={WA_PATH} /></svg>
  if (phone) {
    return (
      <a href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
        title={`WhatsApp ${name}`}
        style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'rgba(125,190,147,0.12)', color: C.ok, display: 'flex', flexShrink: 0 }}>
        {icon}
      </a>
    )
  }
  return (
    <button onClick={() => toast('Agregá un número de teléfono al proveedor para usar WhatsApp', 'error')}
      title="Sin número de contacto"
      style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', color: C.piedra, opacity: 0.35, cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
      {icon}
    </button>
  )
}

function SupplierModal({ supplier, onClose }) {
  const qc    = useQueryClient()
  const toast = useToast()
  const isEdit = Boolean(supplier)

  const [form, setForm] = useState({
    name:    supplier?.name    ?? '',
    email:   supplier?.email   ?? '',
    phone:   supplier?.phone   ?? '',
    address: supplier?.address ?? '',
    website: supplier?.website ?? '',
    notes:   supplier?.notes   ?? '',
  })

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateSupplier(supplier.id, data) : createSupplier(data),
    onSuccess: () => {
      qc.invalidateQueries(['suppliers'])
      toast(isEdit ? 'Proveedor actualizado' : 'Proveedor creado', 'success')
      onClose()
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al guardar', 'error'),
  })

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast('El nombre es requerido', 'error')
    mutation.mutate({
      name:    form.name.trim(),
      email:   form.email.trim()   || undefined,
      phone:   form.phone.trim()   || undefined,
      address: form.address.trim() || undefined,
      website: form.website.trim() || undefined,
      notes:   form.notes.trim()   || undefined,
    })
  }

  const labelStyle = { fontSize: 11, fontWeight: 500, color: C.piedra, display: 'block', marginBottom: 4 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      className="sm:items-center">
      <div style={{ width: '100%', maxWidth: 512, background: C.s1, borderRadius: '0 16px 0 0', border: `1px solid ${C.linea}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
        className="sm:rounded-[0_16px_16px_0] sm:max-h-[85vh]">

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}`, flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.crema }}>{isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}</span>
          <button onClick={onClose}
            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
            <CloseSvg style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input className="du-input" placeholder="Ej: Distribuidora García" value={form.name} onChange={set('name')} required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Email</label>
                <input className="du-input" type="email" placeholder="contacto@proveedor.com" value={form.email} onChange={set('email')} />
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input className="du-input" placeholder="+54 11 1234-5678" value={form.phone} onChange={set('phone')} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Sitio web</label>
              <input className="du-input" placeholder="https://proveedor.com" value={form.website} onChange={set('website')} />
            </div>
            <div>
              <label style={labelStyle}>Dirección</label>
              <input className="du-input" placeholder="Av. Corrientes 1234, CABA" value={form.address} onChange={set('address')} />
            </div>
            <div>
              <label style={labelStyle}>Notas</label>
              <textarea className="du-input" rows={3} placeholder="Condiciones de pago, contacto, etc." value={form.notes} onChange={set('notes')} />
            </div>
          </div>

          <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.linea}`, display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
            <button type="button" onClick={onClose}
              style={{ padding: '10px 16px', borderRadius: '0 10px 10px 0', border: `1px solid ${C.linea}`, background: 'none', color: C.piedra, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending}
              style={{ padding: '10px 16px', borderRadius: '0 10px 10px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, cursor: mutation.isPending ? 'not-allowed' : 'pointer', opacity: mutation.isPending ? 0.5 : 1 }}>
              {mutation.isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProvidersPage() {
  const qc      = useQueryClient()
  const toast   = useToast()
  const confirm = useConfirm()
  const { user } = useAuth()
  const canWrite = user?.role !== 'member'

  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', { search: search || undefined }],
    queryFn: () => getSuppliers({ search: search || undefined }).then(r => r.data.data),
  })
  const suppliers = data ?? []

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => { qc.invalidateQueries(['suppliers']); toast('Proveedor eliminado', 'success') },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al eliminar', 'error'),
  })

  async function handleDelete(supplier) {
    const productCount = supplier._count?.products ?? 0
    const msg = productCount > 0
      ? `¿Eliminar "${supplier.name}"? Sus ${productCount} producto(s) quedarán sin proveedor asignado.`
      : `¿Eliminar "${supplier.name}"?`
    const ok = await confirm(msg, { confirmLabel: 'Eliminar', danger: true })
    if (ok) deleteMutation.mutate(supplier.id)
  }

  const thStyle = { textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em' }
  const tdStyle = { padding: '12px 14px' }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }} className="md:p-8">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StoreSvg style={{ width: 18, height: 18, color: C.arena }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema, margin: 0 }}>Proveedores</h2>
          </div>
          <p style={{ fontSize: 12, color: C.piedra, marginTop: 2 }}>
            {suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''}{search ? ' (filtrados)' : ''}
          </p>
        </div>
        {canWrite && (
          <button onClick={() => setModal('new')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: '0 10px 10px 0', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <PlusSvg style={{ width: 16, height: 16 }} />
            Nuevo
          </button>
        )}
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', maxWidth: 320 }}>
        <SearchSvg style={{ width: 16, height: 16, color: C.piedra, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar proveedor…"
          style={{ paddingLeft: 36, paddingRight: 12, paddingTop: 6, paddingBottom: 6, background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', fontSize: 13, color: C.crema, outline: 'none', width: '100%' }}
          className="placeholder:text-[#8C877E]" />
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: C.piedra, fontSize: 14 }}>Cargando…</div>
      ) : suppliers.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16, color: C.piedra }}>
          <StoreSvg style={{ width: 48, height: 48, opacity: 0.2 }} />
          <p style={{ fontSize: 14 }}>{search ? 'Sin proveedores con esa búsqueda.' : 'Aún no hay proveedores. ¡Agregá el primero!'}</p>
          {!search && canWrite && (
            <button onClick={() => setModal('new')}
              style={{ fontSize: 14, color: C.arena, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              + Nuevo
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block" style={{ overflow: 'hidden', borderRadius: '0 16px 16px 0', border: `1px solid ${C.linea}` }}>
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.linea}`, background: 'rgba(38,38,42,0.6)' }}>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Contacto</th>
                  <th style={thStyle}>Dirección</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Productos</th>
                  <th style={tdStyle} />
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${C.linea}`, background: i % 2 !== 0 ? 'rgba(30,30,32,0.3)' : 'transparent' }}
                    className="hover:bg-[rgba(38,38,42,0.4)] last:border-0 transition-colors">
                    <td style={tdStyle}>
                      <p style={{ fontWeight: 500, color: C.crema }}>{s.name}</p>
                      {s.notes && <p style={{ fontSize: 12, color: C.piedra, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{s.notes}</p>}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {s.email && (
                            <a href={`mailto:${s.email}`} style={{ fontSize: 12, color: C.piedra, display: 'flex', alignItems: 'center', gap: 4 }}
                              onMouseEnter={e => e.currentTarget.style.color = C.arena}
                              onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                              <MailSvg style={{ width: 12, height: 12, flexShrink: 0 }} />{s.email}
                            </a>
                          )}
                          {s.phone && (
                            <a href={`tel:${s.phone}`} style={{ fontSize: 12, color: C.piedra, display: 'flex', alignItems: 'center', gap: 4 }}
                              onMouseEnter={e => e.currentTarget.style.color = C.arena}
                              onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                              <PhoneSvg style={{ width: 12, height: 12, flexShrink: 0 }} />{s.phone}
                            </a>
                          )}
                          {s.website && (
                            <a href={s.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.piedra, display: 'flex', alignItems: 'center', gap: 4 }}
                              onMouseEnter={e => e.currentTarget.style.color = C.arena}
                              onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                              <GlobeSvg style={{ width: 12, height: 12, flexShrink: 0 }} />{s.website.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                          {!s.email && !s.phone && !s.website && <span style={{ fontSize: 12, color: C.piedra }}>—</span>}
                        </div>
                        <WhatsAppButton phone={s.phone} name={s.name} toast={toast} />
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: C.piedra, fontSize: 13 }}>{s.address || '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.crema }}>{s._count?.products ?? 0}</span>
                    </td>
                    <td style={tdStyle}>
                      {canWrite && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          <button onClick={() => setModal(s)}
                            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', color: C.piedra, cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(185,180,170,0.08)'; e.currentTarget.style.color = C.crema }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.piedra }}>
                            <PencilSvg style={{ width: 14, height: 14 }} />
                          </button>
                          <button onClick={() => handleDelete(s)}
                            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', color: C.piedra, cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,131,115,0.12)'; e.currentTarget.style.color = C.err }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.piedra }}>
                            <TrashSvg style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {suppliers.map(s => (
              <div key={s.id} style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 12px 12px 0', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600, color: C.crema }}>{s.name}</p>
                    {s.notes && <p style={{ fontSize: 12, color: C.piedra, marginTop: 2 }}>{s.notes}</p>}
                  </div>
                  <span style={{ fontSize: 12, color: C.piedra, background: C.s2, padding: '2px 8px', borderRadius: 100, flexShrink: 0 }}>
                    {s._count?.products ?? 0} prod.
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {s.email && (
                    <a href={`mailto:${s.email}`} style={{ fontSize: 12, color: C.piedra, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MailSvg style={{ width: 14, height: 14, flexShrink: 0 }} />{s.email}
                    </a>
                  )}
                  {s.phone && (
                    <a href={`tel:${s.phone}`} style={{ fontSize: 12, color: C.piedra, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <PhoneSvg style={{ width: 14, height: 14, flexShrink: 0 }} />{s.phone}
                    </a>
                  )}
                  {s.address && <p style={{ fontSize: 12, color: C.piedra }}>{s.address}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: `1px solid ${C.linea}` }}>
                  <WhatsAppButton phone={s.phone} name={s.name} toast={toast} />
                  {canWrite && (
                    <>
                      <button onClick={() => setModal(s)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 0', borderRadius: '0 8px 8px 0', fontSize: 12, fontWeight: 500, border: `1px solid ${C.linea}`, background: 'none', color: C.piedra, cursor: 'pointer' }}>
                        <PencilSvg style={{ width: 14, height: 14 }} />Editar
                      </button>
                      <button onClick={() => handleDelete(s)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 0', borderRadius: '0 8px 8px 0', fontSize: 12, fontWeight: 500, border: 'none', background: 'rgba(229,131,115,0.12)', color: C.err, cursor: 'pointer' }}>
                        <TrashSvg style={{ width: 14, height: 14 }} />Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {(modal === 'new' || (modal && typeof modal === 'object')) && (
        <SupplierModal
          supplier={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
