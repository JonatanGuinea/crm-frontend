import { useState, useEffect } from 'react'
import logoUrl  from '../assets/danteup/logotipo-vertical-crema.svg'
import tramaUrl from '../assets/danteup/trama-oscuro.svg'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0)
  // 0 → invisible  1 → logo aparece  2 → fade out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80)
    const t2 = setTimeout(() => setPhase(2), 1700)
    const t3 = setTimeout(onDone,            2250)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0B0B0C',
        opacity:    phase >= 2 ? 0 : 1,
        transition: phase >= 2 ? 'opacity 0.55s ease' : 'none',
        fontFamily: 'Geist, system-ui, sans-serif',
      }}
    >
      {/* Trama sutil */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `url(${tramaUrl}) 0 0/768px 768px repeat`,
          opacity: 0.18,
        }}
      />

      {/* Logo vertical */}
      <img
        src={logoUrl}
        alt="DANTEUP"
        style={{
          height: 108,
          width: 'auto',
          position: 'relative', zIndex: 1,
          opacity:   phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(12px)',
          transition: phase >= 1
            ? 'opacity 0.65s ease, transform 0.7s cubic-bezier(0.34,1.3,0.64,1)'
            : 'none',
        }}
      />

      {/* Barra de progreso */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 2, background: 'rgba(242,237,227,0.07)',
        }}
      >
        <div
          style={{
            height: '100%',
            background: '#F2EDE3',
            opacity: 0.35,
            width: phase >= 1 ? '100%' : '0%',
            transition: 'width 1.7s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
    </div>
  )
}
