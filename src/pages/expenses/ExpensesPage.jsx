import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { useConfirm } from '../../components/ConfirmDialog'
import { getExpenses, getCategories, createExpense, updateExpense, deleteExpense } from '../../api/expenses'
import ExpenseModal from './ExpenseModal'
import Pagination from '../../components/Pagination'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

function TrendDownSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>
}
function PlusSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
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
    <div className="p-4 md:p-8">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendDownSvg style={{ width: 18, height: 18, color: C.arena }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.crema, letterSpacing: '-0.02em', margin: 0 }}>Egresos</h2>
        </div>
        {canWrite && (
          <button
            onClick={() => setModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: '0 10px 10px 0', border: 'none', background: C.crema, color: C.bg, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <PlusSvg style={{ width: 16, height: 16 }} />
            Nuevo egreso
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
          className="du-input w-full md:w-auto"
        >
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-fg-soft">Cargando...</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden grid grid-cols-1 gap-3 mb-4">
            {expenses.map(exp => (
              <div key={exp.id} className="bg-surface/60 backdrop-blur-xl border border-line rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-medium text-fg">{exp.title}</p>
                    <p className="text-xs text-fg-muted mt-0.5">{exp.category?.name} · {fmtDate(exp.date)}</p>
                  </div>
                  <span className="text-sm font-semibold shrink-0" style={{ color: C.err }}>${fmt(exp.amount)}</span>
                </div>
                {exp.notes && <p className="text-xs text-fg-muted mb-3">{exp.notes}</p>}
                {canWrite && (
                  <div className="flex gap-2 pt-3 border-t border-line">
                    <button
                      onClick={() => setEditing(exp)}
                      className="flex-1 py-1.5 text-xs rounded-md bg-raised text-fg-soft hover:text-fg text-center"
                    >
                      Editar
                    </button>
                    <button
                      onClick={async () => { if (await confirm('¿Eliminar este egreso?')) deleteMut.mutate(exp.id) }}
                      style={{ flex: 1, padding: '6px 0', fontSize: 12, borderRadius: '0 8px 8px 0', border: 'none', background: 'rgba(229,131,115,0.12)', color: C.err, cursor: 'pointer' }}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop tabla */}
          <div className="hidden md:block bg-surface/60 backdrop-blur-xl border border-line rounded-xl overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-raised border-b border-line">
                <tr>
                  {['Título', 'Categoría', 'Fecha', 'Monto', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-raised transition-colors">
                    <td className="px-4 py-3 font-medium text-fg">
                      {exp.title}
                      {exp.notes && <p className="text-xs text-fg-muted font-normal mt-0.5 truncate max-w-xs">{exp.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-raised text-fg-soft">
                        {exp.category?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-fg-soft">{fmtDate(exp.date)}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: C.err }}>${fmt(exp.amount)}</td>
                    <td className="px-4 py-3">
                      {canWrite && (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setEditing(exp)}
                            className="px-2.5 py-1 text-xs rounded-md bg-raised text-fg-soft hover:text-fg"
                          >
                            Editar
                          </button>
                          <button
                            onClick={async () => { if (await confirm('¿Eliminar este egreso?')) deleteMut.mutate(exp.id) }}
                            style={{ padding: '4px 10px', fontSize: 12, borderRadius: '0 6px 6px 0', border: 'none', background: 'rgba(229,131,115,0.12)', color: C.err, cursor: 'pointer' }}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-fg-muted">Sin egresos</td>
                  </tr>
                )}
              </tbody>
              {expenses.length > 0 && (
                <tfoot className="border-t border-line bg-raised">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-xs text-fg-muted">
                      Total en esta página
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: C.err }}>${fmt(totalFiltered)}</td>
                    <td />
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
