# Setup Neon PostgreSQL - Guía Detallada

## Paso 1: Crear Cuenta Neon

1. Abre https://neon.tech
2. Haz clic en **"Sign Up"**
3. Selecciona **"Continue with GitHub"** (recomendado)
   - Autoriza el acceso a tu cuenta GitHub
4. Verifica tu email

## Paso 2: Crear Proyecto PostgreSQL

1. En el dashboard de Neon, haz clic en **"New Project"**
2. Configura:
   - **Name:** `istpet-db`
   - **Database Name:** `istpet_db` (automático)
   - **Region:** `us-east-1` (o la más cercana a tu ubicación)
   - **Plan:** Free (suficiente para desarrollo/testing)
3. Haz clic en **"Create Project"**
4. Espera a que se cree (1-2 minutos)

## Paso 3: Obtener Connection String

Una vez creado el proyecto:

1. Haz clic en **"Connect"** (botón azul)
2. Selecciona **"Connection string"**
3. Selecciona **Pooler** (para mejor rendimiento)
4. Copia la cadena completa:

```
postgresql://neondb_owner:[PASSWORD]@ep-xxxxx-xxxxx.us-east-1.neon.tech/istpet_db?sslmode=require
```

**IMPORTANTE:** Anota esta cadena con la contraseña - la necesitarás en los próximos pasos.

## Paso 4: Configurar Credenciales

Neon automáticamente asigna:
- **Usuario:** `neondb_owner`
- **Contraseña:** Se genera automáticamente (visible en la connection string)
- **Host:** `ep-xxxxx-xxxxx.us-east-1.neon.tech`
- **Database:** `istpet_db`
- **Port:** `5432` (por defecto)

## Paso 5: Prueba de Conexión (Opcional)

Desde tu terminal local:

```bash
# Reemplaza la connection string completa
psql "postgresql://neondb_owner:[PASSWORD]@ep-xxxxx-xxxxx.us-east-1.neon.tech/istpet_db?sslmode=require"
```

Si se conecta exitosamente, deberías ver:
```
istpet_db=>
```

Escribe `\q` para salir.

## Paso 6: Configurar en Variables de Entorno del Backend

Guarda esta connection string en tu `.env` local:

```env
DATABASE_URL="postgresql://neondb_owner:[PASSWORD]@ep-xxxxx-xxxxx.us-east-1.neon.tech/istpet_db?sslmode=require"
```

## Notas Importantes

- **SSL Required:** El `?sslmode=require` es obligatorio en Neon
- **Password:** Cambia la contraseña desde el dashboard de Neon si lo deseas
- **Pooler:** Usa siempre el "Pooler" connection string en production
- **Backups:** Neon ofrece backups automáticos incluso en plan free
- **Escalabilidad:** Puedes actualizar el plan cuando sea necesario
