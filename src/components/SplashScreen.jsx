import { useState, useEffect } from 'react'

export default function SplashScreen({ onDone }) {
  const [showIA, setShowIA] = useState(false)
  const [showSides, setShowSides] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowIA(true), 100)
    const t2 = setTimeout(() => setShowSides(true), 800)
    const t3 = setTimeout(() => setFadeOut(true), 1900)
    const t4 = setTimeout(() => onDone(), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 bg-base flex items-center justify-center z-50 transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="flex items-center">
        {/* SOF — sale desde el centro hacia la izquierda */}
        <span
          className="text-5xl font-bold text-fg transition-all duration-700"
          style={{
            opacity: showSides ? 1 : 0,
            transform: showSides ? 'translateX(0)' : 'translateX(60px)',
            transitionTimingFunction: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
          }}
        >
          SOF
        </span>

        {/* IA — aparece primero al centro */}
        <span
          className="text-5xl font-bold text-brand transition-all duration-500"
          style={{
            opacity: showIA ? 1 : 0,
            transform: showIA ? 'scale(1)' : 'scale(0.8)',
          }}
        >
          IA
        </span>

        {/* PP — sale desde el centro hacia la derecha */}
        <span
          className="text-5xl font-bold text-fg transition-all duration-700"
          style={{
            opacity: showSides ? 1 : 0,
            transform: showSides ? 'translateX(0)' : 'translateX(-60px)',
            transitionTimingFunction: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
          }}
        >
          PP
        </span>
      </div>
    </div>
  )
}
