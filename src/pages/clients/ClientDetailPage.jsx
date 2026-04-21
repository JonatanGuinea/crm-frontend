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
  pending:     'bg-warning-subtle text-warning',
  approved:    'bg-info-subtle text-info',
  in_progress: 'bg-brand-subtle text-brand',
  finished:    'bg-brand-subtle text-brand',
  cancelled:   'bg-raised text-fg-muted'
}
const STATUS_LABELS_PROJECT = {
  pending: 'Pendiente', approved: 'Aprobado', in_progress: 'En curso',
  finished: 'Finalizado', cancelled: 'Cancelado'
}

const STATUS_COLORS_DOC = {
  draft:     'bg-raised text-fg-soft',
  sent:      'bg-info-subtle text-info',
  approved:  'bg-brand-subtle text-brand',
  rejected:  'bg-danger-subtle text-danger',
  pending:   'bg-warning-subtle text-warning',
  paid:      'bg-brand-subtle text-brand',
  overdue:   'bg-danger-subtle text-danger',
  cancelled: 'bg-raised text-fg-muted'
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

  if (isLoading) return <div className="p-8 text-sm text-fg-soft">Cargando...</div>
  if (!clientRes) return <div className="p-8 text-sm text-fg-soft">Cliente no encontrado</div>

  const client = clientRes
  const projects = projectsRes?.data || []
  const quotes = quotesRes?.data || []
  const invoices = invoicesRes?.data || []

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/clients')} className="text-sm text-fg-muted hover:text-fg-soft">
          ← Clientes
        </button>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-fg">{client.name}</h1>
          {client.company && <p className="text-fg-soft mt-0.5">{client.company}</p>}
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="px-4 py-2 border border-line-soft rounded-md text-sm font-medium text-fg-soft hover:bg-raised transition-colors"
        >
          Editar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-line p-5">
            <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide mb-4">Información</h3>
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Email', value: client.email },
                { label: 'Teléfono', value: client.phone },
                { label: 'Empresa', value: client.company },
              ].map(({ label, value }) => value && (
                <div key={label}>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">{label}</dt>
                  <dd className="text-fg">{value}</dd>
                </div>
              ))}
              {client.notes && (
                <div>
                  <dt className="text-xs text-fg-muted uppercase mb-0.5">Notas</dt>
                  <dd className="text-fg whitespace-pre-line">{client.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-surface rounded-xl border border-line p-5">
            <AttachmentsPanel entityType="client" entityId={id} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Proyectos */}
          <div className="bg-surface rounded-xl border border-line overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">
                Proyectos <span className="text-fg-muted font-normal">({projects.length})</span>
              </h3>
              <Link to={`/projects?clientId=${id}`} className="text-xs text-brand hover:underline">Ver todos</Link>
            </div>
            {projects.length === 0 ? (
              <p className="px-5 py-4 text-sm text-fg-muted">Sin proyectos</p>
            ) : (
              <ul className="divide-y divide-line">
                {projects.slice(0, 5).map(p => (
                  <li key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-raised">
                    <div>
                      <Link to={`/projects/${p.id}`} className="text-sm font-medium text-fg hover:text-brand">
                        {p.title}
                      </Link>
                      {p.budget != null && (
                        <p className="text-xs text-fg-muted">${Number(p.budget).toLocaleString('es-AR')}</p>
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
          <div className="bg-surface rounded-xl border border-line overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">
                Presupuestos <span className="text-fg-muted font-normal">({quotes.length})</span>
              </h3>
              <Link to="/quotes" className="text-xs text-brand hover:underline">Ver todos</Link>
            </div>
            {quotes.length === 0 ? (
              <p className="px-5 py-4 text-sm text-fg-muted">Sin presupuestos</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-raised">
                  <tr>
                    {['N°', 'Estado', 'Total'].map(h => (
                      <th key={h} className="text-left px-5 py-2 text-xs font-medium text-fg-soft uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {quotes.slice(0, 5).map(q => (
                    <tr key={q.id} className="hover:bg-raised">
                      <td className="px-5 py-3 font-medium text-fg">{q.number}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS_DOC[q.status] || 'bg-raised text-fg-soft'}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-fg-soft">
                        {q.total != null ? `$${Number(q.total).toLocaleString('es-AR')}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Facturas */}
          <div className="bg-surface rounded-xl border border-line overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">
                Facturas <span className="text-fg-muted font-normal">({invoices.length})</span>
              </h3>
              <Link to="/invoices" className="text-xs text-brand hover:underline">Ver todos</Link>
            </div>
            {invoices.length === 0 ? (
              <p className="px-5 py-4 text-sm text-fg-muted">Sin facturas</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-raised">
                  <tr>
                    {['N°', 'Estado', 'Total', 'Vencimiento'].map(h => (
                      <th key={h} className="text-left px-5 py-2 text-xs font-medium text-fg-soft uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {invoices.slice(0, 5).map(inv => (
                    <tr key={inv.id} className="hover:bg-raised">
                      <td className="px-5 py-3 font-medium text-fg">{inv.number}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS_DOC[inv.status] || 'bg-raised text-fg-soft'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-fg-soft">
                        {inv.total != null ? `$${Number(inv.total).toLocaleString('es-AR')}` : '-'}
                      </td>
                      <td className="px-5 py-3 text-fg-soft">
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
