import { Outlet } from 'react-router-dom'
import logo from '../assets/logo-dark-mode.png'

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    title: 'Gestión de clientes',
    desc: 'Centralizá toda la información de tus clientes en un solo lugar.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
      </svg>
    ),
    title: 'Presupuestos y facturas',
    desc: 'Creá y enviá documentos profesionales en segundos.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
    title: 'Proyectos y seguimiento',
    desc: 'Seguí el avance de cada proyecto con métricas en tiempo real.',
  },
]

export default function AuthLayout() {
  return (
    <div className="dark min-h-screen flex overflow-hidden bg-slate-950 relative">
      {/* Glows globales */}
      <div className="absolute top-[-80px] left-[-80px] w-[600px] h-[500px] bg-teal-400/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Panel izquierdo ── */}
      <div className="hidden lg:flex lg:w-[58%] relative flex-col pl-14 pr-6 py-12 overflow-hidden">

        {/* Logo */}
        <div className="relative">
          <img src={logo} alt="Sofiapp" className="h-24 w-auto" />
        </div>

        {/* Texto central — centrado verticalmente */}
        <div className="relative flex-1 flex flex-col justify-center space-y-10">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Tu negocio,<br />todo en un lugar.
            </h2>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm">
              Gestioná clientes, proyectos, presupuestos y facturas desde una sola plataforma diseñada para crecer con vos.
            </p>
          </div>

          <ul className="space-y-6">
            {features.map(f => (
              <li key={f.title} className="flex items-start gap-4">
                <span className="mt-0.5 flex-shrink-0 p-2 rounded-lg bg-teal-400/10 text-teal-400">{f.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white">{f.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-slate-600">© {new Date().getFullYear()} Sofiapp. Todos los derechos reservados.</p>
      </div>

      {/* Divisor vertical */}
      <div className="hidden lg:block w-px bg-white/5 self-stretch flex-shrink-0" />

      {/* ── Panel derecho ── */}
      <div className="w-full lg:w-[42%] flex items-center justify-center pl-8 pr-12 py-12 relative">

        <div className="w-full max-w-sm relative">
          {/* Logo móvil */}
          <div className="flex justify-center mb-8 lg:hidden">
            <img src={logo} alt="Sofiapp" className="h-12 w-auto" />
          </div>

          <Outlet />
        </div>
      </div>

    </div>
  )
}
