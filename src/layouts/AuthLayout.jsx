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
    title: 'Presupuestos',
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
    <div className="dark min-h-screen flex overflow-hidden bg-[#050a12] relative">

      {/* ── CRM Animated Background (panel derecho) ── */}
      <div
        className="hidden lg:block absolute top-0 bottom-0 overflow-hidden pointer-events-none"
        style={{ left: '43%', right: 0 }}
      >
        {/* Trend line + área — esquina superior derecha */}
        <svg
          viewBox="0 0 320 100"
          fill="none"
          preserveAspectRatio="none"
          className="absolute"
          style={{ top: '7%', right: '4%', width: '46%', opacity: 0.22 }}
        >
          <defs>
            <linearGradient id="crmAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,78 C45,68 75,40 115,48 C150,56 168,16 224,24 C262,30 286,12 320,4 L320,100 L0,100 Z" fill="url(#crmAreaGrad)" />
          <path
            d="M0,78 C45,68 75,40 115,48 C150,56 168,16 224,24 C262,30 286,12 320,4"
            stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="800"
            style={{ animation: 'crm-draw 3s ease-out 0.4s both' }}
          />
          {[[115,48],[168,16],[224,24],[286,12]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="#14b8a6"
              style={{ animation: `crm-dot-pulse 2.2s ease-in-out ${i*0.35+3.4}s infinite` }}
            />
          ))}
        </svg>

        {/* Bar chart mensual — inferior izquierda */}
        <div className="absolute flex items-end gap-1.5" style={{ bottom: '19%', left: '5%', opacity: 0.22 }}>
          {[42,65,52,82,66,90,74].map((h,i) => (
            <div key={i} style={{
              width: '13px', height: `${h}px`,
              borderRadius: '3px 3px 0 0',
              background: 'linear-gradient(to top, rgba(20,184,166,0.8), rgba(6,182,212,0.25))',
              transformOrigin: 'bottom',
              animation: `crm-bar-pulse 3s ease-in-out ${i*0.22}s infinite`,
            }} />
          ))}
        </div>

        {/* Tarjeta: Clientes */}
        <div className="absolute rounded-xl border" style={{
          top: '21%', left: '7%', padding: '10px 14px',
          background: 'rgba(6,182,212,0.03)', borderColor: 'rgba(20,184,166,0.1)',
          backdropFilter: 'blur(8px)',
          animation: 'crm-fade-up 0.9s ease 0.6s both, crm-float-a 5.5s ease-in-out 1.5s infinite',
        }}>
          <p style={{ fontSize:'9px', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(6,182,212,0.45)', marginBottom:'4px' }}>Clientes</p>
          <p style={{ fontSize:'22px', fontWeight:700, color:'rgba(255,255,255,0.28)', lineHeight:1 }}>248</p>
        </div>

        {/* Tarjeta: Proyectos */}
        <div className="absolute rounded-xl border" style={{
          top: '46%', right: '9%', padding: '10px 14px',
          background: 'rgba(6,182,212,0.03)', borderColor: 'rgba(20,184,166,0.1)',
          backdropFilter: 'blur(8px)',
          animation: 'crm-fade-up 0.9s ease 1.1s both, crm-float-b 6.5s ease-in-out 2s infinite',
        }}>
          <p style={{ fontSize:'9px', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(6,182,212,0.45)', marginBottom:'4px' }}>Proyectos</p>
          <p style={{ fontSize:'22px', fontWeight:700, color:'rgba(255,255,255,0.28)', lineHeight:1 }}>18</p>
        </div>

        {/* Tarjeta: Ingresos */}
        <div className="absolute rounded-xl border" style={{
          bottom: '33%', left: '32%', padding: '10px 14px',
          background: 'rgba(6,182,212,0.03)', borderColor: 'rgba(20,184,166,0.1)',
          backdropFilter: 'blur(8px)',
          animation: 'crm-fade-up 0.9s ease 1.6s both, crm-float-c 4.8s ease-in-out 2.5s infinite',
        }}>
          <p style={{ fontSize:'9px', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(6,182,212,0.45)', marginBottom:'4px' }}>Ingresos</p>
          <p style={{ fontSize:'22px', fontWeight:700, color:'rgba(255,255,255,0.28)', lineHeight:1 }}>$45.2k</p>
        </div>

        {/* Red de nodos — zona media derecha */}
        <svg viewBox="0 0 200 130" fill="none" className="absolute"
          style={{ bottom: '35%', right: '4%', width: '20%', opacity: 0.18 }}
        >
          <line x1="100" y1="65" x2="35"  y2="22"  stroke="#14b8a6" strokeWidth="0.6" />
          <line x1="100" y1="65" x2="165" y2="28"  stroke="#14b8a6" strokeWidth="0.6" />
          <line x1="100" y1="65" x2="45"  y2="108" stroke="#14b8a6" strokeWidth="0.6" />
          <line x1="100" y1="65" x2="168" y2="102" stroke="#14b8a6" strokeWidth="0.6" />
          <line x1="35"  y1="22" x2="165" y2="28"  stroke="#14b8a6" strokeWidth="0.4" strokeDasharray="3 3" />
          {[[100,65,4],[35,22,2.5],[165,28,2.5],[45,108,2.5],[168,102,2.5]].map(([x,y,r],i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#14b8a6"
              style={{ animation: `crm-dot-pulse 2s ease-in-out ${i*0.3}s infinite` }}
            />
          ))}
        </svg>

        {/* Donut chart — esquina inferior derecha */}
        <svg viewBox="0 0 80 80" className="absolute"
          style={{ bottom: '9%', right: '8%', width: '68px', animation: 'crm-fade-up 1.2s ease 2.2s both' }}
        >
          <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(20,184,166,0.12)" strokeWidth="5" />
          <circle cx="40" cy="40" r="28" fill="none" stroke="#14b8a6" strokeWidth="5"
            strokeLinecap="round" strokeDasharray="106 70"
            transform="rotate(-90 40 40)" style={{ opacity: 0.7 }}
          />
          <text x="40" y="44" textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize="11" fontWeight="600">60%</text>
        </svg>
      </div>

      {/* Glows globales */}
      <div className="absolute top-[-80px] left-[-80px] w-[600px] h-[500px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] bg-teal-400/8 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-cyan-600/5 rounded-full blur-[80px] pointer-events-none" />

      {/* ── Panel izquierdo ── */}
      <div className="hidden lg:flex lg:w-[43%] relative flex-col pl-14 pr-6 py-12 overflow-hidden">

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
              Gestioná clientes, emails, proyectos y presupuestos desde una sola plataforma diseñada para crecer con vos.
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

      {/* ── Panel derecho ── */}
      <div className="w-full lg:w-[57%] flex items-start justify-start pl-8 pr-12 py-12 relative overflow-y-auto">

        <div className="w-full max-w-4xl relative my-auto">
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
