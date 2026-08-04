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
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU…"
            className="pl-9 pr-3 py-1.5 rounded-lg bg-raised border border-line text-sm text-fg focus:outline-none focus:border-brand transition-colors w-full sm:w-56"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <select value={filterStatus} onChange={e => setFilter(e.target.value)} className="px-3 py-1.5 rounded-lg bg-raised border border-line text-sm text-fg-soft focus:outline-none focus:border-brand transition-colors">
            <option value="">Estado</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="discontinued">Descontinuado</option>
          </select>

          {categories.length > 0 && (
            <select value={filterCategory} onChange={e => setFilterCat(e.target.value)} className="px-3 py-1.5 rounded-lg bg-raised border border-line text-sm text-fg-soft focus:outline-none focus:border-brand transition-colors">
              <option value="">Categoría</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          <select value={filterStock} onChange={e => setFilterStock(e.target.value)} className="px-3 py-1.5 rounded-lg bg-raised border border-line text-sm text-fg-soft focus:outline-none focus:border-brand transition-colors">
            <option value="">Stock</option>
            <option value="out">Sin stock</option>
            <option value="low">Stock bajo</option>
          </select>

          {hasFilters && (
            <button onClick={() => { setSearch(''); setFilter(''); setFilterCat(''); setFilterStock('') }} className="text-xs text-fg-muted hover:text-fg underline transition-colors">
              Limpiar
            </button>
          )}
        </div>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Proveedor</th>
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
                      <td className="px-4 py-3">
                        {p.supplier ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-fg-muted truncate max-w-[140px]">{p.supplier.name}</span>
                            {p.supplier.phone ? (
                              <a
                                href={`https://wa.me/${p.supplier.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                title={`WhatsApp ${p.supplier.name}`}
                                className="p-1 rounded-md bg-success-subtle text-success hover:opacity-80 transition-opacity shrink-0"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.531 5.847L.057 23.882l6.196-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.031-1.388l-.361-.214-3.736.873.936-3.629-.235-.373A9.775 9.775 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                              </a>
                            ) : (
                              <button
                                onClick={() => toast('Agregá un número de teléfono al proveedor para usar WhatsApp', 'error')}
                                title="Sin número de contacto"
                                className="p-1 rounded-md text-fg-muted/30 hover:text-fg-muted transition-colors shrink-0"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.531 5.847L.057 23.882l6.196-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.031-1.388l-.361-.214-3.736.873.936-3.629-.235-.373A9.775 9.775 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                              </button>
                            )}
                          </div>
                        ) : <span className="text-sm text-fg-muted">—</span>}
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
                    {p.supplier && (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-fg-muted bg-raised px-2 py-0.5 rounded-full truncate max-w-[90px]">
                          {p.supplier.name}
                        </span>
                        {p.supplier.phone ? (
                          <a
                            href={`https://wa.me/${p.supplier.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            title={`WhatsApp ${p.supplier.name}`}
                            className="p-1 rounded-md hover:bg-success-subtle text-fg-muted hover:text-success transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.531 5.847L.057 23.882l6.196-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.031-1.388l-.361-.214-3.736.873.936-3.629-.235-.373A9.775 9.775 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                          </a>
                        ) : (
                          <button
                            onClick={() => toast('Agregá un número de teléfono al proveedor para usar WhatsApp', 'error')}
                            title="Sin número de contacto"
                            className="p-1 rounded-md text-fg-muted/30 hover:text-fg-muted transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.531 5.847L.057 23.882l6.196-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.031-1.388l-.361-.214-3.736.873.936-3.629-.235-.373A9.775 9.775 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                          </button>
                        )}
                      </div>
                    )}
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
