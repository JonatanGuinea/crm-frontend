import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask, updateTask } from '../../api/tasks'
import { getProjects } from '../../api/projects'
import { getMembers } from '../../api/members'
import { getProducts } from '../../api/stock'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'
import DatePicker from '../../components/DatePicker'
import { XMarkIcon, PlusIcon, TrashIcon, CubeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'Pendiente' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'done',        label: 'Completada' },
]

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high',   label: 'Alta' },
]

export default function TaskModal({ task, defaultStatus = 'todo', defaultProjectId = '', onClose }) {
  const qc    = useQueryClient()
  const toast = useToast()
  const { user } = useAuth()
  const orgId  = user?.org
  const isEdit = Boolean(task)

  const [form, setForm] = useState({
    title:        task?.title        ?? '',
    description:  task?.description  ?? '',
    status:       task?.status       ?? defaultStatus,
    priority:     task?.priority     ?? 'medium',
    dueDate:      task?.dueDate      ? task.dueDate.slice(0, 10) : '',
    assignedToId: task?.assignedToId ?? '',
    projectId:    task?.projectId    ?? defaultProjectId,
  })
  const [errors, setErrors] = useState({})

  // Stock items: [{ productId, quantity, product }]
  const [stockItems, setStockItems] = useState(
    task?.stockItems?.map(i => ({
      productId: i.productId,
      quantity:  Number(i.quantity),
      product:   i.product,
    })) ?? []
  )
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedQty, setSelectedQty] = useState('1')

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects().then(r => r.data.data?.items ?? r.data.data ?? []),
    staleTime: 60_000,
  })

  const { data: membersData } = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => getMembers(orgId).then(r => r.data.data),
    enabled: Boolean(orgId),
    staleTime: 60_000,
  })
  const members = (membersData ?? []).filter(m => m.status === 'active')

  const { data: productsData } = useQuery({
    queryKey: ['products', { limit: 200, status: 'active' }],
    queryFn: () => getProducts({ limit: 200, status: 'active' }).then(r => r.data.data),
    staleTime: 60_000,
  })
  const products = productsData?.items ?? []

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateTask(task.id, data) : createTask(data),
    onSuccess: () => {
      qc.invalidateQueries(['tasks'])
      qc.invalidateQueries(['products'])
      qc.invalidateQueries(['stock-dashboard'])
      toast(isEdit ? 'Tarea actualizada' : 'Tarea creada', 'success')
      onClose()
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al guardar', 'error'),
  })

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'El título es obligatorio'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function addStockItem() {
    if (!selectedProductId || !selectedQty || Number(selectedQty) <= 0) return
    const product = products.find(p => p.id === selectedProductId)
    if (!product) return
    // Si ya existe, actualiza la cantidad
    setStockItems(prev => {
      const idx = prev.findIndex(i => i.productId === selectedProductId)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], quantity: Number(selectedQty) }
        return updated
      }
      return [...prev, { productId: selectedProductId, quantity: Number(selectedQty), product }]
    })
    setSelectedProductId('')
    setSelectedQty('1')
  }

  function removeStockItem(productId) {
    setStockItems(prev => prev.filter(i => i.productId !== productId))
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    if (!validate()) return
    const payload = {
      title:        form.title.trim(),
      description:  form.description.trim() || null,
      status:       form.status,
      priority:     form.priority,
      dueDate:      form.dueDate || null,
      assignedToId: form.assignedToId || null,
      projectId:    form.projectId    || null,
      stockItems:   stockItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
    }
    mutation.mutate(payload)
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Productos disponibles para el selector (excluye los ya agregados)
  const availableProducts = products.filter(p => !stockItems.some(i => i.productId === p.id))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-lg bg-surface border border-line rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
          <h2 className="text-base font-semibold text-fg">
            {isEdit ? 'Editar tarea' : 'Nueva tarea'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-raised text-fg-muted hover:text-fg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* Título */}
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Título *</label>
              <input
                autoFocus
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Ej: Revisar propuesta del cliente"
                className={`w-full px-3 py-2 rounded-lg bg-raised border text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-brand transition-colors ${errors.title ? 'border-danger' : 'border-line'}`}
              />
              {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
                placeholder="Detalles opcionales..."
                className="w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-brand transition-colors resize-none"
              />
            </div>

            {/* Estado + Prioridad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Estado</label>
                <select
                  value={form.status}
                  onChange={e => set('status', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors"
                >
                  {STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1.5">Prioridad</label>
                <select
                  value={form.priority}
                  onChange={e => set('priority', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors"
                >
                  {PRIORITY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fecha límite */}
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Fecha límite</label>
              <DatePicker
                value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)}
                placeholder="Sin fecha límite"
                className="w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm focus:outline-none transition-colors"
              />
            </div>

            {/* Responsable */}
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Responsable</label>
              <select
                value={form.assignedToId}
                onChange={e => set('assignedToId', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors"
              >
                <option value="">Sin asignar</option>
                {members.map(m => (
                  <option key={m.userId} value={m.userId}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Proyecto */}
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Proyecto</label>
              <select
                value={form.projectId}
                onChange={e => set('projectId', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors"
              >
                <option value="">Sin proyecto</option>
                {(projects ?? []).map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* Materiales / Stock */}
            {products.length > 0 && (
              <div className="border-t border-line pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <CubeIcon className="w-4 h-4 text-fg-muted" />
                  <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide">Materiales</p>
                  <p className="text-xs text-fg-muted ml-auto">Se descuentan al completar</p>
                </div>

                {/* Ítems agregados */}
                {stockItems.length > 0 && (
                  <div className="flex flex-col gap-1.5 mb-3">
                    {stockItems.map(item => {
                      const currentStock = Number(item.product.stock)
                      const insufficient = currentStock < item.quantity
                      const outOfStock   = currentStock <= 0
                      return (
                        <div key={item.productId} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${insufficient ? 'bg-warning-subtle border border-warning/30' : 'bg-raised'}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-fg truncate">{item.product.name}</p>
                              {insufficient && (
                                <ExclamationTriangleIcon className="w-3.5 h-3.5 text-warning shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-fg-muted font-mono">
                              {item.product.sku}
                              {outOfStock
                                ? <span className="ml-1.5 text-danger font-medium">· Sin stock</span>
                                : insufficient
                                  ? <span className="ml-1.5 text-warning font-medium">· Stock: {currentStock} {item.product.unit}</span>
                                  : null
                              }
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-fg shrink-0">
                            {item.quantity} <span className="text-xs font-normal text-fg-muted">{item.product.unit}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeStockItem(item.productId)}
                            className="p-1 rounded-md hover:bg-danger-subtle text-fg-muted hover:text-danger transition-colors shrink-0"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Agregar ítem */}
                {availableProducts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedProductId}
                      onChange={e => setSelectedProductId(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors"
                    >
                      <option value="">Seleccionar producto…</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — {Number(p.stock) <= 0 ? 'Sin stock' : `${Number(p.stock)} ${p.unit}`}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={selectedQty}
                      onChange={e => setSelectedQty(e.target.value)}
                      className="w-20 px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors"
                    />
                    <button
                      type="button"
                      onClick={addStockItem}
                      disabled={!selectedProductId || !selectedQty || Number(selectedQty) <= 0}
                      className="p-2 rounded-lg bg-brand text-white hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-fg-soft hover:bg-raised transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
