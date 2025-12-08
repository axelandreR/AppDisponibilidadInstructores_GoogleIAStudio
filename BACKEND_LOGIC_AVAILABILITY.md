# Lógica Funcional del Backend: Gestión de Disponibilidad y Versionado

Este documento describe la lógica interna, algoritmos y reglas de negocio que el Backend debe implementar para gestionar el ciclo de vida de la disponibilidad de los instructores.

## 1. Modelo Conceptual de Datos

Para soportar el versionado y la inmutabilidad, el sistema no debe "actualizar" registros de disponibilidad, sino "insertar" nuevas instantáneas.

**Entidad: `AvailabilityVersion`**
*   **ID:** Identificador único (UUID).
*   **InstructorID:** Referencia al usuario.
*   **PeriodID:** Referencia al periodo académico.
*   **Timestamp:** Fecha y hora exacta de creación (UTC).
*   **Slots:** Estructura JSON o Array que contiene los bloques seleccionados (ej: `["Lunes-07:30", "Lunes-08:00"]`).
*   **Comments:** Texto de observaciones.
*   **IsFinal:** Booleano. Indica si esta es la versión "oficial" para el periodo.

---

## 2. Operación: Recepción y Guardado (`POST /availability`)

### Fase 1: Validación de Contexto (Pre-Flight Checks)
Antes de procesar los datos, el backend verifica el estado del entorno:

1.  **Validación de Instructor:**
    *   ¿El `instructorId` existe en la base de datos?
    *   ¿El usuario tiene `active: true`?
    *   *Si falla:* Retorna error `404 Not Found` o `403 Forbidden`.
2.  **Validación de Periodo:**
    *   Recuperar el Periodo Académico Activo.
    *   ¿Existe un periodo activo?
    *   *Si falla:* Retorna error `409 Conflict` ("No hay periodo académico configurado").
3.  **Validación de Ventana de Carga:**
    *   Verificar la bandera `isOpenForSubmission` del periodo.
    *   **Excepción de Rol:** Si el usuario es ADMIN o SUPER_ADMIN, se puede ignorar esta validación (opcional, según regla estricta).
    *   *Si falla (Instructor):* Retorna error `423 Locked` ("La ventana de carga está cerrada").

### Fase 2: Validación de Reglas de Negocio (El Algoritmo)
El backend procesa la lista de bloques recibida (`slots`).

1.  **Sanitización:**
    *   Verificar que cada slot tenga el formato `DIA-HORA`.
    *   Verificar que la hora esté en el rango permitido (07:30 - 22:30).
    *   Eliminar duplicados si existen.
2.  **Detección de Continuidad (Regla de 2 Horas):**
    *   **Paso A:** Agrupar los slots por Día.
    *   **Paso B:** Para cada día, convertir las horas a índices numéricos (ej. 07:30 = 0, 08:00 = 1, etc.).
    *   **Paso C:** Ordenar los índices ascendentemente.
    *   **Paso D (Algoritmo de Islas):** Recorrer el array ordenado. Si `index[i] != index[i-1] + 1`, se rompe la cadena.
    *   **Paso E:** Evaluar la longitud de cada cadena detectada.
    *   **Condición de Fallo:** Si existe alguna cadena con longitud `< 4` (menos de 2 horas), la validación falla.
    *   *Respuesta de Error:* Debe ser específica. Ej: `{ "code": "RULE_MIN_TIME", "message": "Bloque aislado detectado el Lunes a las 09:00. Mínimo requerido: 2 horas." }`.

### Fase 3: Persistencia (Creación de Versión)
Si todas las validaciones pasan:

1.  Crear un nuevo registro `AvailabilityVersion`.
2.  Establecer `isFinal = false` por defecto (el usuario debe marcarla explícitamente después, o enviarlo como flag opcional).
3.  Guardar en base de datos.
4.  **No borrar** versiones anteriores.
5.  *Respuesta:* `201 Created` con el ID de la nueva versión.

---

## 3. Operación: Marcado de Versión Final (`PUT .../final`)

Esta operación asegura la unicidad de la versión final por instructor y periodo. Debe ejecutarse de manera **Transaccional** (Atomicidad).

**Input:** `versionId`, `instructorId` (derivado del token), `periodId` (derivado de la versión).

### Lógica Transaccional:
1.  **Inicio de Transacción.**
2.  **Validación de Propiedad:** Verificar que la versión pertenezca al instructor que solicita la acción (o que sea Admin).
3.  **Validación de Ventana:** Verificar nuevamente que `isOpenForSubmission` sea `true`.
4.  **Reset Masivo:**
    *   Ejecutar Update: `SET isFinal = false WHERE instructorId = X AND periodId = Y`.
    *   Esto asegura que cualquier versión final anterior deje de serlo.
5.  **Set Final:**
    *   Ejecutar Update: `SET isFinal = true WHERE id = versionId`.
6.  **Confirmación (Commit).**

*Respuesta:* `200 OK` ("Versión marcada como final exitosamente").

---

## 4. Operación: Consulta y Consolidación (`GET`)

### A. Listar Historial (`/history`)
*   **Lógica:** `SELECT * FROM versions WHERE instructorId = X AND periodId = Y ORDER BY timestamp DESC`.
*   Devuelve todas las versiones para que el frontend construya la lista lateral.

### B. Obtener Versión "Efectiva" (Para Reportes)
Esta es la lógica crítica para generar el Excel consolidado o la vista administrativa por defecto.

**Algoritmo de Selección:**
1.  **Consulta Prioritaria:** Buscar registro donde `instructorId = X AND periodId = Y AND isFinal = true`.
2.  **Evaluación:**
    *   **Caso 1 (Existe Final):** Retornar este registro. Origen: "CONFIRMADO".
    *   **Caso 2 (No existe Final):** Buscar el registro más reciente (`ORDER BY timestamp DESC LIMIT 1`).
        *   Si existe: Retornar este registro. Origen: "BORRADOR RECIENTE".
        *   Si no existe: Retornar Null. Origen: "SIN DATOS".

---

## 5. Estructuras de Respuesta Funcional

El backend debe normalizar las respuestas para que el frontend pueda reaccionar (mostrar alertas rojas, verdes, etc.).

### Caso: Error de Validación de Negocio (400)
```json
{
  "status": "error",
  "code": "VALIDATION_RULE_BROKEN",
  "message": "La disponibilidad no cumple con las reglas mínimas.",
  "details": {
    "rule": "MIN_2_HOURS_CONSECUTIVE",
    "conflictDay": "Lunes",
    "conflictTime": "14:00"
  }
}
```

### Caso: Ventana Cerrada (423)
```json
{
  "status": "error",
  "code": "SUBMISSION_WINDOW_CLOSED",
  "message": "El periodo de carga ha finalizado. No se permiten cambios.",
  "periodId": "2024-1"
}
```

### Caso: Éxito (201/200)
```json
{
  "status": "success",
  "data": {
    "versionId": "uuid-1234...",
    "timestamp": "2024-03-20T10:00:00Z",
    "isFinal": false,
    "slotCount": 12
  }
}
```
