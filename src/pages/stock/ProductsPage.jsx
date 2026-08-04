import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getProducts, deleteProduct, getCategories } from '../../api/stock'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import ProductModal from './ProductModal'
import StockMovementModal from './StockMovementModal'
import CategoriesModal from './CategoriesModal'
import {
  PlusIcon, PencilIcon, TrashIcon,
  MagnifyingGlassIcon, ArrowDownTrayIcon, ArrowUpTrayIcon,
  AdjustmentsHorizontalIcon, ChevronRightIcon, ExclamationTriangleIcon,
  TagIcon,
} from '@heroicons/react/24/outline'

const STATUS_STYLES = {
  active:       'bg-success-subtle text-success',
  inactive:     'bg-raised text-fg-muted',
  discontinued: 'bg-danger-subtle text-danger',
}
const STATUS_LABELS = { active: 'Activo', inactive: 'Inactivo', discontinued: 'Descontinuado' }

function stockState(product) {
  const stock = Number(product.stock)
  const min   = Number(product.minStock)
  if (stock <= 0)         return 'out'
  if (min > 0 && stock <= min) return 'low'
  return 'ok'
}

export default function ProductsPage() {
  const qc      = useQueryClient()
  const toast   = useToast()
  const confirm = useConfirm()

  const [search, setSearch]         = useState('')
  const [filterStatus, setFilter]   = useState('')
  const [filterCategory, setFilterCat] = useState('')
  const [filterStock, setFilterStock]  = useState('')
  const [modal, setModal]           = useState(null) // { type: 'product'|'in'|'out'|'adj', product? }
  const [showCategories, setShowCategories] = useState(false)

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(r => r.data.data),
    staleTime: 60_000,
  })
  const categories = categoriesData ?? []

  const params = {
    search:     search   || undefined,
    status:     filterStatus    || undefined,
    categoryId: filterCategory  || undefined,
    outOfStock: filterStock === 'out'  ? 'true' : undefined,
    lowStock:   filterStock === 'low'  ? 'true' : undefined,
    limit: 100,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params).then(r => r.data.data),
  })
  const products = data?.items ?? []

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: (res) => {
      qc.invalidateQueries(['products'])
      qc.invalidateQueries(['stock-dashboard'])
      const msg = res.data.data?._softDeleted
        ? 'Producto marcado como descontinuado (tenía movimientos)'
        : 'Producto eliminado'
      toast(msg, 'success')
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al eliminar', 'error'),
  })

  async function handleDelete(product) {
    const ok = await confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`, { confirmLabel: 'Eliminar', danger: true })
    if (ok) deleteMutation.mutate(product.id)
  }

  const hasFilters = search || filterStatus || filterCategory || filterStock

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-fg">Productos</h1>
          <p className="text-sm text-fg-muted mt-0.5">{products.length} producto{products.length !== 1 ? 's' : ''}{hasFilters ? ' (filtrados)' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategories(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line bg-surface text-sm font-medium text-fg-soft hover:bg-raised hover:text-fg transition-colors"
          >
            <TagIcon className="w-4 h-4" />
            Categorías
          </button>
          <button
            onClick={() => setModal({ type: 'product' })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-4 h-4" />
            Nuevo producto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU…"
            className="pl-9 pr-3 py-1.5 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors w-56"
          />
        </div>

        <select value={filterStatus} onChange={e => setFilter(e.target.value)} className="px-3 py-1.5 rounded-lg bg-raised border border-line text-sm text-fg-soft focus:outline-none focus:border-brand transition-colors">
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="discontinued">Descontinuado</option>
        </select>

        {categories.length > 0 && (
          <select value={filterCategory} onChange={e => setFilterCat(e.target.value)} className="px-3 py-1.5 rounded-lg bg-raised border border-line text-sm text-fg-soft focus:outline-none focus:border-brand transition-colors">
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        <select value={filterStock} onChange={e => setFilterStock(e.target.value)} className="px-3 py-1.5 rounded-lg bg-raised border border-line text-sm text-fg-soft focus:outline-none focus:border-brand transition-colors">
          <option value="">Todo el stock</option>
          <option value="out">Sin stock</option>
          <option value="low">Stock bajo</option>
        </select>

        {hasFilters && (
          <button onClick={() => { setSearch(''); setFilter(''); setFilterCat(''); setFilterStock('') }} className="text-xs text-fg-muted hover:text-fg underline transition-colors">
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-fg-muted text-sm">Cargando…</div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-fg-muted">
          <p className="text-sm">{hasFilters ? 'Sin productos con esos filtros.' : 'Aún no hay productos. ¡Creá el primero!'}</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-raised/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Categoría</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Stock</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Costo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const state = stockState(p)
                  return (
                    <tr key={p.id} className={`border-b border-line last:border-0 hover:bg-raised/40 transition-colors ${i % 2 === 0 ? '' : 'bg-raised/20'}`}>
                      <td className="px-4 py-3 font-mono text-xs text-fg-muted">{p.sku}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {state === 'out' && <ExclamationTriangleIcon className="w-3.5 h-3.5 text-danger shrink-0" />}
                          {state === 'low' && <ExclamationTriangleIcon className="w-3.5 h-3.5 text-warning shrink-0" />}
                          <span className="font-medium text-fg">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{p.category?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${state === 'out' ? 'text-danger' : state === 'low' ? 'text-warning' : 'text-fg'}`}>
                          {Number(p.stock).toLocaleString('es-AR')}
                        </span>
                        <span className="text-xs text-fg-muted ml-1">{p.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-fg-muted">
                        {p.costPrice ? `$${Number(p.costPrice).toLocaleString('es-AR')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setModal({ type: 'in', product: p })} title="Ingresar" className="p-1.5 rounded-md hover:bg-success-subtle text-fg-muted hover:text-success transition-colors">
                            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setModal({ type: 'out', product: p })} title="Egresar" className="p-1.5 rounded-md hover:bg-danger-subtle text-fg-muted hover:text-danger transition-colors">
                            <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setModal({ type: 'adj', product: p })} title="Ajustar" className="p-1.5 rounded-md hover:bg-warning-subtle text-fg-muted hover:text-warning transition-colors">
                            <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setModal({ type: 'product', product: p })} title="Editar" className="p-1.5 rounded-md hover:bg-raised text-fg-muted hover:text-fg transition-colors">
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(p)} title="Eliminar" className="p-1.5 rounded-md hover:bg-danger-subtle text-fg-muted hover:text-danger transition-colors">
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                          <Link to={`/stock/products/${p.id}`} title="Ver kardex" className="p-1.5 rounded-md hover:bg-raised text-fg-muted hover:text-fg transition-colors">
                            <ChevronRightIcon className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {products.map(p => {
              const state = stockState(p)
              return (
                <div key={p.id} className="bg-surface border border-line rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs text-fg-muted">{p.sku}</p>
                      <p className="font-semibold text-fg mt-0.5">{p.name}</p>
                      {p.category && <p className="text-xs text-fg-muted mt-0.5">{p.category.name}</p>}
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-fg-muted">Stock</p>
                      <p className={`text-lg font-bold ${state === 'out' ? 'text-danger' : state === 'low' ? 'text-warning' : 'text-fg'}`}>
                        {Number(p.stock).toLocaleString('es-AR')} <span className="text-xs font-normal text-fg-muted">{p.unit}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setModal({ type: 'in', product: p })} className="p-2 rounded-lg bg-success-subtle text-success"><ArrowDownTrayIcon className="w-4 h-4" /></button>
                      <button onClick={() => setModal({ type: 'out', product: p })} className="p-2 rounded-lg bg-danger-subtle text-danger"><ArrowUpTrayIcon className="w-4 h-4" /></button>
                      <button onClick={() => setModal({ type: 'product', product: p })} className="p-2 rounded-lg hover:bg-raised text-fg-muted"><PencilIcon className="w-4 h-4" /></button>
                      <Link to={`/stock/products/${p.id}`} className="p-2 rounded-lg hover:bg-raised text-fg-muted"><ChevronRightIcon className="w-4 h-4" /></Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Modals */}
      {modal?.type === 'product' && (
        <ProductModal product={modal.product} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'in' && (
        <StockMovementModal product={modal.product} mode="in" onClose={() => setModal(null)} />
      )}
      {modal?.type === 'out' && (
        <StockMovementModal product={modal.product} mode="out" onClose={() => setModal(null)} />
      )}
      {modal?.type === 'adj' && (
        <StockMovementModal product={modal.product} mode="adjustment" onClose={() => setModal(null)} />
      )}
      {showCategories && (
        <CategoriesModal onClose={() => setShowCategories(false)} />
      )}
    </div>
  )
}
