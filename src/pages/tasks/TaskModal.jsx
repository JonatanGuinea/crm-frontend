import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask, updateTask } from '../../api/tasks'
import { getProjects } from '../../api/projects'
import { getMembers } from '../../api/members'
import { getProducts } from '../../api/stock'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'
import DatePicker from '../../components/DatePicker'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }
const dpClass = "h-[34px] px-3 bg-[#141415] border border-[#2C2C2F] rounded-[0_9px_9px_0] text-[13px] outline-none w-full"

function CloseSvg() {
  return (
    <svg style={{ display: 'block', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function PlusSvg() {
  return (
    <svg style={{ display: 'block', width: 15, height: 15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
function TrashSvg() {
  return (
    <svg style={{ display: 'block', width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  )
}
function CubeSvg() {
  return (
    <svg style={{ display: 'block', width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  )
}
function WarnSvg() {
  return (
    <svg style={{ display: 'block', width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

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

  const { data: productsData, isLoading: productsLoading } = useQuery({
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

  const originalCommitments = useMemo(() => {
    if (!task?.stockItems) return {}
    return Object.fromEntries(task.stockItems.map(i => [i.productId, Number(i.quantity)]))
  }, [task])

  function availableFor(product) {
    const committed   = product.committedStock ?? 0
    const ownOriginal = originalCommitments[product.id] ?? 0
    return Number(product.stock) - committed + ownOriginal
  }

  const availableProducts = products.filter(p => !stockItems.some(i => i.productId === p.id))

  const labelCls = "block text-xs font-medium text-fg-soft mb-1.5"

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="shadow-2xl w-full sm:max-w-lg sm:mx-4 max-h-[92dvh] flex flex-col"
        style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', fontFamily: 'Geist, system-ui, sans-serif' }}>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-line" style={{ background: C.s1 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: C.crema, margin: 0 }}>
            {isEdit ? 'Editar tarea' : 'Nueva tarea'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.arena, padding: 4, display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.arena}
          >
            <CloseSvg />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Título */}
            <div>
              <label className={labelCls}>Título *</label>
              <input
                autoFocus
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Ej: Revisar propuesta del cliente"
                className="du-input w-full"
                style={errors.title ? { borderColor: C.err } : {}}
              />
              {errors.title && <p style={{ fontSize: 11, color: C.err, marginTop: 4 }}>{errors.title}</p>}
            </div>

            {/* Descripción */}
            <div>
              <label className={labelCls}>Descripción</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
                placeholder="Detalles opcionales..."
                className="w-full resize-none outline-none font-[inherit]"
                style={{ background: C.bg, border: `1px solid ${C.linea}`, borderRadius: '0 8px 8px 0', color: C.crema, fontSize: 13, padding: '6px 12px', boxSizing: 'border-box', width: '100%' }}
              />
            </div>

            {/* Estado + Prioridad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Estado</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className="du-input w-full">
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Prioridad</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)} className="du-input w-full">
                  {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Fecha límite */}
            <div>
              <label className={labelCls}>Fecha límite</label>
              <DatePicker
                value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)}
                placeholder="Sin fecha límite"
                className={dpClass}
              />
            </div>

            {/* Responsable */}
            <div>
              <label className={labelCls}>Responsable</label>
              <select value={form.assignedToId} onChange={e => set('assignedToId', e.target.value)} className="du-input w-full">
                <option value="">Sin asignar</option>
                {members.map(m => <option key={m.userId} value={m.userId}>{m.name}</option>)}
              </select>
            </div>

            {/* Proyecto */}
            <div>
              <label className={labelCls}>Proyecto</label>
              <select value={form.projectId} onChange={e => set('projectId', e.target.value)} className="du-input w-full">
                <option value="">Sin proyecto</option>
                {(projects ?? []).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            {/* Materiales / Stock */}
            <div style={{ borderTop: `1px solid ${C.linea}`, paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CubeSvg style={{ color: C.piedra }} />
                <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena }}>Materiales</p>
                <p style={{ fontSize: 11, color: C.piedra, marginLeft: 'auto' }}>Se descuentan al completar</p>
              </div>

              {stockItems.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {stockItems.map(item => {
                    const available    = availableFor(item.product)
                    const outOfStock   = Number(item.product.stock) <= 0
                    const insufficient = available < item.quantity
                    return (
                      <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: '0 10px 10px 0', background: insufficient ? 'rgba(226,182,99,0.08)' : C.s2, border: `1px solid ${insufficient ? 'rgba(226,182,99,0.3)' : C.linea}` }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: C.crema, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</p>
                            {insufficient && <WarnSvg style={{ color: C.warn, flexShrink: 0 }} />}
                          </div>
                          <p style={{ fontSize: 11, color: C.piedra, fontFamily: "'Geist Mono', monospace" }}>
                            {item.product.sku}
                            {outOfStock
                              ? <span style={{ marginLeft: 6, color: C.err, fontWeight: 500 }}>· Sin stock</span>
                              : insufficient
                                ? <span style={{ marginLeft: 6, color: C.warn, fontWeight: 500 }}>· Disponible: {available} {item.product.unit}</span>
                                : null
                            }
                          </p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.crema, flexShrink: 0 }}>
                          {item.quantity} <span style={{ fontSize: 11, fontWeight: 400, color: C.piedra }}>{item.product.unit}</span>
                        </span>
                        <button type="button" onClick={() => removeStockItem(item.productId)}
                          style={{ padding: 4, borderRadius: '0 5px 5px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex', alignItems: 'center', flexShrink: 0 }}
                          onMouseEnter={e => e.currentTarget.style.color = C.err}
                          onMouseLeave={e => e.currentTarget.style.color = C.piedra}
                        >
                          <TrashSvg />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {productsLoading ? (
                <p style={{ fontSize: 12, color: C.piedra, padding: '4px 0' }}>Cargando productos...</p>
              ) : availableProducts.length === 0 && stockItems.length === 0 ? (
                <p style={{ fontSize: 12, color: C.piedra, padding: '4px 0' }}>No hay productos activos en el inventario.</p>
              ) : availableProducts.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="du-input w-full">
                      <option value="">Seleccionar producto…</option>
                      {availableProducts.map(p => {
                        const avail     = availableFor(p)
                        const committed = p.committedStock ?? 0
                        const stockLabel = Number(p.stock) <= 0 ? 'Sin stock' : committed > 0 ? `Disp: ${avail} ${p.unit}` : `${Number(p.stock)} ${p.unit}`
                        return <option key={p.id} value={p.id}>{p.name} — {stockLabel}</option>
                      })}
                    </select>
                  </div>
                  <input
                    type="number" min="0.01" step="0.01"
                    value={selectedQty}
                    onChange={e => setSelectedQty(e.target.value)}
                    className="du-input"
                    style={{ width: 72 }}
                  />
                  <button type="button" onClick={addStockItem}
                    disabled={!selectedProductId || !selectedQty || Number(selectedQty) <= 0}
                    style={{ padding: 8, borderRadius: '0 9px 9px 0', background: C.crema, color: C.bg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, opacity: (!selectedProductId || !selectedQty || Number(selectedQty) <= 0) ? 0.4 : 1 }}
                  >
                    <PlusSvg />
                  </button>
                </div>
              ) : null}
            </div>

          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-line px-5 py-4 flex justify-end gap-2">
            <button type="button" onClick={onClose}
              style={{ padding: '8px 16px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: C.arena }}
              onMouseEnter={e => e.currentTarget.style.color = C.crema}
              onMouseLeave={e => e.currentTarget.style.color = C.arena}
            >
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="du-btn-pri disabled:opacity-50"
              style={{ width: 'auto', height: 38, paddingInline: 20, fontSize: 14 }}
            >
              {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
