# Setup Backend en Vercel - Guía Detallada

## Paso 1: Preparar Código Backend para Production

### Actualizar vercel.json

En la raíz del proyecto backend, crea un archivo `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Actualizar package.json

Asegúrate de que incluya:

```json
{
  "scripts": {
    "start": "node dist/src/server.js",
    "build": "tsc",
    "dev": "ts-node src/server.ts"
  },
  "engines": {
    "node": "18.x"
  }
}
```

## Paso 2: Crear Proyecto Backend en Vercel

1. En Vercel Dashboard, haz clic en **"Add New"** → **"Project"**
2. Selecciona el repositorio `istpet-eventos` (mismo que el frontend)
3. Configuración:
   - **Project Name:** `istpet-eventos-backend` (diferente del frontend)
   - **Framework:** `Other` (ya que es Express puro)
   - **Root Directory:** `backend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

## Paso 3: Agregar Variables de Entorno del Backend

Antes de hacer deploy:

1. En Vercel, en el paso de configuración, haz clic en **"Environment Variables"**
2. Agrega cada variable:

```
DATABASE_URL
postgresql://neondb_owner:[PASSWORD]@ep-xxxxx.us-east-1.neon.tech/istpet_db?sslmode=require

FRONTEND_URL
https://istpet-eventos-xxx.vercel.app

JWT_SECRET
[generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]

AWS_ACCESS_KEY_ID
AKIA...

AWS_SECRET_ACCESS_KEY
wJal...

AWS_S3_BUCKET
istpet-eventos-uploads

AWS_REGION
us-east-1

SMTP_HOST
smtp.gmail.com

SMTP_PORT
587

SMTP_USER
[tu-email-gmail]

SMTP_PASS
[app-password de Gmail]
```

### Generar JWT_SECRET Seguro:

En tu terminal local:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ejemplo de salida:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

Copia este valor como JWT_SECRET.

### Gmail App Password:

1. Ve a https://myaccount.google.com/security
2. En la izquierda, selecciona **"2-Step Verification"** (activa si no está)
3. Desplázate hasta **"App passwords"**
4. Selecciona **"Mail"** y **"Windows Computer"**
5. Gmail genera una contraseña de 16 caracteres
6. Copia esta contraseña como SMTP_PASS (sin espacios)

## Paso 4: Desplegar Backend

1. Haz clic en **"Deploy"** en Vercel
2. Espera a que se complete (3-5 minutos)
3. Una vez desplegado, verás una URL como:
   ```
   https://istpet-eventos-backend-xxx.vercel.app
   ```

Guarda esta URL - la necesitarás para el frontend.

## Paso 5: Migrar Base de Datos a Neon

Ahora ejecuta las migraciones de Prisma para crear las tablas en Neon:

En tu terminal local (en el directorio `backend`):

```bash
# Primero, actualiza el .env local con la connection string de Neon:
# DATABASE_URL="postgresql://neondb_owner:[PASSWORD]@ep-xxxxx.us-east-1.neon.tech/istpet_db?sslmode=require"

npx prisma migrate deploy
```

Si es la primera vez, Prisma te preguntará si quieres ejecutar las migraciones pendientes. Selecciona **"yes"**.

Deberías ver:
```
8 migrations executed successfully

Your database is now in sync with your schema.
```

## Paso 6: Verificar Backend

Prueba el endpoint de salud:

```bash
curl https://istpet-eventos-backend-xxx.vercel.app/health
```

Deberías ver:
```json
{"status":"ok","timestamp":"2026-05-04T..."}
```

## Paso 7: Actualizar Frontend con URL del Backend

Ahora que tienes la URL del backend, actualiza el frontend:

1. En Vercel Dashboard del frontend (`istpet-eventos`)
2. Selecciona **"Settings"** → **"Environment Variables"**
3. Agrega o edita:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://istpet-eventos-backend-xxx.vercel.app/api`
4. Haz clic en **"Save"**

5. Ve a **"Deployments"** y haz clic en el botón **"..."** del deploy más reciente
6. Selecciona **"Redeploy"**
7. Espera a que se complete

## Notas Importantes

- **Build Time:** El backend puede tardar 2-3 minutos en compilar TypeScript
- **Migraciones:** Las migraciones de Prisma solo se ejecutan localmente; los schemas ya están sincronizados en production
- **Función Serverless:** Cada request es una nueva ejecución de Node.js; asegúrate de que los tiempos de respuesta sean rápidos
- **Logs:** Puedes ver los logs en Vercel Dashboard → Project → Deployments → View Logs
- **Error 500:** Si ves errores 500, verifica que todas las variables de entorno estén correctamente configuradas

## Troubleshooting

### Error: "Cannot find module 'aws-sdk'"

Ejecuta en el backend local:
```bash
npm install aws-sdk
```

Luego haz push a GitHub - Vercel reinstalará las dependencias automáticamente.

### Error: "Database connection failed"

Verifica:
1. DATABASE_URL está correctamente configurada en Vercel
2. La connection string incluye `?sslmode=require`
3. El usuario neondb_owner tiene permisos en la base de datos

### Error: "404 on /api/..."

Verifica:
1. El backend está desplegado correctamente
2. Las rutas están correctamente definidas en `backend/src/server.ts`
3. La URL del backend es correcta en `VITE_API_URL` del frontend
