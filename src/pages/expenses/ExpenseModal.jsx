import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCategories, createCategory } from '../../api/expenses'

const inputCls = "w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
const labelCls = "block text-sm font-medium text-fg-soft mb-1"

export default function ExpenseModal({ expense, onClose, onSaved }) {
  const isEditing = Boolean(expense)

  const [form, setForm] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    categoryId: '',
    notes: ''
  })
  const [newCatName, setNewCatName] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingCat, setSavingCat] = useState(false)

  const { data: categoriesData, refetch: refetchCats } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => getCategories().then(r => r.data.data)
  })
  const categories = categoriesData ?? []

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title,
        amount: expense.amount,
        date: expense.date?.slice(0, 10) ?? '',
        categoryId: expense.categoryId,
        notes: expense.notes ?? ''
      })
    }
  }, [expense])

  // Preseleccionar primera categoría al cargar
  useEffect(() => {
    if (!form.categoryId && categories.length > 0) {
      setForm(f => ({ ...f, categoryId: categories[0].id }))
    }
  }, [categories])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!form.title || !form.amount || !form.date || !form.categoryId) {
      return setError('Todos los campos son requeridos')
    }
    setSaving(true)
    try {
      await onSaved({ ...form, amount: parseFloat(form.amount) })
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateCat() {
    if (!newCatName.trim()) return
    setSavingCat(true)
    try {
      const res = await createCategory({ name: newCatName.trim() })
      await refetchCats()
      setForm(f => ({ ...f, categoryId: res.data.data.id }))
      setNewCatName('')
      setShowNewCat(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear categoría')
    } finally {
      setSavingCat(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-line">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-base font-semibold text-fg">{isEditing ? 'Editar egreso' : 'Nuevo egreso'}</h2>
          <button onClick={onClose} className="text-fg-muted hover:text-fg text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Título</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={inputCls}
              placeholder="Ej: Pago alquiler mayo"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Monto</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelCls}>Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls.replace('mb-1', '')}>Categoría</label>
              <button
                type="button"
                onClick={() => setShowNewCat(v => !v)}
                className="text-xs text-brand hover:underline"
              >
                {showNewCat ? 'Cancelar' : '+ Nueva categoría'}
              </button>
            </div>
            {showNewCat ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className={inputCls}
                  placeholder="Nombre de la categoría"
                />
                <button
                  type="button"
                  onClick={handleCreateCat}
                  disabled={savingCat}
                  className="px-3 py-2 bg-brand text-white rounded-md text-sm hover:bg-brand-hover disabled:opacity-50 shrink-0"
                >
                  Crear
                </button>
              </div>
            ) : (
              <select
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className={inputCls}
              >
                <option value="">Seleccionar categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className={labelCls}>Notas</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={inputCls + ' resize-none'}
              rows={2}
              placeholder="Opcional"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-fg-soft hover:text-fg">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
            >
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear egreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
