# Arquitectura Técnica del Frontend y Estructura de Carpetas
**Sistema de Gestión de Disponibilidad de Instructores con RBAC**

Este documento define la organización lógica, la estructura de archivos y las estrategias técnicas para la implementación del cliente web.

---

## 1. Arquitectura Técnica (Diseño Lógico)

El frontend se basa en una arquitectura de **Componentes y Servicios**, desacoplando la interfaz de usuario de la lógica de negocio y la comunicación con la API.

### A. Organización de Pantallas y Rutas
Utilizaremos `react-router-dom` con un esquema de rutas protegidas y layouts anidados.

1.  **Layout Público (AuthLayout):**
    *   **Login:** Pantalla centrada, sin sidebar.
    *   **Recuperación:** Flujo de dos pasos (Identidad -> Nueva Clave).

2.  **Layout Privado (MainLayout):**
    *   Contiene el `Sidebar` (Menú lateral), `Header` (Móvil) y el área de contenido principal (`Outlet`).
    *   **Rutas de Instructor:**
        *   `/availability` -> `AvailabilityPage`: Contenedor principal que orquesta el `CalendarEditor` y el `VersionHistory`.
        *   `/profile` -> `ProfilePage`: Formulario de datos y cambio de contraseña.
    *   **Rutas de Administrador:**
        *   `/admin/dashboard` -> `DashboardPage`: Grid de widgets y gráficos.
        *   `/admin/instructors` -> `InstructorsPage`: Tabla con filtros y modal de edición.
        *   `/admin/config` -> `ConfigPage`: Formularios de periodo y toggle de ventana.
    *   **Rutas de Super Admin:**
        *   `/super/admins` -> `AdminManagementPage`: Tabla exclusiva para gestionar otros admins.

### B. Separación de Responsabilidades

1.  **Componentes UI (Presentational Components):**
    *   **Responsabilidad:** "Cómo se ve". No tienen lógica de negocio ni llamadas a API. Reciben datos por `props`.
    *   *Ejemplos:* `Button`, `Modal`, `Badge`, `Card`, `InputField`.
    *   *Reutilización:* Alta. Se usan en todo el sistema.

2.  **Componentes de Dominio (Domain/Feature Components):**
    *   **Responsabilidad:** Lógica específica del negocio. Conectan UI con lógica compleja.
    *   *Ejemplos:*
        *   `AvailabilityGrid`: Maneja la matriz de 7x30, selección de celdas y lógica visual de "bloques".
        *   `InstructorTable`: Tabla específica con las columnas de ID, Nombre, Estado.
        *   `VersionList`: Lista lateral con lógica de "Marcar como Final".

3.  **Páginas (Views/Container Components):**
    *   **Responsabilidad:** "Cómo funciona". Orquestan la carga de datos (Query Hooks), gestionan el estado global de la vista y pasan la data a los componentes de dominio.
    *   *Ejemplo:* `AvailabilityPage` llama al hook `useAvailabilityQuery`, obtiene los datos y se los pasa a `AvailabilityGrid`.

4.  **Servicios (API Client):**
    *   **Responsabilidad:** Comunicación HTTP pura. Singleton de Axios.
    *   *Lógica:* Interceptores para inyectar Token, manejo de errores 401/403.

5.  **Gestión de Estado:**
    *   **Estado de Sesión (Global):** `AuthContext` (React Context API). Guarda el usuario actual y su rol.
    *   **Estado del Servidor (Caché):** `TanStack Query`. Maneja la carga, caché, reintentos y estados de carga (isLoading, isError) de los datos de disponibilidad e instructores.
    *   **Estado Local:** `useState` / `useReducer` para interacciones complejas en el calendario (selección múltiple antes de guardar).

---

## 2. Estructura de Carpetas Propuesta

La estructura sigue un enfoque modular agrupado por funcionalidad técnica y dominio.

```text
src/
├── assets/                 # Imágenes, fuentes y estilos globales (Tailwind imports)
│
├── components/             # Bloques de construcción de la UI
│   ├── ui/                 # Componentes genéricos (Atomic Design)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   └── Inputs/
│   │
│   ├── layout/             # Estructura visual principal
│   │   ├── Sidebar.tsx     # Menú dinámico por rol
│   │   ├── Header.tsx      # Barra superior (móvil)
│   │   └── MainLayout.tsx  # Wrapper de rutas privadas
│   │
│   └── domain/             # Componentes específicos del negocio
│       ├── availability/
│       │   ├── AvailabilityGrid.tsx  # La matriz de calendario
│       │   ├── VersionHistory.tsx    # Lista lateral
│       │   └── CalendarCell.tsx
│       │
│       ├── instructors/
│       │   ├── InstructorTable.tsx
│       │   └── InstructorForm.tsx
│       │
│       └── dashboard/
│           ├── StatsCard.tsx
│           └── SubmissionChart.tsx
│
├── context/                # Estado Global
│   └── AuthContext.tsx     # Provider de Usuario, Login, Logout
│
├── hooks/                  # Custom Hooks (Lógica reutilizable)
│   ├── useAuth.ts          # Consumidor del contexto de auth
│   ├── usePermissions.ts   # Lógica de RBAC (canView, canEdit)
│   └── queries/            # Hooks de React Query (Data Fetching)
│       ├── useAvailability.ts
│       ├── useInstructors.ts
│       └── usePeriod.ts
│
├── pages/                  # Vistas completas (Rutas)
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RecoveryPage.tsx
│   │
│   ├── instructor/
│   │   ├── AvailabilityPage.tsx
│   │   └── ProfilePage.tsx
│   │
│   ├── admin/
│   │   ├── DashboardPage.tsx
│   │   ├── InstructorsPage.tsx
│   │   └── ConfigPage.tsx
│   │
│   └── super/
│       └── AdminManagementPage.tsx
│
├── services/               # Comunicación con Backend
│   ├── api.ts              # Instancia de Axios con interceptores
│   ├── auth.service.ts
│   ├── instructor.service.ts
│   └── availability.service.ts
│
├── types/                  # Definiciones TypeScript (Interfaces compartidas)
│   ├── user.types.ts       # User, Role, Permissions
│   ├── availability.types.ts
│   └── api.types.ts
│
├── utils/                  # Funciones puras auxiliares
│   ├── date-helpers.ts     # Lógica de fechas (date-fns wrappers)
│   ├── validators.ts       # Regla de 2 horas, validación de passwords
│   └── csv-generator.ts    # Lógica de descarga de reportes
│
├── App.tsx                 # Definición de Rutas (React Router)
└── main.tsx                # Punto de entrada
```

---

## 3. Implementación Técnica de Sesión y Seguridad

### A. Manejo de Sesión y Token
1.  **Almacenamiento:**
    *   El JWT (`access_token`) se almacenará en `localStorage`. Esto permite persistencia simple entre recargas.
2.  **Inicialización:**
    *   Al cargar la app (`AuthProvider`), se busca el token.
    *   Si existe, se decodifica (si no está expirado) para hidratar el estado `currentUser`.
3.  **Comunicación API:**
    *   En `services/api.ts`, se configura un **Axios Interceptor** de petición.
    *   Antes de salir, cada petición inyecta: `config.headers.Authorization = Bearer ${token}`.
4.  **Expiración:**
    *   Interceptor de respuesta Axios: Si detecta `401 Unauthorized`, dispara automáticamente la función `logout()` del contexto, limpia el storage y redirige a `/login`.

### B. Implementación de RBAC en la Interfaz

Para mostrar u ocultar elementos según el rol, utilizaremos dos estrategias:

1.  **Protección de Rutas (Router Level):**
    Un componente wrapper `ProtectedRoute` que envuelve las rutas en `App.tsx`.

    ```typescript
    // Ejemplo conceptual
    <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
       <Route path="/admin/dashboard" element={<DashboardPage />} />
    </Route>
    ```

2.  **Renderizado Condicional (Component Level):**
    Un hook personalizado `usePermissions` o un componente `<RoleGuard>`.

    *   *Hook:*
        ```typescript
        const { hasRole, can } = usePermissions();
        if (can('manageConfig')) { return <ConfigButton />; }
        ```

    *   *Lógica de Permisos:*
        El frontend no recalcula permisos complejos. Confía en el objeto `user.permissions` que viene en el payload del Login/Token, pero aplica la lógica de jerarquía:
        *   Si `role === 'SUPER_ADMIN'` -> Retorna `true` siempre.
        *   Si `role === 'ADMIN'` -> Verifica el flag específico (ej. `canManageConfig`).

### C. Lógica del Calendario (Separación)
Dado que la lógica de validación de disponibilidad ("Regla de 2 horas") es crítica:
1.  Se implementa como una función pura en `utils/validators.ts`.
2.  Se usa en el Frontend para dar feedback visual inmediato (bordes rojos, toasts).
3.  (Nota: El Backend también usa esta lógica, idealmente compartiendo el código o replicándolo, para asegurar la integridad).
