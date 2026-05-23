import { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null) // { message, confirmLabel, danger, resolve, exiting }

  const confirm = useCallback((message, { confirmLabel = 'Eliminar', danger = true } = {}) => {
    return new Promise(resolve => {
      setDialog({ message, confirmLabel, danger, resolve, exiting: false })
    })
  }, [])

  function handleResolve(value) {
    // animar salida antes de cerrar
    setDialog(d => d ? { ...d, exiting: true } : null)
    setTimeout(() => {
      dialog?.resolve(value)
      setDialog(null)
    }, 200)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            style={{ animation: `${dialog.exiting ? 'backdrop-out' : 'backdrop-in'} 0.2s ease forwards` }}
            className="absolute inset-0 bg-black/50"
            onClick={() => handleResolve(false)}
          />
          {/* Panel */}
          <div
            style={{ animation: `${dialog.exiting ? 'dialog-out' : 'dialog-in'} 0.25s cubic-bezier(0.4,0,0.2,1) forwards` }}
            className="relative bg-surface/90 backdrop-blur-xl border border-line rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-danger-subtle shrink-0">
                <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
              </div>
              <p className="text-sm text-fg leading-snug pt-1.5">{dialog.message}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => handleResolve(false)}
                className="px-4 py-2 text-sm text-fg-soft hover:text-fg border border-line-soft rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleResolve(true)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  dialog.danger
                    ? 'bg-danger text-white hover:opacity-90'
                    : 'bg-brand text-white hover:bg-brand-hover'
                }`}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}
