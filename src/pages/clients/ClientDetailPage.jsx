import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClientById } from '../../api/clients'
import { getProjects } from '../../api/projects'
import { getQuotes } from '../../api/quotes'
import { getInvoices } from '../../api/invoices'
import ClientModal from './ClientModal'
import AttachmentsPanel from '../../components/AttachmentsPanel'

const STATUS_COLORS_PROJECT = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  finished: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500'
}
const STATUS_LABELS_PROJECT = {
  pending: 'Pendiente', approved: 'Aprobado', in_progress: 'En curso',
  finished: 'Finalizado', cancelled: 'Cancelado'
}

const STATUS_COLORS_DOC = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500'
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)

  const { data: clientRes, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => getClientById(id).then(r => r.data.data)
  })

  const { data: projectsRes } = useQuery({
    queryKey: ['projects', { clientId: id }],
    queryFn: () => getProjects({ clientId: id, limit: 100 }).then(r => r.data)
  })

  const { data: quotesRes } = useQuery({
    queryKey: ['quotes', { clientId: id }],
    queryFn: () => getQuotes({ clientId: id, limit: 100 }).then(r => r.data)
  })

  const { data: invoicesRes } = useQuery({
    queryKey: ['invoices', { clientId: id }],
    queryFn: () => getInvoices({ clientId: id, limit: 100 }).then(r => r.data)
  })

  if (isLoading) return <div className="p-8 text-sm text-gray-500">Cargando...</div>
  if (!clientRes) return <div className="p-8 text-sm text-gray-500">Cliente no encontrado</div>

  const client = clientRes
  const projects = projectsRes?.data || []
  const quotes = quotesRes?.data || []
  const invoices = invoicesRes?.data || []

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/clients')} className="text-sm text-gray-400 hover:text-gray-700">
          ← Clientes
        </button>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          {client.company && <p className="text-gray-500 mt-0.5">{client.company}</p>}
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Editar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Información</h3>
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Email', value: client.email },
                { label: 'Teléfono', value: client.phone },
                { label: 'Empresa', value: client.company },
              ].map(({ label, value }) => value && (
                <div key={label}>
                  <dt className="text-xs text-gray-400 uppercase mb-0.5">{label}</dt>
                  <dd className="text-gray-800">{value}</dd>
                </div>
              ))}
              {client.notes && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase mb-0.5">Notas</dt>
                  <dd className="text-gray-800 whitespace-pre-line">{client.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Adjuntos */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <AttachmentsPanel entityType="client" entityId={id} />
          </div>
        </div>

        {/* Columna derecha */}
        <div className="lg:col-span-2 space-y-6">
          {/* Proyectos */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Proyectos <span className="text-gray-400 font-normal">({projects.length})</span>
              </h3>
              <Link to={`/projects?clientId=${id}`} className="text-xs text-indigo-600 hover:underline">Ver todos</Link>
            </div>
            {projects.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">Sin proyectos</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {projects.slice(0, 5).map(p => (
                  <li key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div>
                      <Link to={`/projects/${p.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                        {p.title}
                      </Link>
                      {p.budget != null && (
                        <p className="text-xs text-gray-400">${Number(p.budget).toLocaleString('es-AR')}</p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS_PROJECT[p.status]}`}>
                      {STATUS_LABELS_PROJECT[p.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Presupuestos */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Presupuestos <span className="text-gray-400 font-normal">({quotes.length})</span>
              </h3>
              <Link to="/quotes" className="text-xs text-indigo-600 hover:underline">Ver todos</Link>
            </div>
            {quotes.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">Sin presupuestos</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['N°', 'Estado', 'Total'].map(h => (
                      <th key={h} className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quotes.slice(0, 5).map(q => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{q.number}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS_DOC[q.status] || 'bg-gray-100 text-gray-600'}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        {q.total != null ? `$${Number(q.total).toLocaleString('es-AR')}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Facturas */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Facturas <span className="text-gray-400 font-normal">({invoices.length})</span>
              </h3>
              <Link to="/invoices" className="text-xs text-indigo-600 hover:underline">Ver todos</Link>
            </div>
            {invoices.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">Sin facturas</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['N°', 'Estado', 'Total', 'Vencimiento'].map(h => (
                      <th key={h} className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.slice(0, 5).map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{inv.number}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS_DOC[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        {inv.total != null ? `$${Number(inv.total).toLocaleString('es-AR')}` : '-'}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('es-AR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {editOpen && (
        <ClientModal
          client={client}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false)
            qc.invalidateQueries(['client', id])
            qc.invalidateQueries(['clients'])
          }}
        />
      )}
    </div>
  )
}
