import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../components/Toast'
import GlobalSearch from '../components/GlobalSearch'
import OrgSwitcher from '../components/OrgSwitcher'
import InvitationsBanner from '../components/InvitationsBanner'
import DBStatusBanner from '../components/DBStatusBanner'
import AnnouncementBanner from '../components/AnnouncementBanner'
import { SetupOrgModal } from '../components/OrgModal'
import { getProfile } from '../api/profile'
import { getNotifications } from '../api/notifications'
import { getPendingInvitations } from '../api/invitations'
import { getOrganizations, switchOrganization } from '../api/auth'
import { getNewProjectsCount } from '../api/projects'
import logoUrl from '../assets/danteup/logotipo-crema.svg'
import isotipoUrl from '../assets/danteup/isotipo-crema.svg'
import {
  HomeIcon, UsersIcon, FolderIcon, DocumentTextIcon,
  BellIcon, UserGroupIcon, Bars3Icon, XMarkIcon,
  CalendarDaysIcon, ClipboardDocumentListIcon,
  UserCircleIcon, BuildingOffice2Icon,
  ArrowRightStartOnRectangleIcon, CubeIcon,
  ChevronDownIcon, BuildingStorefrontIcon,
  BanknotesIcon, ChartBarIcon, QuestionMarkCircleIcon,
  ReceiptRefundIcon, ChevronLeftIcon,
} from '@heroicons/react/24/outline'

const UPLOADS_BASE = import.meta.env.VITE_API_URL

const C = {
  bg:    '#0B0B0C',
  s1:    '#141415',
  s2:    '#1E1E20',
  linea: '#2C2C2F',
  crema: '#F2EDE3',
  arena: '#B9B4AA',
  piedra:'#8C877E',
  err:   '#E58373',
}

const ROLE_LABEL = { owner: 'Dueño', admin: 'Admin', member: 'Miembro' }

const navTop = [
  { to: '/',                  label: 'Inicio',       icon: HomeIcon,                   exact: true },
  { to: '/clients',           label: 'Clientes',     icon: UsersIcon },
  { to: '/quotes',            label: 'Presupuestos', icon: DocumentTextIcon,            memberHidden: true },
  { to: '/projects',          label: 'Proyectos',    icon: FolderIcon },
  { to: '/tasks',             label: 'Tareas',       icon: ClipboardDocumentListIcon },
  { to: '/projects/calendar', label: 'Agenda',       icon: CalendarDaysIcon },
]

const navBottom = [
  { to: '/finances', label: 'Finanzas', icon: BanknotesIcon,  memberHidden: true },
  { to: '/reports',  label: 'Reportes', icon: ChartBarIcon,   memberHidden: true },
  { to: '/members',  label: 'Equipo',   icon: UserGroupIcon },
]

const stockSub = [
  { to: '/stock',           label: 'Dashboard',   icon: CubeIcon,              exact: true },
  { to: '/stock/products',  label: 'Productos',   icon: ReceiptRefundIcon },
  { to: '/stock/providers', label: 'Proveedores', icon: BuildingStorefrontIcon },
]

function NavItem({ to, label, icon: Icon, exact, collapsed, onNavClick, badge }) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onNavClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `du-nav-item${collapsed ? ' du-collapsed' : ''}${isActive ? ' du-active' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div style={{
              position: 'absolute', left: 0, top: 4, bottom: 4,
              width: 2, background: C.crema, borderRadius: '0 2px 2px 0',
            }} />
          )}
          <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
          {!collapsed && (
            <>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
              {badge > 0 && (
                <span style={{ color: C.piedra, fontSize: 12, flexShrink: 0 }}>{badge}</span>
              )}
            </>
          )}
        </>
      )}
    </NavLink>
  )
}

function StockGroup({ collapsed, onNavClick }) {
  const location = useLocation()
  const isOnStock = location.pathname.startsWith('/stock')
  const [open, setOpen] = useState(isOnStock)

  return (
    <div>
      <button
        onClick={() => !collapsed && setOpen(o => !o)}
        title={collapsed ? 'Stock' : undefined}
        className={`du-nav-item${collapsed ? ' du-collapsed' : ''}${isOnStock ? ' du-active' : ''}`}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        {isOnStock && (
          <div style={{
            position: 'absolute', left: 0, top: 4, bottom: 4,
            width: 2, background: C.crema, borderRadius: '0 2px 2px 0',
          }} />
        )}
        <CubeIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
        {!collapsed && (
          <>
            <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>Stock</span>
            <ChevronDownIcon style={{
              width: 13, height: 13, flexShrink: 0,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }} />
          </>
        )}
      </button>

      {!collapsed && open && (
        <div style={{ marginTop: 2, marginLeft: 12, paddingLeft: 12, borderLeft: `1px solid ${C.linea}` }}>
          {stockSub.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={onNavClick}
              className={({ isActive }) =>
                `du-nav-item${isActive ? ' du-active' : ''}`
              }
              style={{ fontSize: 13, padding: '6px 10px', gap: 8 }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div style={{
                      position: 'absolute', left: 0, top: 3, bottom: 3,
                      width: 2, background: C.crema, borderRadius: '0 2px 2px 0',
                    }} />
                  )}
                  <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}

      {collapsed && (
        <div style={{ marginTop: 2 }}>
          {stockSub.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              title={label}
              onClick={onNavClick}
              className={({ isActive }) =>
                `du-nav-item du-collapsed${isActive ? ' du-active' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div style={{
                      position: 'absolute', left: 0, top: 4, bottom: 4,
                      width: 2, background: C.crema, borderRadius: '0 2px 2px 0',
                    }} />
                  )}
                  <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

function SidebarAvatar({ avatar, name }) {
  const [imgError, setImgError] = useState(false)
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  if (avatar && !imgError) {
    return (
      <img
        src={`${UPLOADS_BASE}/uploads/${avatar}`}
        alt={name}
        onError={() => setImgError(true)}
        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: C.s2, border: `1px solid ${C.linea}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ color: C.crema, fontSize: 11, fontWeight: 600 }}>{initials}</span>
    </div>
  )
}

function ProfileDropdown({ profile, user, compact = false, position = 'up' }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({})
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
      if (position === 'down') {
        setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
      } else {
        setMenuPos({ bottom: window.innerHeight - r.top + 6, left: r.left })
      }
    }
    setOpen(v => !v)
  }

  function go(path) { setOpen(false); navigate(path) }

  const isOwner = user?.role === 'owner'
  const items = [
    { label: 'Perfil',   icon: UserCircleIcon,         action: () => go('/profile') },
    ...(isOwner ? [{ label: 'Empresa', icon: BuildingOffice2Icon, action: () => go('/organization') }] : []),
    { label: 'Ayuda',    icon: QuestionMarkCircleIcon,  action: () => go('/help') },
  ]

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: compact ? 0 : 10,
          width: compact ? 'auto' : '100%',
          padding: compact ? '4px' : '12px 14px',
          background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit',
          borderRadius: compact ? '50%' : 0,
          transition: 'opacity 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <SidebarAvatar avatar={profile?.avatar} name={profile?.name || user?.name} />
        {!compact && (
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <p style={{ color: C.crema, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.name || user?.name || 'Mi perfil'}
            </p>
            <p style={{ color: C.piedra, fontSize: 11 }}>
              {ROLE_LABEL[user?.role] || user?.role}
            </p>
          </div>
        )}
      </button>

      {createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed', ...menuPos,
            width: 200, background: C.s2, border: `1px solid ${C.linea}`,
            borderRadius: '0 12px 12px 0', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,.5)',
            zIndex: 9999, transition: 'opacity 0.15s, transform 0.15s',
            opacity: open ? 1 : 0,
            transform: open ? 'scale(1)' : 'scale(0.96)',
            pointerEvents: open ? 'auto' : 'none',
            transformOrigin: position === 'down' ? 'top right' : 'bottom left',
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.linea}` }}>
            <p style={{ color: C.crema, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.name || user?.name}
            </p>
            <p style={{ color: C.piedra, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.email || user?.email}
            </p>
          </div>

          <div style={{ padding: '4px 0' }}>
            {items.map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                onClick={action}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', background: 'none', border: 'none',
                  cursor: 'pointer', color: C.arena, fontSize: 13, fontFamily: 'inherit',
                  transition: 'background-color 0.12s, color 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(242,237,227,0.05)'; e.currentTarget.style.color = C.crema }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.arena }}
              >
                <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
                {label}
              </button>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${C.linea}`, padding: '4px 0' }}>
            <button
              onClick={() => { setOpen(false); logout() }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px', background: 'none', border: 'none',
                cursor: 'pointer', color: C.err, fontSize: 13, fontFamily: 'inherit',
                transition: 'background-color 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(229,131,115,0.08)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ArrowRightStartOnRectangleIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
              Cerrar sesión
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function SidebarContent({ collapsed, onNavClick, newProjectsCount, user }) {
  const isMember = user?.role === 'member'
  const { dark } = useTheme()
  const toast = useToast()

  function handleThemeClick() {
    toast('Modo claro en desarrollo — próximamente disponible', 'info')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Org switcher */}
      {!collapsed && <OrgSwitcher />}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {navTop
          .filter(item => !(isMember && item.memberHidden))
          .map(({ to, label, icon: Icon, exact }) => (
            <NavItem
              key={to}
              to={to} label={label} icon={Icon} exact={exact}
              collapsed={collapsed} onNavClick={onNavClick}
              badge={to === '/projects' && newProjectsCount > 0 ? newProjectsCount : 0}
            />
          ))
        }

        {!collapsed && (
          <p className="du-section-label">Gestión</p>
        )}

        <StockGroup collapsed={collapsed} onNavClick={onNavClick} />

        {navBottom
          .filter(item => !(isMember && item.memberHidden))
          .map(({ to, label, icon: Icon }) => (
            <NavItem
              key={to}
              to={to} label={label} icon={Icon}
              collapsed={collapsed} onNavClick={onNavClick}
            />
          ))
        }
      </nav>

      {/* Theme toggle */}
      <div style={{ borderTop: `1px solid ${C.linea}`, flexShrink: 0 }}>
        <button
          onClick={handleThemeClick}
          title="Modo claro — próximamente"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%',
            padding: collapsed ? '12px 0' : '11px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: 'none', border: 'none', cursor: 'not-allowed',
            color: C.linea, fontSize: 13, fontFamily: 'inherit',
            opacity: 0.6,
          }}
        >
          <SunIcon />
          {!collapsed && 'Modo claro'}
        </button>
      </div>

    </div>
  )
}

export default function AppLayout() {
  const { user, switchOrg } = useAuth()
  const { dark } = useTheme()
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

  const sidebarShared = {
    display: 'flex', flexDirection: 'column',
    background: C.bg,
    borderRight: `1px solid ${C.linea}`,
    height: '100dvh',
  }

  return (
    <div className={dark ? 'dark' : ''} style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: C.bg, fontFamily: 'Geist, system-ui, sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      {needsOrg && <SetupOrgModal onCreated={handleOrgCreated} />}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,.6)' }}
          className="md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar (drawer) */}
      <aside
        className="md:hidden"
        style={{
          ...sidebarShared,
          position: 'fixed', top: 0, left: 0, bottom: 0,
          zIndex: 50, width: 240,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s ease',
        }}
      >
        {/* Logo mobile */}
        <div style={{ padding: '18px 20px 16px', borderBottom: `1px solid ${C.linea}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <img src={logoUrl} alt="DANTEUP" style={{ height: 24, width: 'auto' }} />
          <button
            onClick={() => setMobileOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, padding: 4 }}
          >
            <XMarkIcon style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <SidebarContent
          collapsed={false}
          onNavClick={() => setMobileOpen(false)}
          newProjectsCount={newProjectsCount}
          user={user}
          profile={profile}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex"
        style={{
          ...sidebarShared,
          flexDirection: 'column',
          width: collapsed ? 56 : 220,
          flexShrink: 0,
          transition: 'width 0.25s ease',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Logo desktop */}
        <div style={{
          padding: collapsed ? '18px 0' : '18px 20px 16px',
          borderBottom: `1px solid ${C.linea}`,
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          flexShrink: 0, minHeight: 58,
        }}>
          {collapsed ? (
            <button
              onClick={toggleSidebar}
              title="Expandir menú"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
            >
              <img src={isotipoUrl} alt="D" style={{ height: 24, width: 'auto' }} />
            </button>
          ) : (
            <>
              <img src={logoUrl} alt="DANTEUP" style={{ height: 24, width: 'auto' }} />
              <button
                onClick={toggleSidebar}
                title="Colapsar menú"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, padding: 4, flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = C.arena}
                onMouseLeave={e => e.currentTarget.style.color = C.piedra}
              >
                <ChevronLeftIcon style={{ width: 15, height: 15 }} />
              </button>
            </>
          )}
        </div>

        <SidebarContent
          collapsed={collapsed}
          onNavClick={undefined}
          newProjectsCount={newProjectsCount}
          user={user}
          profile={profile}
        />

      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          height: 56, flexShrink: 0,
          background: C.bg, borderBottom: `1px solid ${C.linea}`,
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 12,
        }}>
          {/* Hamburger mobile */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.piedra, padding: 4, flexShrink: 0 }}
          >
            <Bars3Icon style={{ width: 20, height: 20 }} />
          </button>

          {/* Search */}
          <div style={{ flex: 1 }}>
            <GlobalSearch />
          </div>

          {/* Bell */}
          <Link
            to="/notifications"
            style={{ position: 'relative', color: C.piedra, padding: 6, display: 'flex', flexShrink: 0, transition: 'color 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.color = C.arena}
            onMouseLeave={e => e.currentTarget.style.color = C.piedra}
          >
            <BellIcon style={{ width: 20, height: 20 }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                minWidth: 15, height: 15, padding: '0 3px',
                borderRadius: 99, background: C.err,
                color: '#fff', fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Profile avatar */}
          <ProfileDropdown compact position="down" profile={profile} user={user} />
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <DBStatusBanner />
          <InvitationsBanner />
          <AnnouncementBanner />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
