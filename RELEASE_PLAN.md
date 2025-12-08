# Plan de Iteraciones Funcionales (Release Plan)
**Sistema de Gestión de Disponibilidad de Instructores con RBAC**

Este documento detalla la estrategia de construcción evolutiva del sistema, dividida en 8 iteraciones lógicas para asegurar entregas de valor continuo y reducción de riesgos.

---

## Iteración 1: Fundamentos del Sistema
**Objetivo:** Establecer la base de seguridad, identidad y contexto temporal del sistema.

*   **Objetivos Funcionales:**
    *   Que el sistema reconozca quién entra (Identidad).
    *   Que el sistema sepa "en qué momento estamos" (Periodo Académico).
    *   Diferenciar visualmente entre Instructor y Administrador.
*   **Entregables:**
    *   Pantalla de Login funcional (con validación de usuarios inactivos).
    *   Configuración básica del Periodo Académico (Nombre, Fechas, ID).
    *   Estructura de Layout con Sidebar dinámico según rol básico (Instructor vs Admin).
*   **Criterios de Aceptación:**
    *   Un usuario `INSTRUCTOR` al loguearse es redirigido a `/availability` (aunque esté vacío).
    *   Un usuario `ADMIN` al loguearse es redirigido a `/admin/dashboard`.
    *   Si no existe un periodo en BD, el Admin ve una pantalla para crearlo.

---

## Iteración 2: Módulo Instructor (Core UI)
**Objetivo:** Permitir la interacción principal de ingreso de datos, priorizando la usabilidad del calendario.

*   **Objetivos Funcionales:**
    *   Permitir al instructor interactuar con la grilla de tiempo.
    *   Capturar la intención de disponibilidad (Guardar datos crudos).
*   **Entregables:**
    *   Componente `AvailabilityScheduler` interactivo (Grilla 7 días x 30 bloques).
    *   Estado visual de selección (Celdas azules/blancas).
    *   Botón "Guardar" básico (Persistencia de la selección actual).
*   **Criterios de Aceptación:**
    *   El usuario puede hacer clic en múltiples celdas y estas cambian de estado.
    *   Al recargar la página, los datos guardados persisten (recuperación de estado).
    *   El calendario respeta el rango de 07:30 a 22:30.

---

## Iteración 3: Validaciones de Negocio
**Objetivo:** Asegurar la calidad académica de los datos ingresados, impidiendo horarios fragmentados.

*   **Objetivos Funcionales:**
    *   Implementar la regla de "No bloques huérfanos".
    *   Implementar el control de la Ventana de Carga (Open/Close).
*   **Entregables:**
    *   Algoritmo de validación de continuidad (mínimo 2 horas / 4 bloques).
    *   Alertas de error visuales (Toast/Banners) bloqueantes.
    *   Switch de "Ventana Abierta/Cerrada" en panel Admin.
*   **Criterios de Aceptación:**
    *   Intentar guardar 1 hora aislada (2 bloques) arroja error y NO guarda.
    *   Intentar guardar bloques continuos pero separados por cambio de día (Lun 22:30 + Mar 07:30) arroja error.
    *   Si el Admin cierra la ventana, la grilla del instructor se bloquea (Solo lectura).

---

## Iteración 4: Versionado Avanzado
**Objetivo:** Gestionar el ciclo de vida de la información (Borradores vs Versiones Finales).

*   **Objetivos Funcionales:**
    *   Permitir múltiples intentos de carga sin perder historia.
    *   Definir explícitamente qué versión es la válida para la institución.
    *   Añadir contexto cualitativo (Observaciones).
*   **Entregables:**
    *   Lista lateral de "Historial de Versiones".
    *   Funcionalidad "Marcar como Final".
    *   Modo "Solo Lectura" para ver versiones antiguas.
    *   Modal de Observaciones de texto.
*   **Criterios de Aceptación:**
    *   Solo una versión puede tener el flag `isFinal` a la vez.
    *   El instructor puede navegar entre versiones antiguas sin modificarlas accidentalmente.
    *   Las observaciones se guardan junto con los bloques de tiempo.

---

## Iteración 5: Administración de Instructores
**Objetivo:** Dotar al administrador de herramientas para gestionar la fuerza docente.

*   **Objetivos Funcionales:**
    *   Gestionar el padrón de usuarios (Altas, Bajas, Modificaciones).
    *   Facilitar la carga inicial de datos.
*   **Entregables:**
    *   CRUD completo de Instructores (Tabla, Modal de Creación/Edición).
    *   Buscador en tiempo real y filtros de estado (Pendiente/Final).
    *   Prototipo de Carga Masiva (Validación de CSV).
*   **Criterios de Aceptación:**
    *   El Admin puede crear un instructor y este puede loguearse inmediatamente.
    *   El Admin puede buscar a "Juan" y ver si ya envió su disponibilidad final.
    *   No se pueden crear usuarios con IDs duplicados.

---

## Iteración 6: Reportería y Salida de Datos
**Objetivo:** Transformar los datos del sistema en información útil para la programación académica.

*   **Objetivos Funcionales:**
    *   Extraer la información en formatos portables (Excel/CSV).
    *   Visualizar el estado general del proceso.
*   **Entregables:**
    *   Generador de CSV Individual (Para el Instructor).
    *   Generador de CSV Consolidado (Sábana de datos para Admin).
    *   Dashboard con gráficas básicas (Barras: Total vs Enviados).
*   **Criterios de Aceptación:**
    *   El reporte consolidado incluye SOLAMENTE la versión final de cada instructor (o la última si no hay final).
    *   El formato del CSV es legible y contiene columnas separadas para Día, Hora Inicio, Hora Fin.

---

## Iteración 7: Gestión de Super Administrador (RBAC Completo)
**Objetivo:** Establecer la gobernanza y seguridad jerárquica del sistema.

*   **Objetivos Funcionales:**
    *   Delegar funciones administrativas sin entregar control total.
    *   Proteger la configuración crítica.
*   **Entregables:**
    *   CRUD de Administradores (Solo visible para Super Admin).
    *   Matriz de Permisos (Checkboxes: Ver Dash, Gestionar Inst, Config).
    *   Middleware de protección de rutas (Granular).
*   **Criterios de Aceptación:**
    *   Un Admin creado SIN permiso de "Configuración" no ve el menú de Configuración.
    *   El Super Admin tiene acceso irrestricto a todo.
    *   Un Admin no puede eliminar a un Super Admin.

---

## Iteración 8: Mejoras y Optimización
**Objetivo:** Pulir la experiencia de usuario y cubrir casos borde.

*   **Objetivos Funcionales:**
    *   Mejorar la resiliencia ante errores.
    *   Asegurar flujos de recuperación.
*   **Entregables:**
    *   Recuperación de contraseña (Flujo ID + DNI).
    *   Modales de confirmación para acciones destructivas (Borrar usuario, Nuevo Periodo).
    *   Feedback visual mejorado (Spinners de carga, transiciones).
*   **Criterios de Aceptación:**
    *   El sistema no se rompe si falla la red (Manejo de errores gracefully).
    *   El usuario recibe feedback claro ("Guardando...", "Éxito") en cada acción.
