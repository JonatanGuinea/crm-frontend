import { NavLink, Outlet } from 'react-router-dom'
import { C } from '../pages/admin/ui'

/* Consola del panel Sistema: navegación por categorías.
   Desktop: columna lateral propia. Mobile: pestañas con scroll horizontal. */

const SECTIONS = [
  { title: 'General', items: [{ to: '/admin', label: 'Dashboard', end: true }] },
  { title: 'Gestión', items: [{ to: '/admin/organizations', label: 'Empresas' }, { to: '/admin/users', label: 'Usuarios' }] },
  { title: 'Datos', items: [{ to: '/admin/explorer', label: 'Explorador' }, { to: '/admin/finances', label: 'Finanzas' }] },
  { title: 'Seguridad', items: [{ to: '/admin/audit', label: 'Auditoría' }] },
  { title: 'Infraestructura', items: [{ to: '/admin/infra', label: 'Base de datos' }, { to: '/admin/backups', label: 'Backups' }] },
]

function DbSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
}

const linkStyle = isActive => ({
  display: 'block', padding: '7px 12px', fontSize: 13, textDecoration: 'none', borderRadius: '0 8px 8px 0',
  color: isActive ? C.crema : C.piedra, background: isActive ? C.s2 : 'transparent', fontWeight: isActive ? 500 : 400,
  borderLeft: `2px solid ${isActive ? C.crema : 'transparent'}`,
})

export default function AdminLayout() {
  return (
    <div style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-4 md:px-6 md:pt-7" style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.linea}` }}>
        <DbSvg style={{ width: 18, height: 18, color: C.arena }} />
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema, margin: 0 }}>Sistema</h1>
        <span style={{ fontSize: 11, color: C.piedra, marginLeft: 4 }}>Solo administradores del sistema</span>
      </div>

      {/* Navegación mobile */}
      <div className="lg:hidden">
        <nav style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '10px 16px', borderBottom: `1px solid ${C.linea}` }}>
          {SECTIONS.flatMap(s => s.items).map(it => (
            <NavLink key={it.to} to={it.to} end={it.end}
              style={({ isActive }) => ({ ...linkStyle(isActive), borderLeft: 'none', whiteSpace: 'nowrap', flexShrink: 0, background: isActive ? C.s3 : C.s2 })}>
              {it.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {/* Navegación desktop */}
        <div className="hidden lg:block">
          <nav style={{ width: 188, flexShrink: 0, padding: '20px 10px 20px 14px', position: 'sticky', top: 0 }}>
            {SECTIONS.map(s => (
              <div key={s.title} style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.piedra, margin: '0 0 6px 12px' }}>{s.title}</p>
                {s.items.map(it => (
                  <NavLink key={it.to} to={it.to} end={it.end} style={({ isActive }) => linkStyle(isActive)}>{it.label}</NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>

        <main className="px-4 py-5 md:px-6 md:py-6" style={{ flex: 1, minWidth: 0, maxWidth: 1180, paddingBottom: 48 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
