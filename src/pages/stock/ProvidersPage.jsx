import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../api/stock'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { useAuth } from '../../context/AuthContext'
import {
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon,
  XMarkIcon, BuildingStorefrontIcon, EnvelopeIcon, PhoneIcon, GlobeAltIcon,
} from '@heroicons/react/24/outline'

function WhatsAppButton({ phone, name, toast }) {
  const waIcon = (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.531 5.847L.057 23.882l6.196-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.031-1.388l-.361-.214-3.736.873.936-3.629-.235-.373A9.775 9.775 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
    </svg>
  )
  if (phone) {
    return (
      <a
        href={`https://wa.me/${phone.replace(/\D/g, '')}`}
        target="_blank"
        rel="noreferrer"
        title={`WhatsApp ${name}`}
        className="p-1.5 rounded-md bg-success-subtle text-success hover:opacity-80 transition-opacity shrink-0"
      >
        {waIcon}
      </a>
    )
  }
  return (
    <button
      onClick={() => toast('Agregá un número de teléfono al proveedor para usar WhatsApp', 'error')}
      title="Sin número de contacto"
      className="p-1.5 rounded-md text-fg-muted/30 hover:text-fg-muted transition-colors shrink-0"
    >
      {waIcon}
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

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors placeholder:text-fg-muted'
  const labelCls = 'block text-xs font-medium text-fg-muted mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface border border-line rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
          <h2 className="text-base font-semibold text-fg">{isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-raised text-fg-muted hover:text-fg transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            <div>
              <label className={labelCls}>Nombre *</label>
              <input className={inputCls} placeholder="Ej: Distribuidora García" value={form.name} onChange={set('name')} required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Email</label>
                <input className={inputCls} type="email" placeholder="contacto@proveedor.com" value={form.email} onChange={set('email')} />
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input className={inputCls} placeholder="+54 11 1234-5678" value={form.phone} onChange={set('phone')} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Sitio web</label>
              <input className={inputCls} placeholder="https://proveedor.com" value={form.website} onChange={set('website')} />
            </div>
            <div>
              <label className={labelCls}>Dirección</label>
              <input className={inputCls} placeholder="Av. Corrientes 1234, CABA" value={form.address} onChange={set('address')} />
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <textarea className={inputCls} rows={3} placeholder="Condiciones de pago, contacto, etc." value={form.notes} onChange={set('notes')} />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-line flex justify-end gap-2 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-line text-sm text-fg-muted hover:text-fg hover:bg-raised transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
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

  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null) // null | supplier object | 'new'

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

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-fg">Proveedores</h1>
          <p className="text-sm text-fg-muted mt-0.5">
            {suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''}{search ? ' (filtrados)' : ''}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setModal('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-4 h-4" />
            Nuevo proveedor
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="relative max-w-xs">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar proveedor…"
          className="pl-9 pr-3 py-1.5 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors w-full"
        />
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-fg-muted text-sm">Cargando…</div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-fg-muted">
          <BuildingStorefrontIcon className="w-12 h-12 opacity-20" />
          <p className="text-sm">{search ? 'Sin proveedores con esa búsqueda.' : 'Aún no hay proveedores. ¡Agregá el primero!'}</p>
          {!search && canWrite && (
            <button onClick={() => setModal('new')} className="text-sm text-brand hover:underline">
              + Nuevo proveedor
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-raised/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Contacto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Dirección</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Productos</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, i) => (
                  <tr key={s.id} className={`border-b border-line last:border-0 hover:bg-raised/40 transition-colors ${i % 2 !== 0 ? 'bg-raised/20' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-fg">{s.name}</p>
                      {s.notes && <p className="text-xs text-fg-muted mt-0.5 truncate max-w-[200px]">{s.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          {s.email && (
                            <a href={`mailto:${s.email}`} className="text-xs text-fg-soft hover:text-brand flex items-center gap-1 transition-colors">
                              <EnvelopeIcon className="w-3 h-3 shrink-0" />{s.email}
                            </a>
                          )}
                          {s.phone && (
                            <a href={`tel:${s.phone}`} className="text-xs text-fg-soft hover:text-brand flex items-center gap-1 transition-colors">
                              <PhoneIcon className="w-3 h-3 shrink-0" />{s.phone}
                            </a>
                          )}
                          {s.website && (
                            <a href={s.website} target="_blank" rel="noreferrer" className="text-xs text-fg-soft hover:text-brand flex items-center gap-1 transition-colors">
                              <GlobeAltIcon className="w-3 h-3 shrink-0" />{s.website.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                          {!s.email && !s.phone && !s.website && <span className="text-xs text-fg-muted">—</span>}
                        </div>
                        <WhatsAppButton phone={s.phone} name={s.name} toast={toast} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-fg-muted text-sm">{s.address || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-semibold text-fg">{s._count?.products ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      {canWrite && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setModal(s)} className="p-1.5 rounded-md hover:bg-raised text-fg-muted hover:text-fg transition-colors">
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(s)} className="p-1.5 rounded-md hover:bg-danger-subtle text-fg-muted hover:text-danger transition-colors">
                            <TrashIcon className="w-3.5 h-3.5" />
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
              <div key={s.id} className="bg-surface border border-line rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-fg">{s.name}</p>
                    {s.notes && <p className="text-xs text-fg-muted mt-0.5 line-clamp-2">{s.notes}</p>}
                  </div>
                  <span className="text-xs text-fg-muted bg-raised px-2 py-0.5 rounded-full shrink-0">
                    {s._count?.products ?? 0} prod.
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {s.email && (
                    <a href={`mailto:${s.email}`} className="text-xs text-fg-soft hover:text-brand flex items-center gap-1.5 transition-colors">
                      <EnvelopeIcon className="w-3.5 h-3.5 shrink-0" />{s.email}
                    </a>
                  )}
                  {s.phone && (
                    <a href={`tel:${s.phone}`} className="text-xs text-fg-soft hover:text-brand flex items-center gap-1.5 transition-colors">
                      <PhoneIcon className="w-3.5 h-3.5 shrink-0" />{s.phone}
                    </a>
                  )}
                  {s.address && <p className="text-xs text-fg-muted">{s.address}</p>}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-line">
                  <WhatsAppButton phone={s.phone} name={s.name} toast={toast} />
                  {canWrite && (
                    <>
                      <button onClick={() => setModal(s)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border border-line text-fg-soft hover:bg-raised transition-colors">
                        <PencilIcon className="w-3.5 h-3.5" />Editar
                      </button>
                      <button onClick={() => handleDelete(s)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-danger-subtle text-danger hover:opacity-80 transition-opacity">
                        <TrashIcon className="w-3.5 h-3.5" />Eliminar
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
