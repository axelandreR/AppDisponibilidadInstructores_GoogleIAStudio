# Reglas de Seguridad, Validaciones y Manejo de Errores

Este documento define las políticas transversales que el Backend debe implementar para garantizar la integridad, seguridad y usabilidad del sistema.

## 1. Autenticación y Gestión de Sesiones

El sistema sigue un modelo de seguridad **Stateless** (sin estado) basado en Tokens (ej. JWT).

### Reglas Funcionales
1.  **Protección por Defecto:** Todos los endpoints de la API (excepto `/auth/login` y `/auth/recovery`) deben requerir un Token válido en la cabecera `Authorization`.
2.  **Validación de Login:**
    *   Buscar usuario por `id`.
    *   Verificar que `active === true`. Si es falso, rechazar acceso (`403 Account Disabled`).
    *   Verificar hash de contraseña.
    *   *Éxito:* Retornar Token firmado + Datos del Usuario (sin password).
3.  **Expiración de Sesión:**
    *   El token debe tener un tiempo de vida definido (ej. 24 horas).
    *   Si el token ha expirado, el backend rechaza la petición con `HTTP 401 Unauthorized`.
    *   *Acción Frontend:* Redirección inmediata al Login.

---

## 2. Autorización (RBAC)

El sistema debe validar los permisos **después** de autenticar la identidad.

### Matriz de Acceso
| Rol | Recurso Propio (Disponibilidad) | Recurso Ajenos (Instructores) | Configuración | Gestión Admins |
| :--- | :--- | :--- | :--- | :--- |
| **INSTRUCTOR** | Lectura / Escritura | Denegado | Lectura (Solo estado) | Denegado |
| **ADMIN** | Lectura (Vista Admin) | Lectura / Escritura | Escritura (Si tiene permiso) | Denegado |
| **SUPER_ADMIN**| Lectura (Vista Admin) | Lectura / Escritura | Escritura | Lectura / Escritura |

### Reglas de Validación de Permisos
1.  **Principio de Propiedad:** Un Instructor solo puede modificar datos donde `availability.instructorId === token.userId`. Intentar modificar datos de otro ID resulta en `HTTP 403 Forbidden`.
2.  **Jerarquía de Administradores:**
    *   Un ADMIN no puede editar ni eliminar a un SUPER_ADMIN.
    *   Un ADMIN no puede elevar sus propios privilegios.
3.  **Acceso a Configuración:**
    *   Antes de ejecutar cambios en `/config`, verificar si el usuario tiene el flag `canManageConfig` o es SUPER_ADMIN.

---

## 3. Validación de Datos de Entrada (Sanitización)

El backend debe actuar como firewall de datos, rechazando estructuras incorrectas antes de procesarlas.

### Validaciones Generales
*   **Campos Requeridos:** Rechazar si faltan campos obligatorios (`HTTP 400 Bad Request`).
*   **Tipos de Datos:** Validar que los arrays sean arrays, strings sean strings, etc.
*   **Formatos:**
    *   **Email:** Debe cumplir regex estándar de correo.
    *   **Horarios:** Formato `HH:mm` dentro del rango 07:30 - 22:30.
    *   **IDs:** Caracteres alfanuméricos, sin espacios (se recomienda trim).

### Validaciones de Seguridad de Contraseñas
1.  **Política de Contraseña Nueva:**
    *   Longitud mínima: 8 caracteres.
    *   Complejidad: Al menos 1 letra y 1 número.
    *   *Si falla:* Retornar error `PASSWORD_POLICY_VIOLATION`.
2.  **Cambio de Contraseña (`PUT /auth/password`):**
    *   El usuario debe enviar `currentPassword` y `newPassword`.
    *   El backend **debe** validar que `currentPassword` coincida con la almacenada antes de permitir el cambio.
3.  **Recuperación (`POST /auth/recovery`):**
    *   Inputs: `id`, `dni`, `newPassword`.
    *   Lógica: Buscar usuario donde `id` Y `dni` coincidan.
    *   Si no hay coincidencia exacta: Rechazar con error genérico ("Credenciales inválidas") para evitar enumeración de usuarios.

---

## 4. Estrategia de Manejo de Errores

El backend debe devolver respuestas JSON estandarizadas para que el frontend pueda mostrar mensajes adecuados.

### Estructura de Respuesta de Error
```json
{
  "error": {
    "type": "BUSINESS_RULE | VALIDATION | AUTH | SERVER",
    "code": "ERROR_CODE_STRING",
    "message": "Mensaje legible para el usuario final.",
    "details": ["Detalle 1", "Detalle 2"] // Opcional
  }
}
```

### Categorías de Errores y Códigos HTTP

#### A. Errores de Autenticación (401 Unauthorized)
*   **Causa:** Token faltante, inválido o expirado.
*   **Mensaje:** "Sesión expirada o inválida. Por favor inicie sesión nuevamente."

#### B. Errores de Permisos (403 Forbidden)
*   **Causa:** Usuario autenticado intenta acceder a recurso no permitido por su Rol.
*   **Mensaje:** "No tiene permisos para realizar esta acción."

#### C. Errores de Validación de Datos (400 Bad Request)
*   **Causa:** Datos mal formados, tipos incorrectos, campos faltantes.
*   **Code:** `INVALID_INPUT`
*   **Mensaje:** "Los datos enviados son incorrectos." (Incluir array de campos fallidos en `details`).

#### D. Errores de Reglas de Negocio (400 / 409 / 422)
Son errores lógicos donde los datos están bien formados, pero violan una regla del sistema.
*   **Code:** `RULE_MIN_TIME`
    *   *Mensaje:* "Se requieren mínimo 2 horas consecutivas."
*   **Code:** `WINDOW_CLOSED` (HTTP 423 Locked)
    *   *Mensaje:* "La ventana de carga está cerrada para este periodo."
*   **Code:** `DUPLICATE_ENTRY`
    *   *Mensaje:* "El ID o Email ya está registrado en el sistema."

#### E. Errores Internos (500 Internal Server Error)
*   **Causa:** Fallo de base de datos, excepción no controlada.
*   **Mensaje:** "Ha ocurrido un error interno. Contacte a soporte." (Ocultar el stack trace).

---

## 5. Garantías de Seguridad Funcional

1.  **Protección de Contraseñas:**
    *   Las contraseñas **NUNCA** deben ser devueltas en ninguna respuesta API (ni en `/users`, ni en `/me`).
    *   Solo se escriben (hash) y se validan, nunca se leen en texto plano.
2.  **Integridad de Datos:**
    *   No se permite crear versiones de disponibilidad huérfanas (sin instructor o periodo).
    *   No se permite eliminar un Periodo Activo si tiene datos asociados (Soft Delete o Bloqueo).
3.  **Trazabilidad:**
    *   Los campos `createdBy` y `createdAt` deben llenarse automáticamente por el backend basado en el token, nunca confiando en datos enviados por el cliente.
