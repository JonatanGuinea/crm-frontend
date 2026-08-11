import { useState, useRef } from 'react'
import {
  ChevronDownIcon, ChevronUpIcon,
  HomeIcon, UsersIcon, FolderIcon, ClipboardDocumentListIcon,
  DocumentTextIcon, CubeIcon, BanknotesIcon, ChartBarIcon,
  UserGroupIcon, UserCircleIcon, QuestionMarkCircleIcon,
  LightBulbIcon, ShieldCheckIcon, BellIcon,
} from '@heroicons/react/24/outline'

// ── Datos del manual ──────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'inicio',
    label: 'Inicio rápido',
    icon: LightBulbIcon,
    color: 'text-brand',
    bg: 'bg-brand/10',
    description: 'Todo lo que necesitás saber para empezar a usar el CRM desde cero.',
    items: [
      {
        q: '¿Qué es este CRM y para qué sirve?',
        a: 'Es una herramienta de gestión para tu negocio. Desde un solo lugar podés administrar clientes, proyectos, tareas, presupuestos, stock e inventario, y finanzas. Todo organizado por organización, con control de acceso por roles.',
      },
      {
        q: '¿Cómo está organizado el sistema?',
        a: 'El CRM tiene 9 módulos principales accesibles desde el menú lateral:\n\n• Dashboard — resumen general del negocio\n• Clientes — gestión de contactos y empresas\n• Proyectos — seguimiento de trabajos en curso\n• Tareas — kanban de actividades del equipo\n• Presupuestos — creación y envío de cotizaciones\n• Stock — inventario de productos\n• Finanzas — cuentas y movimientos\n• Reportes — análisis y exportación PDF\n• Equipo — miembros y permisos',
      },
      {
        q: '¿Cómo invitar miembros al equipo?',
        a: 'Ir a Equipo → "Invitar miembro". Ingresás el email y el rol (Admin o Miembro). La persona recibe un email con un link para aceptar la invitación y crear su cuenta.',
      },
      {
        q: '¿Qué diferencia hay entre los roles?',
        a: '• Propietario (owner): acceso total. Es el único que puede ver y modificar la configuración de la empresa (/organization).\n• Administrador (admin): acceso total excepto la configuración de la empresa.\n• Miembro (member): puede ver clientes, proyectos, tareas y stock. No ve finanzas, presupuestos ni reportes.',
      },
      {
        q: '¿Cómo cambio entre modo claro y oscuro?',
        a: 'En el menú lateral, abajo a la izquierda, hay un botón de sol/luna para alternar el tema. La preferencia se guarda automáticamente.',
      },
    ],
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: HomeIcon,
    color: 'text-fg',
    bg: 'bg-raised',
    description: 'Vista general con los indicadores más importantes del negocio.',
    items: [
      {
        q: '¿Qué muestra el Dashboard?',
        a: 'Para administradores muestra 4 KPIs: proyectos en curso, ingresos del mes, clientes activos y presupuestos pendientes. También muestra los últimos clientes agregados, los presupuestos recientes y el feed de actividad.',
      },
      {
        q: '¿Qué ve un miembro del equipo en el Dashboard?',
        a: 'Los miembros ven solo 2 KPIs: proyectos en curso y sus tareas asignadas. No tienen acceso a información financiera.',
      },
      {
        q: '¿Puedo crear clientes o presupuestos desde el Dashboard?',
        a: 'Sí. Los botones de acceso rápido "Nuevo cliente" y "Nuevo presupuesto" están disponibles en el header del Dashboard para administradores.',
      },
    ],
  },
  {
    id: 'notificaciones',
    label: 'Notificaciones',
    icon: BellIcon,
    color: 'text-warning',
    bg: 'bg-warning-subtle',
    description: 'Alertas automáticas sobre eventos importantes del negocio.',
    items: [
      {
        q: '¿Qué son las notificaciones?',
        a: 'Son alertas automáticas que el sistema genera cuando ocurre algo importante: un presupuesto está por vencer, un proyecto se acerca a su fecha límite, te asignan una tarea, el stock de un producto cae, o se une un nuevo miembro.\n\nEl ícono de campana en el menú lateral muestra un badge con la cantidad de notificaciones no leídas.',
      },
      {
        q: '¿Qué tipos de notificaciones existen y a quién le llegan?',
        a: '• Presupuesto por vencer: cuando un presupuesto vence hoy o mañana → admins y owners\n• Proyecto por vencer (~5 días): cuando faltan 4–6 días para la fecha fin → todos los miembros\n• Proyecto por vencer (~1 día): cuando faltan 0–2 días para la fecha fin → todos los miembros\n• Presupuesto aprobado: cuando el cliente acepta → creador del presupuesto (o admins si lo confirma por el link público)\n• Presupuesto rechazado: cuando el cliente rechaza, con el motivo → creador (o admins si es por link público)\n• Tarea asignada: cuando alguien te asigna o reasigna una tarea → solo el asignado\n• Sin stock: cuando un producto llega a 0 unidades → todos los miembros activos\n• Stock bajo: cuando el stock cae al mínimo configurado del producto → todos los miembros activos\n• Nuevo miembro: cuando alguien acepta una invitación → solo el owner',
      },
      {
        q: '¿Cada cuánto se actualizan las notificaciones?',
        a: 'El sistema consulta nuevas notificaciones cada 60 segundos automáticamente, sin necesidad de recargar la página.\n\nLas alertas de vencimiento (presupuestos y proyectos) las calcula el servidor cada 6 horas en segundo plano. Si entrás a la página de Notificaciones, también se recalculan en ese momento.',
      },
      {
        q: '¿Cómo funcionan las notificaciones de presupuesto aprobado o rechazado?',
        a: 'Cuando el cliente responde desde el enlace público (aprueba o rechaza el presupuesto), recibís una notificación con el nombre del cliente, número de presupuesto y —en caso de rechazo— el motivo.\n\nLa notificación incluye un botón directo para contactar al cliente por WhatsApp con un mensaje preescrito según la respuesta.',
      },
      {
        q: '¿Puedo eliminar o marcar como leídas las notificaciones?',
        a: 'Al entrar a la página de Notificaciones, todas se marcan como leídas automáticamente.\n\nPodés eliminar una notificación individual con el ícono de papelera. No hay forma de eliminar todas de golpe, pero el badge del menú se actualiza al instante.',
      },
    ],
  },
  {
    id: 'clientes',
    label: 'Clientes',
    icon: UsersIcon,
    color: 'text-success',
    bg: 'bg-success-subtle',
    description: 'Gestión de contactos, empresas y su historial de actividad.',
    items: [
      {
        q: '¿Cómo creo un cliente?',
        a: 'Ir a Clientes → "Nuevo cliente". Los campos obligatorios son nombre y tipo (persona o empresa). El email, teléfono, CUIT/DNI y dirección son opcionales pero recomendados para poder enviar presupuestos por email y contactar por WhatsApp.',
      },
      {
        q: '¿Para qué sirve el campo "Potencial"?',
        a: 'Marca al cliente como prospecto (aún no confirmado). Podés crear presupuestos para clientes potenciales directamente desde la pantalla de Presupuestos con el botón "Nuevo presupuesto" → "Cliente potencial".',
      },
      {
        q: '¿Qué muestra el detalle de un cliente?',
        a: 'El perfil del cliente tiene tabs: Información general, Proyectos asociados, Presupuestos emitidos, Historial de actividad y Archivos adjuntos. Todo el historial de interacciones queda registrado automáticamente.',
      },
      {
        q: '¿Cómo contacto a un cliente por WhatsApp?',
        a: 'Si el cliente tiene un número de teléfono cargado, aparece un ícono de WhatsApp en su tarjeta y en el detalle. Al hacer clic abre WhatsApp con el número prellenado.',
      },
      {
        q: '¿Puedo ver el historial de cambios de un cliente?',
        a: 'Sí. En el detalle del cliente, la tab "Historial" registra automáticamente cada edición: qué campo cambió, valor anterior, valor nuevo, fecha y usuario que lo modificó.',
      },
    ],
  },
  {
    id: 'proyectos',
    label: 'Proyectos',
    icon: FolderIcon,
    color: 'text-warning',
    bg: 'bg-warning-subtle',
    description: 'Seguimiento de trabajos, estados y tareas asociadas.',
    items: [
      {
        q: '¿Cómo creo un proyecto?',
        a: 'Ir a Proyectos → "Nuevo proyecto". Podés asignar un cliente, fecha de inicio y fin, descripción y un presupuesto vinculado. El presupuesto vinculado es opcional pero útil para hacer seguimiento del valor del trabajo.',
      },
      {
        q: '¿Cuáles son los estados de un proyecto?',
        a: '• Pendiente: aún no comenzó\n• En curso: trabajo activo\n• En revisión: esperando aprobación del cliente\n• Completado: finalizado\n• Cancelado: descartado\n\nCualquier miembro del equipo puede cambiar el estado. Los cambios quedan registrados en el historial.',
      },
      {
        q: '¿Cómo veo las tareas de un proyecto?',
        a: 'En el detalle del proyecto hay un panel "Tareas" que muestra todas las tareas asociadas con su estado y responsable. También podés ver el progreso general (tareas completadas vs. total).',
      },
      {
        q: '¿Para qué sirve el Calendario?',
        a: 'La vista Agenda (ícono de calendario en el menú) muestra todos los proyectos organizados por fechas. Podés ver qué trabajos se superponen o qué períodos están libres.',
      },
      {
        q: '¿Los miembros pueden editar proyectos?',
        a: 'Los miembros pueden cambiar el estado del proyecto pero no pueden editar los campos (nombre, fechas, presupuesto) ni crear o eliminar proyectos. Eso es exclusivo de administradores.',
      },
    ],
  },
  {
    id: 'tareas',
    label: 'Tareas',
    icon: ClipboardDocumentListIcon,
    color: 'text-brand',
    bg: 'bg-brand/10',
    description: 'Kanban del equipo con asignaciones, fechas y seguimiento de stock.',
    items: [
      {
        q: '¿Cómo funciona el tablero kanban?',
        a: 'Las tareas se organizan en 4 columnas: Pendiente → En curso → En revisión → Completada. Arrastrá las tarjetas entre columnas para actualizar el estado. Las columnas tienen colores y las tareas completadas se colapsan automáticamente.',
      },
      {
        q: '¿Cómo creo una tarea?',
        a: 'Clic en "+" en cualquier columna o en el botón "Nueva tarea". Podés asignar responsable, fecha límite, proyecto asociado, prioridad y descripción.',
      },
      {
        q: '¿Qué son los ítems de stock en una tarea?',
        a: 'Podés asociar productos del inventario a una tarea. Al completar la tarea, el stock de esos productos se descuenta automáticamente. Esto se llama "stock comprometido" y es visible en la página de productos.',
      },
      {
        q: '¿Puedo filtrar las tareas?',
        a: 'Sí. Hay filtros por responsable, proyecto, prioridad y estado. También podés buscar por nombre de tarea. Los filtros se combinan entre sí.',
      },
      {
        q: '¿Cómo veo solo mis tareas?',
        a: 'Usá el filtro "Responsable" → seleccioná tu nombre. Los miembros del equipo solo ven las tareas asignadas a ellos por defecto en su Dashboard.',
      },
    ],
  },
  {
    id: 'presupuestos',
    label: 'Presupuestos',
    icon: DocumentTextIcon,
    color: 'text-brand',
    bg: 'bg-brand/10',
    description: 'Creación, envío, firma digital y seguimiento de cotizaciones.',
    memberHidden: true,
    items: [
      {
        q: '¿Cómo creo un presupuesto?',
        a: 'Ir a Presupuestos → "Nuevo presupuesto". Elegís el cliente, agregás los ítems (con autocomplete de productos del inventario), configurás condiciones de pago y fecha de vencimiento. El número de presupuesto se genera automáticamente.',
      },
      {
        q: '¿Cuáles son los estados de un presupuesto?',
        a: '• Borrador: en preparación, no enviado\n• Enviado: el cliente ya lo recibió\n• Aprobado: el cliente aceptó\n• Rechazado: el cliente rechazó (con motivo registrado)\n• Vencido: superó la fecha límite sin respuesta\n• Firmado: tiene firma digital del cliente',
      },
      {
        q: '¿Cómo envío un presupuesto al cliente?',
        a: 'Desde el detalle del presupuesto podés enviarlo por:\n• Email: se envía un email con un botón que lleva al cliente a la página pública del presupuesto. No se adjunta ningún PDF.\n• WhatsApp: se comparte el enlace público del presupuesto directamente.\n\nDesde la página pública el cliente puede ver el presupuesto, aprobarlo, rechazarlo, firmarlo digitalmente y descargar el PDF si lo necesita. No requiere tener cuenta en el sistema.',
      },
      {
        q: '¿Qué pasa si el cliente no responde el presupuesto?',
        a: 'Si enviaste el presupuesto por email y el cliente no responde en 2 días, el sistema envía automáticamente un email de recordatorio con el mismo enlace al presupuesto.\n\nEl recordatorio se envía una sola vez por presupuesto. Si el presupuesto ya venció al momento de la verificación, no se envía ningún recordatorio.',
      },
      {
        q: '¿Qué es la firma digital?',
        a: 'El cliente puede firmar el presupuesto directamente desde el enlace público con su dedo (mobile) o mouse (desktop). La firma queda registrada con fecha y hora. El presupuesto pasa a estado "Firmado".',
      },
      {
        q: '¿Qué pasa cuando aprueban un presupuesto?',
        a: 'Al aprobar un presupuesto, el sistema puede crear automáticamente un proyecto asociado con el mismo título y cliente. También se genera un movimiento de ingreso en Finanzas si tenés configurada una cuenta predeterminada.',
      },
      {
        q: '¿Cómo descargo el PDF del presupuesto?',
        a: 'En el detalle del presupuesto hay un botón "Descargar PDF". También está disponible en el enlace público para que el cliente lo guarde.',
      },
    ],
  },
  {
    id: 'stock',
    label: 'Stock',
    icon: CubeIcon,
    color: 'text-success',
    bg: 'bg-success-subtle',
    description: 'Gestión de inventario diferenciado por tipo, movimientos y Kardex.',
    items: [
      {
        q: '¿Qué tipos de inventario existen?',
        a: '• Producto para venta: artículos que vendés a clientes. Aparecen en el autocomplete al crear presupuestos.\n• Insumo / material interno: materiales que usás en tu producción o servicio pero no vendés directamente.\n• Materia prima: materiales base para fabricar productos.',
      },
      {
        q: '¿Cómo creo un producto?',
        a: 'Ir a Stock → Productos → "Nuevo producto". Los campos obligatorios son SKU (código único), nombre y tipo de inventario. Podés asignar categoría, proveedor, precio de costo y venta, y stock mínimo para alertas.',
      },
      {
        q: '¿Cómo registro un ingreso o egreso de stock?',
        a: 'Desde el Dashboard de Stock o desde la lista de productos:\n• Ingreso (↓ verde): compra, devolución de cliente, producción, transferencia\n• Egreso (↑ rojo): venta, consumo interno, devolución a proveedor, transferencia\n• Ajuste (⚙): para corregir el stock a un valor exacto\n\nCada movimiento queda registrado en el Kardex del producto.',
      },
      {
        q: '¿Qué es el Kardex?',
        a: 'El Kardex es el historial completo de movimientos de un producto: todas las entradas, salidas, ajustes y el stock anterior/posterior a cada operación. Podés acceder desde el ícono "→" en la fila del producto.',
      },
      {
        q: '¿Cómo funciona el stock comprometido?',
        a: 'Cuando asignás un producto a una tarea, esa cantidad queda "comprometida". Se muestra en la columna de stock para que sepas cuánto stock real disponés (stock actual menos comprometido). Al completar la tarea, el stock se descuenta automáticamente.',
      },
      {
        q: '¿Qué son las alertas de stock bajo?',
        a: 'Cada producto tiene un campo "Stock mínimo". Cuando el stock cae a ese nivel o menos, el sistema envía una notificación automática a todos los miembros activos de la organización.',
      },
      {
        q: '¿Los productos internos aparecen en los presupuestos?',
        a: 'No. El autocomplete de productos al crear presupuestos solo muestra productos de tipo "Para venta". Los insumos y materias primas no aparecen en esa búsqueda, pero siguen existiendo en el inventario.',
      },
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icon: BanknotesIcon,
    color: 'text-success',
    bg: 'bg-success-subtle',
    description: 'Cuentas, movimientos, categorías y seguimiento del flujo de caja.',
    memberHidden: true,
    items: [
      {
        q: '¿Cómo están organizadas las finanzas?',
        a: 'El módulo tiene 4 secciones:\n• Dashboard: resumen del mes con KPIs, gráficos y saldo de cuentas\n• Movimientos: listado de ingresos y egresos con filtros\n• Cuentas: banco, efectivo y otras cuentas\n• Categorías: para clasificar movimientos',
      },
      {
        q: '¿Cómo registro un movimiento?',
        a: 'Ir a Finanzas → Movimientos → "Nuevo movimiento". Seleccionás tipo (ingreso/egreso), cuenta, monto, categoría, fecha y descripción. Podés vincularlo a un cliente o proyecto.',
      },
      {
        q: '¿Los presupuestos aprobados generan movimientos automáticos?',
        a: 'Sí. Al aprobar un presupuesto, si tenés configurada una cuenta predeterminada en Organización, se crea automáticamente un movimiento de ingreso por el monto del presupuesto.',
      },
      {
        q: '¿Cómo transfiero dinero entre cuentas?',
        a: 'En Movimientos → "Nueva transferencia". Elegís cuenta origen, cuenta destino y monto. Se crean dos movimientos vinculados (salida de una, entrada en la otra) manteniendo el balance correcto.',
      },
      {
        q: '¿Qué son los movimientos pendientes?',
        a: 'Son movimientos en estado "pendiente" (por ejemplo, una factura a cobrar o un pago a realizar). Se muestran separados de los movimientos confirmados y aparecen en el indicador de "Cuentas por cobrar/pagar" del Dashboard.',
      },
    ],
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: ChartBarIcon,
    color: 'text-brand',
    bg: 'bg-brand/10',
    description: 'Análisis completo del negocio con descarga de PDF unificado.',
    memberHidden: true,
    items: [
      {
        q: '¿Qué tabs tiene la página de Reportes?',
        a: '4 tabs con datos completos:\n• Finanzas: resumen ejecutivo, liquidez, evolución mensual, egresos por categoría\n• Presupuestos: tasas de aprobación, causas de rechazo, evolución mensual, top clientes\n• Proyectos: estados, comparativas\n• Stock: inventario total, desglose por tipo, productos sin stock / stock bajo',
      },
      {
        q: '¿Qué incluye el Reporte Completo PDF?',
        a: 'El botón "Reporte Completo" genera un único PDF con las 4 secciones (finanzas, presupuestos, proyectos, stock) en orden, con portada, numeración y el nombre de la organización. Los datos son los mismos que ves en pantalla.',
      },
      {
        q: '¿Puedo descargar el PDF de una sola sección?',
        a: 'No. El botón de descarga genera siempre el reporte completo con las 4 secciones (finanzas, presupuestos, proyectos, stock) en un único PDF.',
      },
      {
        q: '¿El sistema envía reportes automáticamente?',
        a: 'Sí. El último día de cada mes a las 8 AM, el sistema genera automáticamente el informe mensual en PDF y lo envía por email al propietario (owner) de cada organización.\n\nEl PDF incluye:\n• Resumen financiero del mes (ingresos, egresos, balance, categorías, evolución 6 meses)\n• Estado de presupuestos (totales, por estado, tasa de aprobación)\n• Situación de proyectos (distribución por estado)\n• Inventario y alertas de stock (sin stock, stock bajo)\n\nEl reporte llega como archivo adjunto al email del propietario registrado en la cuenta.',
      },
    ],
  },
  {
    id: 'equipo',
    label: 'Equipo',
    icon: UserGroupIcon,
    color: 'text-warning',
    bg: 'bg-warning-subtle',
    description: 'Gestión de miembros, invitaciones y permisos por rol.',
    items: [
      {
        q: '¿Cómo invito a alguien al equipo?',
        a: 'Ir a Equipo → "Invitar miembro". Ingresás el email y elegís el rol. La persona recibe un correo con un link para aceptar. El link expira en 7 días.',
      },
      {
        q: '¿Puedo cambiar el rol de un miembro?',
        a: 'Sí, los administradores y propietarios pueden cambiar el rol de cualquier miembro desde la pantalla de Equipo haciendo clic en el rol actual.',
      },
      {
        q: '¿Cómo elimino a un miembro?',
        a: 'Desde la pantalla de Equipo, usá el menú de acciones del miembro → "Eliminar". El miembro pierde acceso inmediatamente pero sus datos históricos (tareas, movimientos, etc.) se conservan.',
      },
      {
        q: '¿Qué puede hacer un Miembro vs un Admin vs un Propietario?',
        a: 'Miembro: Dashboard limitado, Clientes, Proyectos (ver y cambiar estado), Tareas, Stock.\n\nAdministrador: todo lo anterior + Presupuestos, Finanzas, Reportes, Equipo.\n\nPropietario: todo lo anterior + Configuración de la empresa (único rol con acceso).',
      },
    ],
  },
  {
    id: 'organizacion',
    label: 'Organización y Perfil',
    icon: UserCircleIcon,
    color: 'text-fg-muted',
    bg: 'bg-raised',
    description: 'Configuración de la empresa y datos personales.',
    memberHidden: true,
    items: [
      {
        q: '¿Qué configuro en Organización?',
        a: 'Nombre de la empresa, logo, moneda predeterminada, datos de contacto y la cuenta financiera predeterminada para movimientos automáticos de presupuestos aprobados.\n\nEsta sección es exclusiva del Propietario (owner). Los administradores no tienen acceso.',
      },
      {
        q: '¿Cómo cambio mi contraseña?',
        a: 'Ir a tu avatar (esquina inferior del menú lateral) → "Mi perfil". Desde ahí podés actualizar nombre, email y contraseña.',
      },
      {
        q: '¿Puedo tener múltiples organizaciones?',
        a: 'Sí. Una misma cuenta puede pertenecer a varias organizaciones. Desde el selector de organización (en el perfil) podés alternar entre ellas. Cada organización tiene sus propios datos separados.',
      },
    ],
  },
]

// ── Componentes ───────────────────────────────────────────────────────────────

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-line last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-raised/50 transition-colors"
      >
        <span className="text-sm font-medium text-fg">{q}</span>
        {open
          ? <ChevronUpIcon className="w-4 h-4 text-fg-muted shrink-0" />
          : <ChevronDownIcon className="w-4 h-4 text-fg-muted shrink-0" />
        }
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-fg-muted leading-relaxed whitespace-pre-line">{a}</p>
        </div>
      )}
    </div>
  )
}

function Section({ section, innerRef }) {
  const Icon = section.icon
  return (
    <div ref={innerRef} id={section.id} className="scroll-mt-6 flex flex-col gap-3">
      {/* Header de sección */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${section.bg}`}>
          <Icon className={`w-5 h-5 ${section.color}`} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-fg">{section.label}</h2>
          <p className="text-xs text-fg-muted mt-0.5">{section.description}</p>
        </div>
        {section.memberHidden && (
          <span className="ml-auto shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-raised text-fg-muted border border-line">
            <ShieldCheckIcon className="w-3 h-3" />
            Admin
          </span>
        )}
      </div>

      {/* Acordeón */}
      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        {section.items.map((item, i) => (
          <AccordionItem key={i} q={item.q} a={item.a} />
        ))}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function HelpPage() {
  const [activeId, setActiveId] = useState('inicio')
  const sectionRefs = useRef({})
  const mainRef = useRef(null)

  function scrollTo(id) {
    setActiveId(id)
    const el = sectionRefs.current[id]
    const container = mainRef.current
    if (!el || !container) return
    const containerTop = container.getBoundingClientRect().top
    const elTop = el.getBoundingClientRect().top
    const offset = elTop - containerTop + container.scrollTop - 24
    container.scrollTo({ top: offset, behavior: 'smooth' })
  }

  return (
    <div className="flex h-full min-h-0">

      {/* Sidebar de navegación — solo desktop */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-line bg-surface overflow-y-auto">
        <div className="px-4 pt-6 pb-3">
          <div className="flex items-center gap-2">
            <QuestionMarkCircleIcon className="w-5 h-5 text-brand" />
            <h1 className="text-sm font-semibold text-fg">Manual de uso</h1>
          </div>
          <p className="text-xs text-fg-muted mt-1">Documentación del CRM</p>
        </div>
        <nav className="flex flex-col px-2 pb-6 gap-0.5">
          {SECTIONS.map(s => {
            const Icon = s.icon
            const isActive = activeId === s.id
            return (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                  isActive
                    ? 'bg-brand/10 text-brand font-medium'
                    : 'text-fg-muted hover:text-fg hover:bg-raised'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{s.label}</span>
                {s.memberHidden && (
                  <ShieldCheckIcon className="w-3 h-3 shrink-0 ml-auto opacity-50" />
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Contenido principal */}
      <main ref={mainRef} className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-8">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-fg">Manual de uso</h1>
              <p className="text-sm text-fg-muted mt-1">
                {SECTIONS.length} secciones · {SECTIONS.reduce((a, s) => a + s.items.length, 0)} preguntas
              </p>
            </div>
          </div>

          {/* Navegación mobile (chips) */}
          <div className="flex gap-2 flex-wrap lg:hidden">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeId === s.id
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface text-fg-muted border-line hover:text-fg hover:bg-raised'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Secciones */}
          {SECTIONS.map(s => (
            <Section
              key={s.id}
              section={s}
              innerRef={el => { sectionRefs.current[s.id] = el }}
            />
          ))}

          {/* Footer */}
          <div className="border-t border-line pt-6 text-center">
            <p className="text-xs text-fg-muted">
              ¿Necesitás ayuda adicional? Contactá al administrador de tu organización.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
