# Arquitectura Funcional del Backend (API Specification)

Este documento define la estructura lógica, los recursos y el comportamiento de la API RESTful para el **Sistema de Gestión de Disponibilidad con RBAC**.

## 1. Modelo de Seguridad y Acceso

El backend actúa como la fuente de verdad y guardián de la seguridad.

### Autenticación
*   **Mecanismo:** Basado en Tokens (Stateless).
*   **Ciclo de Vida:**
    *   El cliente envía credenciales.
    *   El servidor valida y retorna un Token de Acceso con tiempo de expiración definido.
    *   Cada petición subsiguiente debe incluir este Token en la cabecera.

### Control de Acceso (RBAC)
Cada endpoint implementa un "Middleware de Autorización" que verifica dos niveles:
1.  **Nivel de Rol:** ¿Es el usuario Instructor, Admin o Super Admin?
2.  **Nivel de Permiso (Granular):** Para administradores, verifica flags específicos (`canManageInstructors`, `canManageConfig`).

---

## 2. Catálogo de Recursos y Endpoints

### A. Recurso: Autenticación (`/auth`)
Gestión de identidad y sesiones.

| Método | Endpoint | Descripción Funcional | Acceso |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/login` | Valida ID y Contraseña. Retorna Token + Datos de Usuario. | Público |
| **POST** | `/auth/recovery` | Valida ID y DNI. Si coinciden, permite establecer nueva contraseña. | Público |
| **POST** | `/auth/logout` | Invalida la sesión actual (si aplica blacklist) o instruye al cliente a borrar el token. | Autenticado |
| **GET** | `/auth/me` | Retorna el perfil del usuario actual basado en el token enviado. | Autenticado |
| **PUT** | `/auth/password` | Permite cambiar la contraseña actual por una nueva. Requiere contraseña anterior. | Autenticado |

### B. Recurso: Instructores (`/instructors`)
Gestión del padrón docente.

| Método | Endpoint | Descripción Funcional | Acceso |
| :--- | :--- | :--- | :--- |
| **GET** | `/instructors` | Lista instructores con paginación, filtros (nombre, email) y ordenamiento. | Admin, Super Admin |
| **POST** | `/instructors` | Registra un nuevo instructor. Valida unicidad de ID y Email. | Admin, Super Admin |
| **GET** | `/instructors/{id}` | Obtiene detalle de un instructor específico. | Admin, Super Admin |
| **PUT** | `/instructors/{id}` | Actualiza datos (Nombre, Email, DNI, Estado Activo). | Admin, Super Admin |
| **DELETE** | `/instructors/{id}` | Elimina (lógica o físicamente) al instructor. | Admin, Super Admin |
| **POST** | `/instructors/bulk` | Procesa un archivo (CSV/JSON) para crear múltiples usuarios. Retorna reporte de éxito/error por fila. | Admin, Super Admin |

### C. Recurso: Disponibilidad (`/availability`)
Núcleo del negocio. Gestiona los horarios.

| Método | Endpoint | Descripción Funcional | Acceso |
| :--- | :--- | :--- | :--- |
| **GET** | `/availability/my-history` | Lista todas las versiones enviadas por el instructor autenticado para el periodo activo. | Instructor |
| **POST** | `/availability` | Crea una nueva versión de disponibilidad. **Ejecuta Reglas de Validación**. | Instructor |
| **PUT** | `/availability/{versionId}/final` | Marca una versión específica como "Final". Desmarca las anteriores del mismo periodo. | Instructor |
| **GET** | `/availability/users/{userId}` | (Vista Admin) Obtiene el historial completo de un instructor específico. | Admin, Super Admin |

### D. Recurso: Administradores (`/admins`)
Gestión exclusiva para el Super Usuario.

| Método | Endpoint | Descripción Funcional | Acceso |
| :--- | :--- | :--- | :--- |
| **GET** | `/admins` | Lista usuarios con rol ADMIN o SUPER_ADMIN. | Super Admin |
| **POST** | `/admins` | Crea un nuevo administrador y asigna permisos granulares. | Super Admin |
| **PUT** | `/admins/{id}` | Modifica permisos o datos de un administrador. | Super Admin |
| **DELETE** | `/admins/{id}` | Revoca acceso a un administrador. | Super Admin |

### E. Recurso: Configuración del Sistema (`/config`)
Control del periodo y ventana de carga.

| Método | Endpoint | Descripción Funcional | Acceso |
| :--- | :--- | :--- | :--- |
| **GET** | `/config/period` | Obtiene datos del periodo actual y estado de la ventana. | Autenticado (Todos) |
| **PUT** | `/config/period` | Actualiza fechas o nombre del periodo. | Admin (con permiso), Super Admin |
| **POST** | `/config/period/new` | Cierra el periodo actual y crea uno nuevo (Reset del sistema). | Admin (con permiso), Super Admin |
| **PUT** | `/config/window` | Toggle (Activar/Desactivar) la ventana de carga de disponibilidad. | Admin (con permiso), Super Admin |

### F. Recurso: Reportes (`/reports`)
Generación de documentos.

| Método | Endpoint | Descripción Funcional | Acceso |
| :--- | :--- | :--- | :--- |
| **GET** | `/reports/consolidated` | Genera y descarga CSV/Excel con la última versión final de TODOS los instructores. | Admin, Super Admin |
| **GET** | `/reports/instructor/{id}` | Genera y descarga CSV/Excel individual de un instructor. | Instructor (propio), Admin |

---

## 3. Lógica de Negocio y Validaciones (Backend)

El backend no confía en el frontend. Debe re-validar todo.

### 1. Validación de Disponibilidad (Regla de las 2 Horas)
Al recibir un `POST /availability`, el backend ejecuta:
1.  **Parsing:** Convierte la lista de IDs de bloques en una matriz temporal.
2.  **Agrupación:** Agrupa bloques por día.
3.  **Continuidad:** Verifica matemáticamente que no existan grupos de bloques consecutivos menores a 4 unidades (2 horas).
4.  **Resultado:**
    *   Si falla: Retorna `HTTP 400 Bad Request` con mensaje detallado: *"Bloque aislado detectado el Lunes a las 09:00"*.
    *   Si pasa: Guarda la versión en base de datos.

### 2. Validación de Ventana de Carga
Al recibir `POST /availability` o `PUT .../final`:
1.  Consulta la configuración global.
2.  Si `isOpenForSubmission === false`:
    *   Rechaza inmediatamente con `HTTP 403 Forbidden`.
    *   Mensaje: *"El periodo de carga ha finalizado. Contacte al administrador."*

### 3. Validación de Integridad Referencial
*   No se puede eliminar un instructor si tiene disponibilidades asociadas (salvo borrado en cascada explícito).
*   No se puede crear un usuario con un ID o Email que ya exista.

---

## 4. Flujo General de una Petición (Request Lifecycle)

1.  **Entrada:** La petición HTTP llega al servidor.
2.  **Seguridad (Middleware):**
    *   Se extrae el Token.
    *   Se verifica firma y expiración.
    *   Se identifica al usuario (User Context).
3.  **Autorización (RBAC):**
    *   Se verifica si el User Context tiene el Rol y Permisos necesarios para la ruta.
    *   Si no: `HTTP 403 Forbidden`.
4.  **Validación de Entrada (Input Validation):**
    *   Se revisa que el cuerpo (Body) tenga el formato correcto (tipos de datos, campos obligatorios).
    *   Si no: `HTTP 400 Bad Request`.
5.  **Reglas de Negocio (Service Layer):**
    *   Validaciones complejas (ej. Regla de 2 horas, Ventana Abierta).
    *   Lógica de base de datos.
6.  **Persistencia:**
    *   Operación CRUD en la Base de Datos.
7.  **Respuesta:**
    *   Se formatea la respuesta (JSON).
    *   Se envía al cliente con código HTTP apropiado (200, 201, etc.).
