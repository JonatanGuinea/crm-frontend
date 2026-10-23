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
  ClienteIcon, PresupuestoIcon, ProyectoIcon, AgendaIcon,
  CobroIcon, ReporteIcon, EquipoIcon, StockIcon,
  CampanaIcon, AjustesIcon, CarpetaIcon, ModulosIcon
} from '../components/DuIcons'
import { imgUrl } from '../utils/imgUrl.js'

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
  { to: '/',                  label: 'Inicio',       icon: ModulosIcon,     exact: true },
  { to: '/clients',           label: 'Clientes',     icon: ClienteIcon },
  { to: '/quotes',            label: 'Presupuestos', icon: PresupuestoIcon, memberHidden: true },
  { to: '/projects',          label: 'Proyectos',    icon: CarpetaIcon },
  { to: '/tasks',             label: 'Tareas',       icon: ProyectoIcon },
  { to: '/projects/calendar', label: 'Agenda',       icon: AgendaIcon },
]

const navBottom = [
  { to: '/finances', label: 'Finanzas', icon: CobroIcon,   memberHidden: true },
  { to: '/reports',  label: 'Reportes', icon: ReporteIcon, memberHidden: true },
  { to: '/members',  label: 'Equipo',   icon: EquipoIcon },
]

const stockSub = [
  { to: '/stock',           label: 'Dashboard',   icon: StockIcon,       exact: true },
  { to: '/stock/products',  label: 'Productos',   icon: ProductosSvg },
  { to: '/stock/providers', label: 'Proveedores', icon: ProveedoresSvg },
]

// 4 tabs directos del bottom nav mobile
const BOTTOM_NAV = [
  { to: '/',          label: 'Inicio',    icon: ModulosIcon,     exact: true },
  { to: '/projects',  label: 'Proyectos', icon: CarpetaIcon },
  { to: '/quotes',    label: 'Presup.',   icon: PresupuestoIcon, memberHidden: true },
  { to: '/tasks',     label: 'Tareas',    icon: ProyectoIcon },
]

// Items del bottom sheet "Más"
const MORE_ITEMS = [
  { to: '/clients',           label: 'Clientes',  icon: ClienteIcon },
  { to: '/projects/calendar', label: 'Agenda',    icon: AgendaIcon },
  { to: '/finances',          label: 'Finanzas',  icon: CobroIcon,   memberHidden: true },
  { to: '/stock',             label: 'Stock',     icon: StockIcon,   expandable: true },
  { to: '/reports',           label: 'Reportes',  icon: ReporteIcon, memberHidden: true },
  { to: '/members',           label: 'Equipo',    icon: EquipoIcon },
]

/* ── NavItem (sidebar desktop) ───────────────────────────────────────────── */

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

/* ── StockGroup (sidebar desktop) ────────────────────────────────────────── */

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
        <StockIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
        {!collapsed && (
          <>
            <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>Stock</span>
            <ChevronDownSvg style={{
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

/* ── SidebarAvatar ────────────────────────────────────────────────────────── */

function SidebarAvatar({ avatar, name }) {
  const [imgError, setImgError] = useState(false)
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  if (avatar && !imgError) {
    return (
      <img
        src={imgUrl(avatar)}
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

/* ── ProfileDropdown ──────────────────────────────────────────────────────── */

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
    { label: 'Perfil',   icon: ProfileSvg,  action: () => go('/profile') },
    ...(isOwner ? [{ label: 'Empresa', icon: AjustesIcon, action: () => go('/organization') }] : []),
    { label: 'Ayuda',    icon: AyudaSvg,    action: () => go('/help') },
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
              <LogoutSvg style={{ width: 15, height: 15, flexShrink: 0 }} />
              Cerrar sesión
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

/* ── SVG helpers ─────────────────────────────────────────────────────────── */

function HomeSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function TasksSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="11" height="18" rx="2" />
      <path d="M4 7h2M4 11h2M4 15h2" />
      <path d="M12 8h5M12 12h5M12 16h5" />
    </svg>
  )
}

function ProductosSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function ProveedoresSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path d="M9 22V12h6v10" />
      <rect x="2" y="9" width="20" height="3" />
    </svg>
  )
}

function ChevronDownSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function ChevronLeftSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ProfileSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function AyudaSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function LogoutSvg({ style }) {
  return (
    <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
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

/* ── SidebarContent (desktop) ────────────────────────────────────────────── */

function SidebarContent({ collapsed, onNavClick, newProjectsCount, user }) {
  const isMember = user?.role === 'member'
  const { dark } = useTheme()
  const toast = useToast()

  function handleThemeClick() {
    toast('Modo claro en desarrollo — próximamente disponible', 'info')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {!collapsed && <OrgSwitcher />}

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

/* ── BottomNav (mobile only) ─────────────────────────────────────────────── */

function BottomNav({ user, onMoreClick, moreOpen }) {
  const location = useLocation()
  const isMember = user?.role === 'member'
  const tabs = BOTTOM_NAV.filter(item => !(isMember && item.memberHidden))
  const moreActive = !moreOpen && MORE_ITEMS.some(item =>
    item.to !== '/' && location.pathname.startsWith(item.to)
  )

  return (
    <nav
      className="md:hidden flex items-stretch"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 90,
        background: C.s1,
        borderTop: `1px solid ${C.linea}`,
        height: 56,
        fontFamily: 'Geist, system-ui, sans-serif',
      }}
    >
      {tabs.map(({ to, label, icon: Icon, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          style={{ flex: 1, display: 'flex' }}
        >
          {({ isActive }) => (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              color: isActive ? C.crema : C.piedra,
              transition: 'color 0.12s',
            }}>
              <div style={{
                width: 44, height: 28,
                borderRadius: '0 12px 12px 0',
                background: isActive ? 'rgba(242,237,227,0.1)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}>
                <Icon style={{ width: 22, height: 22 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.01em' }}>{label}</span>
            </div>
          )}
        </NavLink>
      ))}

      {/* Botón Más */}
      <button
        onClick={onMoreClick}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 4,
          background: 'none', border: 'none', cursor: 'pointer',
          color: moreActive || moreOpen ? C.crema : C.piedra,
          fontFamily: 'inherit',
          transition: 'color 0.12s',
        }}
      >
        <div style={{
          width: 44, height: 28,
          borderRadius: '0 12px 12px 0',
          background: moreActive || moreOpen ? 'rgba(242,237,227,0.1)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
        }}>
          <MasSvg />
        </div>
        <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.01em' }}>Más</span>
      </button>
    </nav>
  )
}

/* ── BottomSheet "Más" (mobile only) ─────────────────────────────────────── */

function BottomSheet({ open, onClose, user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isMember = user?.role === 'member'
  const items = MORE_ITEMS.filter(item => !(isMember && item.memberHidden))
  const isOnStock = location.pathname.startsWith('/stock')
  const [stockOpen, setStockOpen] = useState(isOnStock)

  useEffect(() => { onClose() }, [location.pathname])
  useEffect(() => { if (isOnStock) setStockOpen(true) }, [isOnStock])

  function go(to) {
    onClose()
    navigate(to)
  }

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="md:hidden"
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.65)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="md:hidden"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 101,
          background: C.s1,
          borderTop: `1px solid ${C.linea}`,
          borderRight: `1px solid ${C.linea}`,
          borderRadius: '0 20px 0 0',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          paddingBottom: 72,
          fontFamily: 'Geist, system-ui, sans-serif',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 3, background: C.linea, borderRadius: 99 }} />
        </div>

        {/* Org switcher */}
        <div style={{ padding: '8px 16px 4px' }}>
          <OrgSwitcher />
        </div>

        {/* Grid de ítems */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          padding: '12px 8px 4px',
        }}>
          {items.map(({ to, label, icon: Icon, expandable }) => {
            if (expandable) {
              return (
                <button
                  key={to}
                  onClick={() => setStockOpen(o => !o)}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '18px 8px',
                    background: isOnStock || stockOpen ? 'rgba(242,237,227,0.06)' : 'none',
                    border: 'none', cursor: 'pointer',
                    borderRadius: '0 12px 12px 0',
                    color: isOnStock || stockOpen ? C.crema : C.arena,
                    transition: 'color 0.12s, background 0.12s',
                    fontFamily: 'inherit',
                    position: 'relative',
                  }}
                >
                  <Icon style={{ width: 24, height: 24 }} />
                  <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
                  <ChevronDownSvg style={{
                    position: 'absolute', top: 7, right: 9,
                    width: 11, height: 11, color: C.piedra,
                    transform: stockOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }} />
                </button>
              )
            }

            const isActive = to !== '/' && location.pathname.startsWith(to)
            return (
              <button
                key={to}
                onClick={() => go(to)}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '18px 8px',
                  background: isActive ? 'rgba(242,237,227,0.06)' : 'none',
                  border: 'none', cursor: 'pointer',
                  borderRadius: '0 12px 12px 0',
                  color: isActive ? C.crema : C.arena,
                  transition: 'color 0.12s, background 0.12s',
                  fontFamily: 'inherit',
                }}
              >
                <Icon style={{ width: 24, height: 24 }} />
                <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
              </button>
            )
          })}
        </div>

        {/* Sub-menú Stock */}
        <div style={{
          overflow: 'hidden',
          maxHeight: stockOpen ? 120 : 0,
          opacity: stockOpen ? 1 : 0,
          transition: 'max-height 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
        }}>
          <div style={{
            margin: '4px 8px 8px',
            borderTop: `1px solid ${C.linea}`,
            paddingTop: 4,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
          }}>
            {stockSub.map(({ to, label, icon: Icon, exact }) => {
              const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)
              return (
                <button
                  key={to}
                  onClick={() => go(to)}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '12px 8px',
                    background: isActive ? 'rgba(242,237,227,0.06)' : 'none',
                    border: 'none', cursor: 'pointer',
                    borderRadius: '0 10px 10px 0',
                    color: isActive ? C.crema : C.piedra,
                    transition: 'color 0.12s, background 0.12s',
                    fontFamily: 'inherit',
                  }}
                >
                  <Icon style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 10.5, fontWeight: 500 }}>{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

/* ── SVG ícon "Más" (3 líneas) ───────────────────────────────────────────── */

function MasSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" style={{ width: 22, height: 22, display: 'block' }}>
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

/* ── AppLayout ────────────────────────────────────────────────────────────── */

export default function AppLayout() {
  const { user, switchOrg } = useAuth()
  const { dark } = useTheme()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar') === 'collapsed')
  const [moreOpen, setMoreOpen] = useState(false)

  // Cerrar bottom sheet al navegar con botón atrás del browser
  useEffect(() => { setMoreOpen(false) }, [location.pathname])

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
    flexDirection: 'column',
    background: C.bg,
    borderRight: `1px solid ${C.linea}`,
    height: '100dvh',
  }

  return (
    <div className={dark ? 'dark' : ''} style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: C.bg, fontFamily: 'Geist, system-ui, sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      {needsOrg && <SetupOrgModal onCreated={handleOrgCreated} />}

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
                <ChevronLeftSvg style={{ width: 15, height: 15 }} />
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
          {/* Logo mobile (reemplaza hamburger) */}
          <div className="md:hidden" style={{ flexShrink: 0 }}>
            <img src={isotipoUrl} alt="D" style={{ height: 22, width: 'auto', display: 'block' }} />
          </div>

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
            <CampanaIcon style={{ width: 20, height: 20 }} />
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

        {/* Page content — padding-bottom en mobile para no quedar bajo el bottom nav */}
        <main className="pb-14 md:pb-0" style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <DBStatusBanner />
          <InvitationsBanner />
          <AnnouncementBanner />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom nav mobile */}
      <BottomNav
        user={user}
        onMoreClick={() => setMoreOpen(true)}
        moreOpen={moreOpen}
      />

      {/* Bottom sheet "Más" */}
      <BottomSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        user={user}
      />
    </div>
  )
}
