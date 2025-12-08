# Escenarios de Error Complejos y Manejo de Excepciones
**Sistema de Gestión de Disponibilidad de Instructores (RBAC)**

Este documento define la matriz de respuesta ante situaciones anómalas, intentos de violación de reglas de negocio y errores de integridad.

---

## 1. Errores de Disponibilidad (Actor: Instructor)

Estos escenarios ocurren cuando el instructor interactúa con el calendario y el proceso de guardado.

| ID | Escenario / Descripción | Detección Backend | Mensaje Funcional (API) | Comportamiento UI (Usuario) | Regla de Negocio Protegida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ERR-INS-01** | **Envío fuera de Ventana**<br>Instructor tenía el editor abierto, el Admin cerró la ventana, y el Instructor intentó guardar después. | Verificar `Period.isOpenForSubmission` == `false` al recibir el POST. | `423 Locked`: "La ventana de carga ha sido cerrada por la administración." | Mostrar Alerta Roja (Toast/Banner). Deshabilitar controles de edición tras cerrar alerta. | **Integridad del Periodo:** No permitir cambios fuera de fecha límite. |
| **ERR-INS-02** | **Bloques Aislados (< 2 Horas)**<br>Selección de 1 hora (2 bloques) o 1.5 horas (3 bloques). | Algoritmo de continuidad detecta cadena con `length < 4`. | `400 Bad Request`: "Bloque insuficiente en [Día] [Hora]. Mínimo 2 horas consecutivas." | Resaltar visualmente el grupo de celdas problemático en rojo o mostrar mensaje específico. | **Calidad Académica:** Evitar desplazamientos cortos de docentes. |
| **ERR-INS-03** | **Discontinuidad entre Días**<br>Seleccionar Lunes 22:00 y Martes 07:30. | Algoritmo agrupa por día. Lunes tiene 1 bloque, Martes tiene 1 bloque. Ambos < 4. | `400 Bad Request`: "Bloque insuficiente en Lunes. La continuidad no cruza días." | Mensaje de error explicando que cada día se valida independientemente. | **Lógica Temporal:** Los días son unidades independientes. |
| **ERR-INS-04** | **Sin Periodo Activo**<br>Instructor intenta entrar al sistema cuando no hay ningún periodo marcado como `isActive`. | Middleware verifica existencia de `currentPeriod`. | `503 Service Unavailable`: "No hay un periodo académico activo configurado." | Redirección a pantalla de "Mantenimiento / Espera" o mensaje bloqueante en Dashboard. | **Integridad Estructural:** Los datos deben pertenecer a un periodo. |
| **ERR-INS-05** | **Duplicidad de Versión Final**<br>Race condition: Intenta marcar Final dos veces muy rápido. | Transacción BD verifica y limpia flags anteriores antes de setear el nuevo. | `200 OK` (La segunda petición sobrescribe la primera correctamente, es idempotente en resultado). | Feedback de éxito normal. El usuario ve la etiqueta "Final" en la versión deseada. | **Unicidad de la Verdad:** Solo una versión final por periodo. |

---

## 2. Errores Administrativos (Actor: Admin)

Errores relacionados con la gestión de usuarios y configuración.

| ID | Escenario / Descripción | Detección Backend | Mensaje Funcional (API) | Comportamiento UI (Usuario) | Regla de Negocio Protegida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ERR-ADM-01** | **Alta de Instructor Duplicado**<br>Crear instructor con ID o Email existente. | Restricción `UNIQUE` en BD (columna `id`, `email`). | `409 Conflict`: "El ID 'INST001' o el email ya están registrados." | Formulario marca en rojo los campos duplicados y no se cierra el modal. | **Unicidad de Identidad:** No puede haber dos usuarios iguales. |
| **ERR-ADM-02** | **Carga Masiva Corrupta**<br>Archivo CSV con columnas faltantes o datos inválidos (ej. ID vacío). | Parser CSV valida cabeceras y tipos de datos por fila. | `400 Bad Request`: "Error de estructura en archivo. Fila 15: ID requerido." | Mostrar resumen de errores línea por línea. No procesar ninguna inserción (Rollback total). | **Calidad de Datos:** Evitar "basura" en la base de datos. |
| **ERR-ADM-03** | **Acceso Sin Permiso (Granular)**<br>Admin "Gestor de Instructores" intenta llamar API de `/config`. | Middleware revisa `user.permissions.canManageConfig`. | `403 Forbidden`: "No tiene permisos para modificar la configuración." | El usuario no debería ver el botón, pero si fuerza URL, ve página de "Acceso Denegado". | **RBAC (Least Privilege):** Solo acceso a lo necesario. |
| **ERR-ADM-04** | **Auto-Eliminación**<br>Admin intenta borrar su propia cuenta por error. | Comparar `request.params.id` con `token.userId`. | `400 Bad Request`: "No puedes eliminar tu propia cuenta mientras está activa." | Botón de eliminar deshabilitado para el propio usuario en la lista. | **Disponibilidad Operativa:** Prevenir bloqueos accidentales. |

---

## 3. Errores de Super Administrador (Actor: Super Admin)

| ID | Escenario / Descripción | Detección Backend | Mensaje Funcional (API) | Comportamiento UI (Usuario) | Regla de Negocio Protegida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ERR-SUP-01** | **Admin Sin Permisos**<br>Crear un Admin desmarcando todos los checkboxes de permisos. | Validación lógica en Controller. | `400 Bad Request`: "Un administrador debe tener al menos un permiso asignado." | Mensaje de validación en el formulario de creación. | **Utilidad de Cuentas:** Evitar cuentas administrativas "fantasma". |
| **ERR-SUP-02** | **Conflicto de Roles**<br>Intentar cambiar el rol de un usuario Instructor a Admin sin limpiar sus disponibilidades. | Lógica de Negocio: Verificar si tiene `AvailabilityVersions`. | `409 Conflict`: "El usuario tiene historial como instructor. No puede cambiarse a Admin." | Sugerir crear cuenta nueva o archivar/eliminar historial primero. | **Consistencia de Datos:** Separación clara de roles y datos. |

---

## 4. Errores de Integridad y Lógica de Negocio

| ID | Escenario / Descripción | Detección Backend | Mensaje Funcional (API) | Comportamiento UI (Usuario) | Regla de Negocio Protegida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ERR-BUS-01** | **Reporte sin Datos**<br>Instructor sin versiones intenta generar reporte individual. | Query retorna 0 resultados. | `404 Not Found`: "No se encontraron registros de disponibilidad para este periodo." | Mostrar estado vacío o deshabilitar botón de descarga. | **Coherencia de Reportes:** No generar archivos vacíos. |
| **ERR-BUS-02** | **Cambio de Periodo Destructivo**<br>Admin inicia "Nuevo Periodo" accidentalmente. | N/A (Es una acción válida pero peligrosa). | N/A | **Mitigación UI:** Modal de Doble Confirmación con input de texto "CONFIRMAR". | **Continuidad Operativa:** Evitar pérdida de contexto masiva. |
| **ERR-BUS-03** | **Eliminación con Dependencias**<br>Intentar borrar Instructor que ya tiene Disponibilidad cargada. | Constraint FK en BD (`ON DELETE RESTRICT`). | `409 Conflict`: "No se puede eliminar. El instructor tiene versiones asociadas." | Sugerir "Desactivar usuario" (`active: false`) en lugar de borrar. | **Integridad Referencial:** No dejar registros huérfanos. |

---

## 5. Errores de Autenticación y Sesión

| ID | Escenario / Descripción | Detección Backend | Mensaje Funcional (API) | Comportamiento UI (Usuario) | Regla de Negocio Protegida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ERR-SEC-01** | **Token Expirado**<br>Usuario deja la pestaña abierta 24h e intenta guardar. | Validación JWT (`exp` claim). | `401 Unauthorized`: "Su sesión ha expirado." | Redirección automática al Login. Alerta "Sesión caducada". | **Seguridad de Sesión:** Limitar ventanas de ataque. |
| **ERR-SEC-02** | **Manipulación de Token**<br>Usuario intenta modificar el payload del JWT para elevar privilegios. | Fallo de verificación de firma criptográfica. | `401 Unauthorized`: "Token inválido." | Logout inmediato. | **Integridad de Identidad:** Confianza cero en el cliente. |
| **ERR-SEC-03** | **Usuario Desactivado**<br>Admin desactiva a Instructor mientras este navega. | Middleware consulta `user.active` en cada request crítico. | `403 Forbidden`: "Su cuenta ha sido desactivada." | Logout forzoso en la siguiente acción que requiera servidor. | **Control de Acceso:** Revocación inmediata. |

---

## 6. Errores Técnicos y de Servidor

| ID | Escenario / Descripción | Detección Backend | Mensaje Funcional (API) | Comportamiento UI (Usuario) | Regla de Negocio Protegida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ERR-SYS-01** | **Base de Datos Caída** | Excepción de conexión en ORM/Driver. | `500 Internal Server Error`: "Error de conexión con el servicio de datos." | Pantalla de "Servicio no disponible momentáneamente". | **Resiliencia:** Manejo elegante de fallos de infraestructura. |
| **ERR-SYS-02** | **Timeout de Reporte**<br>Generar consolidado con 5000 instructores tarda > 30s. | Timeout del servidor HTTP/Proxy. | `504 Gateway Timeout`: "El reporte tarda demasiado. Intente filtrar por grupos." | UI muestra spinner y luego mensaje sugiriendo reintentar. | **Performance:** UX en procesos pesados. |
