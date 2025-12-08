# Backlog de Producto - MVP Sistema de Disponibilidad RBAC

Este documento define las Épicas, Historias de Usuario y Tareas Funcionales necesarias para el lanzamiento del Producto Mínimo Viable (MVP).

---

## E. Orden Recomendado de Implementación

Para minimizar dependencias y bloqueos, se sugiere el siguiente flujo de desarrollo:

1.  **Core del Sistema:** Configuración del Periodo (BD) + Estructura de Usuarios + Autenticación Base.
2.  **Módulo Crítico (Frontend):** Calendario, Grilla y Validaciones de UX (Regla de 2 horas).
3.  **Módulo Crítico (Backend):** Guardado de Disponibilidad, Lógica de Versionado y "Hacer Final".
4.  **Gestión Administrativa:** CRUD de Instructores y Control de la Ventana de Carga.
5.  **Salida de Datos:** Generación de Reportes (Consolidado e Individual).
6.  **Cierre de Seguridad:** Implementación fina de RBAC (Permisos granulares) y Dashboard.

---

## A. Épicas y B. Historias de Usuario

### Épica 1: Autenticación y Seguridad
**Prioridad: ALTA**

| ID | Historia de Usuario | Prioridad |
| :--- | :--- | :--- |
| **AUTH-01** | Como **Usuario**, quiero iniciar sesión con mi ID y contraseña para acceder al sistema de forma segura. | **MUST HAVE** |
| **AUTH-02** | Como **Usuario**, quiero recuperar mi contraseña usando mi ID y DNI para restablecer el acceso si la olvido. | **MUST HAVE** |
| **AUTH-03** | Como **Sistema**, quiero invalidar sesiones automáticamente tras un tiempo de inactividad para proteger la cuenta. | **SHOULD HAVE** |

#### Tareas Funcionales (AUTH)
*   [Backend] Endpoint `/login`: Validar `active: true` y hash de contraseña. Retornar JWT.
*   [Backend] Endpoint `/recovery`: Validar coincidencia exacta ID + DNI. Permitir update de password.
*   [Frontend] Pantalla de Login con validación de campos vacíos.
*   [Frontend] Flujo de recuperación de 2 pasos (Validar Identidad -> Nueva Contraseña).

---

### Épica 2: Configuración del Sistema
**Prioridad: ALTA (Pre-requisito para Disponibilidad)**

| ID | Historia de Usuario | Prioridad |
| :--- | :--- | :--- |
| **CONF-01** | Como **Admin**, quiero definir el Periodo Académico (Nombre, Fechas) para agrupar las disponibilidades. | **MUST HAVE** |
| **CONF-02** | Como **Admin**, quiero Abrir o Cerrar la "Ventana de Carga" para controlar cuándo los instructores pueden editar. | **MUST HAVE** |

#### Tareas Funcionales (CONF)
*   [Backend] Modelo de datos `AcademicPeriod`. Solo debe haber un `isActive: true`.
*   [Backend] Endpoint para actualizar `isOpenForSubmission`.
*   [Frontend] Banner global que muestre el Periodo Activo.
*   [Frontend] Switch en panel admin para togglear la ventana.

---

### Épica 3: Calendario de Disponibilidad (UI + Validaciones)
**Prioridad: CRÍTICA (Core Business)**

| ID | Historia de Usuario | Prioridad |
| :--- | :--- | :--- |
| **CAL-01** | Como **Instructor**, quiero ver una grilla semanal (7:30 - 22:30) en bloques de 30 min para marcar mis horarios. | **MUST HAVE** |
| **CAL-02** | Como **Sistema**, quiero impedir la selección de bloques aislados (< 2 horas) para cumplir la normativa académica. | **MUST HAVE** |
| **CAL-03** | Como **Instructor**, quiero agregar observaciones de texto para aclarar preferencias específicas. | **MUST HAVE** |

#### Tareas Funcionales (CAL)
*   [Frontend] Renderizado de matriz 7 días x 30 bloques.
*   [Frontend] Lógica de selección (Toggle click).
*   [Frontend] Algoritmo de validación inmediata: Detectar cadenas consecutivas < 4 bloques.
*   [Frontend] Bloqueo visual de la grilla si `WindowClosed = true`.

---

### Épica 4: Versionado e Historial
**Prioridad: ALTA**

| ID | Historia de Usuario | Prioridad |
| :--- | :--- | :--- |
| **VER-01** | Como **Instructor**, quiero guardar múltiples versiones de mi disponibilidad para tener un respaldo de cambios. | **MUST HAVE** |
| **VER-02** | Como **Instructor**, quiero marcar una versión específica como "FINAL" para que sea considerada la oficial. | **MUST HAVE** |
| **VER-03** | Como **Instructor**, quiero ver mis versiones anteriores en modo lectura para consultar lo que envié. | **MUST HAVE** |

#### Tareas Funcionales (VER)
*   [Backend] `POST /availability`: Crear nuevo registro (INSERT), nunca Update. Validar regla de 2 horas nuevamente.
*   [Backend] `PUT /final`: Transacción atómica (Desmarcar anteriores -> Marcar actual).
*   [Frontend] Lista lateral con historial ordenado por fecha.
*   [Frontend] Botón "Hacer Final" visible solo en ventana abierta.
*   [Frontend] Modo "Solo Lectura": Carga datos en calendario pero deshabilita clicks.

---

### Épica 5: Reportes
**Prioridad: ALTA**

| ID | Historia de Usuario | Prioridad |
| :--- | :--- | :--- |
| **REP-01** | Como **Instructor**, quiero descargar mi disponibilidad en un archivo (CSV/Excel) como comprobante. | **MUST HAVE** |
| **REP-02** | Como **Admin**, quiero descargar un consolidado de TODOS los instructores para armar los horarios finales. | **MUST HAVE** |

#### Tareas Funcionales (REP)
*   [Backend] Lógica de "Versión Efectiva": Buscar Final -> Si no, buscar Última -> Si no, Pendiente.
*   [Frontend] Generador de CSV en cliente (Browser-side) para descarga rápida.
*   [Frontend] Formato de salida aplanado: Una fila por rango de horario continuo (ej. Lunes 08:00-10:00).

---

### Épica 6: Administración de Instructores
**Prioridad: MEDIA**

| ID | Historia de Usuario | Prioridad |
| :--- | :--- | :--- |
| **ADM-01** | Como **Admin**, quiero ver un listado de instructores filtrable por nombre o estado (Pendiente/Final). | **MUST HAVE** |
| **ADM-02** | Como **Admin**, quiero crear/editar/eliminar instructores manualmente para gestionar la planta docente. | **MUST HAVE** |
| **ADM-03** | Como **Admin**, quiero ver el calendario de un instructor específico en modo lectura para validarlo. | **MUST HAVE** |
| **ADM-04** | Como **Admin**, quiero cargar instructores masivamente desde un archivo para ahorrar tiempo. | **SHOULD HAVE** |

#### Tareas Funcionales (ADM)
*   [Backend] CRUD `/instructors`. Validar unicidad de ID y Email.
*   [Frontend] Tabla con filtros en tiempo real.
*   [Frontend] Reutilización del componente Calendario en modo `readOnly` para la vista de detalle.

---

### Épica 7: Gestión de Administradores (RBAC)
**Prioridad: MEDIA (Seguridad)**

| ID | Historia de Usuario | Prioridad |
| :--- | :--- | :--- |
| **RBAC-01** | Como **Super Admin**, quiero crear cuentas para otros administradores asignando permisos específicos. | **MUST HAVE** |
| **RBAC-02** | Como **Admin Restringido**, quiero que el sistema me oculte las opciones para las que no tengo permiso. | **MUST HAVE** |

#### Tareas Funcionales (RBAC)
*   [Backend] Middleware de autorización: Verificar `user.role` y `user.permissions`.
*   [Frontend] Componente `ProtectedRoute` para redirigir accesos no autorizados.
*   [Frontend] Ocultar ítems del menú lateral (`Configuración`, `Usuarios`) según flags del usuario.

---

### Épica 8: Dashboard de Estadísticas
**Prioridad: BAJA (Nice to have para MVP)**

| ID | Historia de Usuario | Prioridad |
| :--- | :--- | :--- |
| **DASH-01** | Como **Admin**, quiero ver cuántos instructores faltan por enviar su disponibilidad para hacer seguimiento. | **SHOULD HAVE** |

#### Tareas Funcionales (DASH)
*   [Backend] Query optimizada `COUNT(*)` agrupada por estado de versión.
*   [Frontend] Tarjetas de KPI (Total, Enviados, Pendientes).
*   [Frontend] Gráfico de barras simple.
