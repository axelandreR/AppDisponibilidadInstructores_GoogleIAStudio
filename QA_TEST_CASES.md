# Casos de Prueba Funcionales (QA)
**Sistema de Gestión de Disponibilidad de Instructores con RBAC**

Este documento detalla los escenarios de prueba necesarios para validar la conformidad del sistema con los requisitos funcionales y de seguridad.

---

## 1. Módulo de Autenticación

| ID | Objetivo | Precondiciones | Pasos | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **QA-AUTH-01** | **Inicio de Sesión Exitoso** | Usuario registrado y activo (`active: true`). | 1. Ingresar a `/login`.<br>2. Introducir ID válido.<br>3. Introducir contraseña correcta.<br>4. Clic en "Ingresar". | Redirección al Dashboard correspondiente según el rol (Instructor -> `/availability`, Admin -> `/admin/dashboard`). |
| **QA-AUTH-02** | **Fallo por Credenciales** | Usuario registrado. | 1. Ingresar ID válido.<br>2. Introducir contraseña incorrecta.<br>3. Clic en "Ingresar". | Mensaje de error visible: "Credenciales inválidas" o similar. No redirige. |
| **QA-AUTH-03** | **Usuario Inactivo** | Usuario con flag `active: false`. | 1. Ingresar credenciales correctas.<br>2. Clic en "Ingresar". | Acceso denegado. Mensaje: "Cuenta deshabilitada/inactiva". |
| **QA-AUTH-04** | **Recuperación de Contraseña (ID+DNI)** | Usuario con ID y DNI conocidos. | 1. Clic en "¿Olvidaste tu contraseña?".<br>2. Ingresar ID y DNI correctos.<br>3. Validar.<br>4. Ingresar nueva contraseña y confirmación. | Mensaje de éxito. Usuario redirigido al Login. La nueva contraseña permite el acceso. |
| **QA-AUTH-05** | **Recuperación Fallida (Datos Erróneos)** | N/A | 1. En recuperación, ingresar ID correcto pero DNI incorrecto. | Mensaje de error genérico (por seguridad): "Los datos no coinciden". No permite cambiar contraseña. |
| **QA-AUTH-06** | **Cambio de Contraseña (Perfil)** | Sesión iniciada como Instructor. | 1. Ir a "Mi Perfil".<br>2. Ingresar contraseña actual correcta.<br>3. Ingresar nueva contraseña simple (ej. "123"). | Error de validación: "La contraseña debe tener mín. 8 caracteres, letras y números". No guarda cambios. |

---

## 2. Módulo de Disponibilidad (Instructor)

| ID | Objetivo | Precondiciones | Pasos | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **QA-AVAIL-01** | **Validación de Regla de 2 Horas (Fallo)** | Ventana de carga abierta. | 1. Seleccionar bloque Lunes 08:00.<br>2. Seleccionar bloque Lunes 08:30 (Total 1 hora).<br>3. Clic en "Guardar". | **Error Bloqueante.** Alerta indicando: "Bloque aislado en Lunes a las 08:00. Mínimo 2 horas consecutivas". No se crea nueva versión. |
| **QA-AVAIL-02** | **Validación de Regla de 2 Horas (Éxito)** | Ventana de carga abierta. | 1. Seleccionar Lunes 08:00, 08:30, 09:00, 09:30 (Total 2 horas).<br>2. Clic en "Guardar". | **Éxito.** Mensaje "Versión guardada". Contador de historial aumenta +1. |
| **QA-AVAIL-03** | **Ventana de Carga Cerrada** | Periodo configurado con `isOpenForSubmission: false`. | 1. Instructor intenta hacer clic en celdas del calendario.<br>2. Instructor busca el botón "Guardar". | Las celdas no reaccionan al clic (solo lectura). El botón "Guardar" está oculto o deshabilitado. Se muestra aviso de "Ventana Cerrada". |
| **QA-AVAIL-04** | **Creación de Nueva Versión** | Historial existente. | 1. Cargar última versión.<br>2. Modificar un bloque.<br>3. Guardar. | Se crea una **nueva** entrada en el historial con timestamp actual. La versión anterior permanece intacta en el historial. |
| **QA-AVAIL-05** | **Marcado de Versión Final** | Al menos 2 versiones guardadas. | 1. Identificar una versión antigua en el historial.<br>2. Clic en "Hacer Final". | Esa versión obtiene la etiqueta "FINAL". Cualquier otra versión que tuviera la etiqueta la pierde. |
| **QA-AVAIL-06** | **Descarga de Reporte Individual** | Instructor con datos guardados. | 1. Clic en botón "Reporte". | Se descarga un archivo `.csv` que contiene los datos de la versión visualizada o la final. |

---

## 3. Módulo de Calendario (UI & Lógica)

| ID | Objetivo | Precondiciones | Pasos | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **QA-CAL-01** | **Límites de Horario** | N/A | 1. Verificar primera y última hora de la grilla. | La grilla comienza estrictamente a las **07:30** y termina a las **22:30**. No hay bloques fuera de este rango. |
| **QA-CAL-02** | **Discontinuidad Multidía** | N/A | 1. Seleccionar Lunes 22:00 y 22:30.<br>2. Seleccionar Martes 07:30 y 08:00. | El sistema debe tratar Lunes y Martes como grupos separados. Debe fallar al guardar porque Lunes tiene solo 1h y Martes solo 1h (aunque visualmente parezcan continuos). |
| **QA-CAL-03** | **Modo Lectura Histórico** | Instructor visualizando versión antigua. | 1. Seleccionar una versión del historial (clic en "Ver").<br>2. Intentar modificar la grilla. | La interfaz muestra "Modo Lectura". No permite seleccionar/deseleccionar celdas. |

---

## 4. Módulo de Administración

| ID | Objetivo | Precondiciones | Pasos | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **QA-ADMIN-01** | **Búsqueda de Instructor** | Lista de instructores cargada. | 1. Escribir "Juan" en el buscador. | La tabla se filtra mostrando solo registros que contengan "Juan" en nombre, ID o email. |
| **QA-ADMIN-02** | **Filtro por Estado** | Instructores con y sin envíos. | 1. Seleccionar filtro "Pendientes". | La tabla muestra solo instructores que no tienen ninguna versión registrada para el periodo actual. |
| **QA-ADMIN-03** | **Visualización (Solo Lectura)** | Instructor con disponibilidad cargada. | 1. Buscar instructor.<br>2. Clic en icono "Ojo". | Se abre el calendario del instructor. Se verifica que el Admin **NO** pueda modificar las celdas (ReadOnly forzado). |
| **QA-ADMIN-04** | **Carga Masiva (Validación)** | Archivo CSV corrupto o con emails duplicados. | 1. Ir a Carga Masiva.<br>2. Subir archivo con errores.<br>3. Clic "Analizar". | El sistema muestra resumen de errores (ej. "Fila 4: Email inválido"). No permite procesar hasta corregir o ignorar errores. |
| **QA-ADMIN-05** | **Reporte Consolidado** | Múltiples instructores con versiones finales. | 1. Clic en "Reporte Consolidado". | Descarga de Excel/CSV. Verificar que incluye la **Versión Final** de cada instructor (o la última si no hay final) y omite borradores antiguos. |

---

## 5. Configuración del Sistema

| ID | Objetivo | Precondiciones | Pasos | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **QA-CONF-01** | **Cierre de Ventana** | Usuario Admin con permiso `canManageConfig`. | 1. Ir a Configuración.<br>2. Switch "Ventana de Carga" a OFF.<br>3. Loguearse como Instructor. | El instructor ve el aviso de bloqueo y no puede guardar cambios. |
| **QA-CONF-02** | **Cambio de Periodo** | Usuario Admin. | 1. Cambiar nombre de periodo a "2024-2".<br>2. Guardar. | El cambio se refleja en el header de todos los usuarios inmediatamente (o tras refresh). |
| **QA-CONF-03** | **Nuevo Periodo (Reset)** | Usuario Admin. | 1. Clic en "Iniciar Nuevo Periodo".<br>2. Confirmar alerta. | Se genera nuevo ID de periodo. La ventana de carga se cierra automáticamente por seguridad. Los calendarios de los instructores aparecen vacíos (limpios para el nuevo ciclo). |

---

## 6. Gestión de Administradores (Super Admin)

| ID | Objetivo | Precondiciones | Pasos | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **QA-SUPER-01** | **Crear Admin con Permisos Limitados** | Logueado como Super Admin. | 1. Crear nuevo usuario Admin.<br>2. Desmarcar "Configuración".<br>3. Loguearse con el nuevo Admin. | El nuevo Admin puede ver Instructores, pero el menú "Configuración" no existe o es inaccesible. |
| **QA-SUPER-02** | **Eliminar Admin** | Logueado como Super Admin. | 1. Seleccionar un Admin existente.<br>2. Clic Eliminar. | El usuario es eliminado. Al intentar loguearse con ese Admin, el acceso es denegado. |
| **QA-SUPER-03** | **Protección de Rol** | Logueado como Admin (Normal). | 1. Intentar acceder a `/super/admins` vía URL. | Redirección forzada al Dashboard. Acceso denegado. |
