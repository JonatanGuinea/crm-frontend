# CHANGELOG — crm-frontend

## 2026-11-17 — Consola de super administración (panel Sistema)

**Cambio:** `/admin` pasa a ser una consola con layout propio (`AdminLayout`) y navegación por categorías: columna lateral en desktop y pestañas con scroll en mobile.

- **Dashboard:** KPIs reales y alertas accionables. Gráficos de crecimiento, actividad, presupuestos y caja por moneda, proyectos por estado y empresas por plan. Últimas empresas, usuarios y actividades, y estado de la plataforma. Filtro de período.
- **Empresas:** búsqueda, filtros por estado, plan y fechas, orden por columnas y paginación en el servidor. El detalle muestra datos, volumen, usuarios, registros recientes, actividad e historial administrativo. Desde ahí se suspende o reactiva con motivo y se cambia el plan.
- **Usuarios:** filtros por empresa, tipo, estado y verificación. El detalle muestra perfil, membresías, conteos, historial de accesos y actividad. Desde ahí se deshabilita o habilita con motivo.
- **Explorador:** todas las entidades del schema con su conteo. Registros con búsqueda, filtro por campo, empresa y fechas, orden y paginación en el servidor. Pestaña de estructura, panel de detalle con relaciones navegables y vista de integridad (huérfanos y cruces entre empresas).
- **Finanzas:** KPIs por moneda (presupuestado, aprobados, pendientes, facturado, cobrado, pendiente de cobro, deuda vencida, egresos), evolución mensual, presupuestos por estado, distribución por empresa y acceso a los registros. Los ingresos de la plataforma figuran como no disponibles.
- **Auditoría:** tabla con filtros (acción, entidad, empresa, resultado, fechas, usuario). El detalle muestra IP, user-agent y la tabla de valores antes y después.
- **Base de datos:** servicios, Postgres, Prisma, consultas lentas, tablas e índices.
- **Capacidad total:** barra de ocupación del disco o de la cuota, con marcas en 80 % y 90 %. Aparece en Base de datos y en el estado de la plataforma del dashboard.
- **Backups:** estado, archivos, historial, backup manual con confirmación y procedimiento de restauración documentado.
- **Exportación** CSV y Excel en Empresas, Usuarios, Explorador, Finanzas y Auditoría, con los filtros aplicados.
- Si la cuenta se deshabilita con la sesión abierta, se cierra la sesión y el login muestra el aviso. El logout se registra en la auditoría.

**Archivos:**
- `layouts/AdminLayout.jsx` y `pages/admin/*`: `ui.jsx`, `plan.jsx` y las 10 páginas.
- `api/admin.js`, `App.jsx`, `api/client.js`, `context/AuthContext.jsx` y `pages/auth/LoginPage.jsx`.
- Se elimina `SystemAdminPage.jsx`: sus funciones (resumen, empresas con cambio de plan, usuarios por tipo) quedaron dentro de las secciones nuevas.

**Validación:** `eslint` sin errores en los archivos tocados. `vite build` OK.

## 2026-11-17 — Panel de sistema: acceso desde el dropdown de perfil

**Cambio:** "Sistema" pasa del menú lateral y del "Más" de mobile al dropdown de perfil. Se muestra debajo de Ayuda, solo con `isSystemAdmin`, y tiene su propio ícono de base de datos. La navegación vuelve a como estaba antes del panel.

**Motivo:** es una herramienta de administración, no un módulo de trabajo diario.

**Archivos:** `src/layouts/AppLayout.jsx`

**Validación:** `vite build` OK. `eslint` sin errores nuevos (quedan los 3 que ya tenía el archivo).

## 2026-11-17 — Panel de sistema: tipo de usuario

**Cambio:** en Usuarios, cada usuario lleva una etiqueta según sus membresías activas:
- **Dueño:** es dueño de al menos una empresa.
- **Solo equipo:** no tiene empresa propia, pero es miembro o admin de empresas de otros.
- **Sin empresa:** no pertenece activamente a ninguna empresa.

El filtro "Con/Sin empresa" pasa a filtrar por tipo, y el KPI Usuarios del Resumen muestra el desglose.

**Motivo:** antes, quien era miembro o admin de una empresa ajena figuraba como "con empresa", igual que un dueño.

**Archivos:** `src/pages/admin/SystemAdminPage.jsx`

**Validación:** `eslint` y `vite build` OK.

## 2026-11-16 — Panel de sistema (`/admin`)

**Cambio:** página nueva "Sistema", visible solo para administradores del sistema (`isSystemAdmin` en el JWT). Tiene tres pestañas:

- **Resumen:** KPIs (estado de la DB, usuarios, empresas, altas), filas por tabla, datos del servidor (latencia, tamaño, conexiones, motor) y backups. Si el último backup tiene más de 30 h, se marca en amarillo.
- **Empresas:** búsqueda por empresa o dueño, filtro por plan y orden (recientes, nombre, equipo, clientes, presupuestos). En la tabla se cambia el plan con un selector y una confirmación. En mobile se muestran tarjetas.
- **Usuarios:** búsqueda por nombre, email o empresa, y filtros por email verificado y por tener empresa. Se muestran las empresas con rol y estado de cada usuario, y las marcas "Sistema" y "Sin verificar".

**Motivo:** que los systemadmins vean el estado de la base, los usuarios y las empresas, y puedan cambiar el plan de una empresa.

**Archivos:**
- `src/pages/admin/SystemAdminPage.jsx` (nuevo)
- `src/api/admin.js` (nuevo)
- `src/App.jsx`: ruta `/admin` con `SystemAdminRoute`. Si el usuario no es systemadmin, vuelve al inicio.
- `src/layouts/AppLayout.jsx`: ítem "Sistema" en el sidebar y en "Más" de mobile (`sysAdminOnly`), con el helper `isNavVisible`.

**Impacto:** los usuarios comunes no ven el ítem ni pueden entrar a la ruta. El backend valida el permiso de todos modos.

**Validación:**
- `eslint` sin errores en los archivos nuevos. `AppLayout.jsx` mantiene los 3 errores que ya tenía.
- `vite build` OK.
