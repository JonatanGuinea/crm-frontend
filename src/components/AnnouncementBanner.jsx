import { useState } from 'react'
import { PresupuestoIcon } from './DuIcons'

function SparklesSvg({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
      <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" opacity=".6" />
      <path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5L5 18z" opacity=".4" />
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

const ANNOUNCEMENT_KEY = 'crm_announcement_2026-09-28'

const FEATURES = [
  {
    icon: PresupuestoIcon,
    title: 'Notas en presupuestos',
    desc: 'Agregá múltiples notas con título y descripción a tus presupuestos. Aparecen en el PDF y en la vista del cliente.',
    where: 'Presupuestos → crear / editar → Notas',
  },
]

export default function AnnouncementBanner() {
  const [visible, setVisible] = useState(
    () => !localStorage.getItem(ANNOUNCEMENT_KEY)
  )

  function dismiss() {
    localStorage.setItem(ANNOUNCEMENT_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed top-4 right-4 z-50 w-[300px] shadow-xl">
      <div className="relative rounded-xl overflow-hidden border border-brand/20 bg-surface backdrop-blur-md">

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 rounded-lg text-fg-muted hover:text-fg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Cerrar"
        >
          <CloseSvg className="w-4 h-4" />
        </button>

        <div className="px-4 py-4 pr-9">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <SparklesSvg className="w-4 h-4 text-brand" />
            <p className="text-sm font-semibold text-fg">Novedades</p>
            <span className="px-2 py-0.5 rounded-full bg-brand text-base text-[10px] font-semibold tracking-wide">NUEVO</span>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-3">
            {FEATURES.map(({ icon: Icon, title, desc, where }) => (
              <div key={title} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-brand" />
                  </div>
                  <p className="text-sm font-semibold text-fg leading-snug">{title}</p>
                </div>
                <p className="text-sm text-fg-muted leading-relaxed">{desc}</p>
                <span className="self-start inline-flex items-center gap-1 text-xs font-medium text-brand/80 bg-brand/8 px-2 py-0.5 rounded-md">
                  {where}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={dismiss}
            className="mt-4 w-full py-2 rounded-lg bg-brand text-base text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  )
}
