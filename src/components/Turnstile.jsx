import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

// Verificación "No soy un robot" de Cloudflare Turnstile.
// Sin VITE_TURNSTILE_SITE_KEY no se muestra nada y no se exige (turnstileEnabled = false).
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
export const turnstileEnabled = Boolean(TURNSTILE_SITE_KEY)

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise = null

function loadScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = SCRIPT_SRC
      s.async = true
      s.defer = true
      s.onload = () => resolve(window.turnstile)
      s.onerror = () => { scriptPromise = null; reject(new Error('No se pudo cargar la verificación')) }
      document.head.appendChild(s)
    })
  }
  return scriptPromise
}

// onToken(token | null): token nuevo cuando se verifica; null cuando vence o falla.
// ref.reset(): pide un token nuevo (los tokens son de un solo uso: resetear después de cada envío).
const Turnstile = forwardRef(function Turnstile({ onToken }, ref) {
  const boxRef    = useRef(null)
  const widgetRef = useRef(null)
  const cbRef     = useRef(onToken)
  cbRef.current   = onToken

  useImperativeHandle(ref, () => ({
    reset() {
      cbRef.current?.(null)
      if (window.turnstile && widgetRef.current != null) window.turnstile.reset(widgetRef.current)
    },
  }), [])

  useEffect(() => {
    if (!turnstileEnabled) return
    let cancelled = false
    loadScript()
      .then(ts => {
        if (cancelled || !boxRef.current || widgetRef.current != null) return
        widgetRef.current = ts.render(boxRef.current, {
          sitekey:            TURNSTILE_SITE_KEY,
          theme:              'dark',
          language:           'es',
          size:               'flexible',
          callback:           t => cbRef.current?.(t),
          'expired-callback': () => cbRef.current?.(null),
          'error-callback':   () => cbRef.current?.(null),
        })
      })
      .catch(() => cbRef.current?.(null))
    return () => {
      cancelled = true
      if (window.turnstile && widgetRef.current != null) {
        try { window.turnstile.remove(widgetRef.current) } catch { /* ya removido */ }
      }
      widgetRef.current = null
    }
  }, [])

  if (!turnstileEnabled) return null
  return <div ref={boxRef} style={{ minHeight: 65, width: '100%' }} />
})

export default Turnstile
