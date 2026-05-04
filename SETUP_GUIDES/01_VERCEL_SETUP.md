# Setup Vercel - Guía Detallada

## Paso 1: Crear Cuenta Vercel

1. Abre https://vercel.com
2. Haz clic en **"Sign Up"**
3. Selecciona **"Continue with GitHub"** (recomendado)
   - Autoriza el acceso a tu cuenta GitHub
4. Selecciona la organización donde está tu repositorio `istpet-eventos`

## Paso 2: Agregar Proyecto Frontend

1. En el dashboard de Vercel, haz clic en **"Add New..."** → **"Project"**
2. Busca y selecciona el repositorio `istpet-eventos`
3. Haz clic en **"Import"**

### Configuración del Proyecto:

**Project Name:** `istpet-eventos` (o similar)

**Framework Preset:** `Vite`

**Build Command:** `npm run build`

**Output Directory:** `dist`

**Environment Variables:**
```
VITE_API_URL = https://[TU-BACKEND-URL]/api
```
(Por ahora puedes dejar esto en blanco; lo actualizarás después)

4. Haz clic en **"Deploy"**
5. Espera a que se complete el deploy (2-3 minutos)

## Paso 3: Copiar URL del Frontend

Después del deploy exitoso, veras una URL como:
```
https://istpet-eventos-xxx.vercel.app
```

**Guarda esta URL** - la necesitarás para configurar el backend.

## Paso 4: Actualizar Variables de Entorno (después del backend)

Una vez que tengas el backend desplegado en Vercel:

1. En Vercel Dashboard → Tu proyecto → **Settings**
2. Selecciona **"Environment Variables"**
3. Agrega:
   - Name: `VITE_API_URL`
   - Value: `https://[tu-backend].vercel.app/api`
4. Haz clic en **"Save"**
5. Vuelve al **Deployments** y haz clic en **"Redeploy"** en el último deploy
   - Selecciona **"Redeploy"** (sin cambios de code)

## Notas Importantes

- El frontend se despliega automáticamente en cada push a main/master
- Vercel maneja HTTPS automáticamente
- Los assets estáticos (CSS, JS) se sirven desde CDN global
- El tiempo de build típicamente es 1-2 minutos
