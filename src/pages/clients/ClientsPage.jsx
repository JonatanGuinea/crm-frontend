import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getClients, deleteClient } from '../../api/clients'
import ClientModal from './ClientModal'
import Pagination from '../../components/Pagination'

export default function ClientsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, page],
    queryFn: () => getClients({ ...(search ? { name: search } : {}), page }).then(r => r.data)
  })

  const del = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => qc.invalidateQueries(['clients'])
  })

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(c) { setEditing(c); setModalOpen(true) }
  function handleSearch(val) { setSearch(val); setPage(1) }

  return (
    <div className="p-4 md:p-8 min-h-full bg-base">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-fg">Clientes</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-colors">
          + Nuevo cliente
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={search}
        onChange={e => handleSearch(e.target.value)}
        className="mb-4 w-full max-w-xs px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg placeholder:text-fg-muted"
      />

      {isLoading ? (
        <p className="text-sm text-fg-soft">Cargando...</p>
      ) : (
        <div className="bg-surface rounded-xl border border-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-raised border-b border-line">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Email</th>
                  <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Empresa</th>
                  <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Teléfono</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data?.data?.map(c => (
                  <tr key={c.id} className="hover:bg-raised">
                    <td className="px-4 py-3 font-medium text-fg">{c.name}</td>
                    <td className="px-4 py-3 text-fg-soft">{c.email || '-'}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-fg-soft">{c.company || '-'}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-fg-soft">{c.phone || '-'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link to={`/clients/${c.id}`} className="text-fg-muted hover:underline text-xs">Ver</Link>
                      <button onClick={() => openEdit(c)} className="text-brand hover:underline text-xs">Editar</button>
                      <button onClick={() => { if (confirm('¿Eliminar cliente?')) del.mutate(c.id) }} className="text-danger hover:underline text-xs">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {!data?.data?.length && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-fg-muted">Sin clientes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination pagination={data?.pagination} onPageChange={setPage} />

      {modalOpen && (
        <ClientModal
          client={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); qc.invalidateQueries(['clients']) }}
        />
      )}
    </div>
  )
}
