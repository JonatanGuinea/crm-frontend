import { useState, useEffect } from 'react'
import sofImg from '../assets/SOF.png'
import iaImg  from '../assets/IA.png'
import ppImg  from '../assets/PP.png'

const BRAND      = '#00B2A9'
const BRAND_DARK = '#009990'
const BRAND_LIGHT= '#33C4BE'
const BG         = '#080e1a'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0)
  // 0 → nada  1 → icono  2 → IA  3 → SOF + PP + subtítulo  4 → fade out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80)
    const t2 = setTimeout(() => setPhase(2), 480)
    const t3 = setTimeout(() => setPhase(3), 1080)
    const t4 = setTimeout(() => setPhase(4), 2000)
    const t5 = setTimeout(onDone,             2580)
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout)
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        backgroundColor: BG,
        opacity:    phase >= 4 ? 0 : 1,
        transition: phase >= 4 ? 'opacity 0.58s ease' : 'none',
      }}
    >
      {/* Grid sutil de fondo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,178,169,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,178,169,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Halo difuso */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 340, height: 340,
          background: `radial-gradient(circle, rgba(0,178,169,0.13) 0%, transparent 70%)`,
          opacity:    phase >= 1 ? 1 : 0,
          transition: 'opacity 0.9s ease',
        }}
      />

      {/* Icono central */}
      <div
        style={{
          opacity:    phase >= 1 ? 1 : 0,
          transform:  phase >= 1 ? 'scale(1)' : 'scale(0.55)',
          transition: 'opacity 0.5s ease, transform 0.65s cubic-bezier(0.34,1.5,0.64,1)',
          marginBottom: 24,
        }}
      >
        <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
          <div
            className="absolute inset-0"
            style={{
              borderRadius: 22,
              background: `conic-gradient(${BRAND}, ${BRAND_LIGHT}, ${BRAND_DARK}, ${BRAND})`,
              animation: phase >= 1 ? 'splash-spin 3s linear infinite' : 'none',
            }}
          />
          <div
            className="relative flex items-center justify-center"
            style={{
              width: 74, height: 74,
              borderRadius: 20,
              background: `linear-gradient(145deg, #0d1a2e, ${BG})`,
              boxShadow: `0 0 28px rgba(0,178,169,0.35), inset 0 1px 1px rgba(255,255,255,0.06)`,
              zIndex: 1,
            }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="4"  y="4"  width="12" height="12" rx="3" fill={BRAND}       />
              <rect x="20" y="4"  width="12" height="12" rx="3" fill={BRAND_LIGHT} opacity="0.6" />
              <rect x="4"  y="20" width="12" height="12" rx="3" fill={BRAND_LIGHT} opacity="0.6" />
              <rect x="20" y="20" width="12" height="12" rx="3" fill={BRAND}       />
            </svg>
          </div>
        </div>
      </div>

      {/* Logo SOFIAPP — tres imágenes */}
      <div className="flex items-center" style={{ marginBottom: 14 }}>

        {/* SOF — entra desde la derecha (hacia su lugar a la izquierda) */}
        <img
          src={sofImg}
          alt="SOF"
          style={{
            height: 52,
            width: 'auto',
            opacity:   phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateX(0)' : 'translateX(28px)',
            transition: 'opacity 0.55s ease, transform 0.6s cubic-bezier(0.34,1.4,0.64,1)',
          }}
        />

        {/* IA — aparece primero, escala desde el centro */}
        <img
          src={iaImg}
          alt="IA"
          style={{
            height: 52,
            width: 'auto',
            opacity:   phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? 'scale(1)' : 'scale(0.75)',
            transition: 'opacity 0.5s ease, transform 0.55s cubic-bezier(0.34,1.5,0.64,1)',
            filter: `drop-shadow(0 0 10px rgba(0,178,169,0.5))`,
          }}
        />

        {/* PP — entra desde la izquierda (hacia su lugar a la derecha) */}
        <img
          src={ppImg}
          alt="PP"
          style={{
            height: 52,
            width: 'auto',
            opacity:   phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateX(0)' : 'translateX(-28px)',
            transition: 'opacity 0.55s ease, transform 0.6s cubic-bezier(0.34,1.4,0.64,1)',
          }}
        />

      </div>

      {/* Subtítulo */}
      <p
        style={{
          color:         `rgba(0,178,169,0.55)`,
          fontSize:      10.5,
          letterSpacing: '0.22em',
          fontWeight:    500,
          textTransform: 'uppercase',
          fontFamily:    'system-ui, -apple-system, sans-serif',
          opacity:       phase >= 3 ? 1 : 0,
          transform:     phase >= 3 ? 'translateY(0)' : 'translateY(8px)',
          transition:    'opacity 0.5s ease, transform 0.5s ease',
          margin:        0,
        }}
      >
        Sistema de Gestión Empresarial
      </p>

      {/* Barra de progreso */}
      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 2,
          background: 'rgba(0,178,169,0.12)',
        }}
      >
        <div
          style={{
            height:     '100%',
            background: `linear-gradient(90deg, ${BRAND_DARK}, ${BRAND_LIGHT})`,
            width: phase >= 3 ? '100%' : phase >= 2 ? '55%' : phase >= 1 ? '18%' : '0%',
            transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
            boxShadow:  `0 0 8px rgba(0,178,169,0.7)`,
          }}
        />
      </div>

      <style>{`
        @keyframes splash-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
