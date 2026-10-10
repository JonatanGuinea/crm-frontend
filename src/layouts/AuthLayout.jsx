import { Outlet } from 'react-router-dom'
import tramaUrl from '../assets/danteup/trama-oscuro.svg'
import logoUrl from '../assets/danteup/logotipo-crema.svg'
import escalonesUrl from '../assets/danteup/escalones-crema.svg'

export default function AuthLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0B0B0C', color: '#F2EDE3', fontFamily: 'Geist, system-ui, sans-serif', WebkitFontSmoothing: 'antialiased' }}>

      {/* Panel izquierdo — trama + marca */}
      <div
        className="hidden lg:flex"
        style={{
          flex: '1 1 560px',
          minHeight: '100vh',
          padding: '56px 64px',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid #2C2C2F',
          background: `linear-gradient(rgba(11,11,12,.45),rgba(11,11,12,.45)), #0B0B0C url(${tramaUrl}) 0 0/1152px 1500px repeat`,
        }}
      >
        <img src={logoUrl} alt="DANTEUP" style={{ height: 30, width: 'auto', alignSelf: 'flex-start' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 520 }}>
          <h1 style={{ fontSize: 64, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1 }}>
            Crecemos <span style={{ color: '#FFFFFF' }}>con vos.</span>
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.5, color: '#B9B4AA' }}>
            Clientes, presupuestos, proyectos y cobros en un solo lugar.
          </p>
        </div>

        <img src={escalonesUrl} alt="" style={{ width: '100%', maxWidth: 520, height: 'auto' }} />
      </div>

      {/* Panel derecho — formulario */}
      <div
        style={{
          flex: '1 1 480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflowY: 'auto',
          padding: '24px',
          minHeight: '100vh',
        }}
      >
        {/* Logo — solo mobile, en flujo normal */}
        <div className="lg:hidden" style={{ flexShrink: 0, marginBottom: 36, marginTop: 20 }}>
          <img src={logoUrl} alt="DANTEUP" style={{ height: 26, width: 'auto' }} />
        </div>

        {/* Spacer superior — solo desktop, centra verticalmente */}
        <div className="hidden lg:block" style={{ flex: 1 }} />

        <div style={{ width: '100%', maxWidth: 400, flexShrink: 0 }}>
          <Outlet />
        </div>

        {/* Spacer inferior — solo desktop */}
        <div className="hidden lg:block" style={{ flex: 1 }} />
      </div>

    </div>
  )
}
