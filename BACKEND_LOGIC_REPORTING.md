# Lógica Funcional del Backend: Reportes y Estadísticas

Este documento define los procesos de agregación de datos, cálculo de métricas y preparación de estructuras para exportación en el sistema.

## 1. Principio General: Selección de Versión Efectiva (Strategy Pattern)

Para todos los reportes, el sistema debe determinar qué información mostrar por instructor. Se aplica una lógica de **"Cascada" (Fallback)**:

1.  **Nivel 1 (Prioridad Máxima): Versión Final.**
    *   Buscar registro en `AvailabilityVersions` donde `instructorId = X`, `periodId = Activo` y `isFinal = true`.
    *   *Estado:* "FINALIZADO".
2.  **Nivel 2 (Borrador Reciente): Última Versión.**
    *   Si no hay final, buscar el registro con `timestamp` más reciente para ese instructor y periodo.
    *   *Estado:* "BORRADOR" (Indica que el instructor cargó algo, pero no confirmó).
3.  **Nivel 3 (Sin Datos).**
    *   Si no existen registros.
    *   *Estado:* "PENDIENTE" (No ha interactuado con el sistema en este periodo).

---

## 2. Lógica de Estadísticas para Dashboard (`GET /stats`)

El objetivo es proveer contadores rápidos (O(1) o index scan) sin cargar toda la data de versiones.

**Input:** `periodId` (derivado del periodo activo).
**Permisos:** ADMIN, SUPER_ADMIN.

### Algoritmo de Cálculo
1.  **Total Instructores (`total`):**
    *   Query: `COUNT(*)` de usuarios donde `role = 'INSTRUCTOR'` y `active = true`.
2.  **Instructores con Versión Final (`finalized`):**
    *   Query: `COUNT(DISTINCT instructorId)` en tabla `Versions` donde `periodId = Activo` y `isFinal = true`.
3.  **Instructores con Alguna Actividad (`active_users`):**
    *   Query: `COUNT(DISTINCT instructorId)` en tabla `Versions` donde `periodId = Activo`.
4.  **Cálculo Derivado:**
    *   `borradores` = `active_users` - `finalized`.
    *   `pendientes` = `total` - `active_users`.

**Estructura de Respuesta:**
```json
{
  "periodId": "2024-1",
  "generatedAt": "ISO_TIMESTAMP",
  "metrics": {
    "totalInstructors": 50,
    "submittedFinal": 35,
    "draftOnly": 5,
    "pending": 10
  }
}
```

---

## 3. Lógica para Reporte Individual (`GET /reports/instructor/{id}`)

Genera la data detallada de un solo docente.

**Validación de Permisos:**
*   Si el solicitante es INSTRUCTOR: `solicitante.id` debe ser igual a `{id}`.
*   Si el solicitante es ADMIN/SUPER_ADMIN: Acceso permitido.

### Algoritmo de Construcción
1.  **Recuperación de Datos:**
    *   Obtener datos del usuario (Nombre, Email, DNI).
    *   Obtener la **Versión Efectiva** (usando el Principio General).
2.  **Transformación de Bloques (Condensación):**
    *   La base de datos guarda slots discretos (ej. `["Lunes-08:00", "Lunes-08:30", "Lunes-09:00"]`).
    *   El reporte debe condensarlos visualmente.
    *   *Lógica:* Ordenar slots -> Detectar continuidad -> Crear rangos "Hora Inicio - Hora Fin".
    *   *Resultado:* "Lunes: 08:00 - 09:30".
3.  **Enriquecimiento:**
    *   Añadir metadatos: Fecha de generación, ID de la versión usada, Tipo de origen ("Final" o "Última").

**Estructura de Respuesta (Data Object para PDF/Excel):**
```json
{
  "reportMetadata": { "generatedBy": "UserID", "timestamp": "..." },
  "instructor": { "name": "Juan Perez", "id": "INST001" },
  "availabilityStatus": "FINALIZADO",
  "versionDate": "2024-03-20T10:00:00Z",
  "comments": "Prefiero las mañanas.",
  "condensedSchedule": [
    { "day": "Lunes", "ranges": ["08:00 - 12:00", "14:00 - 16:00"] },
    { "day": "Martes", "ranges": ["08:00 - 12:00"] }
  ]
}
```

---

## 4. Lógica para Reporte Consolidado (`GET /reports/consolidated`)

Genera una matriz masiva ("Sábana de datos") para administración.

**Permisos:** ADMIN, SUPER_ADMIN Exclusivamente.

### Algoritmo de Generación
1.  **Carga Masiva:** Obtener lista completa de Instructores Activos.
2.  **Iteración y Cruce:**
    *   Para cada instructor, buscar su Versión Efectiva.
    *   *Optimización:* Se recomienda hacer una sola query que traiga la última versión de todos y mapearla en memoria, en lugar de N queries.
3.  **Aplanamiento (Flattening):**
    *   Para formatos Excel/CSV, los datos deben ser filas planas.
    *   Se genera una fila por cada **Rango Continuo** de disponibilidad.
4.  **Columnas Calculadas:**
    *   `Estado`: FINAL / BORRADOR / PENDIENTE.
    *   `Horas Totales`: Suma de bloques * 0.5.

**Estructura de Respuesta (Lista Plana):**
Esta estructura está optimizada para ser convertida directamente a CSV por el frontend o un servicio de streaming.

```json
{
  "period": "2024-1",
  "rows": [
    {
      "instructorId": "INST001",
      "instructorName": "Juan Perez",
      "status": "FINAL",
      "day": "Lunes",
      "start": "08:00",
      "end": "12:00",
      "comments": "..."
    },
    {
      "instructorId": "INST001",
      "instructorName": "Juan Perez",
      "status": "FINAL",
      "day": "Lunes",
      "start": "14:00",
      "end": "16:00",
      "comments": "..."
    },
    {
      "instructorId": "INST002",
      "instructorName": "Ana Gomez",
      "status": "PENDIENTE",
      "day": "N/A",
      "start": "-",
      "end": "-",
      "comments": ""
    }
  ]
}
```

---

## 5. Reglas de Formato y Validación

1.  **Integridad del Periodo:** Todos los reportes deben llevar explícitamente el nombre e ID del periodo académico al que corresponden los datos. No mezclar periodos.
2.  **Timestamps:** Todas las fechas deben estar en UTC (ISO 8601) en el backend y ser localizadas por el cliente al momento de imprimir.
3.  **Manejo de Nulos:**
    *   Si un instructor no tiene disponibilidad, debe aparecer en el reporte consolidado con estado "PENDIENTE" o "SIN DISPONIBILIDAD" y celdas de horario vacías, no debe ser omitido de la lista.
