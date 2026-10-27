/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
function CheckCircleSvg({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
function XCircleSvg({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
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

const ToastContext = createContext(null)

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    // marca como saliendo para disparar animación de salida
    setToasts(t => t.map(x => x.id === id ? { ...x, exiting: true } : x))
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 250)
  }, [])

  const addToast = useCallback((message, type = 'error') => {
    const id = ++_id
    setToasts(t => [...t, { id, message, type, exiting: false }])
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
              className={`flex items-start gap-3 px-4 py-3 border shadow-lg backdrop-blur-xl pointer-events-auto
                ${toast.type === 'success'
                  ? 'bg-surface/90 border-brand/30 text-fg'
                  : 'bg-surface/90 border-danger/30 text-fg'
                }`}
              style={{ animation: `${toast.exiting ? 'toast-out' : 'toast-in'} 0.25s cubic-bezier(0.4,0,0.2,1) forwards`, borderRadius: '0 12px 12px 0' }}
            >
              {toast.type === 'success'
                ? <CheckCircleSvg className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                : <XCircleSvg className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              }
              <p className="text-sm flex-1 leading-snug">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-fg-muted hover:text-fg shrink-0 mt-0.5"
              >
                <CloseSvg className="w-4 h-4" />
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
