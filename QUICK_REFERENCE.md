# Quick Reference - Guía de Referencia Rápida

## URLs a Recordar

```
Frontend:        https://istpet-eventos-xxx.vercel.app
Backend:         https://istpet-eventos-backend-xxx.vercel.app
Backend Health:  https://istpet-eventos-backend-xxx.vercel.app/health
API Base:        https://istpet-eventos-backend-xxx.vercel.app/api
```

---

## Credenciales y Secretos

### Guardar en lugar seguro:

```
AWS Access Key ID:           AKIA...
AWS Secret Access Key:       wJal...
Neon Database Password:      [PASSWORD]
JWT Secret:                  [32 caracteres hex]
Gmail App Password:          [16 caracteres]
```

**NUNCA**:
- Guardes en git
- Compartas en Slack/email sin encriptar
- Uses en URLs o query strings

---

## Variables de Entorno

### Backend (.env o Vercel)

```env
# Database
DATABASE_URL=postgresql://neondb_owner:[PASS]@ep-xxxxx.neon.tech/istpet_db?sslmode=require

# Server
PORT=3000
FRONTEND_URL=https://istpet-eventos-xxx.vercel.app

# Auth
JWT_SECRET=[32-char-hex]

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJal...
AWS_S3_BUCKET=istpet-eventos-uploads
AWS_REGION=us-east-1

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[tu-email]@gmail.com
SMTP_PASS=[app-password]
```

### Frontend (.env o Vercel)

```env
VITE_API_URL=https://istpet-eventos-backend-xxx.vercel.app/api
```

---

## Procesos Comunes

### Redeploy Frontend

1. Vercel Dashboard → istpet-eventos
2. Deployments → último deploy → "..." → Redeploy
3. O: `git push` automáticamente triggearea nuevo deploy

### Redeploy Backend

1. Vercel Dashboard → istpet-eventos-backend
2. Deployments → último deploy → "..." → Redeploy
3. O: `git push` automáticamente triggearea nuevo deploy

### Ver Logs Backend

1. Vercel Dashboard → istpet-eventos-backend
2. Deployments → último deploy → "View Logs"

### Ejecutar Migraciones

```bash
# En terminal local (directorio backend)
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### Verificar Base de Datos

```bash
# Conectar a Neon
psql "postgresql://neondb_owner:[PASSWORD]@ep-xxxxx.neon.tech/istpet_db?sslmode=require"

# Listar tablas
\dt

# Salir
\q
```

---

## Solucionar Problemas Comunes

| Problema | Solución |
|----------|----------|
| "Cannot find module 'aws-sdk'" | `npm install aws-sdk` en backend + push |
| "CORS error" | Verifica FRONTEND_URL en backend |
| "Database connection failed" | Verifica DATABASE_URL y ?sslmode=require |
| "404 on /api/..." | Verifica backend está desplegado y rutas existen |
| "No such table" | Ejecuta `npx prisma migrate deploy` |
| "Certificado no se descarga" | Verifica AWS_S3 está configurado + bucket existe |

---

## Estructura de Carpetas

```
istpet-eventos/
├── frontend/
│   ├── .env                    # LOCAL (no commit)
│   ├── .env.example            # TEMPLATE (sí commit)
│   ├── src/
│   │   ├── lib/api.ts          # Punto de conexión al backend
│   │   └── ...
│   └── vite.config.ts
│
├── backend/
│   ├── .env                    # LOCAL (no commit)
│   ├── .env.example            # TEMPLATE (sí commit)
│   ├── vercel.json             # Config de Vercel
│   ├── src/
│   │   ├── server.ts           # Punto de entrada
│   │   ├── controllers/        # Lógica de negocio
│   │   ├── routes/             # Endpoints
│   │   ├── utils/              # Helpers (s3Client, jwt, etc)
│   │   └── prismaClient.ts     # ORM
│   ├── prisma/
│   │   ├── schema.prisma       # Definición de tablas
│   │   └── migrations/         # Historial de cambios BD
│   └── package.json
│
├── DEPLOYMENT_CHECKLIST.md     # Este archivo
├── QUICK_REFERENCE.md          # Este archivo
└── SETUP_GUIDES/               # Guías detalladas
    ├── 01_VERCEL_SETUP.md
    ├── 02_NEON_SETUP.md
    ├── 03_AWS_SETUP.md
    ├── 04_BACKEND_DEPLOYMENT.md
    └── 05_VERIFICATION.md
```

---

## Roles y Permisos

```
ADMIN       → Todas las acciones
SECRETARIA  → Gestiona eventos y usuarios, genera reportes
DOCENTE     → Marca asistencia, genera certificados
ALUMNO      → Se registra en eventos, descarga certificados
```

---

## Endpoints Principales

### Autenticación
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password/:token
GET    /api/auth/me
```

### Eventos
```
GET    /api/events                    # Todos (filtrado por carrera si alumno)
POST   /api/events                    # Crear
GET    /api/events/:id                # Detalle
PUT    /api/events/:id                # Actualizar
DELETE /api/events/:id                # Eliminar
```

### Registro a Eventos
```
POST   /api/events/:eventId/register  # Registrarse
DELETE /api/events/:eventId/register  # Cancelar registro
```

### Asistencia
```
POST   /api/attendance                # Marcar asistencia
GET    /api/attendance/:eventId       # Ver asistencias
```

### Certificados
```
POST   /api/certificate/:eventId      # Generar certificado
GET    /api/certificate/:eventId      # Descargar certificado
```

### Reportes
```
GET    /api/reports/events
GET    /api/reports/attendance
GET    /api/reports/certificates
```

---

## Timeline Típico de Deployment

| Tarea | Tiempo | Dependencias |
|-------|--------|--------------|
| Crear cuentas (Vercel, Neon, AWS) | 20 min | Ninguna |
| Configurar variables de entorno | 5 min | Cuentas creadas |
| Migrar BD a Neon | 5 min | Neon configurado |
| Desplegar frontend | 5 min | Variables configuradas |
| Desplegar backend | 10 min | Variables configuradas |
| Verificar end-to-end | 15 min | Ambos deployed |
| **TOTAL** | **60 min** | - |

---

## Monitoreo en Producción

### Diariamente:
- Revisar logs en Vercel para errores
- Verificar que /health responda correctamente

### Semanalmente:
- Revisar reportes de eventos
- Verificar integridad de certificados en S3

### Mensualmente:
- Hacer backup de Neon (automático)
- Revisar costos de AWS
- Revisar métricas de uso en Vercel

---

## Contacto y Soporte

| Servicio | Soporte | Documentación |
|----------|---------|--------------|
| Vercel | support.vercel.com | vercel.com/docs |
| Neon | docs.neon.tech | support.neon.tech |
| AWS | console.aws.amazon.com/support | docs.aws.amazon.com |
| Node.js | nodejs.org/docs | github.com/nodejs |
| Express | expressjs.com | express.io/docs |
| Prisma | prisma.io/docs | support.prisma.io |

---

## Notas Finales

✅ **Antes de desplegar:**
- Todos los tests pasan localmente
- No hay credenciales en código
- Variables de entorno están configuradas
- Base de datos es accesible

✅ **Después de desplegar:**
- Verificar que frontend y backend están comunicándose
- Probar flujo completo: login → crear evento → registrarse → certificado
- Revisar logs de Vercel
- Hacer backup de datos importantes

⚠️ **Importante:**
- No uses credenciales root de AWS
- Siempre usa SSL en producción
- Actualiza dependencias regularmente
- Mantén logs de cambios en Git

📧 **En caso de problemas:**
1. Revisa los logs en Vercel
2. Verifica variables de entorno
3. Prueba endpoints con curl/Postman
4. Consulta la sección de troubleshooting
5. Contacta al soporte del servicio respectivo
