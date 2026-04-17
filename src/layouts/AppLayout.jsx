import { useState } from 'react'
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import GlobalSearch from '../components/GlobalSearch'
import OrgSwitcher from '../components/OrgSwitcher'
import { getProfile } from '../api/profile'
import logo from '../assets/logo.png'
import {
  HomeIcon,
  UsersIcon,
  FolderIcon,
  DocumentTextIcon,
  ReceiptRefundIcon,
  BellIcon,
  UserGroupIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

const API_BASE = import.meta.env.VITE_API_URL.replace('/api', '')

const navItems = [
  { to: '/',             label: 'Dashboard',      icon: HomeIcon,            exact: true },
  { to: '/clients',      label: 'Clientes',        icon: UsersIcon },
  { to: '/projects',     label: 'Proyectos',       icon: FolderIcon },
  { to: '/quotes',       label: 'Presupuestos',    icon: DocumentTextIcon },
  { to: '/invoices',     label: 'Facturas',        icon: ReceiptRefundIcon },
  { to: '/notifications',label: 'Notificaciones',  icon: BellIcon },
  { to: '/members',      label: 'Equipo',          icon: UserGroupIcon },
]

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

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar') === 'collapsed')

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile().then(r => r.data.data)
  })

  function toggleSidebar() {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebar', next ? 'collapsed' : 'expanded')
      return next
    })
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? 'w-16' : 'w-56'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden shrink-0`}
      >
        {/* Logo + toggle */}
        <div className={`flex items-center border-b border-gray-200 h-16 shrink-0 ${collapsed ? 'justify-center px-0' : 'px-4 justify-between'}`}>
          {!collapsed && (
            <img src={logo} alt="Logo" className="w-4/5 max-h-10 object-contain" />
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
          >
            {collapsed
              ? <ChevronRightIcon className="w-4 h-4" />
              : <ChevronLeftIcon className="w-4 h-4" />
            }
          </button>
        </div>

        {/* OrgSwitcher solo cuando está expandido */}
        {!collapsed && <OrgSwitcher />}

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-4 border-t border-gray-200 space-y-1">
          <Link
            to="/profile"
            title={collapsed ? 'Mi perfil' : undefined}
            className={`flex items-center gap-2 px-2 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <SidebarAvatar avatar={profile?.avatar} name={profile?.name || user?.name} />
            {!collapsed && <span className="truncate">{profile?.name || user?.name || 'Mi perfil'}</span>}
          </Link>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
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
