# Especificación de Comportamiento de Interfaz por Roles (RBAC)

Este documento define cómo se comporta la interfaz de usuario (UI) para cada uno de los roles del sistema: **Instructor**, **Administrador** y **Super Administrador**.

## 1. Elementos Contextuales Comunes
Independientemente del rol, la interfaz siempre muestra la siguiente información de contexto para mantener al usuario orientado:

1.  **Barra Lateral (Sidebar):**
    *   **Identidad:** Avatar con iniciales, Nombre completo y Rol actual visible en la parte inferior.
    *   **Navegación:** Enlaces filtrados dinámicamente según permisos.
2.  **Contexto del Periodo:**
    *   En los Dashboards y Calendarios, se muestra siempre un bloque informativo indicando el **Periodo Académico Activo** (ej. "Ciclo 2024-1").
3.  **Estado de la Ventana de Carga:**
    *   Indicador visual (Icono de Candado o Check) que informa si el sistema acepta cambios o está en modo "Solo Lectura".

---

## 2. Experiencia del Usuario: INSTRUCTOR

El flujo del instructor está optimizado para la **ejecución rápida** de la carga de disponibilidad.

### Elementos Visibles
*   **Menú:** Acceso exclusivo a "Mi Disponibilidad" y "Mi Perfil".
*   **Calendario Interactivo:** Grilla de 7 días x 30 bloques de tiempo.
*   **Historial de Versiones:** Lista lateral derecha con sus envíos previos.
*   **Controles de Acción:** Botones "Guardar", "Observaciones" y "Reporte".

### Comportamiento de la Interfaz
1.  **Ingreso:**
    *   Es redirigido automáticamente a `/availability` tras el login.
2.  **Interacción con el Calendario:**
    *   **Ventana Abierta:** Clic en casillas cambia color (Blanco <-> Azul). Puede editar observaciones.
    *   **Ventana Cerrada:** Las casillas se ven con opacidad reducida. Al intentar hacer clic, no ocurre nada visualmente (o aparece un cursor de "prohibido"). Los botones de "Guardar" desaparecen o se deshabilitan.
3.  **Gestión de Versiones:**
    *   Puede ver un botón "Hacer Final" en sus versiones históricas.
    *   Al marcar una versión como final, aparece inmediatamente una etiqueta verde "FINAL" en ese ítem.
4.  **Restricciones:**
    *   Si intenta navegar manualmente a `/admin/*`, el sistema lo expulsa y lo redirige a su home (`/availability`).

---

## 3. Experiencia del Usuario: ADMINISTRADOR

El flujo administrativo se enfoca en el **monitoreo, gestión y exportación** de datos.

### Elementos Visibles
*   **Menú:** "Dashboard", "Instructores", "Configuración" (si tiene permiso).
*   **Dashboard:** Gráficos de barras y tarjetas de KPI (Total Instructores, Pendientes, Enviados).
*   **Lista de Instructores:** Tabla con buscador, filtros y acciones.

### Comportamiento de la Interfaz
1.  **Dashboard:**
    *   Vista de alto nivel. No interactiva, solo informativa.
2.  **Gestión de Instructores:**
    *   **Buscador:** Filtra la tabla en tiempo real al escribir.
    *   **Acción "Ver" (Ojo):** Abre un **Modal Grande**.
        *   Este modal contiene el componente `AvailabilityScheduler` reutilizado.
        *   **Diferencia Clave:** Se fuerza el modo `readOnly`. El administrador ve exactamente lo que el instructor cargó, pero no puede hacer clic en las casillas ni modificar la versión. Aparece un banner púrpura "Vista de Administrador (Solo Lectura)".
    *   **Carga Masiva:** Abre un modal con pasos claros (1. Selección -> 2. Validación -> 3. Confirmación).
3.  **Configuración (Si tiene permiso):**
    *   Puede cambiar fechas del periodo.
    *   **Switch de Ventana de Carga:** Al alternar el interruptor, el cambio es inmediato para todos los usuarios. Visualmente cambia de Verde (Abierto) a Gris/Rojo (Cerrado).

### Restricciones
*   No ve la opción "Administradores" en el menú.
*   Si intenta acceder a rutas de Super Admin, es redirigido.
*   Si no tiene el permiso `canManageConfig`, el enlace "Configuración" desaparece de su menú.

---

## 4. Experiencia del Usuario: SUPER ADMINISTRADOR

El Super Administrador tiene **control total** y gestión de la propia estructura de administración.

### Elementos Visibles
*   **Todo lo del Administrador** (Dashboard, Instructores, Configuración).
*   **Menú Exclusivo:** Sección "SISTEMA" con enlace a "Administradores".

### Comportamiento de la Interfaz
1.  **Gestión de Administradores:**
    *   Accede a una tabla exclusiva de usuarios con rol `ADMIN` o `SUPER_ADMIN`.
    *   **Creación de Admins:** Abre un modal donde puede asignar permisos granulares mediante Checkboxes:
        *   [ ] Ver Dashboard
        *   [ ] Gestionar Instructores
        *   [ ] Configuración del Periodo
    *   **Supremacía:** El Super Admin puede editar o eliminar a otros administradores, pero el sistema (idealmente) debería impedir que se elimine a sí mismo.
2.  **Bypass de Permisos:**
    *   En las rutas protegidas (`ProtectedRoute`), el Super Admin siempre pasa las validaciones, ignorando los flags específicos de permisos. Siempre tiene acceso a todo.

---

## 5. Matriz de Comportamiento ante Acciones No Permitidas

| Acción Intentada | Rol / Estado | Comportamiento UI |
| :--- | :--- | :--- |
| **Editar Calendario** | Ventana Cerrada | Grilla bloqueada, opacidad baja, mensaje de bloqueo visible. |
| **Editar Calendario** | Admin (Viendo Instructor) | Grilla bloqueada, banner "Modo Lectura Administrador". |
| **Acceder URL Admin** | Instructor | Redirección inmediata a `/availability`. |
| **Acceder URL Super Admin** | Admin Normal | Redirección inmediata a `/admin/dashboard`. |
| **Guardar Disponibilidad** | Regla < 2 horas | Alerta roja flotante, bloqueo de envío. |
| **Guardar Vacío** | Cualquier Rol | Permitido (se considera "No Disponible"), pero pide confirmación o es válido. |

## 6. Buenas Prácticas de Claridad Funcional Implementadas

1.  **Feedback de Color:**
    *   **Azul:** Acción principal / Selección.
    *   **Verde:** Éxito / Ventana Abierta / Versión Final.
    *   **Rojo/Naranja:** Error / Ventana Cerrada / Pendiente.
    *   **Gris:** Deshabilitado / Histórico.
2.  **Modales vs. Navegación:**
    *   Las ediciones rápidas (Datos personales, Observaciones) usan **Modales** para no perder el contexto de la página.
    *   Los cambios de módulo usan **Navegación completa**.
3.  **Prevención de Errores:**
    *   Los botones destructivos (Eliminar, Iniciar Nuevo Periodo) siempre lanzan un `window.confirm` o modal de confirmación antes de ejecutar la lógica.
