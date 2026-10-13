import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCategories, createCategory } from '../../api/expenses'
import { getOrganizations } from '../../api/organizations'
import { useAuth } from '../../context/AuthContext'
import DatePicker from '../../components/DatePicker'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

const labelStyle = { fontSize: 11, fontWeight: 500, color: C.piedra, display: 'block', marginBottom: 4 }

export default function ExpenseModal({ expense, onClose, onSaved }) {
  const isEditing = Boolean(expense)
  const { user } = useAuth()

  const [form, setForm] = useState({
    title: '',
    amount: '',
    currency: 'USD',
    date: new Date().toISOString().slice(0, 10),
    categoryId: '',
    notes: ''
  })
  const [newCatName, setNewCatName] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingCat, setSavingCat] = useState(false)

  const orgId = user?.org
  const { data: orgData } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganizations().then(r => r.data.data?.find(o => o.id === orgId)),
    enabled: Boolean(orgId) && !isEditing,
    staleTime: 5 * 60 * 1000,
  })

  const { data: categoriesData, refetch: refetchCats } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => getCategories().then(r => r.data.data)
  })
  const categories = categoriesData ?? []

  useEffect(() => {
    if (!isEditing && orgData?.defaultCurrency) {
      setForm(f => ({ ...f, currency: orgData.defaultCurrency }))
    }
  }, [orgData, isEditing])

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title,
        amount: expense.amount,
        currency: expense.currency ?? 'USD',
        date: expense.date?.slice(0, 10) ?? '',
        categoryId: expense.categoryId,
        notes: expense.notes ?? ''
      })
    }
  }, [expense])

  useEffect(() => {
    if (!form.categoryId && categories.length > 0) {
      setForm(f => ({ ...f, categoryId: categories[0].id }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(err.response?.data?.error || err.message || 'Error al guardar')
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
      setError(err.response?.data?.error || err.message || 'Error al crear categoría')
    } finally {
      setSavingCat(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      className="sm:items-center">
      <div style={{ width: '100%', maxWidth: 448, background: C.s1, borderRadius: '0 16px 0 0', border: `1px solid ${C.linea}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
        className="sm:rounded-[0_16px_16px_0] sm:max-h-[85vh]">

        {/* Header */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}` }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: C.crema, margin: 0 }}>{isEditing ? 'Editar egreso' : 'Nuevo egreso'}</h2>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, color: C.piedra, padding: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}>×</button>
        </div>

        {/* Scrollable body */}
        <form id="expense-form" onSubmit={handleSave} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Título</label>
            <input type="text" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="du-input" placeholder="Ej: Pago alquiler mayo" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Monto</label>
              <input type="number" min="0" step="1" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="du-input" placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Fecha</label>
              <DatePicker value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="du-input" />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Categoría</label>
              <button type="button" onClick={() => setShowNewCat(v => !v)}
                style={{ fontSize: 12, color: C.crema, background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                {showNewCat ? 'Cancelar' : '+ Nueva categoría'}
              </button>
            </div>
            {showNewCat ? (
              <div className="flex gap-2">
                <input type="text" value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="du-input" placeholder="Nombre de la categoría" />
                <button type="button" onClick={handleCreateCat} disabled={savingCat}
                  style={{ padding: '8px 12px', borderRadius: '0 8px 8px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 500, cursor: savingCat ? 'not-allowed' : 'pointer', opacity: savingCat ? 0.5 : 1, flexShrink: 0 }}>
                  Crear
                </button>
              </div>
            ) : (
              <select value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="du-input">
                <option value="">Seleccionar categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>

          <div>
            <label style={labelStyle}>Notas</label>
            <textarea value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="du-input resize-none" rows={2} placeholder="Opcional" />
          </div>

          {error && <p style={{ fontSize: 13, color: C.err }}>{error}</p>}
        </form>

        {/* Footer */}
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: `1px solid ${C.linea}` }}>
          <button type="button" onClick={onClose}
            style={{ padding: '8px 16px', fontSize: 13, color: C.piedra, background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
            Cancelar
          </button>
          <button type="submit" form="expense-form" disabled={saving}
            style={{ padding: '10px 20px', borderRadius: '0 10px 10px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear egreso'}
          </button>
        </div>

      </div>
    </div>
  )
}
