# CHANGELOG — crm-frontend

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
