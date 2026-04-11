import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getProjects, deleteProject } from '../../api/projects'
import ProjectModal from './ProjectModal'

const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  in_progress: 'En curso',
  finished: 'Finalizado',
  cancelled: 'Cancelado'
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  finished: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500'
}

export default function ProjectsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['projects', statusFilter],
    queryFn: () => getProjects(statusFilter ? { status: statusFilter } : {}).then(r => r.data)
  })

  const del = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => qc.invalidateQueries(['projects'])
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Proyectos</h2>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
          + Nuevo proyecto
        </button>
      </div>

      <select
        value={statusFilter}
        onChange={e => setStatusFilter(e.target.value)}
        className="mb-4 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">Todos los estados</option>
        {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>

      {isLoading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Título', 'Cliente', 'Estado', 'Presupuesto', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data?.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                  <td className="px-4 py-3 text-gray-600">{p.client?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.budget != null ? `$${Number(p.budget).toLocaleString('es-AR')}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link to={`/projects/${p.id}`} className="text-gray-500 hover:underline text-xs">Ver</Link>
                    <button onClick={() => { setEditing(p); setModalOpen(true) }} className="text-indigo-600 hover:underline text-xs">Editar</button>
                    <button onClick={() => { if (confirm('¿Eliminar proyecto?')) del.mutate(p.id) }} className="text-red-500 hover:underline text-xs">Eliminar</button>
                  </td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Sin proyectos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data?.pagination && (
        <p className="mt-3 text-xs text-gray-400">
          {data.pagination.total} proyecto(s)
        </p>
      )}

      {modalOpen && (
        <ProjectModal
          project={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); qc.invalidateQueries(['projects']) }}
        />
      )}
    </div>
  )
}
