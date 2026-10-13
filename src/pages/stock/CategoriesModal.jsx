import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/stock'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

function CloseSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}
function PencilSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function TrashSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
}
function CheckSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
}

const PRESET_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#64748b',
]

const labelStyle = { fontSize: 11, fontWeight: 500, color: C.piedra, display: 'block', marginBottom: 4 }

// ── Row ──────────────────────────────────────────────────────────────────────
function ColorDot({ color }) {
  return <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, backgroundColor: color || PRESET_COLORS[0], display: 'inline-block' }} />
}

function CategoryRow({ cat, isChild, editing, onStartEdit, onCancelEdit, onSave, saving, onDelete }) {
  const isEditing = editing?.id === cat.id
  const productCount = cat._count?.products ?? 0
  const childCount   = cat.children?.length ?? 0
  const canDelete    = productCount === 0 && childCount === 0

  if (isEditing) {
    return (
      <form onSubmit={onSave}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: '0 12px 12px 0', background: 'rgba(242,237,227,0.06)', border: '1px solid rgba(242,237,227,0.15)', marginLeft: isChild ? 24 : 0 }}>
        <ColorDot color={editing.color} />
        <input
          style={{ flex: 1, padding: '6px 8px', borderRadius: '0 8px 8px 0', background: C.s2, border: `1px solid ${C.linea}`, fontSize: 13, color: C.crema, outline: 'none' }}
          value={editing.name}
          onChange={e => onStartEdit({ ...editing, name: e.target.value })}
          autoFocus
          required />
        <button type="submit" disabled={saving}
          style={{ padding: 6, borderRadius: '0 6px 6px 0', background: C.crema, color: C.bg, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: saving ? 0.6 : 1, display: 'flex' }}>
          <CheckSvg style={{ width: 14, height: 14 }} />
        </button>
        <button type="button" onClick={onCancelEdit}
          style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', color: C.piedra, cursor: 'pointer', flexShrink: 0, display: 'flex' }}
          onMouseEnter={e => { e.currentTarget.style.background = C.s2; e.currentTarget.style.color = C.crema }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.piedra }}>
          <CloseSvg style={{ width: 14, height: 14 }} />
        </button>
      </form>
    )
  }

  return (
    <div className="group"
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: '0 12px 12px 0', marginLeft: isChild ? 24 : 0 }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,30,32,0.5)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <ColorDot color={cat.color} />
      <span style={{ flex: 1, fontSize: 13, color: C.crema, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
      <span style={{ fontSize: 12, color: C.piedra, flexShrink: 0 }}>{productCount} prod.</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
        className="opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onStartEdit({ id: cat.id, name: cat.name, color: cat.color || PRESET_COLORS[0] })}
          style={{ padding: 5, borderRadius: '0 5px 5px 0', background: 'none', border: 'none', color: C.piedra, cursor: 'pointer', display: 'flex' }}
          onMouseEnter={e => { e.currentTarget.style.background = C.s2; e.currentTarget.style.color = C.crema }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.piedra }}>
          <PencilSvg style={{ width: 12, height: 12 }} />
        </button>
        <button onClick={() => onDelete(cat)} disabled={!canDelete}
          title={!canDelete ? `No se puede eliminar: tiene ${productCount > 0 ? `${productCount} producto(s)` : 'subcategorías'}` : 'Eliminar'}
          style={{ padding: 5, borderRadius: '0 5px 5px 0', background: 'none', border: 'none', color: C.piedra, cursor: canDelete ? 'pointer' : 'not-allowed', display: 'flex', opacity: canDelete ? 1 : 0.35 }}
          onMouseEnter={e => { if (canDelete) { e.currentTarget.style.background = 'rgba(229,131,115,0.12)'; e.currentTarget.style.color = C.err } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.piedra; e.currentTarget.style.opacity = canDelete ? 1 : 0.35 }}>
          <TrashSvg style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function CategoriesModal({ onClose }) {
  const qc      = useQueryClient()
  const toast   = useToast()
  const confirm = useConfirm()

  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState({ name: '', color: PRESET_COLORS[0], parentId: '' })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(r => r.data.data),
  })
  const categories = categoriesData ?? []
  const topLevel   = categories.filter(c => !c.parentId)

  function setField(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      qc.invalidateQueries(['categories'])
      toast('Categoría creada', 'success')
      setForm({ name: '', color: PRESET_COLORS[0], parentId: '' })
    },
    onError: (err) => toast(err.response?.data?.error ?? 'Error al crear', 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['categories'])
      toast('Categoría actualizada', 'success')
      setEditing(null)
    },
    onError: (err) => toast(err.response?.data?.error ?? 'Error al actualizar', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries(['categories'])
      toast('Categoría eliminada', 'success')
    },
    onError: (err) => toast(err.response?.data?.error ?? 'Error al eliminar', 'error'),
  })

  async function handleDelete(cat) {
    const ok = await confirm(`¿Eliminar la categoría "${cat.name}"?`, { confirmLabel: 'Eliminar', danger: true })
    if (ok) deleteMutation.mutate(cat.id)
  }

  function handleCreate(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    createMutation.mutate({
      name:     form.name.trim(),
      color:    form.color,
      parentId: form.parentId || undefined,
    })
  }

  function handleUpdate(e) {
    e.preventDefault()
    if (!editing?.name.trim()) return
    updateMutation.mutate({ id: editing.id, data: { name: editing.name.trim(), color: editing.color } })
  }

  const rowProps = {
    editing,
    onStartEdit:  setEditing,
    onCancelEdit: () => setEditing(null),
    onSave:       handleUpdate,
    saving:       updateMutation.isPending,
    onDelete:     handleDelete,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      className="sm:items-center">
      <div style={{ width: '100%', maxWidth: 448, background: C.s1, borderRadius: '0 16px 0 0', border: `1px solid ${C.linea}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
        className="sm:rounded-[0_16px_16px_0] sm:max-h-[85vh]">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}`, flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.crema }}>Categorías</span>
            <p style={{ fontSize: 12, color: C.piedra, marginTop: 2 }}>
              {categories.length} categoría{categories.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose}
            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
            <CloseSvg style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', minHeight: 0 }}>
          {categories.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: 14, color: C.piedra }}>Aún no hay categorías. ¡Creá la primera!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {topLevel.map(cat => (
                <div key={cat.id}>
                  <CategoryRow cat={cat} isChild={false} {...rowProps} />
                  {cat.children?.map(child => (
                    <CategoryRow key={child.id} cat={child} isChild {...rowProps} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulario crear */}
        <div style={{ borderTop: `1px solid ${C.linea}`, padding: '16px 20px', flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Nueva categoría</p>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              {/* Color */}
              <div style={{ flexShrink: 0 }}>
                <label style={labelStyle}>Color</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: c, border: 'none', cursor: 'pointer', outline: form.color === c ? `2px solid ${C.crema}` : 'none', outlineOffset: 1, transform: form.color === c ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.1s' }} />
                  ))}
                </div>
              </div>
              {/* Nombre */}
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Nombre *</label>
                <input className="du-input" placeholder="Ej: Materiales" value={form.name} onChange={setField('name')} required />
              </div>
            </div>

            {topLevel.length > 0 && (
              <div>
                <label style={labelStyle}>Subcategoría de</label>
                <select className="du-input" value={form.parentId} onChange={setField('parentId')}>
                  <option value="">Categoría raíz</option>
                  {topLevel.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" disabled={createMutation.isPending || !form.name.trim()}
              style={{ width: '100%', padding: '10px 0', borderRadius: '0 10px 10px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, cursor: (createMutation.isPending || !form.name.trim()) ? 'not-allowed' : 'pointer', opacity: (createMutation.isPending || !form.name.trim()) ? 0.6 : 1 }}>
              {createMutation.isPending ? 'Creando…' : 'Crear categoría'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
