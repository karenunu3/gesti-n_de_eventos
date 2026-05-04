# 🚀 ISTPET Eventos - Guía Completa de Despliegue a Producción

**Versión:** 1.0  
**Última Actualización:** 2026-05-04  
**Estado:** Listo para desplegar

---

## 📋 Índice de Documentación

Esta guía está organizada en varios documentos. Lee en este orden:

1. **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** ← COMIENZA AQUÍ
   - Vista general de 5 fases
   - Checklist ejecutable paso a paso
   - Tiempos estimados

2. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** ← Referencia rápida
   - URLs y credenciales
   - Variables de entorno
   - Comandos comunes
   - Troubleshooting rápido

3. **Guías Detalladas** (en carpeta `SETUP_GUIDES/`):
   - [01_VERCEL_SETUP.md](./SETUP_GUIDES/01_VERCEL_SETUP.md) - Frontend
   - [02_NEON_SETUP.md](./SETUP_GUIDES/02_NEON_SETUP.md) - Base de datos
   - [03_AWS_SETUP.md](./SETUP_GUIDES/03_AWS_SETUP.md) - Almacenamiento S3
   - [04_BACKEND_DEPLOYMENT.md](./SETUP_GUIDES/04_BACKEND_DEPLOYMENT.md) - Backend
   - [05_VERIFICATION.md](./SETUP_GUIDES/05_VERIFICATION.md) - Testing completo

---

## 🎯 Resumen Ejecutivo

### ¿Qué vamos a desplegar?

```
┌─────────────────────────────────────────────────────────┐
│  ISTPET Eventos - Sistema de Gestión de Eventos        │
│  Arquitectura Moderna en Cloud ☁️                        │
└─────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐
│  React 19    │         │  Vercel CDN  │
│  + Tailwind  │ Deploy→ │  (Frontend)  │
│  (Frontend)  │         │              │
└──────────────┘         └──────────────┘
       ↓ API
       ↓ (JWT Auth)
┌──────────────┐         ┌──────────────┐
│  Node.js +   │         │  Vercel      │
│  Express 5   │ Deploy→ │  Serverless  │
│  (Backend)   │         │  (Backend)   │
└──────────────┘         └──────────────┘
       ↓ SQL
       ↓ (Connection Pool)
┌──────────────┐         ┌──────────────┐
│  Prisma ORM  │         │  Neon        │
│  + TypeScript│ Connect→│  PostgreSQL  │
│  (Esquema BD)│         │  (DB)        │
└──────────────┘         └──────────────┘
       ↓ Files
       ↓ (AWS SDK)
┌──────────────┐         ┌──────────────┐
│  PDFKit +    │         │  AWS S3      │
│  QR Codes    │ Upload→ │  Bucket      │
│  (Certs)     │         │  (Storage)   │
└──────────────┘         └──────────────┘
```

### Servicios en los que nos registraremos:

| Servicio | Función | Plan | Costo |
|----------|---------|------|-------|
| **Vercel** | Hosting (Frontend + Backend) | Pro | $20/mes (opcional, free tier suficiente) |
| **Neon** | PostgreSQL Managed | Free | $0 (generoso para desarrollo) |
| **AWS** | S3 Storage + IAM | Free Tier | $0 (primeros 12 meses) |
| **Gmail** | SMTP para emails | Gratis + App Password | $0 |

**Total Costo Mensual en Producción: $0 - $20 USD** (dependiendo de uso)

---

## ⏱️ Cronograma de Implementación

### Antes de Empezar (5 minutos)

- [ ] Verifica que Git esté actualizado: `git status`
- [ ] Todo comiteado: `git log -1` 
- [ ] Tienes acceso a tu email: `karen.9.mercedes@gmail.com`

### FASE 1: Crear Cuentas (15-20 minutos)

```
Vercel         → Frontend hosting
                → 5 minutos

Neon           → PostgreSQL cloud
                → 5 minutos

AWS            → S3 + IAM
                → 10 minutos
```

**Resultado:** Tienes 3 servicios con credenciales listas

### FASE 2: Configurar Entorno (10 minutos)

```
Backend .env   → Variables de producción
                → 3 minutos

Frontend .env  → URL de API
                → 2 minutos

AWS S3 CORS    → Permisos de descarga
                → 5 minutos
```

**Resultado:** Sistema configurado para producción

### FASE 3: Migrar Base de Datos (5 minutos)

```
Crear tablas en Neon usando Prisma
→ 5 minutos (comando simple)
```

**Resultado:** BD lista con esquema

### FASE 4: Desplegar (15 minutos)

```
Frontend       → npm run build + Vercel
                → 5 minutos

Backend        → npm run build + Vercel
                → 10 minutos
```

**Resultado:** Sistema en vivo en URLs públicas

### FASE 5: Verificar (15 minutos)

```
Test login     → Verificar autenticación
                → 3 minutos

Test evento    → Crear, registrarse, certificado
                → 10 minutos

Test email     → Password reset funciona
                → 2 minutos
```

**Resultado:** Sistema completamente funcional

---

## 🛠️ Requisitos Previos

✅ **Software Necesario:**
- Git instalado y configurado
- Node.js 18+ instalado
- npm o yarn disponible
- Navegador web (Chrome, Firefox, Safari, Edge)

✅ **Cuentas GitHub:**
- Cuenta GitHub con acceso al repositorio `istpet-eventos`

✅ **Email válido:**
- Email para registrarse en servicios: `karen.9.mercedes@gmail.com`
- Con capacidad de recibir emails de confirmación

✅ **Tarjeta de Crédito:**
- Para AWS (no se cobra con free tier)
- VISA, Mastercard, o American Express

---

## 📚 Documentación Técnica

### Stack de Tecnologías

**Frontend:**
- React 19 con TypeScript
- Vite como bundler
- Tailwind CSS para estilos
- Vite como env vars loader

**Backend:**
- Node.js 18+ con Express 5
- TypeScript para type safety
- Prisma ORM para datos
- JWT para autenticación
- AWS SDK para S3
- Nodemailer para emails
- PDFKit para certificados
- QR Code para códigos

**Base de Datos:**
- PostgreSQL (Neon)
- Migraciones Prisma
- Connection pooling

**Almacenamiento:**
- AWS S3 (certificados PDF)
- Acceso público por URL

---

## 🔒 Seguridad Implementada

✅ **Autenticación:**
- JWT tokens con 8 horas de expiración
- Contraseñas hasheadas con bcrypt (salt 10)
- HTTPS/TLS en todas las conexiones

✅ **Autorización:**
- Role-Based Access Control (RBAC) con 4 roles
- Protección de endpoints por rol
- Filtrado de datos por usuario

✅ **Datos Sensibles:**
- Credenciales en variables de entorno (no en código)
- Database connection string con SSL requerido
- AWS credentials encriptadas en Vercel
- No se guardan contraseñas en plain text

✅ **API:**
- CORS restrictivo (solo origen permitido)
- Rate limiting (si se configura)
- Validación de inputs
- Protección contra SQL injection (via Prisma)

✅ **Storage:**
- S3 bucket con acceso público solo para lectura
- Archivos generados con timestamps únicos
- Firma digital en certificados

---

## 📖 Guía Rápida por Rol

### Si eres ADMIN/SECRETARIA:

1. Asegúrate de tener acceso al admin panel
2. Crea al menos un evento de prueba
3. Verifica que los reportes se generan correctamente

### Si eres DOCENTE:

1. Login en el sistema
2. Accede a "Mis Eventos"
3. Prueba marcar asistencia
4. Verifica que puedes generar certificados

### Si eres ALUMNO:

1. Login en el sistema
2. Ve al Dashboard
3. Registrate en un evento disponible
4. Descarga tu certificado (si hay asistencia)

### Si eres DESARROLLADOR:

1. Sigue [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
2. Usa [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) para troubleshooting
3. Consulta guías detalladas en `SETUP_GUIDES/` para detalles

---

## ✨ Características Principales

### Para Estudiantes (ALUMNO)
- ✅ Registro de cuenta por email
- ✅ Login seguro con JWT
- ✅ Ver eventos de su carrera
- ✅ Registrarse en eventos
- ✅ Descargar certificados (PDF profesional)
- ✅ Recuperar contraseña vía email

### Para Docentes (DOCENTE)
- ✅ Crear y editar eventos
- ✅ Marcar asistencia (GPS + manual)
- ✅ Generar certificados de participación
- ✅ Ver reportes de asistencia

### Para Secretaria (SECRETARIA)
- ✅ Gestionar eventos
- ✅ Gestionar usuarios
- ✅ Generar reportes de eventos
- ✅ Descargar datos en Excel

### Para Admin (ADMIN)
- ✅ Todas las acciones de secretaria
- ✅ Gestionar carreras
- ✅ Gestionar roles de usuarios
- ✅ Configurar parámetros del sistema

### Características de Eventos
- ✅ Validación lógica de fechas (inicio < fin)
- ✅ Validación de duración (1-8 horas)
- ✅ Capacidad máxima (flexible)
- ✅ Asignación a carreras específicas
- ✅ Transversales (para todas las carreras)
- ✅ Ubicación con validación GPS

### Características de Certificados
- ✅ Diseño profesional con logo ISTPET
- ✅ Datos del evento y estudiante
- ✅ Código QR de verificación
- ✅ Firma digital
- ✅ Descarga en formato PDF
- ✅ Almacenamiento en S3 (cloud)

---

## 🆘 Troubleshooting Rápido

### "No puedo crear cuenta Vercel"
→ Ver [01_VERCEL_SETUP.md](./SETUP_GUIDES/01_VERCEL_SETUP.md) - Paso 1

### "No sé la connection string de Neon"
→ Ver [02_NEON_SETUP.md](./SETUP_GUIDES/02_NEON_SETUP.md) - Paso 3

### "Perdí mis credenciales de AWS"
→ Ver [03_AWS_SETUP.md](./SETUP_GUIDES/03_AWS_SETUP.md) - Puedo generar nuevas

### "Frontend no encuentra backend"
→ Ver [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - CORS error

### "Certificado no se descarga"
→ Ver [05_VERIFICATION.md](./SETUP_GUIDES/05_VERIFICATION.md) - Test 5

### "¿Cuál es el siguiente paso?"
→ Abre [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) y marca FASE 1

---

## 📞 Soporte y Contacto

Si encuentras problemas:

1. **Verifica los logs:** Vercel Dashboard → Deployments → View Logs
2. **Consulta Quick Reference:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
3. **Lee la guía correspondiente:** Carpeta `SETUP_GUIDES/`
4. **Busca en documentación:**
   - Vercel: https://vercel.com/docs
   - Neon: https://docs.neon.tech
   - AWS: https://docs.aws.amazon.com
   - Prisma: https://www.prisma.io/docs

---

## ✅ Checklist Final Pre-Despliegue

Antes de presionar el botón "Deploy":

- [ ] Git repository está actualizado
- [ ] Todos los cambios están comiteados
- [ ] No hay credenciales en el código
- [ ] `.env` local no está en `.git`
- [ ] `SETUP_GUIDES/` están guardadas localmente
- [ ] Tengo acceso a mi email
- [ ] He leído al menos [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- [ ] Entiendo el flujo de datos (Frontend → Backend → BD → S3)
- [ ] Tengo tiempo para completar los 60 minutos sin interrupciones
- [ ] He backup mi BD local (si tienes datos importantes)

---

## 🎓 Próximos Pasos Recomendados

Una vez desplegado:

1. **Entrenar usuarios:**
   - Crear video tutorial de login
   - Documentar flujo de estudiante
   - Documentar flujo de docente

2. **Monitorar sistema:**
   - Revisar logs diariamente primera semana
   - Verificar métricas en Vercel
   - Monitorear usage de S3

3. **Optimizar:**
   - Agregar analytics (Google Analytics)
   - Implementar feedback de usuarios
   - Mejorar diseño basado en feedback

4. **Escalar:**
   - Configurar custom domain (CNAME en DNS)
   - Agregar CDN más potente (Cloudflare)
   - Optimizar imágenes y assets
   - Implementar caching más agresivo

5. **Mantener:**
   - Actualizar dependencias mensualmente
   - Hacer backups de BD semanalmente
   - Revisar seguridad cada trimestre
   - Revisar costos mensualmente

---

## 📝 Notas de Desarrollo

**Cambios realizados en el código:**

1. ✅ Frontend `.env` con VITE_API_URL configurable
2. ✅ Backend `.env` con todas las variables necesarias
3. ✅ CORS dinámico basado en FRONTEND_URL
4. ✅ Password reset URL dinámica
5. ✅ S3 integration completa (uploadToS3, deleteFromS3)
6. ✅ AWS SDK instalado en dependencies

**Archivos nuevos creados:**

```
backend/
├── src/utils/s3Client.ts       ← Funciones S3
└── vercel.json                 ← Configuración Vercel

frontend/
├── .env                        ← Variables locales
└── .env.example                ← Template

SETUP_GUIDES/
├── 01_VERCEL_SETUP.md
├── 02_NEON_SETUP.md
├── 03_AWS_SETUP.md
├── 04_BACKEND_DEPLOYMENT.md
└── 05_VERIFICATION.md

Raíz/
├── DEPLOYMENT_CHECKLIST.md     ← Este
├── QUICK_REFERENCE.md          ← Referencia
└── DEPLOYMENT_GUIDE.md         ← Visión general
```

---

## 🚀 ¡Listo para Desplegar!

Ahora que entiendes la estructura completa, puedes:

### **Opción A: Guía Paso a Paso (Recomendado para primeros despliegues)**
→ Abre [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

### **Opción B: Referencia Rápida (Para despliegues rápidos)**
→ Abre [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

### **Opción C: Detalles Técnicos (Para developers)**
→ Lee las guías en `SETUP_GUIDES/` en orden

---

**Documento Actualizado:** 2026-05-04  
**Versión:** 1.0  
**Estado:** ✅ Listo para Producción

¡Que disfrutes tu despliegue! 🎉

---

*Preguntas? Revisa troubleshooting en [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) o consulta la guía correspondiente en `SETUP_GUIDES/`*
