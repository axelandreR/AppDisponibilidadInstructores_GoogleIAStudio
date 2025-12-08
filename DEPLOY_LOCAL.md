# Guía de Despliegue Local - Sistema de Gestión de Disponibilidad

Sigue estos pasos para ejecutar el proyecto en tu entorno local. El sistema consta de un **Backend** (NestJS + Prisma) y un **Frontend** (React + Vite).

---

## 1. Prerrequisitos

Asegúrate de tener instalado:
*   **Node.js** (v18 o superior)
*   **PostgreSQL** (Base de datos)
*   **Git**

---

## 2. Instalación de Todas las Dependencias

Para instalar las dependencias de **todo el proyecto** (Frontend y Backend) de una sola vez, abre una terminal en la **raíz del proyecto** y ejecuta el siguiente comando:

```bash
npm install && cd backend && npm install && cd ..
```

*Este comando instalará primero las dependencias del Frontend (raíz), luego entrará a la carpeta `backend` para instalar sus dependencias, y finalmente regresará a la raíz.*

---

## 3. Configuración del Backend

El backend gestiona la lógica de negocio y la conexión a la base de datos.

1.  **Navega a la carpeta del backend:**
    ```bash
    cd backend
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo `.env` en la carpeta `backend/` con el siguiente contenido. **Importante**: Cambiaremos el puerto a `3001` para evitar conflictos con el frontend.

    ```env
    # backend/.env
    PORT=3001
    DATABASE_URL="postgresql://usuario:password@localhost:5432/nombre_base_datos?schema=public"
    JWT_SECRET="mi_secreto_super_seguro"
    ```
    *Asegúrate de reemplazar `usuario`, `password` y `nombre_base_datos` con tus credenciales reales de PostgreSQL.*

4.  **Ejecuta las migraciones de base de datos:**
    Esto creará las tablas necesarias en tu base de datos.
    ```bash
    npx prisma migrate dev --name init
    ```

5.  **Inicia el servidor backend:**
    ```bash
    npm run start:dev
    ```
    Verás un mensaje indicando que el servidor corre en `http://localhost:3001/api/v1`.

---

## 4. Configuración del Frontend

El frontend es la interfaz de usuario. Actualmente, la versión en la raíz del proyecto funciona como un prototipo con datos simulados (Mocks).

1.  **Abre una nueva terminal** y asegúrate de estar en la **raíz del proyecto** (donde está el archivo `vite.config.ts`).

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Inicia el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

4.  **Accede a la aplicación:**
    Abre tu navegador en la URL que muestra la terminal (usualmente `http://localhost:3000` o `http://localhost:5173`).

---

## Notas Importantes

*   **Conflicto de Puertos**: Por defecto, tanto NestJS como Vite intentan usar el puerto 3000. Por eso configuramos el Backend en el puerto **3001** en el paso 2.
*   **Modo Prototipo**: El frontend actualmente visualiza datos de prueba (`App.tsx` usa `MOCK_USERS`). Para conectar el Frontend real con el Backend, se deberá trabajar en la integración de los servicios (ubicados en `frontend/src/services` o refactorizando el root).
