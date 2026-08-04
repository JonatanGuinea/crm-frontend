import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProduct, updateProduct, getCategories } from '../../api/stock'
import { useToast } from '../../components/Toast'
import { XMarkIcon } from '@heroicons/react/24/outline'

const UNITS = ['unidad', 'kg', 'g', 'litro', 'ml', 'm', 'cm', 'm²', 'm³', 'caja', 'par', 'rollo', 'bolsa']

export default function ProductModal({ product, onClose }) {
  const qc    = useQueryClient()
  const toast = useToast()
  const isEdit = Boolean(product)

  const [form, setForm] = useState({
    sku:          product?.sku          ?? '',
    name:         product?.name         ?? '',
    description:  product?.description  ?? '',
    unit:         product?.unit         ?? 'unidad',
    categoryId:   product?.categoryId   ?? '',
    costPrice:    product?.costPrice    ?? '',
    salePrice:    product?.salePrice    ?? '',
    minStock:     product?.minStock     ?? '0',
    maxStock:     product?.maxStock     ?? '',
    status:       product?.status       ?? 'active',
    initialStock: '',
    initialReason: '',
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(r => r.data.data),
    staleTime: 60_000,
  })
  const categories = categoriesData ?? []

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
      sku:         form.sku.trim(),
      name:        form.name.trim(),
      description: form.description.trim() || undefined,
      unit:        form.unit,
      categoryId:  form.categoryId || undefined,
      costPrice:   form.costPrice !== '' ? Number(form.costPrice) : undefined,
      salePrice:   form.salePrice !== '' ? Number(form.salePrice) : undefined,
      minStock:    Number(form.minStock),
      maxStock:    form.maxStock !== '' ? Number(form.maxStock) : undefined,
      status:      form.status,
    }
    if (!isEdit) {
      data.initialStock  = form.initialStock !== '' ? Number(form.initialStock) : 0
      data.initialReason = form.initialReason.trim() || undefined
    }
    mutation.mutate(data)
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors placeholder:text-fg-muted'
  const labelCls = 'block text-xs font-medium text-fg-muted mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface border border-line rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
          <h2 className="text-base font-semibold text-fg">{isEdit ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-raised text-fg-muted hover:text-fg transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 flex flex-col gap-4">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>SKU *</label>
                <input className={inputCls} placeholder="Ej: PROD-001" value={form.sku} onChange={set('sku')} required />
              </div>
              <div>
                <label className={labelCls}>Unidad</label>
                <select className={inputCls} value={form.unit} onChange={set('unit')}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Nombre *</label>
              <input className={inputCls} placeholder="Nombre del producto" value={form.name} onChange={set('name')} required />
            </div>

            <div>
              <label className={labelCls}>Descripción</label>
              <textarea className={inputCls} rows={2} placeholder="Descripción opcional" value={form.description} onChange={set('description')} />
            </div>

            <div>
              <label className={labelCls}>Categoría</label>
              <select className={inputCls} value={form.categoryId} onChange={set('categoryId')}>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Precio de costo</label>
                <input className={inputCls} type="number" min="0" step="0.01" placeholder="0.00" value={form.costPrice} onChange={set('costPrice')} />
              </div>
              <div>
                <label className={labelCls}>Precio de venta</label>
                <input className={inputCls} type="number" min="0" step="0.01" placeholder="0.00" value={form.salePrice} onChange={set('salePrice')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Stock mínimo (alerta)</label>
                <input className={inputCls} type="number" min="0" step="0.01" placeholder="0" value={form.minStock} onChange={set('minStock')} />
              </div>
              <div>
                <label className={labelCls}>Stock máximo</label>
                <input className={inputCls} type="number" min="0" step="0.01" placeholder="Sin límite" value={form.maxStock} onChange={set('maxStock')} />
              </div>
            </div>

            {isEdit && (
              <div>
                <label className={labelCls}>Estado</label>
                <select className={inputCls} value={form.status} onChange={set('status')}>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="discontinued">Descontinuado</option>
                </select>
              </div>
            )}

            {!isEdit && (
              <div className="border-t border-line pt-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide">Stock inicial</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Cantidad</label>
                    <input className={inputCls} type="number" min="0" step="0.01" placeholder="0" value={form.initialStock} onChange={set('initialStock')} />
                  </div>
                  <div>
                    <label className={labelCls}>Motivo</label>
                    <input className={inputCls} placeholder="Carga inicial" value={form.initialReason} onChange={set('initialReason')} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-line text-sm text-fg-muted hover:text-fg hover:bg-raised transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {mutation.isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  )
}
