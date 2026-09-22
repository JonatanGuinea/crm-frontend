import { useState } from 'react'
import { XMarkIcon, PhotoIcon, SwatchIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'

const ANNOUNCEMENT_KEY = 'crm_announcement_2026-09-21'

const FEATURES = [
  {
    icon: PhotoIcon,
    title: 'Imágenes en presupuestos',
    desc: 'Adjuntá fotos a tus presupuestos. Aparecen en el PDF y en la vista del cliente.',
    where: 'Presupuestos → detalle → Imágenes',
  },
  {
    icon: SwatchIcon,
    title: 'Colores de marca',
    desc: 'Personalizá el PDF y la vista pública de tus presupuestos con los colores de tu empresa.',
    where: 'Ajustes → Identidad de marca',
  },
  {
    icon: ClipboardDocumentListIcon,
    title: 'Tareas predeterminadas',
    desc: 'Configurá tareas que se crean solas cada vez que empieza un proyecto.',
    where: 'Ajustes → Tareas predeterminadas',
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
    <div className="mx-4 md:mx-6 mt-3">
      <div className="relative rounded-xl overflow-hidden border border-brand/20 bg-gradient-to-br from-brand/8 via-brand/4 to-transparent">

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Cerrar"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>

        <div className="px-5 py-4 pr-10">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <SparklesIcon className="w-4 h-4 text-brand" />
            <p className="text-sm font-semibold text-fg">Novedades</p>
            <span className="px-2 py-0.5 rounded-full bg-brand text-white text-[10px] font-semibold tracking-wide">NUEVO</span>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FEATURES.map(({ icon: Icon, title, desc, where }) => (
              <div key={title} className="bg-surface/70 backdrop-blur-sm rounded-lg border border-line/60 p-3.5 flex flex-col gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-fg leading-snug">{title}</p>
                  <p className="text-xs text-fg-muted mt-0.5 leading-relaxed">{desc}</p>
                </div>
                <div className="mt-auto pt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-brand/80 bg-brand/8 px-2 py-0.5 rounded-md">
                    {where}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
