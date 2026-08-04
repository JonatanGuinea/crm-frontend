import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import GlobalSearch from '../components/GlobalSearch'
import OrgSwitcher from '../components/OrgSwitcher'
import InvitationsBanner from '../components/InvitationsBanner'
import DBStatusBanner from '../components/DBStatusBanner'
import OrgSettingsModal from '../components/OrgSettingsModal'
import { SetupOrgModal } from '../components/OrgModal'
import { getProfile } from '../api/profile'
import { getNotifications } from '../api/notifications'
import { getPendingInvitations } from '../api/invitations'
import { getOrganizations, switchOrganization } from '../api/auth'
import { getNewProjectsCount } from '../api/projects'
import logo from '../assets/logo.png'
import logoDark from '../assets/logo-dark-mode.png'
import favicon from '../assets/favicon.png'
import {
  HomeIcon,
  UsersIcon,
  FolderIcon,
  DocumentTextIcon,
  ReceiptRefundIcon,
  ArrowTrendingDownIcon,
  BellIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  BuildingOffice2Icon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  CubeIcon,
} from '@heroicons/react/24/outline'


const API_BASE = import.meta.env.VITE_API_URL.replace('/api', '')

const navItems = [
  { to: '/',              label: 'Dashboard',      icon: HomeIcon,           exact: true },
  { to: '/clients',       label: 'Clientes',        icon: UsersIcon },
  { to: '/projects',      label: 'Proyectos',       icon: FolderIcon },
  { to: '/tasks',         label: 'Tareas',          icon: ClipboardDocumentListIcon },
  { to: '/projects/calendar', label: 'Agenda',      icon: CalendarDaysIcon },
  { to: '/quotes',        label: 'Presupuestos',    icon: DocumentTextIcon },
  { to: '/expenses',      label: 'Egresos',         icon: ArrowTrendingDownIcon },
  { to: '/stock',         label: 'Stock',           icon: CubeIcon },
  { to: '/members',       label: 'Equipo',          icon: UserGroupIcon },
]

function ProfileDropdown({ profile, user }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [showOrgModal, setShowOrgModal] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef()
  const menuRef = useRef()

  useEffect(() => {
    function handler(e) {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleOpen() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    }
    setOpen(v => !v)
  }

  function go(path) { setOpen(false); navigate(path) }

  const items = [
    { label: 'Perfil',        icon: UserCircleIcon,      action: () => go('/profile') },
    { label: 'Empresa',       icon: BuildingOffice2Icon, action: () => { setOpen(false); setShowOrgModal(true) } },
    { label: 'Configuración', icon: Cog6ToothIcon,       action: () => go('/members') },
  ]

  return (
    <div className="shrink-0">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-raised transition-colors"
      >
        <SidebarAvatar avatar={profile?.avatar} name={profile?.name || user?.name} />
        <span className="hidden sm:block text-sm text-fg-soft truncate max-w-[120px]">
          {profile?.name || user?.name || 'Mi perfil'}
        </span>
      </button>

      {createPortal(
        <div
          ref={menuRef}
          style={{ top: menuPos.top, right: menuPos.right, position: 'fixed' }}
          className={`w-52 bg-surface border border-line rounded-xl shadow-xl z-[9999] overflow-hidden transition-all duration-150 origin-top-right ${
            open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <div className="px-4 py-3 border-b border-line">
            <p className="text-sm font-semibold text-fg truncate">{profile?.name || user?.name}</p>
            <p className="text-xs text-fg-muted truncate">{profile?.email || user?.email}</p>
          </div>

          <div className="py-1">
            {items.map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-fg-soft hover:bg-raised hover:text-fg transition-colors"
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>

          <div className="border-t border-line py-1">
            <button
              onClick={() => { setOpen(false); logout() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger-subtle transition-colors"
            >
              <ArrowRightStartOnRectangleIcon className="w-4 h-4 shrink-0" />
              Cerrar sesión
            </button>
          </div>
        </div>,
        document.body
      )}

      {showOrgModal && <OrgSettingsModal onClose={() => setShowOrgModal(false)} />}
    </div>
  )
}

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

function SidebarContent({ collapsed, profile, user, onNavClick, dark, onToggleTheme, newProjectsCount }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {!collapsed && <OrgSwitcher />}

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, exact }) => {
          const isProjects = to === '/projects'
          const badge = isProjects && newProjectsCount > 0 ? newProjectsCount : 0
          return (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={onNavClick}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-subtle text-brand'
                    : 'text-fg-soft hover:bg-raised hover:text-fg'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <div className="relative shrink-0">
                <Icon className="w-5 h-5" />
                {badge > 0 && collapsed && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              {!collapsed && <span className="truncate flex-1">{label}</span>}
              {!collapsed && badge > 0 && (
                <span className="ml-auto min-w-[18px] h-4.5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-2 py-4 border-t border-line space-y-1 shrink-0">
        <button
          onClick={onToggleTheme}
          title={collapsed ? (dark ? 'Modo claro' : 'Modo oscuro') : undefined}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-fg-soft hover:bg-raised hover:text-fg transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          {dark ? <SunIcon className="w-5 h-5 shrink-0" /> : <MoonIcon className="w-5 h-5 shrink-0" />}
          {!collapsed && <span>{dark ? 'Modo claro' : 'Modo oscuro'}</span>}
        </button>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const { user, switchOrg } = useAuth()
  const { dark, toggle } = useTheme()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar') === 'collapsed')
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations().then(r => r.data.data)
  })

  const needsOrg = orgs !== undefined && orgs.length === 0

  async function handleOrgCreated(newOrg) {
    try {
      const switchRes = await switchOrganization(newOrg.id)
      switchOrg(switchRes.data.data.token)
      qc.clear()
      navigate('/')
    } catch {
      // si el switch falla, invalida la query para que reaparezca el modal
      await qc.invalidateQueries(['organizations'])
    }
  }

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile().then(r => r.data.data)
  })

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications().then(r => r.data.data),
    refetchInterval: 60_000,
  })
  const { data: invitations } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => getPendingInvitations().then(r => r.data.data),
    staleTime: 30_000,
  })
  const unreadCount = (notifData?.unreadCount ?? 0) + (invitations?.length ?? 0)

  const projectsLastSeen = localStorage.getItem('projectsLastSeen') ?? new Date(0).toISOString()
  const { data: newProjectsData } = useQuery({
    queryKey: ['new-projects-count', projectsLastSeen],
    queryFn: () => getNewProjectsCount(projectsLastSeen).then(r => r.data.data.count),
    refetchInterval: 60_000,
  })
  const newProjectsCount = newProjectsData ?? 0

  function toggleSidebar() {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebar', next ? 'collapsed' : 'expanded')
      return next
    })
  }

  return (
    <div className={`flex h-dvh relative overflow-hidden ${dark ? 'bg-slate-950' : 'bg-base'}`}>
      {needsOrg && <SetupOrgModal onCreated={handleOrgCreated} />}

      {/* Glows de fondo */}
      <div className={`absolute top-[-80px] left-[-80px] w-[600px] h-[500px] rounded-full blur-[130px] pointer-events-none z-0 ${dark ? 'bg-teal-400/20' : 'bg-teal-400/[0.07]'}`} />
      <div className={`absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none z-0 ${dark ? 'bg-teal-400/10' : 'bg-teal-400/[0.04]'}`} />

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar (drawer) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-surface/60 backdrop-blur-xl border-r border-line flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ height: '100dvh' }}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-line shrink-0">
          <img src={dark ? logoDark : logo} alt="Logo" className="w-4/5 max-h-10 object-contain" />
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
          dark={dark}
          onToggleTheme={toggle}
          newProjectsCount={newProjectsCount}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`relative z-10 hidden md:flex ${collapsed ? 'w-16' : 'w-56'} bg-surface/60 backdrop-blur-xl border-r border-line flex-col transition-all duration-300 ease-in-out overflow-hidden shrink-0`}
      >
        <div className={`flex items-center border-b border-line h-16 shrink-0 ${collapsed ? 'justify-center px-0' : 'px-4 justify-between'}`}>
          {collapsed
            ? <img src={favicon} alt="Logo" className="w-7 h-7 object-contain" />
            : <img src={dark ? logoDark : logo} alt="Logo" className="w-4/5 max-h-10 object-contain" />
          }
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
          dark={dark}
          onToggleTheme={toggle}
          newProjectsCount={newProjectsCount}
        />
      </aside>

      {/* Main */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-surface/60 backdrop-blur-xl border-b border-line flex items-center px-4 md:px-6 shrink-0 gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-md text-fg-muted hover:bg-raised transition-colors shrink-0"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <GlobalSearch />
          </div>
          <Link
            to="/notifications"
            className="relative p-2 rounded-md text-fg-muted hover:bg-raised hover:text-fg transition-colors shrink-0"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
          <ProfileDropdown profile={profile} user={user} />
        </header>
        <main className="flex-1 overflow-auto flex flex-col">
          <DBStatusBanner />
          <InvitationsBanner />
          <div className="flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
