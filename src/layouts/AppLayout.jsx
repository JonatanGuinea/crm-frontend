import { useState } from 'react'
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
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
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const API_BASE = import.meta.env.VITE_API_URL.replace('/api', '')

const navItems = [
  { to: '/',              label: 'Dashboard',      icon: HomeIcon,           exact: true },
  { to: '/clients',       label: 'Clientes',        icon: UsersIcon },
  { to: '/projects',      label: 'Proyectos',       icon: FolderIcon },
  { to: '/quotes',        label: 'Presupuestos',    icon: DocumentTextIcon },
  { to: '/invoices',      label: 'Facturas',        icon: ReceiptRefundIcon },
  { to: '/notifications', label: 'Notificaciones',  icon: BellIcon },
  { to: '/members',       label: 'Equipo',          icon: UserGroupIcon },
]

function SidebarAvatar({ avatar, name }) {
  if (avatar) {
    return <img src={`${API_BASE}/uploads/${avatar}`} alt={name} className="w-7 h-7 rounded-full object-cover shrink-0" />
  }
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  return (
    <div className="w-7 h-7 rounded-full bg-brand-subtle text-brand text-xs font-semibold flex items-center justify-center shrink-0">
      {initials}
    </div>
  )
}

function SidebarContent({ collapsed, profile, user, onNavClick, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      {!collapsed && <OrgSwitcher />}

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={onNavClick}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-subtle text-brand'
                  : 'text-fg-soft hover:bg-raised hover:text-fg'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-4 border-t border-line space-y-1">
        <Link
          to="/profile"
          onClick={onNavClick}
          title={collapsed ? 'Mi perfil' : undefined}
          className={`flex items-center gap-2 px-2 py-2 rounded-md text-sm text-fg-soft hover:bg-raised hover:text-fg transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <SidebarAvatar avatar={profile?.avatar} name={profile?.name || user?.name} />
          {!collapsed && <span className="truncate">{profile?.name || user?.name || 'Mi perfil'}</span>}
        </Link>
        <button
          onClick={onLogout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-fg-soft hover:bg-raised hover:text-fg transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar') === 'collapsed')
  const [mobileOpen, setMobileOpen] = useState(false)

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
    <div className="flex h-screen bg-base">

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar (drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-line flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-line shrink-0">
          <img src={logo} alt="Logo" className="w-4/5 max-h-10 object-contain" />
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-md text-fg-muted hover:bg-raised"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent
          collapsed={false}
          profile={profile}
          user={user}
          onNavClick={() => setMobileOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex ${collapsed ? 'w-16' : 'w-56'} bg-surface border-r border-line flex-col transition-all duration-300 ease-in-out overflow-hidden shrink-0`}
      >
        <div className={`flex items-center border-b border-line h-16 shrink-0 ${collapsed ? 'justify-center px-0' : 'px-4 justify-between'}`}>
          {!collapsed && (
            <img src={logo} alt="Logo" className="w-4/5 max-h-10 object-contain" />
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-fg-muted hover:bg-raised hover:text-fg-soft transition-colors shrink-0"
          >
            {collapsed
              ? <ChevronRightIcon className="w-4 h-4" />
              : <ChevronLeftIcon className="w-4 h-4" />
            }
          </button>
        </div>
        <SidebarContent
          collapsed={collapsed}
          profile={profile}
          user={user}
          onNavClick={undefined}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-surface border-b border-line flex items-center px-4 md:px-6 shrink-0 gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-md text-fg-muted hover:bg-raised transition-colors shrink-0"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <GlobalSearch />
          </div>
          <button onClick={toggle} className="p-2 rounded-md text-fg-muted hover:bg-raised transition-colors shrink-0">
            {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
