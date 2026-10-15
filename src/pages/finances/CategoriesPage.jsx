import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getFinancialCategories, createFinancialCategory,
  updateFinancialCategory, deleteFinancialCategory,
} from '../../api/finances'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

function CloseSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}
function ChevronLSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
}
function PlusSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}
function PencilSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function TrashSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
}
function TrendUpSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
}
function TrendDownSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>
}
function TagSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
}

function CategoryModal({ category, onClose, onSaved }) {
  const toast  = useToast()
  const isEdit = !!category
  const [form, setForm] = useState({ name: category?.name ?? '', type: category?.type ?? 'expense' })
  const [saving, setSaving] = useState(false)

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast('Ingresá un nombre', 'error')
    setSaving(true)
    try {
      if (isEdit) await updateFinancialCategory(category.id, { name: form.name })
      else        await createFinancialCategory(form)
      onSaved()
    } catch (err) {
      toast(err.response?.data?.error || err.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = { fontSize: 11, fontWeight: 500, color: C.piedra }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      className="items-end sm:items-center">
      <div style={{ width: '100%', maxWidth: 400, background: C.s1, borderRadius: '0 16px 0 0', border: `1px solid ${C.linea}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        className="sm:rounded-[0_16px_16px_0]">

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${C.linea}` }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.crema }}>
            {isEdit ? 'Editar categoría' : 'Nueva categoría'}
          </span>
          <button onClick={onClose}
            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra }}
            onMouseEnter={e => e.currentTarget.style.color = C.crema}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
            <CloseSvg style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {!isEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>Tipo</label>
              <div style={{ display: 'flex', overflow: 'hidden', border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 500 }}>
                <button type="button" onClick={() => set('type', 'income')}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: form.type === 'income' ? C.ok : 'transparent', color: form.type === 'income' ? C.bg : C.piedra, border: 'none', cursor: 'pointer' }}>
                  <TrendUpSvg style={{ width: 14, height: 14 }} /> Ingreso
                </button>
                <button type="button" onClick={() => set('type', 'expense')}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: form.type === 'expense' ? C.err : 'transparent', color: form.type === 'expense' ? C.bg : C.piedra, border: 'none', cursor: 'pointer' }}>
                  <TrendDownSvg style={{ width: 14, height: 14 }} /> Egreso
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Nombre</label>
            <input type="text"
              placeholder={form.type === 'income' ? 'Ej: Cobro de cliente…' : 'Ej: Alquiler, sueldos…'}
              value={form.name} onChange={e => set('name', e.target.value)}
              className="du-input" required autoFocus />
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4, paddingBottom: 8 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: `1px solid ${C.linea}`, background: 'none', color: C.piedra, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: '10px 0', borderRadius: '0 10px 10px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CategoryGroup({ title, type, categories, onEdit, onDelete }) {
  const isIncome  = type === 'income'
  const accent    = isIncome ? C.ok : C.err
  const accentBg  = isIncome ? 'rgba(125,190,147,0.08)' : 'rgba(229,131,115,0.08)'
  const accentBdr = isIncome ? 'rgba(125,190,147,0.2)' : 'rgba(229,131,115,0.2)'
  const Icon      = isIncome ? TrendUpSvg : TrendDownSvg

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: '0 10px 10px 0', border: `1px solid ${accentBdr}`, background: accentBg }}>
        <Icon style={{ width: 15, height: 15, color: accent }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>{title}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.piedra }}>{categories.length}</span>
      </div>

      {categories.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: C.piedra, border: `1px dashed ${C.linea}`, borderRadius: '0 10px 10px 0' }}>
          Sin categorías de {isIncome ? 'ingreso' : 'egreso'} aún.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {categories.map(cat => (
            <div key={cat.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 10px 10px 0' }}
              className="group">
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: C.crema, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
              {cat._count?.movements > 0 && (
                <span style={{ fontSize: 11, color: C.piedra, flexShrink: 0 }}>{cat._count.movements} mov.</span>
              )}
              {cat.isDefault && (
                <span style={{ fontSize: 10.5, color: C.piedra, background: C.s3, padding: '1px 7px', borderRadius: '0 4px 4px 0', flexShrink: 0 }}>Default</span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(cat)}
                  style={{ padding: 5, borderRadius: '0 5px 5px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.arena}
                  onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                  <PencilSvg style={{ width: 13, height: 13 }} />
                </button>
                <button onClick={() => onDelete(cat)}
                  style={{ padding: 5, borderRadius: '0 5px 5px 0', background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, display: 'flex' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.err}
                  onMouseLeave={e => e.currentTarget.style.color = C.piedra}>
                  <TrashSvg style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CategoriesPage() {
  const toast   = useToast()
  const confirm = useConfirm()
  const qc      = useQueryClient()
  const [modal, setModal] = useState(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['financial-categories-all'],
    queryFn: () => getFinancialCategories().then(r => r.data.data),
  })

  function invalidate() {
    qc.invalidateQueries(['financial-categories-all'])
    qc.invalidateQueries(['financial-categories'])
  }

  async function handleDelete(cat) {
    const ok = await confirm(
      `¿Eliminar "${cat.name}"? Solo es posible si no tiene movimientos asociados.`,
      { confirmLabel: 'Eliminar', danger: true }
    )
    if (!ok) return
    try {
      await deleteFinancialCategory(cat.id)
      toast('Categoría eliminada', 'success')
      invalidate()
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error')
    }
  }

  const income  = categories.filter(c => c.type === 'income')
  const expense = categories.filter(c => c.type === 'expense')

  return (
    <div className="px-4 pt-4 pb-10 md:px-6 md:pt-5" style={{ fontFamily: 'Geist, system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 12, color: C.piedra }}>{categories.length} categoría{categories.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setModal({ create: true })}
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: C.crema, color: C.bg, borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          <PlusSvg style={{ width: 13, height: 13 }} />
          Nueva categoría
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', fontSize: 13, color: C.piedra }}>Cargando…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CategoryGroup title="Ingresos"  type="income"  categories={income}  onEdit={cat => setModal({ edit: cat })} onDelete={handleDelete} />
          <CategoryGroup title="Egresos"   type="expense" categories={expense} onEdit={cat => setModal({ edit: cat })} onDelete={handleDelete} />
        </div>
      )}

      {(modal?.create || modal?.edit) && (
        <CategoryModal
          category={modal.edit}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); invalidate() }}
        />
      )}
    </div>
  )
}
