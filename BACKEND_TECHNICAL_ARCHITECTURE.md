# Arquitectura Técnica del Backend y Diseño de API
**Stack:** NestJS + TypeScript + Prisma ORM + PostgreSQL

Este documento define la organización interna del servidor, la ubicación de la lógica de negocio y el contrato de interfaz (API) que consumirá el frontend.

---

## 1. Organización Interna del Backend (NestJS)

El backend seguirá una arquitectura modular basada en dominios (**Modular Monolith**), aprovechando el sistema de inyección de dependencias de NestJS.

### A. Estructura de Módulos
El código se dividirá en los siguientes módulos principales (`@Module`):

1.  **`AuthModule`**:
    *   Encargado de la estrategia de Passport (JWT), Login, y Recuperación de contraseña.
2.  **`UsersModule`**:
    *   Gestiona la entidad `User`. Maneja tanto Instructores como Administradores.
3.  **`AvailabilityModule`**:
    *   El núcleo del sistema. Gestiona `AvailabilityVersion` y las validaciones de tiempo.
4.  **`ConfigModule`**:
    *   Gestiona la entidad `AcademicPeriod` y el estado de la ventana de carga.
5.  **`ReportsModule`**:
    *   Agregador de datos. No tiene tablas propias, lee de los otros servicios para generar CSV/Excel.
6.  **`CommonModule` (Shared)**:
    *   Utilidades compartidas, validadores personalizados y Guards globales.

### B. Capas de Responsabilidad

1.  **Controllers (`*.controller.ts`):**
    *   Reciben la petición HTTP.
    *   Validan la estructura de entrada usando **DTOs** (Data Transfer Objects) con `class-validator`.
    *   Aplican decoradores de seguridad (`@UseGuards`, `@Roles`).
    *   No contienen lógica de negocio compleja.

2.  **Services (`*.service.ts`):**
    *   Contienen toda la lógica de negocio y reglas del sistema.
    *   Interactúan con la capa de persistencia (Prisma).
    *   *Ejemplo:* `AvailabilityService.create()` ejecuta el algoritmo de validación de 2 horas antes de llamar a `prisma.create()`.

3.  **Persistence (Prisma Client):**
    *   Abstracción de la base de datos.
    *   Define el esquema en `schema.prisma`.
    *   Maneja transacciones ACID (necesarias para "Marcar como Final").

### C. Implementación de Reglas de Negocio

*   **Validación de Bloques (Regla 2 Horas):** Se implementa como un método privado en `AvailabilityService` (`validateTimeSlots(slots: string[])`). Se invoca antes de crear cualquier versión. Lanza `BadRequestException` si falla.
*   **Versión Final:** Se implementa en `AvailabilityService` usando una transacción interactiva de Prisma (`$transaction`) para asegurar que al marcar una versión como `true`, todas las demás del mismo usuario/periodo pasen a `false` atómicamente.
*   **Ventana de Carga:** Se implementa como un **Interceptor** o check imperativo al inicio de los métodos de escritura en `AvailabilityService`. Consulta `PeriodService.isOpen()`.
*   **RBAC (Roles y Permisos):** Se implementa mediante **Guards** personalizados (`RolesGuard`, `PermissionsGuard`) que leen metadatos (`Reflector`) puestos en los controladores.

---

## 2. Diseño Detallado de la API (Endpoints)

Todos los endpoints (excepto Auth) requieren cabecera `Authorization: Bearer <token>`.

### A. Recurso: Autenticación (`Auth`)

| Verbo | Ruta | Body / Query | Respuesta (JSON) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/auth/login` | `{ id: string, password: string }` | `{ accessToken: string, user: UserDTO }` | Valida credenciales y `isActive`. Retorna JWT. |
| **GET** | `/auth/me` | - | `{ id, name, role, permissions, ... }` | Retorna datos del usuario del token actual. |
| **POST** | `/auth/recovery` | `{ id: string, dni: string, newPassword: string }` | `{ message: "Success" }` | Valida match ID+DNI y actualiza password. |
| **PUT** | `/auth/password` | `{ currentPassword, newPassword }` | `{ message: "Success" }` | Cambio de clave autenticado. Valida política de complejidad. |

### B. Recurso: Instructores (`Users`)
*Requiere Rol: ADMIN o SUPER_ADMIN*

| Verbo | Ruta | Body / Query | Respuesta | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/users` | `?role=INSTRUCTOR&search=...&page=1` | `{ data: UserDTO[], meta: PageMeta }` | Lista paginada y filtrable. |
| **POST** | `/users` | `{ id, name, email, dni, role: 'INSTRUCTOR' }` | `UserDTO` | Crea usuario. Error 409 si ID/Email existe. |
| **PUT** | `/users/:id` | `{ name?, email?, active? }` | `UserDTO` | Actualiza datos. |
| **DELETE** | `/users/:id` | - | `{ message: "User deleted" }` | Soft delete o borrado físico (si no tiene datos). |
| **POST** | `/users/bulk` | `Multipart/Form-Data (file.csv)` | `{ created: 10, errors: ["Row 5: Invalid Email"] }` | Procesa carga masiva. |

### C. Recurso: Disponibilidad (`Availability`)

| Verbo | Ruta | Body / Query | Acceso | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/availability/history` | `?periodId=...` | Instructor | Retorna lista de versiones del usuario logueado. |
| **GET** | `/availability/user/:userId` | `?periodId=...` | Admin | Retorna historial de un usuario específico (Solo lectura). |
| **POST** | `/availability` | `{ periodId, slots: string[], comments }` | Instructor | **Core.** Valida 2 horas, ventana abierta y guarda versión. |
| **PATCH** | `/availability/:id/final` | - | Instructor | Marca versión `:id` como final. Ejecuta transacción. |

### D. Recurso: Administradores (`Admins`)
*Requiere Rol: SUPER_ADMIN*

| Verbo | Ruta | Body / Query | Respuesta | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/admins` | - | `UserDTO[]` | Lista usuarios con role ADMIN o SUPER_ADMIN. |
| **POST** | `/admins` | `{ id, name, email, permissions: { ... } }` | `UserDTO` | Crea administrador con permisos granulares. |
| **PATCH** | `/admins/:id/permissions` | `{ permissions: { canManageConfig: bool ... } }` | `UserDTO` | Actualiza solo los permisos. |

### E. Recurso: Configuración (`Config`)
*Requiere Permiso: canManageConfig o SUPER_ADMIN*

| Verbo | Ruta | Body / Query | Respuesta | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/config/period` | - | `PeriodDTO` | Retorna periodo activo (Acceso público autenticado). |
| **PUT** | `/config/period` | `{ name, startDate, endDate }` | `PeriodDTO` | Actualiza metadatos del periodo actual. |
| **POST** | `/config/period/next` | `{ name, ... }` | `PeriodDTO` | Cierra periodo actual y crea uno nuevo. |
| **PATCH** | `/config/window` | `{ isOpen: boolean }` | `{ isOpen: boolean }` | Toggle inmediato de la ventana de carga. |

### F. Recurso: Reportes (`Reports`)
*Requiere Rol: ADMIN o SUPER_ADMIN*

| Verbo | Ruta | Body / Query | Respuesta | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/reports/consolidated` | `?format=csv` | `Stream (File)` | Descarga sábana de datos de versiones finales. |
| **GET** | `/reports/instructor/:id` | `?format=csv` | `Stream (File)` | Descarga individual (Disponible también para el propio instructor). |
| **GET** | `/reports/dashboard` | - | `{ stats: { total, pending... } }` | Datos para gráficos del dashboard. |

---

## 3. Manejo Técnico de Autenticación y Autorización

### A. Validación del Token (Passport-JWT)
1.  El cliente envía `Authorization: Bearer eyJhbGci...`.
2.  **JwtStrategy:** Intercepta la petición.
3.  Decodifica el token y extrae el `sub` (userId).
4.  Consulta a la base de datos (o caché Redis en futuro) para verificar que el usuario existe y `isActive: true`.
5.  Inyecta el objeto `user` en `request.user`.

### B. Aplicación de RBAC (Guards)

Se utilizará un enfoque declarativo con decoradores personalizados.

**Ejemplo de Implementación en Controlador:**

```typescript
@Controller('config')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Cadena de seguridad
export class ConfigController {

  @Patch('window')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN) // Nivel 1: Rol
  @RequirePermission('canManageConfig') // Nivel 2: Permiso Granular
  toggleWindow(@Body() body: ToggleWindowDto) {
    return this.configService.toggle(body.isOpen);
  }
}
```

### C. Respuestas ante Fallos de Permisos

1.  **Token Inválido / Expirado:**
    *   **HTTP 401 Unauthorized**.
    *   Mensaje: *"Unauthorized"*.
    *   Acción Frontend: Redirigir a Login.

2.  **Rol Insuficiente (Ej. Instructor intentando entrar a /users):**
    *   **HTTP 403 Forbidden**.
    *   Mensaje: *"Forbidden resource"*.

3.  **Permiso Granular Insuficiente (Ej. Admin Básico intentando editar Config):**
    *   **HTTP 403 Forbidden**.
    *   Mensaje: *"Missing required permission: canManageConfig"*.

4.  **Ventana Cerrada (Instructor intentando POST):**
    *   **HTTP 423 Locked** (WebDAV extension) o **403 Forbidden**.
    *   Mensaje: *"Submission window is closed"*.
