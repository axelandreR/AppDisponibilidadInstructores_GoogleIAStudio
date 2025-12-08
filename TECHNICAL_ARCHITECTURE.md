# Arquitectura Técnica Global y Stack Tecnológico
**Sistema de Gestión de Disponibilidad de Instructores con RBAC**

Este documento define las tecnologías seleccionadas, la justificación de dichas elecciones y el diseño de alto nivel de la infraestructura del sistema.

---

## 1. Selección del Stack Tecnológico

### A. Frontend (Cliente Web)
*   **Lenguaje:** TypeScript.
*   **Framework:** **React** (vía Vite).
*   **Estado & Data Fetching:** React Context API + TanStack Query (React Query).
*   **UI Library:** Tailwind CSS + Lucide React (Iconos).
*   **Utilidades:** `date-fns` (Manejo de fechas), `papaparse` (Generación CSV cliente).

### B. Backend (API REST)
*   **Lenguaje:** TypeScript (Node.js).
*   **Framework:** **NestJS**.
*   **ORM (Object-Relational Mapping):** **Prisma ORM**.
*   **Validación:** `class-validator` + `class-transformer`.

### C. Base de Datos
*   **Motor:** **PostgreSQL**.
*   **Características Clave:** Relacional con soporte JSONB.

### D. Autenticación y Seguridad
*   **Mecanismo:** **JWT (JSON Web Tokens)**.
*   **Estrategia:** Stateless (Sin estado en servidor).
*   **Hashing:** Argon2 o Bcrypt.

### E. Infraestructura / Despliegue
*   **Modelo:** SPA (Single Page Application) + API REST.
*   **Containerización:** Docker (Opcional para desarrollo/deploy).

---

## 2. Justificación de las Elecciones

### ¿Por qué este Stack Frontend? (React + TypeScript)
1.  **Interactividad del Calendario:** El componente `AvailabilityScheduler` requiere gestionar un estado complejo (cientos de celdas, selecciones, hover). El Virtual DOM de React es ideal para renderizar eficientemente la grilla 7x30 sin lag.
2.  **Seguridad de Tipos:** Al usar TypeScript, podemos compartir las interfaces (`User`, `AvailabilityVersion`) definidas en el análisis funcional directamente con el backend, evitando errores de "contrato" entre ambas capas.
3.  **Ecosistema:** Tailwind CSS permite construir la UI responsiva y profesional requerida (Dashboard, Tablas) muy rápido sin escribir CSS tradicional.

### ¿Por qué este Stack Backend? (NestJS + Prisma)
1.  **Arquitectura para RBAC:** NestJS ofrece nativamente "Guards" y "Decorators". Esto permite implementar la seguridad de forma declarativa:
    *   `@UseGuards(JwtAuthGuard, RolesGuard)`
    *   `@Roles(Role.ADMIN)`
    *   Esto encaja perfectamente con el requisito de permisos granulares.
2.  **Integridad de Datos:** Prisma ORM maneja las relaciones (Instructor -> Versiones) de forma estricta, previniendo registros huérfanos.
3.  **Lógica de Negocio Compartida:** La lógica de validación (regla de 2 horas) es compleja. Al usar TypeScript en ambos lados, podemos aislar el algoritmo de validación en una librería compartida (`shared-utils`) y usarla tanto en el Frontend (para feedback visual) como en el Backend (para seguridad final).

### ¿Por qué PostgreSQL?
1.  **Relacional + Flexible:**
    *   El sistema requiere integridad referencial estricta (Un usuario no puede ser borrado si tiene historial). Postgres es excelente en esto.
    *   Sin embargo, los "slots" de tiempo (`['Lunes-08:00', 'Martes...']`) son datos estructurados variables. Postgres permite guardar esto en una columna `JSONB`, permitiendo consultas rápidas sin crear una tabla separada con millones de filas para cada bloque de 30 minutos.
2.  **Transaccionalidad (ACID):** El proceso de "Marcar como Final" requiere actualizar la fila nueva a `true` y todas las anteriores a `false` simultáneamente. Postgres garantiza que esto ocurra atómicamente.

### ¿Por qué JWT?
1.  **Escalabilidad:** No requiere mantener sesiones en memoria o base de datos en el servidor.
2.  **Portabilidad:** El token contiene el `Role` y los `Permissions` del usuario (payload). El frontend puede leer este token para renderizar u ocultar menús instantáneamente sin hacer una petición al servidor cada vez que cambia de ruta.

---

## 3. Arquitectura Técnica Global

El sistema sigue una arquitectura de **Capas Separadas (Layered Architecture)**.

### Diagrama de Componentes

```mermaid
graph TD
    Client[Navegador Web (React App)]
    API[Backend API (NestJS)]
    DB[(PostgreSQL Database)]
    Auth[JWT Service]
    
    %% Flujo
    Client -- 1. HTTPS / JSON --> API
    API -- 2. Valida Token --> Auth
    API -- 3. Query / Transacción --> DB
    DB -- 4. Datos Relacionales --> API
    API -- 5. Respuesta JSON --> Client
```

### Detalle de las Capas

#### 1. Capa de Presentación (Frontend)
*   **Responsabilidad:** Renderizado UI, captura de eventos, validación preliminar (UX).
*   **Lógica de Negocio:**
    *   Validación visual de la regla de 2 horas.
    *   Generación de CSV Individual (Browser-side generation para no saturar servidor).
    *   Control de rutas protegidas basado en el Token decodificado.

#### 2. Capa de API y Controladores (Backend - Controllers)
*   **Responsabilidad:** Recibir peticiones HTTP, validación de DTOs (Data Transfer Objects), manejo de códigos de estado (200, 400, 403).
*   **Seguridad:** Aquí actúan los **Guards** de NestJS. Si el token no es válido o el rol es insuficiente, la petición muere aquí y no toca la base de datos.

#### 3. Capa de Servicios (Backend - Services)
*   **Responsabilidad:** El "Cerebro" del sistema.
    *   **AvailabilityService:** Contiene el algoritmo maestro de validación de continuidad temporal.
    *   **ReportingService:** Agrega datos de múltiples tablas para generar el JSON consolidado.
    *   **PeriodService:** Controla la lógica de cierre de ventana y creación de nuevos periodos.

#### 4. Capa de Persistencia (Base de Datos)
*   **Tablas Principales:**
    *   `users`: (id, email, password_hash, role, permissions JSON).
    *   `academic_periods`: (id, dates, is_open).
    *   `availability_versions`: (id, user_id, period_id, slots JSONB, is_final, comments).

---

## 4. Flujo de Datos y Seguridad

### Autenticación y Autorización
1.  Usuario hace Login -> Backend valida -> Retorna `access_token`.
2.  Frontend guarda token en `localStorage` o `Cookies` (HttpOnly recomendado).
3.  Frontend intercepta cada petición (Axios Interceptor) e inyecta `Authorization: Bearer <token>`.
4.  Backend recibe petición -> `JwtGuard` verifica firma -> `RolesGuard` verifica permisos del Payload -> Controlador ejecuta acción.

### Manejo de Reportes
*   **Reporte Individual:** El Backend envía el JSON limpio de la versión. El Frontend usa la librería `papaparse` para convertir ese JSON a CSV y disparar la descarga. Esto distribuye la carga de CPU al cliente.
*   **Reporte Consolidado:** Debido al volumen de datos (cientos de instructores), el Backend procesa la "sábana" de datos, realiza el aplanamiento (flattening) de los horarios y envía un stream de datos optimizado o un JSON listo para ser consumido.

### Manejo de la Ventana de Carga
*   **Configuración:** Guardada en la tabla `academic_periods`.
*   **Check:** Cada vez que el `AvailabilityService` intenta crear una versión, consulta esta tabla. Si `is_open === false` y el usuario no es Admin, lanza excepción `ForbiddenException`.
