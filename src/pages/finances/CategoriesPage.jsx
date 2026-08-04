import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getFinancialCategories, createFinancialCategory,
  updateFinancialCategory, deleteFinancialCategory, seedFinancialCategories,
} from '../../api/finances'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import {
  ChevronLeftIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, SparklesIcon,
} from '@heroicons/react/24/outline'

const inputCls = 'w-full rounded-lg border border-line bg-raised text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40'
const labelCls = 'text-xs font-medium text-fg-muted'

function CategoryModal({ category, onClose, onSaved }) {
  const toast  = useToast()
  const isEdit = !!category
  const [form, setForm] = useState({
    name: category?.name ?? '',
    type: category?.type ?? 'expense',
  })
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-sm bg-surface rounded-t-2xl sm:rounded-2xl border border-line shadow-xl">

        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line">
          <h2 className="text-base font-semibold text-fg">
            {isEdit ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button onClick={onClose} className="text-fg-muted hover:text-fg transition-colors p-1">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">

          {/* Tipo (solo en creación) */}
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Tipo</label>
              <div className="flex rounded-lg overflow-hidden border border-line text-sm font-medium">
                <button
                  type="button"
                  onClick={() => set('type', 'income')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors ${
                    form.type === 'income' ? 'bg-success text-white' : 'text-fg-muted hover:text-fg hover:bg-raised'
                  }`}
                >
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => set('type', 'expense')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors ${
                    form.type === 'expense' ? 'bg-danger text-white' : 'text-fg-muted hover:text-fg hover:bg-raised'
                  }`}
                >
                  <ArrowTrendingDownIcon className="w-4 h-4" />
                  Egreso
                </button>
              </div>
            </div>
          )}

          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Nombre</label>
            <input
              type="text"
              placeholder={form.type === 'income' ? 'Ej: Cobro de cliente…' : 'Ej: Alquiler, sueldos…'}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className={inputCls}
              required
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-1 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-line text-sm font-medium text-fg-muted hover:text-fg hover:bg-raised transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CategoryGroup({ title, type, categories, onEdit, onDelete }) {
  const isIncome = type === 'income'
  const accent   = isIncome ? 'text-success' : 'text-danger'
  const bg       = isIncome ? 'bg-success-subtle/10 border-success/20' : 'bg-danger-subtle/10 border-danger/20'
  const Icon     = isIncome ? ArrowTrendingUpIcon : ArrowTrendingDownIcon

  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${bg}`}>
        <Icon className={`w-4 h-4 ${accent}`} />
        <h2 className={`text-sm font-semibold ${accent}`}>{title}</h2>
        <span className="ml-auto text-xs text-fg-muted">{categories.length}</span>
      </div>

      {categories.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-muted border border-dashed border-line rounded-xl">
          Sin categorías de {isIncome ? 'ingreso' : 'egreso'} aún.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="flex items-center gap-3 px-4 py-3 bg-surface border border-line rounded-xl group"
            >
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isIncome ? 'bg-success' : 'bg-danger'}`} />
              <p className="text-sm text-fg flex-1 min-w-0 truncate">{cat.name}</p>
              {cat._count?.movements > 0 && (
                <span className="text-xs text-fg-muted shrink-0">
                  {cat._count.movements} mov.
                </span>
              )}
              {cat.isDefault && (
                <span className="text-xs text-fg-muted bg-raised px-2 py-0.5 rounded-full shrink-0">
                  Default
                </span>
              )}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => onEdit(cat)}
                  className="p-1.5 text-fg-muted hover:text-fg rounded-lg hover:bg-raised transition-colors"
                  title="Editar"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(cat)}
                  className="p-1.5 text-fg-muted hover:text-danger rounded-lg hover:bg-danger-subtle/20 transition-colors"
                  title="Eliminar"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
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
  const [modal,   setModal]   = useState(null)
  const [seeding, setSeeding] = useState(false)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['financial-categories-all'],
    queryFn: () => getFinancialCategories().then(r => r.data.data),
  })

  function invalidate() {
    qc.invalidateQueries(['financial-categories-all'])
    qc.invalidateQueries(['financial-categories'])
  }

  async function handleSeed() {
    setSeeding(true)
    try {
      await seedFinancialCategories()
      toast('Categorías inicializadas', 'success')
      invalidate()
    } catch (err) {
      toast(err.response?.data?.error || err.message, 'error')
    } finally {
      setSeeding(false)
    }
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
    <div className="p-4 md:p-8 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/finances" className="text-fg-muted hover:text-fg transition-colors shrink-0">
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-fg">Categorías</h1>
            <p className="text-xs text-fg-muted mt-0.5">{categories.length} categoría{categories.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {categories.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-sm font-medium text-fg-muted hover:text-fg hover:bg-raised transition-colors disabled:opacity-50"
            >
              <SparklesIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{seeding ? 'Inicializando…' : 'Cargar predeterminadas'}</span>
            </button>
          )}
          <button
            onClick={() => setModal({ create: true })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva categoría</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-fg-muted text-sm">Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CategoryGroup
            title="Ingresos"
            type="income"
            categories={income}
            onEdit={cat => setModal({ edit: cat })}
            onDelete={handleDelete}
          />
          <CategoryGroup
            title="Egresos"
            type="expense"
            categories={expense}
            onEdit={cat => setModal({ edit: cat })}
            onDelete={handleDelete}
          />
        </div>
      )}

      {/* Seed si hay categorías */}
      {!isLoading && categories.length > 0 && (
        <div className="flex items-center justify-center pt-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors disabled:opacity-50"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            {seeding ? 'Inicializando…' : 'Recargar categorías predeterminadas'}
          </button>
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
