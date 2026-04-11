import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClients, deleteClient } from '../../api/clients'
import ClientModal from './ClientModal'

export default function ClientsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => getClients(search ? { name: search } : {}).then(r => r.data)
  })

  const del = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => qc.invalidateQueries(['clients'])
  })

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(c) { setEditing(c); setModalOpen(true) }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Clientes</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
          + Nuevo cliente
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {isLoading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nombre', 'Email', 'Empresa', 'Teléfono', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data?.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.company || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone || '-'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(c)} className="text-indigo-600 hover:underline text-xs">Editar</button>
                    <button onClick={() => { if (confirm('¿Eliminar cliente?')) del.mutate(c.id) }} className="text-red-500 hover:underline text-xs">Eliminar</button>
                  </td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Sin clientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data?.pagination && (
        <p className="mt-3 text-xs text-gray-400">
          {data.pagination.total} cliente(s) — página {data.pagination.page} de {data.pagination.totalPages}
        </p>
      )}

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
