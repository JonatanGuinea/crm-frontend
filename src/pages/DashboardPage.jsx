import { useQuery } from '@tanstack/react-query'
import { getProjectsDashboard } from '../api/projects'
import { getInvoicesDashboard } from '../api/invoices'
import { getQuotesDashboard } from '../api/quotes'
import { useAuth } from '../context/AuthContext'

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: projects } = useQuery({
    queryKey: ['projects-dashboard'],
    queryFn: () => getProjectsDashboard().then(r => r.data.data)
  })

  const { data: invoices } = useQuery({
    queryKey: ['invoices-dashboard'],
    queryFn: () => getInvoicesDashboard().then(r => r.data.data)
  })

  const { data: quotes } = useQuery({
    queryKey: ['quotes-dashboard'],
    queryFn: () => getQuotesDashboard().then(r => r.data.data)
  })

  function fmt(n) {
    return n != null ? `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })}` : '-'
  }

  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Dashboard</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Bienvenido, {user?.name || 'usuario'}</p>

      <section className="mb-8">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Proyectos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total proyectos" value={projects?.summary.totalProjects ?? '-'} />
          <StatCard label="Presupuesto total" value={fmt(projects?.summary.totalBudget)} />
          {projects?.byStatus.map(s => (
            <StatCard key={s._id} label={s._id} value={s.totalProjects} sub={fmt(s.totalBudget)} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Facturas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total facturas" value={invoices?.summary.totalInvoices ?? '-'} />
          <StatCard label="Cobrado" value={fmt(invoices?.summary.paid)} />
          <StatCard label="Pendiente" value={fmt(invoices?.summary.pending)} />
          <StatCard label="Vencido" value={fmt(invoices?.summary.overdue)} />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Presupuestos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total presupuestos" value={quotes?.summary.totalQuotes ?? '-'} />
          <StatCard label="Valor total" value={fmt(quotes?.summary.totalValue)} />
          {quotes?.byStatus.map(s => (
            <StatCard key={s.status} label={s.status} value={s.count} sub={fmt(s.total)} />
          ))}
        </div>
      </section>
    </div>
  )
}
