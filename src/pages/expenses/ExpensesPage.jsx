import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { getExpenses, getCategories, createExpense, updateExpense, deleteExpense } from '../../api/expenses'
import ExpenseModal from './ExpenseModal'
import Pagination from '../../components/Pagination'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }
const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"
const card = { background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0' }
const SECTION_TITLE = { fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.arena }

function TrendDownSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>
}
function TrashSvg() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
}

const fmt = (n) => Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d) => new Date(d).toLocaleDateString('es-AR')

export default function ExpensesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const canWrite = user?.role !== 'member'
  const qc = useQueryClient()

  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', { categoryId: categoryFilter, page }],
    queryFn: () => getExpenses({ categoryId: categoryFilter || undefined, page, limit: 20 }).then(r => r.data)
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => getCategories().then(r => r.data.data)
  })

  const createMut = useMutation({
    mutationFn: (data) => createExpense(data),
    onSuccess: () => { qc.invalidateQueries(['expenses']); setModalOpen(false) }
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateExpense(id, data),
    onSuccess: () => { qc.invalidateQueries(['expenses']); setEditing(null) }
  })

  const deleteMut = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => { qc.invalidateQueries(['expenses']); toast('Egreso eliminado', 'success') }
  })

  const expenses = data?.data ?? []
  const pagination = data?.pagination
  const totalFiltered = expenses.reduce((acc, e) => acc + e.amount, 0)

  return (
    <div className="px-4 pt-5 pb-10 md:px-6 md:pt-7" style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendDownSvg style={{ width: 18, height: 18, color: C.arena }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema, margin: 0 }}>Egresos</h2>
        </div>
        {canWrite && (
          <button
            onClick={() => setModalOpen(true)}
            style={{ height: 34, padding: '0 14px', background: C.crema, color: C.bg, borderRadius: '0 9px 9px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            + Nuevo egreso
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
          style={{ height: 34, padding: '0 12px', background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', color: C.crema, fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer' }}
        >
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {categoryFilter && (
          <button
            onClick={() => { setCategoryFilter(''); setPage(1) }}
            style={{ height: 34, padding: '0 12px', background: 'none', border: `1px solid ${C.linea}`, borderRadius: '0 9px 9px 0', color: C.piedra, fontSize: 12, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
            onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
          >
            Limpiar
          </button>
        )}
      </div>

      {isLoading ? (
        <p style={{ fontSize: 13, color: C.piedra }}>Cargando...</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden" style={{ marginBottom: 16 }}>
            {expenses.map(exp => (
              <div key={exp.id} style={{ ...card, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: C.crema, marginBottom: 2 }}>{exp.title}</p>
                    <p style={{ fontSize: 11, color: C.piedra }}>{exp.category?.name} · {fmtDate(exp.date)}</p>
                  </div>
                  <span style={{ fontFamily: CIFRAS, fontSize: 15, fontWeight: 600, color: C.err, flexShrink: 0 }}>${fmt(exp.amount)}</span>
                </div>
                {exp.notes && <p style={{ fontSize: 12, color: C.piedra, marginBottom: 10 }}>{exp.notes}</p>}
                {canWrite && (
                  <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: `1px solid ${C.linea}` }}>
                    <button
                      onClick={() => setEditing(exp)}
                      style={{ flex: 1, padding: '6px 0', fontSize: 12, borderRadius: '0 7px 7px 0', border: `1px solid ${C.linea}`, background: 'none', color: C.arena, cursor: 'pointer' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={async () => { if (await confirm('¿Eliminar este egreso?')) deleteMut.mutate(exp.id) }}
                      style={{ flex: 1, padding: '6px 0', fontSize: 12, borderRadius: '0 7px 7px 0', border: 'none', background: 'rgba(229,131,115,0.12)', color: C.err, cursor: 'pointer' }}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
            {expenses.length === 0 && (
              <p style={{ fontSize: 13, color: C.piedra, padding: '20px 0' }}>Sin egresos</p>
            )}
          </div>

          {/* Desktop tabla */}
          <div className="hidden md:block" style={{ ...card, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Título', 'Categoría', 'Fecha', 'Monto', ''].map(h => (
                    <th key={h} style={{ ...SECTION_TITLE, background: C.linea, textAlign: 'left', padding: '12px 14px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr
                    key={exp.id}
                    onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = C.s2)}
                    onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, color: C.crema, fontWeight: 500 }}>
                      {exp.title}
                      {exp.notes && <p style={{ fontSize: 11, color: C.piedra, marginTop: 2 }}>{exp.notes}</p>}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}` }}>
                      {exp.category?.name && (
                        <span style={{ padding: '2px 8px', borderRadius: '0 6px 6px 0', fontSize: 11, fontWeight: 600, background: 'rgba(242,237,227,0.07)', color: C.arena }}>
                          {exp.category.name}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, color: C.piedra }}>{fmtDate(exp.date)}</td>
                    <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}`, fontFamily: CIFRAS, fontWeight: 600, color: C.err }}>${fmt(exp.amount)}</td>
                    <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}` }}>
                      {canWrite && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setEditing(exp)}
                            style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '0 7px 7px 0', background: C.linea, color: C.crema, fontSize: 11.5, border: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.background = C.s3}
                            onMouseLeave={e => e.currentTarget.style.background = C.linea}
                          >
                            Editar
                          </button>
                          <button
                            onClick={async () => { if (await confirm('¿Eliminar este egreso?')) deleteMut.mutate(exp.id) }}
                            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderRadius: '0 6px 6px 0', color: C.piedra, cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.color = C.err; e.currentTarget.style.background = 'rgba(229,131,115,0.12)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.background = 'none' }}
                          >
                            <TrashSvg />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px 14px', textAlign: 'center', fontSize: 13, color: C.piedra }}>Sin egresos</td>
                  </tr>
                )}
              </tbody>
              {expenses.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: `1px solid ${C.linea}` }}>
                    <td colSpan={3} style={{ padding: '12px 14px', fontSize: 11, color: C.piedra, background: C.s2 }}>Total en esta página</td>
                    <td style={{ padding: '12px 14px', fontFamily: CIFRAS, fontWeight: 600, color: C.err, background: C.s2 }}>${fmt(totalFiltered)}</td>
                    <td style={{ background: C.s2 }} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      {(modalOpen || editing) && (
        <ExpenseModal
          expense={editing}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={async (data) => {
            if (editing) {
              await updateMut.mutateAsync({ id: editing.id, data })
              toast('Egreso actualizado', 'success')
            } else {
              await createMut.mutateAsync(data)
              toast('Egreso creado', 'success')
            }
          }}
        />
      )}
    </div>
  )
}
