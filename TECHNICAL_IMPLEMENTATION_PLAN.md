# Plan Técnico de Implementación Gradual
**Sistema de Gestión de Disponibilidad de Instructores con RBAC**

Este documento traza la ruta técnica para transformar la arquitectura y diseños previos en código funcional, minimizando dependencias circulares y asegurando una base sólida.

---

## 1. Orden de Implementación Sugerido

La estrategia sigue el patrón **"Walking Skeleton"** (Esqueleto Caminante): Construir primero una traza vertical completa (DB -> Backend -> Frontend) de la funcionalidad más básica (Login) y luego iterar sobre los módulos de negocio.

### Fase 1: Cimientos y Autenticación (Weeks 1-2)
*Objetivo: Tener un sistema desplegable donde los usuarios pueden identificarse y el sistema reconoce roles.*

1.  **Infraestructura & DB:**
    *   Configurar Docker Compose (PostgreSQL).
    *   Inicializar proyecto NestJS y React+Vite.
    *   Implementar esquema Prisma (`User`, `AcademicPeriod`) y ejecutar migraciones.
    *   *Seed* (Semilla) de base de datos: Crear 1 Super Admin y 1 Periodo Activo.
2.  **Backend (Auth):**
    *   Implementar `AuthModule` (Passport JWT Strategy).
    *   Implementar `UsersModule` (Solo lectura básica).
    *   Endpoint `/auth/login` y `/auth/me`.
3.  **Frontend (Auth):**
    *   Configurar Axios Interceptor (Inyección de Token).
    *   Implementar `AuthProvider` (Context).
    *   Crear `LoginPage`.
    *   Crear el "Shell" de la aplicación: `ProtectedRoute` y `Layout` (Sidebar vacío).
4.  **Integración:**
    *   Conectar Login Frontend con Backend.
    *   Verificar redirección: Admin -> `/admin`, Instructor -> `/availability`.

### Fase 2: El Core del Negocio - Disponibilidad (Weeks 2-3)
*Objetivo: Que un instructor pueda guardar su disponibilidad validada.*

1.  **Backend (Logic):**
    *   Crear `AvailabilityModule`.
    *   **Crítico:** Implementar algoritmo de "Regla de 2 Horas" en un servicio aislado.
    *   Implementar `POST /availability` (Validar Periodo Abierto + Regla 2 Horas).
    *   Implementar `GET /availability/history`.
2.  **Frontend (Interactive UI):**
    *   Crear componente `AvailabilityGrid` (Matriz 7x30 interactiva).
    *   Implementar lógica de validación visual (replicar regla de 2 horas en cliente).
    *   Conectar `AvailabilityPage` con los endpoints.
    *   Implementar Historial de Versiones (Lista lateral).

### Fase 3: Gestión Administrativa y Configuración (Week 4)
*Objetivo: Que el Admin pueda gestionar el entorno y los usuarios.*

1.  **Backend (Admin):**
    *   Expandir `UsersModule` para CRUD completo (Crear, Editar, Soft Delete).
    *   Implementar `ConfigModule`: Endpoints para cambiar fechas y togglear `isOpenForSubmission`.
    *   Aplicar Guards RBAC estrictos (`@Roles(ADMIN)`).
2.  **Frontend (Admin):**
    *   Implementar `InstructorsPage` (Tabla con filtros).
    *   Implementar `ConfigPage` (Formularios de periodo).
    *   Implementar vista de "Solo Lectura" del calendario (Reutilizar `AvailabilityGrid` con prop `readOnly`).

### Fase 4: Cierre, Reportes y Dashboard (Week 5)
*Objetivo: Extraer valor de los datos ingresados.*

1.  **Backend (Reporting):**
    *   Implementar lógica de "Versión Efectiva" (Strategy Pattern: Final > Última > Nada).
    *   Endpoint `/reports/consolidated` (Data flattening).
    *   Endpoint `/stats` (Queries de conteo optimizadas).
2.  **Frontend (Reporting):**
    *   Implementar generación de CSV con `papaparse`.
    *   Implementar `DashboardPage` con gráficos (Recharts).
    *   Pulido visual (Toasts, Spinners, manejo de errores 403/404).

---

## 2. Paquetes y Componentes para la Primera Iteración (Código Base)

Estos son los artefactos mínimos necesarios para arrancar la **Fase 1**.

### A. Backend (NestJS)
*   **`prisma/schema.prisma`**: Definición de modelos `User` y `Period`.
*   **`src/auth/`**:
    *   `auth.service.ts`: Validación de contraseña y generación de JWT.
    *   `jwt.strategy.ts`: Extracción y validación del Bearer Token.
    *   `roles.guard.ts`: Guard base para leer metadata de roles.
*   **`src/common/decorators/`**:
    *   `user.decorator.ts`: Para extraer el usuario del Request (`@User()`).
*   **`src/users/users.service.ts`**: Método `findByEmail` (necesario para auth).

### B. Frontend (React)
*   **`src/services/api.ts`**: Instancia de Axios singleton.
    *   *Clave:* Interceptor que captura errores 401 y dispara el logout.
*   **`src/context/AuthContext.tsx`**:
    *   Estado: `user` (null | User), `isAuthenticated` (bool).
    *   Métodos: `login(token)`, `logout()`.
*   **`src/components/layout/Sidebar.tsx`**:
    *   Lógica condicional básica: `if (role === 'ADMIN') return <AdminLinks />`.
*   **`src/routes/ProtectedRoute.tsx`**:
    *   Componente HOC que verifica `isAuthenticated` y `allowedRoles.includes(user.role)`.

---

## 3. Estrategia de Pruebas Técnicas

### A. Backend Testing (Prioridad: Lógica de Negocio y Seguridad)
1.  **Unit Testing (Jest):**
    *   **Objetivo:** Probar el algoritmo de validación de tiempo (`AvailabilityValidator`).
    *   *Caso:* Pasar array `['Lun-08:00', 'Lun-08:30']` -> Debe retornar `false` (Solo 1 hora).
    *   *Caso:* Pasar array `['Lun-08:00'...'Lun-10:00']` -> Debe retornar `true`.
2.  **Integration Testing (Supertest):**
    *   **Objetivo:** Probar Guards de Seguridad.
    *   *Caso:* Hacer petición a `/users` sin token -> Esperar 401.
    *   *Caso:* Hacer petición a `/users` con token de Instructor -> Esperar 403.

### B. Frontend Testing (Prioridad: Flujos Críticos)
1.  **Component Testing (React Testing Library):**
    *   **Objetivo:** Validar interacción de Grilla.
    *   *Caso:* Clic en celda vacía -> Celda cambia clase CSS a "selected".
    *   *Caso:* Prop `readOnly={true}` -> Clic en celda NO dispara evento.
2.  **E2E Testing Manual (Inicial):**
    *   Flujo: Login -> Redirección Correcta -> Logout -> Intento de entrar por URL -> Redirección a Login.

### C. Validación de Reglas de Negocio (Técnica)
*   **Regla de Versión Final:**
    *   Crear un script de prueba que inserte 3 versiones y llame al endpoint `PATCH /final`.
    *   Verificar en DB que solo 1 fila tiene `is_final = true`.

---

## 4. Estrategia para Evitar Re-Trabajo (Scalability)

### A. Tipado Compartido (Shared Types)
*   **Problema:** El backend define un DTO y el frontend define una interfaz manualmente. Si el backend cambia, el frontend se rompe en runtime.
*   **Solución:** Crear una carpeta `packages/shared` (o simplemente un archivo `types.ts` en frontend que se genera/copia) que contenga los contratos.
    *   `export interface UserDTO { ... }`
    *   `export enum Role { ... }`
    *   Esto asegura que Frontend y Backend hablen el mismo idioma desde el día 1.

### B. Aislamiento de Lógica (Logic Isolation)
*   **Problema:** La regla de "2 horas consecutivas" se necesita en el frontend (para UX, borde rojo) y en el backend (para seguridad).
*   **Solución:** Escribir esta función `validateAvailability(slots: string[])` en un archivo TypeScript puro (`utils/validators.ts`).
    *   En el Frontend: Se importa directamente.
    *   En el Backend: Se puede copiar o importar (si es monorepo).
    *   *Beneficio:* Si la regla cambia a "3 horas", solo se edita un archivo.

### C. Abstracción de API (Service Layer)
*   **Problema:** Hardcodear llamadas `axios.get('/users')` dentro de los componentes React (`useEffect`). Difícil de testear y mantener.
*   **Solución:** Usar **React Query (TanStack Query)** con Hooks personalizados (`useUsers`, `useAvailability`).
    *   Si mañana cambiamos el endpoint o añadimos paginación, solo tocamos el Hook, no los 20 componentes que usan los datos.
    *   Maneja caché y revalidación automáticamente ("Stale-while-revalidate").

### D. Diseño Modular de NestJS
*   Mantener el `AvailabilityModule` desacoplado del `UsersModule`. Si en el futuro se quiere notificar por email al guardar, se usa un **Event Emitter** (`AvailabilityCreatedEvent`) que escuche un `NotificationModule`, en lugar de importar el servicio de email dentro del servicio de disponibilidad.
