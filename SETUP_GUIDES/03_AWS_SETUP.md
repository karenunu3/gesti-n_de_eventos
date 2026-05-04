# Setup AWS S3 - Guía Detallada

## Paso 1: Crear Cuenta AWS

1. Abre https://aws.amazon.com/free
2. Haz clic en **"Create a Free Account"**
3. Ingresa tu email: `karen.9.mercedes@gmail.com`
4. Crea una contraseña segura
5. Ingresa información de contacto personal
6. **IMPORTANTE:** Proporciona una tarjeta de crédito válida
   - AWS requiere esto, pero no te cobrará mientras uses el free tier
7. Verifica tu número de teléfono (SMS o llamada)
8. Selecciona un plan de soporte: **"Basic Support (Free)"**
9. Espera confirmación por email (2-5 minutos)

## Paso 2: Crear Usuario IAM (Usuario de Aplicación)

**IMPORTANTE:** Nunca uses credenciales root para aplicaciones. Siempre crea un usuario IAM.

1. En AWS Console, busca **"IAM"** en la barra superior
2. En el menú izquierdo, selecciona **"Users"**
3. Haz clic en **"Create User"**
4. Configuración:
   - **User Name:** `istpet-backend`
   - Deja las demás opciones sin cambios
5. Haz clic en **"Next"**

### Asignar Permisos:

1. En la sección "Permissions", selecciona **"Attach Policies Directly"**
2. Busca **"AmazonS3FullAccess"**
3. Marca el checkbox de esa política
4. Haz clic en **"Next"**
5. Revisa y haz clic en **"Create User"**

## Paso 3: Generar Access Keys

1. En Users, haz clic en el usuario **"istpet-backend"**
2. Selecciona la pestaña **"Security Credentials"**
3. Desplázate hasta "Access Keys"
4. Haz clic en **"Create Access Key"**
5. Selecciona **"Application running outside AWS"**
6. Haz clic en **"Next"**
7. Puedes agregar una descripción: "Backend ISTPET Eventos"
8. Haz clic en **"Create Access Key"**

### Copiar Credenciales:

Verás dos valores - **CÓPIALOS INMEDIATAMENTE** (no podrás verlos después):

```
Access Key ID:       AKIA...
Secret Access Key:   wJal...
```

Guarda estos valores de forma segura (en un archivo .txt o gestor de contraseñas).

## Paso 4: Crear S3 Bucket

1. En AWS Console, busca **"S3"** en la barra superior
2. Haz clic en **"Create Bucket"**
3. Configuración:
   - **Bucket Name:** `istpet-eventos-uploads`
   - **Region:** `us-east-1` (debe coincidir con AWS_REGION en .env)
4. Deja las demás opciones por defecto
5. Desplázate hasta **"Block Public Access settings"**
   - **DESMARCA** el checkbox: "Block all public access"
   - Marca: "I acknowledge that the current settings might result in this bucket and the objects within it becoming public"
6. Haz clic en **"Create Bucket"**
7. Espera a que aparezca en la lista

## Paso 5: Configurar CORS del Bucket

Para permitir que el frontend descargue certificados desde S3:

1. Selecciona el bucket `istpet-eventos-uploads`
2. Abre la pestaña **"Permissions"**
3. Desplázate hasta **"Cross-origin resource sharing (CORS)"**
4. Haz clic en **"Edit"**
5. Reemplaza el contenido con:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST"
    ],
    "AllowedOrigins": [
      "https://istpet-eventos-xxx.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

**Reemplaza `istpet-eventos-xxx.vercel.app` con tu URL real de Vercel.**

6. Haz clic en **"Save Changes"**

## Paso 6: Permitir Lectura Pública (Bucket Policy)

1. Pestaña **"Permissions"** → **"Bucket Policy"**
2. Haz clic en **"Edit"**
3. Agrega esta política:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::istpet-eventos-uploads/*"
    }
  ]
}
```

4. Haz clic en **"Save Changes"**

## Paso 7: Verificar Configuración

En la pestaña **"Objects"** del bucket:
- Deberías poder ver archivos subidos
- Los archivos deberían ser descargables públicamente

Prueba URL pública:
```
https://istpet-eventos-uploads.s3.us-east-1.amazonaws.com/uploads/[nombre-archivo]
```

## Paso 8: Guardar Credenciales en Variables de Entorno

Actualiza tu `.env` del backend:

```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJal...
AWS_S3_BUCKET=istpet-eventos-uploads
AWS_REGION=us-east-1
```

## Notas Importantes

- **Nunca commits las credenciales a Git** - usa `.env` local
- **Costos:** El free tier de AWS es suficiente para testing; S3 tiene 5GB/mes gratis
- **Seguridad:** Las credenciales no deben ser visibles públicamente
- **CORS:** Actualiza AllowedOrigins cuando cambies de dominio
- **Bucket Name:** Debe ser único globalmente en todo AWS
