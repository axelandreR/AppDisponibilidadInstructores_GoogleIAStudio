# Camino Crítico y Flujo de Desarrollo Funcional
**Sistema de Gestión de Disponibilidad de Instructores (RBAC)**

Este documento estratégico define las dependencias lógicas, el camino crítico para el MVP y los riesgos funcionales del proyecto.

---

## 1. Dependencias Funcionales

Antes de desarrollar cualquier módulo, es crucial entender qué "piezas" necesita para funcionar.

### A. Dependencias del Periodo Académico (El "Contexto")
**Nivel de Dependencia: BLOQUEANTE**
Nadie puede registrar disponibilidad si no existe un "contenedor" de tiempo.
*   **Módulo Disponibilidad:** Depende al 100% de que exista un `Periodo Activo` y de la bandera `isOpenForSubmission`.
*   **Módulo Reportes:** Los reportes requieren el `PeriodoID` para filtrar datos.
*   **Dashboard:** Las estadísticas se calculan basándose en el periodo actual.

### B. Dependencias de Autenticación y Usuarios
**Nivel de Dependencia: ESTRUCTURAL**
*   **Disponibilidad:** Requiere un `InstructorID` validado.
*   **Recuperación de Clave:** Depende de que existan datos previos (DNI) cargados en el perfil del usuario.

### C. Dependencias del RBAC (Roles)
**Nivel de Dependencia: SEGURIDAD**
*   **Menús de Navegación:** Dependen del Rol para renderizarse.
*   **Endpoints de API:** Dependen del Middleware de permisos.

### D. Dependencias del Calendario
**Nivel de Dependencia: LÓGICA DE NEGOCIO**
*   **Guardado:** No se puede guardar si la validación visual de "2 horas consecutivas" falla.
*   **Reportes:** No se puede generar un reporte si el formato de los slots (`Dia-Hora`) no es consistente.

---

## 2. Camino Crítico del Proyecto (CPM)

El **Camino Crítico** es la secuencia de tareas que determina la duración mínima del proyecto. Si una de estas tareas se retrasa, se retrasa el lanzamiento del MVP.

1.  **Definición de Estructura de Datos:** (Usuarios + Periodo + Versiones).
2.  **Configuración Base:** Crear el primer Periodo Académico.
3.  **Autenticación:** Login básico (Instructor).
4.  **Interfaz de Calendario (Editor):** Implementar la grilla interactiva.
5.  **Validación de Negocio (Core):** Algoritmo de 2 horas consecutivas.
6.  **Persistencia:** Guardar la disponibilidad (Backend).
7.  **Versionado Básico:** Marcar "Final" (Indispensable para saber qué es oficial).
8.  **Exportación de Datos:** Reporte Consolidado (Sin esto, la información no sirve a la administración).

**Elementos Fuera del Camino Crítico (Holgura permitida):**
*   Dashboard Gráfico (Se puede lanzar con tablas simples).
*   Carga Masiva de Instructores (Se pueden cargar manualmente o vía script DB inicialmente).
*   Gestión Granular de Admins (Se pueden crear Admins manualmente en BD al inicio).

---

## 3. Flujo de Desarrollo Recomendado

Este orden optimiza la entrega de valor y permite pruebas tempranas de lo más riesgoso.

### Paso 1: Cimientos (Configuración y Acceso)
*   **Justificación:** Sin Periodo no hay sistema. Sin Login no hay usuarios.
*   *Entregable:* Admin puede configurar un periodo. Usuarios pueden loguearse.

### Paso 2: El Núcleo (Disponibilidad y Validación)
*   **Justificación:** Es la funcionalidad más compleja y con mayor riesgo de error humano. Debe probarse cuanto antes.
*   *Entregable:* Instructor puede marcar bloques, el sistema valida las 2 horas y bloquea errores.

### Paso 3: Ciclo de Vida del Dato (Guardar y Versionar)
*   **Justificación:** Validar en pantalla no sirve si no se guarda. El versionado es clave para evitar disputas ("Yo envié esto, no aquello").
*   *Entregable:* Instructor guarda versiones y marca la final.

### Paso 4: Visibilidad Administrativa (Lectura y Gestión)
*   **Justificación:** Una vez que los instructores cargan datos, los admins necesitan verlos para validarlos.
*   *Entregable:* Admin puede ver listas y detalles (Solo Lectura).

### Paso 5: Salida de Información (Reportes)
*   **Justificación:** El objetivo final del sistema es generar el horario académico.
*   *Entregable:* Excel consolidado.

### Paso 6: Gobernanza y Refinamiento (RBAC Fino y Dashboard)
*   **Justificación:** Capa de seguridad administrativa y mejoras visuales.
*   *Entregable:* Super Admin gestionando permisos y Dashboard visual.

---

## 4. Riesgos Funcionales Detectados

| Riesgo | Impacto | Probabilidad | Descripción |
| :--- | :--- | :--- | :--- |
| **Inconsistencia de Horario** | Crítico | Media | Que el algoritmo de validación permita guardar huecos de 30 min por error de lógica en fronteras de días. |
| **Confusión de Versión** | Alto | Alta | Que el instructor guarde 5 versiones pero olvide marcar la "Final", y el reporte administrativo salga vacío o con datos viejos. |
| **Cierre Prematuro** | Medio | Baja | Que un Admin cierre la ventana de carga mientras instructores están editando, provocando pérdida de datos no guardados. |
| **Autbloqueo RBAC** | Alto | Baja | Que un Super Admin elimine sus propios permisos o su cuenta por error, dejando el sistema acéfalo. |
| **Formato de Exportación** | Medio | Media | Que el Excel generado no sea compatible con el sistema posterior de horarios de la institución. |

---

## 5. Medidas Funcionales de Mitigación

### Para Inconsistencia de Horario:
*   **Doble Validación:** Implementar la lógica de validación de 2 horas tanto en el Frontend (UX inmediata) como en el Backend (Seguridad final).
*   **Unit Testing:** Crear tests automáticos para patrones de horario complejos (bordes de día, saltos).

### Para Confusión de Versión:
*   **Lógica de Fallback Inteligente:** Si el instructor no marca "Final", el sistema en el reporte debe tomar automáticamente la **Última Versión Guardada** y marcarla en el reporte como "Borrador Reciente" (no ignorarla).
*   **Alertas UI:** Mostrar un banner amarillo al instructor si tiene borradores pero ninguna versión final marcada.

### Para Cierre Prematuro:
*   **Grace Period (Opcional):** Permitir guardar cambios iniciados antes del cierre (complejo técnicamente).
*   **Check Simple:** El frontend verifica el estado de la ventana *antes* de enviar la petición y avisa al usuario visualmente.

### Para Autobloqueo RBAC:
*   **Regla de Negocio:** El Backend debe prohibir `DELETE /admins/{id}` si `{id} === currentUser.id`.

### Para Formato de Exportación:
*   **Estandarización:** Usar formato CSV plano y simple (universal). Evitar celdas fusionadas o estilos complejos en la primera versión.
