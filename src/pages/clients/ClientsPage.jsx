import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getClients, getAllClientsHistory } from '../../api/clients'
import ClientModal from './ClientModal'
import { useAuth } from '../../context/AuthContext'
import { EnvelopeIcon, PhoneIcon, BuildingOfficeIcon, EyeIcon, ClockIcon, TableCellsIcon } from '@heroicons/react/24/outline'

const PAGE_SIZE = 15

export default function ClientsPage() {
  const { user } = useAuth()
  const canWrite = user?.role !== 'member'
  const qc = useQueryClient()
  const [tab, setTab]         = useState('table')
  const [search, setSearch]   = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [historyVisible, setHistoryVisible] = useState(25)

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => getClients({ ...(search ? { name: search } : {}), limit: 500 }).then(r => r.data)
  })

  const { data: historyData = [] } = useQuery({
    queryKey: ['clients-history'],
    queryFn: () => getAllClientsHistory().then(r => r.data.data),
    enabled: tab === 'history',
  })

  function openCreate() { setEditing(null); setModalOpen(true) }
  function handleSearch(val) { setSearch(val); setVisible(PAGE_SIZE) }

  const allClients = data?.data ?? []
  const shownClients = allClients.slice(0, visible)
  const hasMore = allClients.length > visible

  return (
    <div className="p-4 md:p-8 min-h-full">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h2 className="text-xl font-semibold text-fg">Clientes</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-raised rounded-lg border border-line overflow-hidden">
            <button
              onClick={() => setTab('table')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'table' ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
              }`}
            >
              <TableCellsIcon className="w-4 h-4" />
              Tabla
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'history' ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
              }`}
            >
              <ClockIcon className="w-4 h-4" />
              Historial
            </button>
          </div>
          {canWrite && tab === 'table' && (
            <button onClick={openCreate} className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-colors">
              + Nuevo cliente
            </button>
          )}
        </div>
      </div>

      {tab === 'history' && (
        <div className="flex flex-col gap-4 max-w-2xl">
          {historyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-fg-muted">
              <ClockIcon className="w-10 h-10 opacity-30" />
              <p className="text-sm">Sin movimientos registrados.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {historyData.slice(0, historyVisible).map((entry, i) => {
                const initials = entry.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                const date = new Date(entry.createdAt)
                const dateStr = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
                const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                const shown = historyData.slice(0, historyVisible)
                return (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-brand-subtle text-brand text-[11px] font-bold flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      {i < shown.length - 1 && <div className="w-px flex-1 bg-line mt-1 mb-1 min-h-[16px]" />}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                        <span className="text-sm font-semibold text-fg">{entry.user.name}</span>
                        <span className="text-sm text-fg-muted">
                          {entry.action === 'created' ? 'creó el cliente' : 'actualizó'}
                        </span>
                        {entry.detail && (
                          <span className="text-sm text-fg-soft">· {entry.detail}</span>
                        )}
                      </div>
                      <Link to={`/clients/${entry.client.id}`} className="text-xs text-brand hover:underline">
                        {entry.client.name}
                      </Link>
                      <p className="text-[11px] text-fg-muted/70 mt-0.5">{dateStr} · {timeStr}</p>
                    </div>
                  </div>
                )
              })}
              {historyData.length > historyVisible && (
                <button
                  onClick={() => setHistoryVisible(v => v + 25)}
                  className="mt-2 text-xs text-fg-muted hover:text-fg text-center py-2 border border-dashed border-line rounded-xl transition-colors"
                >
                  Mostrar más ({historyData.length - historyVisible} restante{historyData.length - historyVisible !== 1 ? 's' : ''})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'table' && <>
      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={search}
        onChange={e => handleSearch(e.target.value)}
        className="mb-4 w-full md:max-w-xs px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg placeholder:text-fg-muted"
      />

      {isLoading ? (
        <p className="text-sm text-fg-soft">Cargando...</p>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {shownClients.map(c => (
              <div key={c.id} className="bg-surface/60 backdrop-blur-xl rounded-xl border border-line p-4">
                {/* Avatar + nombre */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-brand-subtle text-brand font-bold text-sm flex items-center justify-center shrink-0 uppercase">
                    {c.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-fg truncate leading-snug">{c.name}</p>
                    {c.company && <p className="text-xs text-fg-muted truncate">{c.company}</p>}
                  </div>
                </div>
                {/* Meta */}
                <div className="space-y-1.5 mb-4">
                  {c.email && (
                    <p className="text-xs text-fg-soft flex items-center gap-2 truncate">
                      <EnvelopeIcon className="w-3.5 h-3.5 shrink-0 text-fg-muted" />
                      {c.email}
                    </p>
                  )}
                  {c.phone && (
                    <p className="text-xs text-fg-soft flex items-center gap-2">
                      <PhoneIcon className="w-3.5 h-3.5 shrink-0 text-fg-muted" />
                      {c.phone}
                    </p>
                  )}
                  {c.company && (
                    <p className="text-xs text-fg-soft flex items-center gap-2 truncate">
                      <BuildingOfficeIcon className="w-3.5 h-3.5 shrink-0 text-fg-muted" />
                      {c.company}
                    </p>
                  )}
                </div>
                {/* Acciones */}
                <div className="flex items-center gap-2 pt-3 border-t border-line">
                  <Link to={`/clients/${c.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-brand text-white hover:opacity-90 transition-opacity">
                    <EyeIcon className="w-3.5 h-3.5" />
                    Ver
                  </Link>
                </div>
              </div>
            ))}
            {!allClients.length && (
              <p className="py-10 text-center text-sm text-fg-muted">Sin clientes</p>
            )}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden md:block bg-surface/60 backdrop-blur-xl rounded-xl border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-raised border-b border-line">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Empresa</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide">Teléfono</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-fg-soft uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shownClients.map(c => (
                    <tr key={c.id} className="hover:bg-raised">
                      <td className="px-4 py-3 font-medium text-fg">{c.name}</td>
                      <td className="px-4 py-3 text-fg-soft">{c.email || '-'}</td>
                      <td className="px-4 py-3 text-fg-soft">{c.company || '-'}</td>
                      <td className="px-4 py-3 text-fg-soft">{c.phone || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/clients/${c.id}`} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-brand text-white hover:opacity-90 transition-opacity">
                          <EyeIcon className="w-3.5 h-3.5" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!allClients.length && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-fg-muted">Sin clientes</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {hasMore && (
            <button
              onClick={() => setVisible(v => v + PAGE_SIZE)}
              className="mt-4 w-full py-2.5 text-sm text-fg-muted hover:text-fg border border-dashed border-line rounded-xl transition-colors"
            >
              Ver más ({allClients.length - visible} restante{allClients.length - visible !== 1 ? 's' : ''})
            </button>
          )}
        </>
      )}
      </>}

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
