# Matriz de Pruebas por Roles (RBAC)
**Sistema de Gestión de Disponibilidad de Instructores**

Este documento define el alcance, las restricciones y los escenarios críticos de prueba segmentados por el perfil del usuario.

---

## 1. Rol: INSTRUCTOR

**Objetivo:** Validar que el usuario pueda registrar su disponibilidad cumpliendo las reglas de negocio, pero sin capacidad de alterar el sistema o ver datos ajenos.

### A. Pruebas Funcionales Obligatorias
*   **Login & Perfil:** Iniciar sesión y cambiar contraseña exitosamente.
*   **Interacción Calendario:** Selección y deselección de bloques en la grilla.
*   **Guardado:** Guardar una disponibilidad válida (>= 2 horas consecutivas).
*   **Versionado:**
    *   Generar al menos 3 versiones diferentes.
    *   Marcar una versión antigua como "Final".
    *   Restaurar una versión antigua al editor.
*   **Observaciones:** Guardar texto en el campo de observaciones.

### B. Pruebas de Validaciones de Negocio (Críticas)
*   **Regla de 2 Horas:** Intentar guardar bloques aislados de 30, 60 o 90 minutos. **Debe fallar.**
*   **Discontinuidad entre Días:** Seleccionar el último bloque del Lunes y el primero del Martes. **Debe fallar** (no son consecutivos).
*   **Ventana Cerrada:** Intentar guardar o modificar cuando el administrador ha cerrado la ventana de carga.

### C. Pruebas de Permisos (RBAC) & Restricciones
*   **Acceso a Admin:** Intentar acceder manualmente a `/admin/dashboard` o `/admin/instructors`. **Debe redirigir a `/availability`**.
*   **Visibilidad:** Verificar que en el historial solo ve sus propias versiones.

### D. Pruebas de Reportes
*   **Reporte Individual:** Descargar el CSV y verificar que:
    *   Coincide con la versión marcada como Final.
    *   Si no hay Final, coincide con la mostrada en pantalla.
    *   El formato de horas es correcto (ej. 07:30 - 09:30).

### E. Escenarios Negativos
*   Intentar guardar sin seleccionar ningún bloque (Debe permitirlo o advertir, según regla definida como "Sin disponibilidad").
*   Intentar modificar una versión histórica en "Modo Lectura" (Clicks no deben funcionar).

---

## 2. Rol: ADMINISTRADOR

**Objetivo:** Validar la gestión de instructores, la supervisión del periodo y la generación de reportes consolidados. Validar permisos granulares.

### A. Pruebas Funcionales Obligatorias
*   **Dashboard:** Verificar que los contadores (Total, Pendientes, Finalizados) coinciden con la realidad de la base de datos.
*   **Búsqueda:** Encontrar un instructor por ID, Nombre y Email.
*   **Vista de Detalle:** Abrir el calendario de un instructor y verificar que se ve la información correcta en modo **Solo Lectura**.
*   **CRUD Instructor:** Crear, Editar y Eliminar (Soft Delete) un instructor.

### B. Pruebas de Permisos (RBAC Granular)
Se deben ejecutar dos sets de pruebas:
1.  **Admin con Permisos Totales:**
    *   Debe poder ver y editar Configuración (`/admin/config`).
    *   Debe poder cambiar la Ventana de Carga.
2.  **Admin Restringido (Sin `canManageConfig`):**
    *   No debe ver el menú "Configuración".
    *   Intentar acceder a `/admin/config`. **Debe ser denegado.**

### C. Pruebas de Validaciones de Negocio
*   **Carga Masiva:** Subir un archivo con IDs o Emails duplicados. El sistema debe reportar los errores y no duplicar registros.
*   **Toggle Ventana:** Cerrar la ventana y verificar inmediatamente (con un usuario Instructor en otra pestaña/navegador) que el bloqueo es efectivo.
*   **Cambio de Periodo:** Modificar fechas del periodo y verificar que se reflejan en el dashboard.

### D. Pruebas de Reportes
*   **Consolidado:** Descargar reporte global.
    *   **Validación Clave:** Verificar la lógica de "Fallback".
        *   Instructor A (Tiene Final): Muestra versión final.
        *   Instructor B (No tiene Final, tiene Borrador): Muestra última versión.
        *   Instructor C (Nada): Muestra "Sin Datos/Pendiente".

### E. Escenarios Negativos
*   Intentar crear un instructor con un ID que ya existe.
*   Intentar modificar la disponibilidad de un instructor desde la vista de detalle (no debe permitir clicks).
*   Intentar acceder a `/super/admins`. **Debe ser denegado.**

---

## 3. Rol: SUPER ADMINISTRADOR

**Objetivo:** Validar el control total del sistema y la gestión de la propia capa administrativa.

### A. Pruebas Funcionales Obligatorias
*   **Gestión de Admins:** Crear un nuevo Administrador.
*   **Asignación de Permisos:**
    *   Crear un Admin "Solo Lectura" (Solo `canViewDashboard`).
    *   Crear un Admin "Gestor" (Solo `canManageInstructors`).
*   **Edición de Admins:** Modificar los permisos de un Admin existente y verificar el impacto.
*   **Eliminación:** Revocar acceso a un Admin.

### B. Pruebas de Permisos (Supremacía)
*   **Acceso Total:** Verificar que el Super Admin puede entrar a `/admin/config` incluso si teóricamente no tuviera el flag explícito (el rol SUPER_ADMIN hace bypass).
*   **Protección:** Verificar si el sistema permite que el Super Admin se elimine a sí mismo (Debe estar bloqueado o pedir doble confirmación crítica).

### C. Pruebas de Flujo Extremo a Extremo (E2E)
1.  **Ciclo de Vida del Admin:**
    *   Super Admin crea Admin "X".
    *   Admin "X" se loguea.
    *   Admin "X" crea Instructor "Y".
    *   Super Admin edita permisos de Admin "X" (le quita `canManageInstructors`).
    *   Admin "X" intenta crear otro instructor -> **Falla/Oculto**.

### D. Escenarios Negativos
*   Intentar quitar todos los permisos a un Admin y verificar si puede hacer login (debería entrar pero ver todo vacío o denegado).

---

## Resumen de Matriz de Acceso a Recursos

| Recurso / Acción | Instructor | Admin (Básico) | Admin (Config) | Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Login** | ✅ | ✅ | ✅ | ✅ |
| **Mi Disponibilidad** | ✅ | ⛔ | ⛔ | ⛔ |
| **Dashboard KPIs** | ⛔ | ✅ | ✅ | ✅ |
| **Ver Instructores** | ⛔ | ✅ | ✅ | ✅ |
| **Editar Instructores** | ⛔ | ✅ | ✅ | ✅ |
| **Configurar Periodo** | ⛔ | ⛔ | ✅ | ✅ |
| **Toggle Ventana** | ⛔ | ⛔ | ✅ | ✅ |
| **Gestionar Admins** | ⛔ | ⛔ | ⛔ | ✅ |
| **Reporte Consolidado**| ⛔ | ✅ | ✅ | ✅ |
