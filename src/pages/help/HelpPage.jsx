import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'

const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }

// ── SVGs ──────────────────────────────────────────────────────────────────────

function LightBulbSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18" /><line x1="10" y1="22" x2="14" y2="22" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" /></svg>
}
function HomeSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
}
function BellSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
}
function UsersSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
}
function FolderSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
}
function ClipboardSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" /></svg>
}
function DocSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
}
function CubeSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
}
function BanknotesSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
}
function CardSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><line x1="6" y1="15" x2="10" y2="15" /></svg>
}
function ChartSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
}
function UserGroupSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
}
function UserCircleSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
}
function ChevronDownSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
}
function ChevronUpSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
}
function QuestionSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
}
function ShieldSvg({ style }) {
  return <svg style={{ display: 'block', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
}

// ── Datos del manual ──────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'inicio',
    label: 'Inicio rápido',
    icon: LightBulbSvg,
    color: C.crema,
    bg: 'rgba(242,237,227,0.10)',
    description: 'Todo lo que necesitás saber para empezar a usar el CRM desde cero.',
    items: [
      {
        q: '¿Qué es este CRM y para qué sirve?',
        a: 'Es una herramienta de gestión para tu negocio. Desde un solo lugar podés administrar clientes, proyectos, tareas, presupuestos, stock e inventario, y finanzas. Todo organizado por organización, con control de acceso por roles.',
      },
      {
        q: '¿Cómo está organizado el sistema?',
        a: 'El CRM tiene 10 módulos principales accesibles desde el menú lateral:\n\n• Dashboard — resumen general del negocio\n• Clientes — gestión de contactos y empresas\n• Proyectos — seguimiento de trabajos en curso\n• Tareas — kanban de actividades del equipo\n• Presupuestos — creación y envío de cotizaciones\n• Stock — inventario de productos\n• Finanzas — cuentas y movimientos\n• Membresías — cobros mensuales recurrentes a clientes\n• Reportes — análisis y exportación PDF\n• Equipo — miembros y permisos',
      },
      {
        q: '¿Cómo invitar miembros al equipo?',
        a: 'Ir a Equipo → "Invitar miembro". Ingresás el email y el rol (Administrador o Miembro). La persona recibe un email con un link para aceptar la invitación y crear su cuenta.',
      },
      {
        q: '¿Qué diferencia hay entre los roles?',
        a: '• Dueño (owner): acceso total. Es el único que puede ver y modificar la configuración de la empresa (/organization).\n• Administrador (admin): acceso total excepto la configuración de la empresa.\n• Miembro (member): puede ver clientes, proyectos, tareas y stock. No ve finanzas, membresías, presupuestos ni reportes.',
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
    icon: HomeSvg,
    color: C.crema,
    bg: C.s2,
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
    icon: BellSvg,
    color: C.warn,
    bg: 'rgba(226,182,99,0.12)',
    description: 'Alertas automáticas sobre eventos importantes del negocio.',
    items: [
      {
        q: '¿Qué son las notificaciones?',
        a: 'Son alertas automáticas que el sistema genera cuando ocurre algo importante: un presupuesto está por vencer, un proyecto se acerca a su fecha límite, te asignan una tarea, el stock de un producto cae, o se une un nuevo miembro.\n\nEl ícono de campana en el menú lateral muestra un badge con la cantidad de notificaciones no leídas.',
      },
      {
        q: '¿Qué tipos de notificaciones existen y a quién le llegan?',
        a: '• Presupuesto por vencer: cuando un presupuesto vence hoy o mañana → admins y owners\n• Proyecto por vencer (~5 días): cuando faltan 4–6 días para la fecha fin → todos los miembros\n• Proyecto por vencer (~1 día): cuando faltan 0–2 días para la fecha fin → todos los miembros\n• Presupuesto aprobado: cuando el cliente acepta → creador del presupuesto (o admins si lo confirma por el link público)\n• Presupuesto rechazado: cuando el cliente rechaza, con el motivo → creador (o admins si es por link público)\n• Piden un presupuesto actualizado: cuando el cliente lo solicita desde el enlace de un presupuesto vencido → admins y owners\n• Tarea asignada: cuando alguien te asigna o reasigna una tarea → solo el asignado\n• Sin stock: cuando un producto llega a 0 unidades → todos los miembros activos\n• Stock bajo: cuando el stock cae al mínimo configurado del producto → todos los miembros activos\n• Nuevo miembro: cuando alguien acepta una invitación → solo el owner',
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
    icon: UsersSvg,
    color: C.ok,
    bg: 'rgba(125,190,147,0.12)',
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
    icon: FolderSvg,
    color: C.warn,
    bg: 'rgba(226,182,99,0.12)',
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
    icon: ClipboardSvg,
    color: C.crema,
    bg: 'rgba(242,237,227,0.10)',
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
    icon: DocSvg,
    color: C.crema,
    bg: 'rgba(242,237,227,0.10)',
    description: 'Creación, envío, firma digital y seguimiento de cotizaciones.',
    memberHidden: true,
    items: [
      {
        q: '¿Cómo creo un presupuesto?',
        a: 'Ir a Presupuestos → "Nuevo presupuesto". Elegís el cliente, agregás los ítems (con autocomplete de productos del inventario), configurás condiciones de pago y fecha de vencimiento. El número de presupuesto se genera automáticamente.',
      },
      {
        q: '¿Cuáles son los estados de un presupuesto?',
        a: '• Borrador: en preparación, no enviado\n• Enviado: el cliente ya lo recibió\n• Aprobado: el cliente aceptó\n• Rechazado: el cliente rechazó (con motivo registrado)\n• Vencido: superó la fecha de validez sin respuesta (se marca automáticamente)\n• Firmado: tiene firma digital del cliente',
      },
      {
        q: '¿Cómo envío un presupuesto al cliente?',
        a: 'Desde el detalle del presupuesto podés enviarlo por:\n• Email: se envía un email con un botón que lleva al cliente a la página pública del presupuesto. No se adjunta ningún PDF.\n• WhatsApp: se comparte el enlace público del presupuesto directamente.\n\nDesde la página pública el cliente puede ver el presupuesto, aprobarlo, rechazarlo, firmarlo digitalmente y descargar el PDF si lo necesita. No requiere tener cuenta en el sistema.',
      },
      {
        q: '¿Qué pasa si el cliente no responde el presupuesto?',
        a: 'El sistema actúa automáticamente en dos momentos:\n\n• A las 48 hs de enviado sin respuesta: se envía un email de recordatorio al cliente con el mismo enlace al presupuesto. Se envía una sola vez por presupuesto.\n\n• 1 día antes de que venza (si sigue sin respuesta): el equipo completo recibe una notificación interna que dice "El cliente no respondió el presupuesto #X y vence mañana". Si para el día del vencimiento aún no hubo respuesta, la notificación se actualiza a "vence hoy" y se reactiva como no leída.\n\nSi el presupuesto ya venció al momento de la verificación, no se envía el email de recordatorio.',
      },
      {
        q: '¿Qué pasa cuando un presupuesto vence?',
        a: 'La fecha de validez incluye ese día completo. A partir del día siguiente, si el presupuesto sigue "Enviado" sin respuesta, el sistema lo pasa automáticamente a "Vencido" y lo registra en el historial como "Sistema".\n\nAdemás, si el cliente tiene email, le llega un aviso de que el presupuesto venció con un botón "Quiero un presupuesto actualizado".\n\nDesde ese momento el cliente ya no puede aprobarlo, firmarlo ni rechazarlo desde el enlace: ve un aviso de que el plazo venció y un botón para solicitar un presupuesto actualizado.\n\nLos borradores no vencen automáticamente: si un borrador tiene la fecha pasada, actualizala antes de enviarlo. Los presupuestos sin fecha de validez nunca vencen.',
      },
      {
        q: '¿Qué pasa cuando el cliente pide un presupuesto actualizado?',
        a: 'Cuando el cliente toca "Solicitar presupuesto actualizado" en el enlace de un presupuesto vencido:\n• El Dueño y los Administradores reciben una notificación "Piden un presupuesto actualizado", con acceso directo a WhatsApp si el cliente tiene teléfono.\n• En el detalle del presupuesto aparece un aviso con la fecha del pedido.\n\nLa solicitud se registra una sola vez por presupuesto. Desde ahí podés reactivarlo o duplicarlo.',
      },
      {
        q: '¿Cómo reactivo o duplico un presupuesto?',
        a: 'Desde el detalle del presupuesto:\n\n• Reactivar (solo vencidos): elegís una nueva fecha de validez y vuelve a "Enviado" con el mismo número y el mismo enlace. El cliente puede aprobarlo o firmarlo de nuevo y el recordatorio de 48 hs vuelve a funcionar. Los precios no cambian.\n\n• Duplicar (cualquier presupuesto): crea un borrador nuevo con número nuevo, copiando cliente, ítems, IVA, descuento, notas e imágenes. No copia las cuotas ni las fechas de validez, entrega y pago. Es la opción para actualizar precios antes de enviarlo.',
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
    icon: CubeSvg,
    color: C.ok,
    bg: 'rgba(125,190,147,0.12)',
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
    icon: BanknotesSvg,
    color: C.ok,
    bg: 'rgba(125,190,147,0.12)',
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
        a: 'Son movimientos en estado "pendiente" (por ejemplo, una factura a cobrar o un pago a realizar). Se muestran separados de los movimientos confirmados y aparecen en los indicadores "A cobrar" y "A pagar" del resumen de Finanzas.\n\nCon las flechas del selector de mes podés avanzar a meses futuros para ver los pendientes de ese mes (por ejemplo, los cobros de membresías).',
      },
    ],
  },
  {
    id: 'membresias',
    label: 'Membresías',
    icon: CardSvg,
    color: C.ok,
    bg: 'rgba(125,190,147,0.12)',
    description: 'Cobros mensuales recurrentes a clientes, con recordatorio automático.',
    memberHidden: true,
    hiddenForMembers: true,
    items: [
      {
        q: '¿Qué es una membresía?',
        a: 'Es un cobro que se repite todos los meses a un mismo cliente: un abono, un plan de mantenimiento, una cuota mensual, etc.\n\nEn lugar de cargar el ingreso a mano cada mes, creás la membresía una sola vez y el sistema genera automáticamente los cobros pendientes en Finanzas.',
      },
      {
        q: '¿Cómo creo una membresía?',
        a: 'Ir a Membresías → "Nueva" y completar:\n• Cliente\n• Nombre (ej: "Plan mensual", "Mantenimiento web")\n• Monto mensual — en la moneda configurada para la empresa\n• Día de cobro — del 1 al 31\n• Fecha de inicio y, opcionalmente, fecha de fin\n• Cuenta donde se acredita el cobro\n• Categoría y notas (opcionales)\n\nNecesitás tener al menos una cuenta creada en Finanzas.',
      },
      {
        q: '¿Qué pasa cuando creo una membresía?',
        a: 'Se generan los cobros pendientes en Finanzas, uno por mes, hasta 12 meses adelante. A medida que pasa el tiempo el sistema extiende ese horizonte solo.\n\nLos cobros arrancan desde la fecha de inicio (o desde hoy si el inicio ya pasó): nunca se generan cobros hacia atrás.\n\nPodés verlos en Finanzas avanzando de mes con las flechas: aparecen en el indicador "A cobrar" y en la lista de movimientos pendientes.',
      },
      {
        q: '¿Qué pasa si el día de cobro no existe en un mes?',
        a: 'Si elegís un día que algunos meses no tienen (por ejemplo el 31, o el 29 en febrero), en esos meses el cobro vence el último día del mes.',
      },
      {
        q: '¿Cómo registro que el cliente pagó?',
        a: 'Igual que cualquier ingreso pendiente: en el resumen de Finanzas, en la lista de movimientos pendientes, usá el botón de confirmar del cobro.\n\nAl confirmarlo, el monto se suma al saldo de la cuenta con la fecha del día en que lo confirmás.',
      },
      {
        q: '¿Qué pasa si un cobro se atrasa?',
        a: 'Si la fecha de cobro pasa y el movimiento sigue pendiente:\n• En Finanzas aparece marcado como "Atrasado".\n• En Membresías se muestra el contador de cobros atrasados y el monto total adeudado.\n• El sistema envía automáticamente un email al cliente recordándole el pago. Se envía una sola vez por cobro, y solo si el cliente tiene email cargado.',
      },
      {
        q: '¿Cómo cambio el monto, pauso o cancelo una membresía?',
        a: 'Desde Membresías → "Editar". Podés cambiar el monto, el día de cobro, la cuenta, las fechas y el estado:\n• Activa: genera cobros normalmente.\n• Pausada: deja de generar cobros. Al reactivarla, vuelven a generarse desde ese día.\n• Cancelada: deja de generar cobros.\n\nAl guardar, todos los cobros pendientes desde hoy en adelante se actualizan con los datos nuevos. Los cobros ya atrasados y los ya confirmados no se modifican.',
      },
      {
        q: '¿Qué pasa si elimino una membresía?',
        a: 'Se borran todos sus cobros pendientes. Los cobros que ya fueron confirmados quedan registrados en Finanzas como ingresos normales.',
      },
      {
        q: '¿Puedo saltear un mes?',
        a: 'Por ahora no directamente: si borrás a mano un cobro pendiente de una membresía, el sistema lo vuelve a generar. Para no cobrar un período, pausá la membresía y reactivala después de la fecha de cobro de ese mes.',
      },
      {
        q: '¿Dónde veo las membresías de un cliente?',
        a: 'En la ficha del cliente (Clientes → el cliente) hay un panel "Membresías" con sus membresías, el día de cobro, el monto, el estado y los cobros atrasados.',
      },
      {
        q: '¿Quién puede ver las membresías?',
        a: 'Solo el Dueño y los Administradores. Los Miembros no ven el módulo ni el panel de membresías en la ficha del cliente.',
      },
    ],
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: ChartSvg,
    color: C.crema,
    bg: 'rgba(242,237,227,0.10)',
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
        a: 'Sí. El último día de cada mes a las 8 AM, el sistema genera automáticamente el informe mensual en PDF y lo envía por email al Dueño (owner) de cada organización.\n\nEl PDF incluye:\n• Resumen financiero del mes (ingresos, egresos, balance, categorías, evolución 6 meses)\n• Estado de presupuestos (totales, por estado, tasa de aprobación)\n• Situación de proyectos (distribución por estado)\n• Inventario y alertas de stock (sin stock, stock bajo)\n\nEl reporte llega como archivo adjunto al email del Dueño registrado en la cuenta.',
      },
    ],
  },
  {
    id: 'equipo',
    label: 'Equipo',
    icon: UserGroupSvg,
    color: C.warn,
    bg: 'rgba(226,182,99,0.12)',
    description: 'Gestión de miembros, invitaciones y permisos por rol.',
    items: [
      {
        q: '¿Cómo invito a alguien al equipo?',
        a: 'Ir a Equipo → "Invitar miembro". Ingresás el email y elegís el rol. La persona recibe un correo con un link para aceptar. El link expira en 7 días.',
      },
      {
        q: '¿Puedo cambiar el rol de un miembro?',
        a: 'Sí, los administradores y Dueños pueden cambiar el rol de cualquier miembro desde la pantalla de Equipo haciendo clic en el rol actual.',
      },
      {
        q: '¿Cómo elimino a un miembro?',
        a: 'Desde la pantalla de Equipo, usá el menú de acciones del miembro → "Eliminar". El miembro pierde acceso inmediatamente pero sus datos históricos (tareas, movimientos, etc.) se conservan.',
      },
      {
        q: '¿Qué puede hacer un Miembro vs un Administrador vs un Dueño?',
        a: 'Miembro: Dashboard limitado, Clientes, Proyectos (ver y cambiar estado), Tareas, Stock.\n\nAdministrador: todo lo anterior + Presupuestos, Finanzas, Membresías, Reportes, Equipo.\n\nDueño: todo lo anterior + Configuración de la empresa (único rol con acceso).',
      },
    ],
  },
  {
    id: 'organizacion',
    label: 'Organización y Perfil',
    icon: UserCircleSvg,
    color: C.piedra,
    bg: C.s2,
    description: 'Configuración de la empresa y datos personales.',
    memberHidden: true,
    items: [
      {
        q: '¿Qué configuro en Organización?',
        a: 'Nombre de la empresa, logo, moneda predeterminada, datos de contacto y la cuenta financiera predeterminada para movimientos automáticos de presupuestos aprobados.\n\nEsta sección es exclusiva del Dueño (owner). Los administradores no tienen acceso.',
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

function AccordionItem({ q, a, isLast }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderBottom: isLast ? 'none' : `1px solid ${C.linea}` }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
        <span style={{ fontSize: 13, fontWeight: 500, color: open ? C.crema : C.arena, lineHeight: 1.4 }}>{q}</span>
        {open
          ? <ChevronUpSvg style={{ width: 15, height: 15, color: C.piedra, flexShrink: 0 }} />
          : <ChevronDownSvg style={{ width: 15, height: 15, color: C.piedra, flexShrink: 0 }} />}
      </button>
      {open && (
        <div style={{ padding: '0 18px 16px' }}>
          <p style={{ fontSize: 13, color: C.piedra, lineHeight: 1.7, whiteSpace: 'pre-line', overflowWrap: 'anywhere', margin: 0 }}>{a}</p>
        </div>
      )}
    </div>
  )
}

function Section({ section, innerRef }) {
  const Icon = section.icon
  return (
    <div ref={innerRef} id={section.id} style={{ scrollMarginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header de sección */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '0 12px 12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: section.bg }}>
          <Icon style={{ width: 18, height: 18, color: section.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.crema, margin: 0 }}>{section.label}</p>
          <p style={{ fontSize: 11, color: C.piedra, margin: 0, marginTop: 2 }}>{section.description}</p>
        </div>
        {section.memberHidden && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: '0 6px 6px 0', background: C.s2, border: `1px solid ${C.linea}` }}>
            <ShieldSvg style={{ width: 11, height: 11, color: C.piedra }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: C.piedra }}>Admin</span>
          </div>
        )}
      </div>

      {/* Acordeón */}
      <div style={{ background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0', overflow: 'hidden' }}>
        {section.items.map((item, i) => (
          <AccordionItem key={i} q={item.q} a={item.a} isLast={i === section.items.length - 1} />
        ))}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function HelpPage() {
  const { user } = useAuth()
  const isMember = user?.role === 'member'
  // hiddenForMembers: la sección no se muestra a Miembros (memberHidden solo agrega la etiqueta "Admin")
  const sections = SECTIONS.filter(s => !(isMember && s.hiddenForMembers))
  const totalQuestions = sections.reduce((a, s) => a + s.items.length, 0)

  const [activeId, setActiveId] = useState('inicio')
  const sectionRefs = useRef({})
  const mainRef     = useRef(null)

  function scrollTo(id) {
    setActiveId(id)
    const el        = sectionRefs.current[id]
    const container = mainRef.current
    if (!el || !container) return
    const containerTop = container.getBoundingClientRect().top
    const elTop        = el.getBoundingClientRect().top
    const offset       = elTop - containerTop + container.scrollTop - 24
    container.scrollTo({ top: offset, behavior: 'smooth' })
  }

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0, fontFamily: 'Geist, system-ui, sans-serif' }}>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex" style={{ flexDirection: 'column', width: 200, flexShrink: 0, borderRight: `1px solid ${C.linea}`, overflowY: 'auto' }}>
        {/* Sidebar header */}
        <div style={{ padding: '20px 16px 12px', borderBottom: `1px solid ${C.linea}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <QuestionSvg style={{ width: 16, height: 16, color: C.crema }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: C.crema, margin: 0 }}>Manual de uso</p>
          </div>
          <p style={{ fontSize: 11, color: C.piedra, margin: 0, marginTop: 3 }}>{sections.length} secciones · {totalQuestions} preguntas</p>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '8px 8px 24px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sections.map(s => {
            const Icon     = s.icon
            const isActive = activeId === s.id
            return (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: '0 8px 8px 0', border: 'none', cursor: 'pointer', textAlign: 'left', background: isActive ? 'rgba(242,237,227,0.07)' : 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none' }}>
                <Icon style={{ width: 14, height: 14, flexShrink: 0, color: isActive ? C.crema : C.piedra }} />
                <span style={{ fontSize: 12, fontWeight: isActive ? 500 : 400, color: isActive ? C.crema : C.piedra, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s.label}</span>
                {s.memberHidden && (
                  <ShieldSvg style={{ width: 11, height: 11, flexShrink: 0, color: C.piedra, opacity: 0.5 }} />
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Contenido principal */}
      <main ref={mainRef} style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>

        {/* Header */}
        <div className="px-4 pt-5 pb-4 md:px-6 md:pt-7" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: `1px solid ${C.linea}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <QuestionSvg style={{ width: 18, height: 18, color: C.arena, flexShrink: 0 }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: C.crema, margin: 0, whiteSpace: 'nowrap' }}>Manual de uso</h2>
            <span className="hidden sm:inline" style={{ fontSize: 12, color: C.piedra, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{totalQuestions} preguntas frecuentes</span>
          </div>
        </div>

        <div className="px-4 pt-6 pb-12 md:px-6" style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Chips mobile */}
          <div className="flex flex-wrap lg:hidden" style={{ gap: 6 }}>
            {sections.map(s => {
              const isActive = activeId === s.id
              return (
                <button key={s.id} onClick={() => scrollTo(s.id)}
                  style={{ padding: '5px 12px', borderRadius: '0 8px 8px 0', border: `1px solid ${isActive ? C.crema : C.linea}`, background: isActive ? C.crema : 'none', color: isActive ? C.bg : C.piedra, fontSize: 12, fontWeight: isActive ? 600 : 400, cursor: 'pointer' }}>
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* Secciones */}
          {sections.map(s => (
            <Section key={s.id} section={s} innerRef={el => { sectionRefs.current[s.id] = el }} />
          ))}

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${C.linea}`, paddingTop: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: C.piedra }}>¿Necesitás ayuda adicional? Contactá al administrador de tu organización.</p>
          </div>

        </div>
      </main>
    </div>
  )
}
