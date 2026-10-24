/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

const C = {
  bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', linea: '#2C2C2F',
  crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', err: '#E58373',
}

function WarnSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, display: 'block', flexShrink: 0 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)

  const confirm = useCallback((message, { confirmLabel = 'Eliminar', danger = true, body = null } = {}) => {
    return new Promise(resolve => {
      setDialog({ message, confirmLabel, danger, body, resolve, exiting: false })
    })
  }, [])

  function handleResolve(value) {
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
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
          fontFamily: 'Geist, system-ui, sans-serif',
          animation: `${dialog.exiting ? 'du-backdrop-out' : 'du-backdrop-in'} 0.2s ease forwards`,
        }}>
          <style>{`
            @keyframes du-backdrop-in  { from { opacity: 0 } to { opacity: 1 } }
            @keyframes du-backdrop-out { from { opacity: 1 } to { opacity: 0 } }
            @keyframes du-dialog-in    { from { opacity: 0; transform: scale(0.95) translateY(6px) } to { opacity: 1; transform: scale(1) translateY(0) } }
            @keyframes du-dialog-out   { from { opacity: 1; transform: scale(1) translateY(0) } to { opacity: 0; transform: scale(0.95) translateY(6px) } }
          `}</style>

          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }}
            onClick={() => handleResolve(false)}
          />

          {/* Panel */}
          <div style={{
            position: 'relative',
            background: C.s2,
            border: `1px solid ${C.linea}`,
            borderRadius: '0 16px 16px 0',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            width: '100%', maxWidth: 360,
            padding: '24px',
            display: 'flex', flexDirection: 'column', gap: 20,
            animation: `${dialog.exiting ? 'du-dialog-out' : 'du-dialog-in'} 0.25s cubic-bezier(0.4,0,0.2,1) forwards`,
          }}>
            {/* Mensaje */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '0 8px 8px 0', flexShrink: 0,
                background: 'rgba(229,131,115,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.err,
              }}>
                <WarnSvg />
              </div>
              <p style={{ fontSize: 14, color: C.crema, lineHeight: 1.5, paddingTop: 6 }}>
                {dialog.message}
              </p>
            </div>

            {/* Body extra (opcional) */}
            {dialog.body && (
              <div style={{ borderTop: `1px solid ${C.linea}`, paddingTop: 14 }}>
                {dialog.body}
              </div>
            )}

            {/* Botones */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => handleResolve(false)}
                style={{
                  padding: '8px 16px', fontSize: 13, cursor: 'pointer',
                  background: 'none', border: `1px solid ${C.linea}`,
                  borderRadius: '0 8px 8px 0', color: C.piedra,
                  fontFamily: 'inherit', transition: 'color 0.12s, border-color 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.arena; e.currentTarget.style.borderColor = C.arena }}
                onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.borderColor = C.linea }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleResolve(true)}
                style={{
                  padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: 'none', borderRadius: '0 8px 8px 0', fontFamily: 'inherit',
                  background: dialog.danger ? C.err : C.crema,
                  color: C.bg,
                  transition: 'opacity 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
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
