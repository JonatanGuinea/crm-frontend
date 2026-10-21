import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { getProducts, deleteProduct, getCategories } from '../../api/stock'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import ProductModal from './ProductModal'
import StockMovementModal from './StockMovementModal'
import CategoriesModal from './CategoriesModal'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

function PlusSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}
function PencilSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function TrashSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
}
function SearchSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
}
function ArrowDownSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
}
function ArrowUpSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
}
function AdjustSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>
}
function ChevronRSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
}
function WarnSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
}
function TagSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
}

const STATUS_STYLES = {
  active:       { bg: 'rgba(125,190,147,0.12)', color: C.ok },
  inactive:     { bg: 'rgba(140,135,126,0.12)', color: C.piedra },
  discontinued: { bg: 'rgba(229,131,115,0.12)', color: C.err },
}
const STATUS_LABELS = { active: 'Activo', inactive: 'Inactivo', discontinued: 'Descontinuado' }

const INVENTORY_TYPE_STYLES = {
  sale:         { bg: 'rgba(142,177,222,0.12)', color: C.info },
  internal:     { bg: 'rgba(226,182,99,0.12)',  color: C.warn },
  raw_material: { bg: 'rgba(125,190,147,0.12)', color: C.ok },
}
const INVENTORY_TYPE_LABELS = {
  sale:         'Para venta',
  internal:     'Interno',
  raw_material: 'Materia prima',
}

const INVENTORY_TABS = [
  { value: '',             label: 'Todos' },
  { value: 'sale',         label: 'Para venta' },
  { value: 'internal',     label: 'Interno' },
  { value: 'raw_material', label: 'Materia prima' },
]

const WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.531 5.847L.057 23.882l6.196-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.031-1.388l-.361-.214-3.736.873.936-3.629-.235-.373A9.775 9.775 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z'

function InventoryTypeBadge({ type }) {
  const s = INVENTORY_TYPE_STYLES[type] ?? { bg: 'rgba(140,135,126,0.12)', color: C.piedra }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 100, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color }}>
      {INVENTORY_TYPE_LABELS[type] ?? type}
    </span>
  )
}

function stockState(product) {
  const stock = Number(product.stock)
  const min   = Number(product.minStock)
  if (stock <= 0)         return 'out'
  if (min > 0 && stock <= min) return 'low'
  return 'ok'
}

const filterSelectStyle = { height: 34, padding: '0 12px', background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', color: C.crema, fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer' }

export default function ProductsPage() {
  const qc      = useQueryClient()
  const toast   = useToast()
  const confirm = useConfirm()

  const [searchParams] = useSearchParams()
  const initialStock = searchParams.get('outOfStock') === 'true' ? 'out'
    : searchParams.get('lowStock') === 'true' ? 'low' : ''
  const initialInventoryType = searchParams.get('inventoryType') ?? ''

  const [search, setSearch]             = useState('')
  const [filterStatus, setFilter]       = useState('')
  const [filterCategory, setFilterCat]  = useState('')
  const [filterStock, setFilterStock]   = useState(initialStock)
  const [filterType, setFilterType]     = useState(initialInventoryType)
  const [modal, setModal]               = useState(null)
  const [showCategories, setShowCategories] = useState(false)

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(r => r.data.data),
    staleTime: 60_000,
  })
  const categories = categoriesData ?? []

  const params = {
    search:        search          || undefined,
    status:        filterStatus    || undefined,
    categoryId:    filterCategory  || undefined,
    inventoryType: filterType      || undefined,
    outOfStock:    filterStock === 'out'  ? 'true' : undefined,
    lowStock:      filterStock === 'low'  ? 'true' : undefined,
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

  const hasFilters = search || filterStatus || filterCategory || filterStock || filterType

  const thStyle = { textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: 'uppercase', letterSpacing: '0.05em' }
  const tdStyle = { padding: '12px 14px' }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }} className="md:p-8">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TagSvg style={{ width: 18, height: 18, color: C.arena }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema, margin: 0 }}>Productos</h2>
          <span style={{ fontSize: 12, color: C.piedra }}>{products.length} producto{products.length !== 1 ? 's' : ''}{hasFilters ? ' (filtrados)' : ''}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowCategories(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: '0 10px 10px 0', border: `1px solid ${C.linea}`, background: C.s2, color: C.arena, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.borderColor = C.arena }}
            onMouseLeave={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.linea }}>
            <TagSvg style={{ width: 16, height: 16 }} />
            Categorías
          </button>
          <button onClick={() => setModal({ type: 'product' })}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: '0 10px 10px 0', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <PlusSvg style={{ width: 16, height: 16 }} />
            Nuevo
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Tab switcher tipo de inventario */}
        <div style={{ display: 'flex', gap: 3, padding: 4, height: 34, background: C.s2, border: `1px solid ${C.linea}`, borderRadius: '0 10px 10px 0' }}>
          {INVENTORY_TABS.map(t => (
            <button key={t.value} onClick={() => setFilterType(t.value)}
              style={{ padding: '0 10px', borderRadius: '0 7px 7px 0', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: filterType === t.value ? C.s3 : 'transparent', color: filterType === t.value ? C.crema : C.piedra }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div style={{ position: 'relative' }}>
          <SearchSvg style={{ width: 14, height: 14, color: C.piedra, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar…"
            style={{ height: 34, paddingLeft: 32, paddingRight: 12, background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', fontSize: 13, color: C.crema, outline: 'none', width: 180 }}
          />
        </div>

        <select value={filterStatus} onChange={e => setFilter(e.target.value)} style={filterSelectStyle}>
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="discontinued">Descontinuado</option>
        </select>

        {categories.length > 0 && (
          <select value={filterCategory} onChange={e => setFilterCat(e.target.value)} style={filterSelectStyle}>
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        <select value={filterStock} onChange={e => setFilterStock(e.target.value)} style={filterSelectStyle}>
          <option value="">Todo el stock</option>
          <option value="out">Sin stock</option>
          <option value="low">Stock bajo</option>
        </select>

        {hasFilters && (
          <button onClick={() => { setSearch(''); setFilter(''); setFilterCat(''); setFilterStock(''); setFilterType('') }}
            style={{ fontSize: 12, color: C.piedra, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            onMouseEnter={e => e.currentTarget.style.color = C.arena}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: C.piedra, fontSize: 14 }}>Cargando…</div>
      ) : products.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12, color: C.piedra }}>
          <p style={{ fontSize: 14 }}>{hasFilters ? 'Sin productos con esos filtros.' : 'Aún no hay productos. ¡Creá el primero!'}</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block" style={{ overflow: 'hidden', borderRadius: '0 16px 16px 0', border: `1px solid ${C.linea}` }}>
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.linea}`, background: 'rgba(38,38,42,0.6)' }}>
                  <th style={thStyle}>SKU</th>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Categoría</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Stock</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Costo</th>
                  <th style={thStyle}>Proveedor</th>
                  <th style={tdStyle} />
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const state = stockState(p)
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${C.linea}`, background: i % 2 !== 0 ? 'rgba(30,30,32,0.3)' : 'transparent' }}
                      className="hover:bg-[rgba(38,38,42,0.4)] last:border-0 transition-colors">
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, color: C.piedra }}>{p.sku}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {state === 'out' && <WarnSvg style={{ width: 14, height: 14, color: C.err, flexShrink: 0 }} />}
                          {state === 'low' && <WarnSvg style={{ width: 14, height: 14, color: C.warn, flexShrink: 0 }} />}
                          <span style={{ fontWeight: 500, color: C.crema }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={tdStyle}><InventoryTypeBadge type={p.inventoryType} /></td>
                      <td style={{ ...tdStyle, color: C.piedra }}>{p.category?.name ?? '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <span style={{ fontWeight: 600, color: state === 'out' ? C.err : state === 'low' ? C.warn : C.crema }}>
                          {Number(p.stock).toLocaleString('es-AR')}
                        </span>
                        <span style={{ fontSize: 12, color: C.piedra, marginLeft: 4 }}>{p.unit}</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: C.piedra }}>
                        {p.costPrice ? `$${Number(p.costPrice).toLocaleString('es-AR')}` : '—'}
                      </td>
                      <td style={tdStyle}>
                        {p.supplier ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, color: C.piedra, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{p.supplier.name}</span>
                            {p.supplier.phone ? (
                              <a href={`https://wa.me/${p.supplier.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                                title={`WhatsApp ${p.supplier.name}`}
                                style={{ padding: 4, borderRadius: '0 6px 6px 0', background: 'rgba(125,190,147,0.12)', color: C.ok, display: 'flex', flexShrink: 0 }}>
                                <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="currentColor"><path d={WA_PATH} /></svg>
                              </a>
                            ) : (
                              <button onClick={() => toast('Agregá un número de teléfono al proveedor para usar WhatsApp', 'error')}
                                title="Sin número de contacto"
                                style={{ padding: 4, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', color: C.piedra, opacity: 0.35, cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                                <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="currentColor"><path d={WA_PATH} /></svg>
                              </button>
                            )}
                          </div>
                        ) : <span style={{ fontSize: 13, color: C.piedra }}>—</span>}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                          <button onClick={() => setModal({ type: 'in', product: p })} title="Ingresar"
                            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', color: C.piedra, cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(125,190,147,0.12)'; e.currentTarget.style.color = C.ok }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.piedra }}>
                            <ArrowDownSvg style={{ width: 14, height: 14 }} />
                          </button>
                          <button onClick={() => setModal({ type: 'out', product: p })} title="Egresar"
                            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', color: C.piedra, cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,131,115,0.12)'; e.currentTarget.style.color = C.err }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.piedra }}>
                            <ArrowUpSvg style={{ width: 14, height: 14 }} />
                          </button>
                          <button onClick={() => setModal({ type: 'adj', product: p })} title="Ajustar"
                            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', color: C.piedra, cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(226,182,99,0.12)'; e.currentTarget.style.color = C.warn }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.piedra }}>
                            <AdjustSvg style={{ width: 14, height: 14 }} />
                          </button>
                          <button onClick={() => setModal({ type: 'product', product: p })} title="Editar"
                            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', color: C.piedra, cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(185,180,170,0.08)'; e.currentTarget.style.color = C.crema }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.piedra }}>
                            <PencilSvg style={{ width: 14, height: 14 }} />
                          </button>
                          <button onClick={() => handleDelete(p)} title="Eliminar"
                            style={{ padding: 6, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', color: C.piedra, cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,131,115,0.12)'; e.currentTarget.style.color = C.err }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.piedra }}>
                            <TrashSvg style={{ width: 14, height: 14 }} />
                          </button>
                          <Link to={`/stock/products/${p.id}`} title="Ver kardex"
                            style={{ padding: 6, borderRadius: '0 6px 6px 0', color: C.piedra, display: 'flex' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(185,180,170,0.08)'; e.currentTarget.style.color = C.crema }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.piedra }}>
                            <ChevronRSvg style={{ width: 14, height: 14 }} />
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
                <div key={p.id} style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 12px 12px 0', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <p style={{ fontFamily: 'monospace', fontSize: 12, color: C.piedra }}>{p.sku}</p>
                      <p style={{ fontWeight: 600, color: C.crema, marginTop: 2 }}>{p.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <InventoryTypeBadge type={p.inventoryType} />
                        {p.category && <p style={{ fontSize: 12, color: C.piedra }}>{p.category.name}</p>}
                      </div>
                    </div>
                    {p.supplier && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: C.piedra, background: C.s2, padding: '2px 8px', borderRadius: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>
                          {p.supplier.name}
                        </span>
                        {p.supplier.phone ? (
                          <a href={`https://wa.me/${p.supplier.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                            style={{ padding: 4, borderRadius: '0 6px 6px 0', background: 'rgba(125,190,147,0.12)', color: C.ok, display: 'flex' }}>
                            <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="currentColor"><path d={WA_PATH} /></svg>
                          </a>
                        ) : (
                          <button onClick={() => toast('Agregá un número de teléfono al proveedor para usar WhatsApp', 'error')}
                            style={{ padding: 4, borderRadius: '0 6px 6px 0', background: 'none', border: 'none', color: C.piedra, opacity: 0.35, cursor: 'pointer', display: 'flex' }}>
                            <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="currentColor"><path d={WA_PATH} /></svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: 12, color: C.piedra }}>Stock</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: state === 'out' ? C.err : state === 'low' ? C.warn : C.crema }}>
                        {Number(p.stock).toLocaleString('es-AR')} <span style={{ fontSize: 12, fontWeight: 400, color: C.piedra }}>{p.unit}</span>
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setModal({ type: 'in', product: p })}
                        style={{ padding: 8, borderRadius: '0 8px 8px 0', background: 'rgba(125,190,147,0.12)', color: C.ok, border: 'none', cursor: 'pointer', display: 'flex' }}>
                        <ArrowDownSvg style={{ width: 16, height: 16 }} />
                      </button>
                      <button onClick={() => setModal({ type: 'out', product: p })}
                        style={{ padding: 8, borderRadius: '0 8px 8px 0', background: 'rgba(229,131,115,0.12)', color: C.err, border: 'none', cursor: 'pointer', display: 'flex' }}>
                        <ArrowUpSvg style={{ width: 16, height: 16 }} />
                      </button>
                      <button onClick={() => setModal({ type: 'product', product: p })}
                        style={{ padding: 8, borderRadius: '0 8px 8px 0', background: C.s2, color: C.piedra, border: 'none', cursor: 'pointer', display: 'flex' }}>
                        <PencilSvg style={{ width: 16, height: 16 }} />
                      </button>
                      <Link to={`/stock/products/${p.id}`}
                        style={{ padding: 8, borderRadius: '0 8px 8px 0', background: C.s2, color: C.piedra, display: 'flex' }}>
                        <ChevronRSvg style={{ width: 16, height: 16 }} />
                      </Link>
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
