import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/stock'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { XMarkIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline'

const PRESET_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#64748b',
]

const inputCls = 'w-full px-3 py-2 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors placeholder:text-fg-muted'
const labelCls = 'block text-xs font-medium text-fg-muted mb-1'

// ── Row ──────────────────────────────────────────────────────────────────────
function CategoryRow({ cat, isChild, editing, onStartEdit, onCancelEdit, onSave, saving, onDelete }) {
  const isEditing = editing?.id === cat.id
  const productCount = cat._count?.products ?? 0
  const childCount   = cat.children?.length ?? 0
  const canDelete    = productCount === 0 && childCount === 0

  if (isEditing) {
    return (
      <form
        onSubmit={onSave}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-subtle/20 border border-brand/20 ${isChild ? 'ml-6' : ''}`}
      >
        <ColorDot color={editing.color} />
        <input
          className="flex-1 px-2 py-1.5 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors"
          value={editing.name}
          onChange={e => onStartEdit({ ...editing, name: e.target.value })}
          autoFocus
          required
        />
        <button
          type="submit"
          disabled={saving}
          className="p-1.5 rounded-lg bg-brand text-white hover:opacity-90 transition-opacity shrink-0 disabled:opacity-60"
        >
          <CheckIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onCancelEdit}
          className="p-1.5 rounded-lg hover:bg-raised text-fg-muted hover:text-fg transition-colors shrink-0"
        >
          <XMarkIcon className="w-3.5 h-3.5" />
        </button>
      </form>
    )
  }

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-raised/50 transition-colors group ${isChild ? 'ml-6' : ''}`}>
      <ColorDot color={cat.color} />
      <span className="flex-1 text-sm text-fg font-medium truncate">{cat.name}</span>
      <span className="text-xs text-fg-muted shrink-0">{productCount} prod.</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onStartEdit({ id: cat.id, name: cat.name, color: cat.color || PRESET_COLORS[0] })}
          className="p-1.5 rounded-md hover:bg-raised text-fg-muted hover:text-fg transition-colors"
        >
          <PencilIcon className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDelete(cat)}
          disabled={!canDelete}
          title={!canDelete ? `No se puede eliminar: tiene ${productCount > 0 ? `${productCount} producto(s)` : 'subcategorías'}` : 'Eliminar'}
          className="p-1.5 rounded-md hover:bg-danger-subtle text-fg-muted hover:text-danger transition-colors disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-fg-muted"
        >
          <TrashIcon className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function ColorDot({ color }) {
  return <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color || PRESET_COLORS[0] }} />
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function CategoriesModal({ onClose }) {
  const qc      = useQueryClient()
  const toast   = useToast()
  const confirm = useConfirm()

  const [editing, setEditing] = useState(null) // { id, name, color }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface border border-line rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
          <div>
            <h2 className="text-base font-semibold text-fg">Categorías</h2>
            <p className="text-xs text-fg-muted mt-0.5">
              {categories.length} categoría{categories.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-raised text-fg-muted hover:text-fg transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
          {categories.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-fg-muted">Aún no hay categorías. ¡Creá la primera!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
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
        <div className="border-t border-line px-6 py-5 shrink-0">
          <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-3">Nueva categoría</p>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex items-end gap-3">
              {/* Color */}
              <div className="shrink-0">
                <label className={labelCls}>Color</label>
                <div className="flex flex-col gap-1.5">
                  <div className="grid grid-cols-4 gap-1">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, color: c }))}
                        className={`w-6 h-6 rounded-md transition-all ${form.color === c ? 'ring-2 ring-offset-1 ring-brand scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Nombre */}
              <div className="flex-1">
                <label className={labelCls}>Nombre *</label>
                <input
                  className={inputCls}
                  placeholder="Ej: Materiales"
                  value={form.name}
                  onChange={setField('name')}
                  required
                />
              </div>
            </div>

            {topLevel.length > 0 && (
              <div>
                <label className={labelCls}>Subcategoría de</label>
                <select className={inputCls} value={form.parentId} onChange={setField('parentId')}>
                  <option value="">Categoría raíz</option>
                  {topLevel.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={createMutation.isPending || !form.name.trim()}
              className="w-full py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {createMutation.isPending ? 'Creando…' : 'Crear categoría'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
