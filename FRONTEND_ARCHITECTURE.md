# Especificación Funcional del Frontend - Sistema de Gestión de Disponibilidad RBAC

Este documento describe la arquitectura, comportamiento y reglas de negocio implementadas en la capa de presentación (Frontend) del sistema.

## 1. Estructura General del Frontend

El sistema está construido como una **Single Page Application (SPA)** utilizando React y React Router (HashRouter).

### Organización de Pantallas
La aplicación se divide en dos contextos principales:
1.  **Contexto Público:**
    *   `Login`: Pantalla única que maneja autenticación y flujo de recuperación de contraseña.
2.  **Contexto Privado (Layout Principal):**
    *   Utiliza un esquema de `Sidebar` (Menú lateral) + `Header` (Móvil) + `Main Content`.
    *   El menú lateral se adapta dinámicamente según el Rol del usuario.

### Jerarquía de Navegación

*   **/** (Ruta Raíz): Redirecciona automáticamente según el rol (`/availability` para Instructores, `/admin/dashboard` para Admins).
*   **Instructor:**
    *   `/availability`: Editor de calendario y gestión de versiones.
    *   `/profile`: Datos personales y cambio de contraseña.
*   **Administrador:**
    *   `/admin/dashboard`: KPIs y estado del periodo.
    *   `/admin/instructors`: CRUD y monitoreo de instructores.
    *   `/admin/config`: Gestión de periodo académico y ventana de carga.
*   **Super Administrador:**
    *   Acceso a todas las rutas de Admin.
    *   `/super/admins`: Gestión de usuarios administrativos y permisos.

---

## 2. Comportamiento de la Interfaz

### Reactividad y Feedback
*   **Interacciones:** El sistema utiliza estados locales (`useState`) para reflejar cambios inmediatos (ej. seleccionar una celda en el calendario cambia a azul instantáneamente).
*   **Alertas:**
    *   **Errores (Rojo):** Se muestran en contenedores con fondo rojo claro e iconos de alerta (ej. fallo de validación, credenciales incorrectas).
    *   **Éxito (Verde):** Mensajes temporales (3 segundos) confirmando acciones (ej. "Guardado correctamente").
    *   **Informativos (Azul/Naranja):** Indican estados de solo lectura o instrucciones (ej. "Modo Lectura: Histórico").

### Estados de Carga y Bloqueo
*   Los botones de acción crítica (Guardar, Validar) se deshabilitan si el formulario es inválido.
*   Si la **Ventana de Carga** está cerrada:
    *   El calendario entra en modo visual (opacidad reducida).
    *   Se ocultan botones de "Guardar" y "Marcar Final".
    *   Se muestra un badge indicando el estado de bloqueo.

---

## 3. Manejo Funcional de Sesión

*   **Autenticación:**
    *   Se mantiene el estado del usuario en una variable global `currentUser` en el componente raíz `App`.
    *   Al iniciar sesión, se valida `active: true`. Si el usuario está inactivo, se deniega el acceso.
*   **Expiración/Logout:**
    *   Al cerrar sesión, se limpia el estado `currentUser` y se fuerza una redirección a `/login`.
*   **Identidad Visual:**
    *   El Sidebar muestra siempre el Avatar (iniciales), Nombre Completo, Email y Rol del usuario autenticado en la parte inferior.

---

## 4. Validaciones del Lado del Usuario

### Formularios
*   **Campos Requeridos:** Inputs marcan visualmente si están vacíos.
*   **Contraseñas:**
    *   Se valida longitud mínima (8 caracteres).
    *   Se requiere al menos una letra y un número.
    *   Validación de coincidencia entre "Nueva Contraseña" y "Confirmación".

### Calendario (Reglas de Negocio Visuales)
*   **Regla de Bloques Consecutivos:**
    *   El sistema valida que no existan bloques aislados de tiempo.
    *   **Mínimo:** 2 horas consecutivas (4 bloques de 30 min).
    *   **Feedback:** Si la regla no se cumple, se muestra un error específico indicando el día y hora del bloque inválido y se impide el guardado.

### Ventana de Carga
*   Antes de cualquier operación de escritura (Guardar/Modificar), el frontend verifica `period.isOpenForSubmission`.
*   Si es `false`, la operación se bloquea incluso si el usuario intenta forzarla.

---

## 5. Comportamiento de Tablas y Listas (Módulo Instructores)

*   **Filtrado en Tiempo Real:**
    *   Búsqueda por texto: Busca coincidencias en ID, Nombre o Email.
    *   Filtro por Estado: Permite ver solo "Pendientes", "Borradores" o "Finalizados".
*   **Ordenamiento:**
    *   Toggle para ordenar por Nombre (A-Z) o ID.
*   **Acciones por Fila:**
    *   **Ojo (Ver):** Abre un modal de solo lectura con el calendario del instructor.
    *   **Lápiz (Editar):** Abre modal para modificar datos personales (Nombre, DNI, Email, Estado Activo).
    *   **Papelera (Eliminar):** Elimina lógicamente o físicamente al instructor (según implementación de backend).
*   **Indicadores Visuales:**
    *   Badges de colores (Verde/Naranja/Gris) para indicar si el instructor ya cumplió con el envío de disponibilidad.

---

## 6. Comportamiento del Calendario de Disponibilidad

> **Nota:** Para una descripción técnica detallada de la lógica de grilla, validaciones y versionado, consultar el archivo [`CALENDAR_SPECIFICATION.md`](./CALENDAR_SPECIFICATION.md).

### Grilla Interactiva
*   **Eje X:** Días de la semana (Lunes - Sábado).
*   **Eje Y:** Bloques de 30 minutos (07:30 - 22:30).
*   **Interacción:** Clic simple para togglear estado (Disponible/No Disponible).

### Gestión de Versiones
*   **Guardado:** Crea una nueva entrada en el historial con fecha/hora actual.
*   **Marcar Final:**
    *   Define cuál versión se usará para el reporte consolidado.
    *   Solo puede haber una versión final por periodo/instructor.
*   **Historial:**
    *   Lista lateral ordenara cronológicamente.
    *   Permite "Ver" versiones antiguas (carga los datos en la grilla en modo lectura).
    *   Permite "Restaurar" versiones antiguas (copia los datos al editor actual para crear una nueva versión).

---

## 7. Comportamiento de Reportes

*   **Generación CSV:**
    *   Se realiza completamente en el cliente (Browser-side).
    *   Utiliza los datos en memoria de `users` y `availabilities`.
*   **Lógica de Consolidación:**
    1.  Busca la versión marcada como `isFinal: true`.
    2.  Si no existe, busca la última versión creada (Fallback).
    3.  Si no hay datos, reporta "N/A".
*   **Descarga:**
    *   Es inmediata. Genera un archivo `.csv` con nombre dinámico `Disponibilidad_[ID]_[Periodo].csv` o `Reporte_Consolidado.csv`.

---

## 8. Pantallas Sensibles al Rol (RBAC)

El sistema oculta elementos de navegación y restringe rutas mediante un componente `ProtectedRoute`.

### Instructor
*   **Ve:** Menú "Mi Disponibilidad", "Mi Perfil".
*   **No Ve:** Dashboard Admin, Lista de Instructores, Configuración.

### Administrador
*   **Ve:** Dashboard, Instructores, Configuración.
*   **Puede:** Crear/Editar Instructores, Abrir/Cerrar Ventana (si tiene permiso `canManageConfig`).
*   **Restricción Granular:** Un admin puede tener `canManageInstructors: true` pero `canManageConfig: false`. En ese caso, el menú de Configuración no aparece.

### Super Administrador
*   **Ve:** Todo lo del Administrador + Menú "Administradores".
*   **Poderes:**
    *   Bypasea todas las validaciones de permisos granulares.
    *   Puede crear y eliminar otros administradores.
    *   Puede asignar permisos específicos a los administradores normales.

---

## 9. Experiencia de Usuario (UX)

*   **Claridad de Contexto:**
    *   Siempre se muestra qué Periodo Académico está activo.
    *   Siempre es visible el estado de la Ventana de Carga.
*   **Prevención de Errores:**
    *   Modales de confirmación para acciones destructivas (Eliminar usuario, Iniciar nuevo periodo).
    *   Mensajes claros cuando se intenta editar un calendario histórico o cerrado.
*   **Navegación Intuitiva:**
    *   Uso de iconos consistentes (Lucide React).
    *   Breadcrumbs implícitos (Títulos de página claros).
    *   Layout responsivo (Menú hamburguesa en móvil).
