# Especificación del Comportamiento del Calendario - Sistema RBAC

Este documento detalla la lógica funcional, reglas de negocio y comportamiento de interfaz del módulo **AvailabilityScheduler** (Calendario de Disponibilidad).

## 1. Visualización de la Semana

El calendario se renderiza como una matriz interactiva.

*   **Eje X (Columnas):** Representa los días de la semana operativos.
    *   Lunes, Martes, Miércoles, Jueves, Viernes, Sábado.
    *   La primera columna es fija y muestra las etiquetas de hora.
*   **Eje Y (Filas):** Representa intervalos de tiempo de 30 minutos.
    *   **Rango:** 07:30 AM a 10:30 PM (22:30).
    *   **Total de bloques por día:** 30 bloques.

## 2. Estados Visuales de los Bloques (Celdas)

Cada celda `(Día, Hora)` puede tener uno de los siguientes estados visuales mutuamente excluyentes:

| Estado | Apariencia Visual | Significado Funcional |
| :--- | :--- | :--- |
| **Disponible (Vacío)** | Fondo Blanco, Borde Gris Claro (`bg-white border-slate-100`) | El instructor NO está disponible en este horario. |
| **Seleccionado** | Fondo Azul Intenso, Sombra Suave (`bg-blue-500 shadow-sm`) | El instructor declara disponibilidad en este horario. |
| **Hover (Interacción)** | Fondo Gris Muy Claro (Si vacío) o Escala ligera (Si lleno) | Feedback visual al pasar el mouse indicando que es clicable. |
| **Deshabilitado** | Opacidad reducida (0.8), Cursor Default | El calendario está en modo "Solo Lectura" (Ventana cerrada o Historial). |

## 3. Interacciones del Usuario

### Selección Simple
*   **Evento:** `Click` en una celda.
*   **Comportamiento:** Toggle (Alternancia).
    *   Si estaba vacío -> Pasa a Seleccionado.
    *   Si estaba seleccionado -> Pasa a Vacío.

### Restricciones de Interacción
La interacción está **bloqueada** (no dispara eventos) si:
1.  La variable `readOnly` es `true` (Vista de Administrador).
2.  La propiedad del periodo `isOpenForSubmission` es `false`.
3.  El usuario está visualizando una versión histórica (`viewingVersionId !== null`).

## 4. Validaciones Previas al Guardado

La validación se ejecuta en el cliente (`services/utils.ts`) al presionar el botón "Guardar".

### Regla de Continuidad (Regla de Negocio Crítica)
*   **Lógica:** No se permiten bloques de tiempo aislados que sumen menos de 2 horas.
*   **Algoritmo:**
    1.  Agrupar los índices de los bloques seleccionados por día.
    2.  Ordenar los índices de menor a mayor.
    3.  Iterar para encontrar cadenas consecutivas (donde `index[i] === index[i-1] + 1`).
    4.  Si una cadena tiene una longitud `< 4` (4 bloques * 30 min = 2 horas), la validación falla.

### Feedback de Validación
*   **Éxito:** Se procede al guardado.
*   **Error:**
    *   Se detiene el proceso.
    *   Se muestra una alerta visual (Toast/Banner) de color **Rojo**.
    *   **Mensaje Específico:** "En [Día] a las [Hora Inicio], tienes un bloque aislado de menos de 2 horas consecutivas. Mínimo 4 casillas continuas."

## 5. Guardado de Disponibilidad

El proceso de guardado genera una **Nueva Versión** (Snapshot) en el historial. No se sobrescriben los datos anteriores.

1.  **Disparador:** Botón "Guardar" en la barra de herramientas.
2.  **Verificación de Estado:** Se confirma que `period.isOpenForSubmission` sea `true`.
3.  **Captura de Datos:**
    *   Array de IDs de slots seleccionados (`['Lunes-07:30', 'Lunes-08:00', ...]`).
    *   Texto del campo "Observaciones".
    *   Timestamp actual (ISO String).
4.  **Acción:** Se añade un objeto `AvailabilityVersion` al array global de disponibilidades.
5.  **Resultado Visual:**
    *   Mensaje de éxito (Verde): "Nueva versión guardada correctamente".
    *   El contador en la lista de historial aumenta en +1.
    *   La nueva versión aparece en el tope de la lista lateral.

## 6. Marcado de "Versión Final"

La "Versión Final" es la única que el sistema tomará en cuenta para los reportes consolidados administrativos.

*   **Ubicación:** Botón "Hacer Final" dentro de cada ítem en la lista lateral "Historial de Versiones".
*   **Comportamiento:**
    1.  Recorre todas las versiones del usuario para el periodo actual.
    2.  Establece `isFinal = false` para todas.
    3.  Establece `isFinal = true` para la versión seleccionada por el usuario.
    4.  Actualiza el estado visual: Aparece un Badge "FINAL" verde en el ítem del historial.
*   **Regla:** Solo puede existir **una** versión final activa por instructor/periodo.

## 7. Carga de Versiones Anteriores (Historial)

El sistema permite navegar por el tiempo para ver qué se envió anteriormente.

### Modo Edición (Default)
*   Muestra la última configuración guardada o la marcada como final.
*   Permite hacer clic en las celdas para modificar.
*   Botones de acción: "Guardar", "Observaciones".

### Modo Lectura (Histórico)
*   Se activa al hacer clic en el botón "Ver" (Icono Ojo) de un ítem del historial.
*   **Indicadores Visuales:**
    *   Banner superior naranja: "Modo Lectura: Histórico".
    *   Grilla del calendario con opacidad reducida.
    *   Celdas no clicables.
*   **Acciones Permitidas:**
    *   "Volver a Actual": Regresa al Modo Edición.
    *   "Restaurar" (Botón de flecha circular): Copia los datos de esa versión histórica y los "pega" en el editor actual, permitiendo al usuario modificarlos y guardarlos como una nueva versión futura.
