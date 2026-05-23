import { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

const ToastContext = createContext(null)

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const addToast = useCallback((message, type = 'error') => {
    const id = ++_id
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-xl pointer-events-auto
                animate-in slide-in-from-top-2 fade-in duration-200
                ${toast.type === 'success'
                  ? 'bg-surface/90 border-brand/30 text-fg'
                  : 'bg-surface/90 border-danger/30 text-fg'
                }`}
            >
              {toast.type === 'success'
                ? <CheckCircleIcon className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                : <XCircleIcon className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              }
              <p className="text-sm flex-1 leading-snug">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-fg-muted hover:text-fg shrink-0 mt-0.5"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
