# DEPLOYMENT CHECKLIST - ISTPET Eventos

## FASE 1: CREAR CUENTAS (Est. 15-20 minutos)

### 1.1 Crear Cuenta Vercel (Frontend)
- [ ] Ir a https://vercel.com
- [ ] Registrarse con GitHub (o email)
- [ ] Autorizar acceso a repositorio `istpet-eventos`
- [ ] Crear nuevo proyecto desde repositorio
- [ ] Nota: Guardar URL del proyecto Vercel

**Resultado esperado:**
```
Frontend URL: https://[tu-app].vercel.app
```

---

### 1.2 Crear Cuenta Neon (PostgreSQL)
- [ ] Ir a https://neon.tech
- [ ] Registrarse con GitHub (recomendado)
- [ ] Crear nuevo proyecto PostgreSQL
- [ ] Nombre: `istpet-db` (o similar)
- [ ] Guardar Connection String (sin ejecutar migraciones aún)

**Resultado esperado:**
```
DATABASE_URL="postgresql://neondb_owner:[PASSWORD]@ep-xxxxx.neon.tech/neondb?sslmode=require"
```

---

### 1.3 Crear Cuenta AWS (S3 + IAM)
- [ ] Ir a https://aws.amazon.com/free
- [ ] Crear cuenta (usar email karen.9.mercedes@gmail.com)
- [ ] Crear usuario IAM: "istpet-backend"
- [ ] Asignar política: AmazonS3FullAccess
- [ ] Generar Access Key ID y Secret Access Key
- [ ] Guardar credenciales en lugar seguro

**Resultado esperado:**
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJal...
```

---

### 1.4 Crear Bucket S3
- [ ] En AWS Console → S3 → Create Bucket
- [ ] Nombre: `istpet-eventos-uploads`
- [ ] Región: `us-east-1`
- [ ] Desactivar "Block all public access" (para downloads)
- [ ] Crear bucket
- [ ] Configurar CORS (ver instrucciones abajo)

**Resultado esperado:**
```
AWS_S3_BUCKET=istpet-eventos-uploads
AWS_REGION=us-east-1
```

---

## FASE 2: CONFIGURAR AMBIENTE (Est. 10 minutos)

### 2.1 Backend - Variables de Entorno en Vercel
```
DATABASE_URL=postgresql://neondb_owner:[PASSWORD]@ep-xxxxx.neon.tech/neondb?sslmode=require
PORT=3000
FRONTEND_URL=https://[tu-app].vercel.app
JWT_SECRET=[generar token seguro 32+ caracteres]
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJal...
AWS_S3_BUCKET=istpet-eventos-uploads
AWS_REGION=us-east-1
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[tu-email-gmail]
SMTP_PASS=[tu-app-password]
```

### 2.2 Frontend - Variables de Entorno en Vercel
```
VITE_API_URL=https://[backend-vercel-url].vercel.app/api
```

---

## FASE 3: MIGRAR BASE DE DATOS (Est. 5 minutos)

```bash
# En terminal local (en directorio backend)
DATABASE_URL="postgresql://neondb_owner:[PASSWORD]@ep-xxxxx.neon.tech/neondb?sslmode=require" \
npx prisma migrate deploy
```

---

## FASE 4: DESPLEGAR FRONTEND (Est. 5 minutos)

- [ ] En Vercel Dashboard: Settings → Environment Variables
- [ ] Agregar: `VITE_API_URL=https://[backend].vercel.app/api`
- [ ] Triggers → Deployments → Redeploy

---

## FASE 5: DESPLEGAR BACKEND (Est. 10 minutos)

- [ ] Crear nuevo proyecto Vercel para backend
- [ ] Conectar repositorio
- [ ] Agregar todas las variables de entorno
- [ ] Desplegar

---

## VERIFICACIÓN FINAL

- [ ] Test login: https://[frontend].vercel.app
- [ ] Crear evento desde admin
- [ ] Generar certificado
- [ ] Verificar archivo en S3 bucket
- [ ] Test email password reset

---

## NOTAS IMPORTANTES

1. **JWT_SECRET**: Generar con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. **AWS IAM**: No usar credenciales root; crear usuario dedicado
3. **CORS**: Verificar que FRONTEND_URL sea correcto en backend
4. **Neon Connection**: Incluir `?sslmode=require` en production
5. **Vercel Limits**: Node.js serverless function timeout = 60 seg (aumentar si certificados son lentos)

