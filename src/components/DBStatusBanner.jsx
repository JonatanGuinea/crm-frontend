import { useState, useEffect } from 'react'
function WarnSvg({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function CloseSvg({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function DBStatusBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let hideTimer = null

    function onError() {
      clearTimeout(hideTimer)
      setShow(true)
    }

    function onOk() {
      // Espera un segundo antes de ocultar para evitar flicker en reconexiones rápidas
      hideTimer = setTimeout(() => setShow(false), 1000)
    }

    window.addEventListener('api-connection-error', onError)
    window.addEventListener('api-connection-ok', onOk)
    return () => {
      window.removeEventListener('api-connection-error', onError)
      window.removeEventListener('api-connection-ok', onOk)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!show) return null

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-danger-subtle border-b border-danger/20 text-danger text-sm shrink-0">
      <WarnSvg className="w-4 h-4 shrink-0" />
      <p className="flex-1 font-medium">
        No se puede conectar al servidor. Verificá tu conexión o que el servidor esté activo.
      </p>
      <button
        onClick={() => setShow(false)}
        className="p-1 rounded-md hover:bg-danger/10 transition-colors shrink-0"
      >
        <CloseSvg className="w-4 h-4" />
      </button>
    </div>
  )
}
