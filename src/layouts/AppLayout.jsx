import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import GlobalSearch from '../components/GlobalSearch'
import OrgSwitcher from '../components/OrgSwitcher'
import { getProfile } from '../api/profile'

const API_BASE = import.meta.env.VITE_API_URL.replace('/api', '')

function SidebarAvatar({ avatar, name }) {
  if (avatar) {
    return <img src={`${API_BASE}/uploads/${avatar}`} alt={name} className="w-7 h-7 rounded-full object-cover shrink-0" />
  }
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  return (
    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold flex items-center justify-center shrink-0">
      {initials}
    </div>
  )
}

const navItems = [
  { to: '/', label: 'Dashboard', exact: true },
  { to: '/clients', label: 'Clientes' },
  { to: '/projects', label: 'Proyectos' },
  { to: '/quotes', label: 'Presupuestos' },
  { to: '/invoices', label: 'Facturas' },
  { to: '/notifications', label: 'Notificaciones' },
  { to: '/members', label: 'Equipo' },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile().then(r => r.data.data)
  })

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">CRM</h1>
        </div>
        <OrgSwitcher />

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-200 space-y-1">
          <Link
            to="/profile"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <SidebarAvatar avatar={profile?.avatar} name={profile?.name || user?.name} />
            <span className="truncate">{profile?.name || user?.name || 'Mi perfil'}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 shrink-0">
          <GlobalSearch />
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
