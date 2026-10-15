import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProduct, updateProduct, getCategories, getSuppliers } from '../../api/stock'
import { useToast } from '../../components/Toast'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

function CloseSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}

const UNITS = ['unidad', 'kg', 'g', 'litro', 'ml', 'm', 'cm', 'm²', 'm³', 'caja', 'par', 'rollo', 'bolsa']

const INVENTORY_TYPE_OPTIONS = [
  { value: 'sale',         label: 'Producto para venta' },
  { value: 'internal',     label: 'Insumo / material interno' },
  { value: 'raw_material', label: 'Materia prima' },
]

export default function ProductModal({ product, onClose }) {
  const qc    = useQueryClient()
  const toast = useToast()
  const isEdit = Boolean(product)

  const [form, setForm] = useState({
    sku:           product?.sku           ?? '',
    name:          product?.name          ?? '',
    description:   product?.description   ?? '',
    unit:          product?.unit          ?? 'unidad',
    inventoryType: product?.inventoryType ?? 'sale',
    categoryId:    product?.categoryId    ?? '',
    supplierId:    product?.supplierId    ?? '',
    costPrice:     product?.costPrice     ?? '',
    salePrice:     product?.salePrice     ?? '',
    minStock:      product?.minStock      ?? '0',
    maxStock:      product?.maxStock      ?? '',
    status:        product?.status        ?? 'active',
    initialStock:  '',
    initialReason: '',
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(r => r.data.data),
    staleTime: 60_000,
  })
  const categories = categoriesData ?? []

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliers().then(r => r.data.data),
    staleTime: 60_000,
  })
  const suppliers = suppliersData ?? []

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateProduct(product.id, data) : createProduct(data),
    onSuccess: () => {
      qc.invalidateQueries(['products'])
      qc.invalidateQueries(['stock-dashboard'])
      toast(isEdit ? 'Producto actualizado' : 'Producto creado', 'success')
      onClose()
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al guardar', 'error'),
  })

  function handleSubmit(e) {
    e.preventDefault()
    const data = {
      sku:           form.sku.trim(),
      name:          form.name.trim(),
      description:   form.description.trim() || undefined,
      unit:          form.unit,
      inventoryType: form.inventoryType,
      categoryId:    form.categoryId  || undefined,
      supplierId:    form.supplierId  || undefined,
      costPrice:     form.costPrice !== '' ? Number(form.costPrice) : undefined,
      salePrice:     form.salePrice !== '' ? Number(form.salePrice) : undefined,
      minStock:      Number(form.minStock),
      maxStock:      form.maxStock !== '' ? Number(form.maxStock) : undefined,
      status:        form.status,
    }
    if (!isEdit) {
      data.initialStock  = form.initialStock !== '' ? Number(form.initialStock) : 0
      data.initialReason = form.initialReason.trim() || undefined
    }
    mutation.mutate(data)
  }

  const labelStyle = { fontSize: 11, fontWeight: 500, color: C.piedra, display: 'block', marginBottom: 4 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      className="sm:items-center">
      <div style={{ width: '100%', maxWidth: 512, background: C.s1, borderRadius: '0 16px 0 0', border: `1px solid ${C.linea}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
        className="sm:rounded-[0_16px_16px_0]">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}`, flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.crema }}>{isEdit ? 'Editar producto' : 'Nuevo producto'}</span>
          <button onClick={onClose}
            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
            <CloseSvg style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>SKU *</label>
                <input className="du-input" placeholder="Ej: PROD-001" value={form.sku} onChange={set('sku')} required />
              </div>
              <div>
                <label style={labelStyle}>Unidad</label>
                <select className="du-input" value={form.unit} onChange={set('unit')}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Nombre *</label>
              <input className="du-input" placeholder="Nombre del producto" value={form.name} onChange={set('name')} required />
            </div>

            <div>
              <label style={labelStyle}>Tipo de inventario *</label>
              <select className="du-input" value={form.inventoryType} onChange={set('inventoryType')} required>
                {INVENTORY_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Descripción</label>
              <textarea className="du-input" rows={2} placeholder="Descripción opcional" value={form.description} onChange={set('description')} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Categoría</label>
                <select className="du-input" value={form.categoryId} onChange={set('categoryId')}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => (
                    <optgroup key={c.id} label={c.name}>
                      <option value={c.id}>{c.name}</option>
                      {c.children?.map(ch => (
                        <option key={ch.id} value={ch.id}>↳ {ch.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Proveedor</label>
                <select className="du-input" value={form.supplierId} onChange={set('supplierId')}>
                  <option value="">Sin proveedor</option>
                  {suppliers.filter(s => s.status === 'active').map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Precio de costo</label>
                <input className="du-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.costPrice} onChange={set('costPrice')} />
              </div>
              <div>
                <label style={labelStyle}>Precio de venta</label>
                <input className="du-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.salePrice} onChange={set('salePrice')} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Stock mínimo (alerta)</label>
                <input className="du-input" type="number" min="0" step="0.01" placeholder="0" value={form.minStock} onChange={set('minStock')} />
              </div>
              <div>
                <label style={labelStyle}>Stock máximo</label>
                <input className="du-input" type="number" min="0" step="0.01" placeholder="Sin límite" value={form.maxStock} onChange={set('maxStock')} />
              </div>
            </div>

            {isEdit && (
              <div>
                <label style={labelStyle}>Estado</label>
                <select className="du-input" value={form.status} onChange={set('status')}>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="discontinued">Descontinuado</option>
                </select>
              </div>
            )}

            {!isEdit && (
              <div style={{ borderTop: `1px solid ${C.linea}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock inicial</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>Cantidad</label>
                    <input className="du-input" type="number" min="0" step="0.01" placeholder="0" value={form.initialStock} onChange={set('initialStock')} />
                  </div>
                  <div>
                    <label style={labelStyle}>Motivo</label>
                    <input className="du-input" placeholder="Carga inicial" value={form.initialReason} onChange={set('initialReason')} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.linea}`, display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <button type="button" onClick={onClose}
            style={{ padding: '10px 16px', borderRadius: '0 10px 10px 0', border: `1px solid ${C.linea}`, background: 'none', color: C.piedra, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
            onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={mutation.isPending}
            style={{ padding: '10px 16px', borderRadius: '0 10px 10px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, cursor: mutation.isPending ? 'not-allowed' : 'pointer', opacity: mutation.isPending ? 0.5 : 1 }}>
            {mutation.isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  )
}
