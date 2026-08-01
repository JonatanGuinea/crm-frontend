import { useState, useEffect } from 'react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

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
      <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
      <p className="flex-1 font-medium">
        No se puede conectar al servidor. Verificá tu conexión o que el servidor esté activo.
      </p>
      <button
        onClick={() => setShow(false)}
        className="p-1 rounded-md hover:bg-danger/10 transition-colors shrink-0"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  )
}
