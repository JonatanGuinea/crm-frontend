import { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)

  const confirm = useCallback((message, { confirmLabel = 'Eliminar', danger = true } = {}) => {
    return new Promise(resolve => {
      setDialog({ message, confirmLabel, danger, resolve })
    })
  }, [])

  function handleResolve(value) {
    dialog?.resolve(value)
    setDialog(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => handleResolve(false)} />
          <div className="relative bg-surface/90 backdrop-blur-xl border border-line rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
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
