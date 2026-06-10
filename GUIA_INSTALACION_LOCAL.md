# Guía de Instalación y Ejecución Local
## Sistema de Gestión de Eventos - Instituto Superior Tecnológico "Mayor Pedro Traversari" (ISTPET)

Esta guía te proporcionará los pasos necesarios para instalar, configurar y ejecutar el sistema de forma local en tu computadora después de descomprimir el archivo `.zip`. 

---

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu computadora:
1. **Node.js** (Versión 18 o superior). [Descargar aquí](https://nodejs.org/).
2. **PostgreSQL** (Versión 15 o superior) en ejecución local en tu máquina.

---

## 🚀 Pasos para la Instalación y Ejecución

Sigue estos 5 sencillos pasos para levantar el sistema:

### Paso 1: Crear la Base de Datos
1. Abre tu gestor de base de datos PostgreSQL (ej. pgAdmin).
2. Crea una base de datos vacía llamada **`istpet_db`**.

### Paso 2: Configurar las Variables de Entorno
1. Entra a la carpeta **`backend/`**.
2. Abre el archivo **`.env`** con cualquier editor de texto y configura la cadena de conexión a tu base de datos local en la primera variable:
   ```env
   DATABASE_URL="postgresql://[USUARIO]:[CONTRASEÑA]@localhost:5432/istpet_db?schema=public"
   ```
   *(Reemplaza `[USUARIO]` por tu usuario de PostgreSQL, generalmente `postgres`, y `[CONTRASEÑA]` por tu contraseña local).*

### Paso 3: Configurar e Iniciar el Servidor (Backend)
1. Abre una terminal o consola del sistema en la carpeta **`backend/`**.
2. Instala las dependencias del servidor ejecutando:
   ```bash
   npm install
   ```
3. Genera las tablas en tu base de datos local con Prisma:
   ```bash
   npx prisma db push
   ```
4. Carga las cuentas y datos iniciales de prueba (Seed):
   ```bash
   npx prisma db seed
   ```
5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   *(Mantén esta ventana abierta. El servidor se iniciará en `http://localhost:4000`).*

### Paso 4: Configurar e Iniciar la Interfaz (Frontend)
1. Abre **otra ventana de la terminal** y entra a la carpeta **`frontend/`**.
2. Instala las dependencias del cliente ejecutando:
   ```bash
   npm install
   ```
3. Inicia la aplicación web:
   ```bash
   npm run dev
   ```
   *(El frontend se iniciará en **`http://localhost:5173`**).*

### Paso 5: Ingresar al Sistema
1. Abre tu navegador web y entra a: **`http://localhost:5173`**
2. Inicia sesión utilizando cualquiera de los siguientes usuarios de prueba:

* **Contraseña común para todas las cuentas:** `password123`

* **Administrador (Admin):**
  * **Usuario:** `admin@istpet.edu.ec`
* **Secretaria:**
  * **Usuario:** `secretaria@istpet.edu.ec`
* **Docente:**
  * **Usuario:** `docente1@istpet.edu.ec`
* **Alumno:**
  * **Usuario:** `alumno1@istpet.edu.ec` *(Existen cuentas del 1 al 40)*

---

## ⚠️ Nota Importante para las Pruebas de Asistencia (Cámara y GPS)

Los navegadores web (como Google Chrome y Edge) restringen el uso de la cámara y el GPS únicamente a entornos seguros. **`localhost`** es considerado un entorno seguro por defecto. 

Para que puedas simular el escaneo de asistencia sin problemas de permisos, **debes ingresar al sistema siempre a través de `http://localhost:5173`**. Si accedes a través de una dirección IP (ej. `http://192.168.x.x`), el navegador desactivará la cámara y el GPS impidiendo las pruebas de asistencia.
