# Verificación End-to-End - Guía de Testing

## Verificación 1: Conectividad Básica

### Test Frontend URL

```bash
# Abre en el navegador:
https://istpet-eventos-xxx.vercel.app
```

Deberías ver:
- Página de login
- Sin errores CORS en la consola

### Test Backend Health

```bash
curl https://istpet-eventos-backend-xxx.vercel.app/health
```

Resultado esperado:
```json
{"status":"ok","timestamp":"2026-05-04T..."}
```

### Test Conexión a Base de Datos

En el backend Vercel, verifica los logs:

1. Vercel Dashboard → istpet-eventos-backend
2. Selecciona el deployment más reciente
3. En **"Logs"** deberías ver:
   ```
   Backend de ISTPET corriendo en http://localhost:4000
   ```

(Nota: Vercel asigna dinámicamente el puerto)

---

## Verificación 2: Prueba de Autenticación

### 1. Registrar Usuario de Prueba

```bash
curl -X POST https://istpet-eventos-backend-xxx.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@",
    "firstName": "Test",
    "lastName": "User",
    "dni": "12345678",
    "role": "ALUMNO"
  }'
```

Resultado esperado:
```json
{
  "user": {
    "id": "...",
    "email": "test@example.com",
    "role": "ALUMNO",
    "firstName": "Test"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Guarda el token** - lo necesitarás para pruebas futuras.

### 2. Login en Frontend

1. Abre https://istpet-eventos-xxx.vercel.app
2. Entra con:
   - Email: `test@example.com`
   - Password: `Test123!@`
3. Deberías ser redirigido al Dashboard

### 3. Verificar localStorage

En el navegador (F12 → Application → Local Storage):
- Deberías ver `token` guardado
- Deberías ver `user` guardado (JSON con id, email, role)

---

## Verificación 3: Crear Evento

### 1. Desde Frontend (Recomendado)

1. Loguéate como Admin o DOCENTE
2. Navega a **"Eventos"**
3. Haz clic en **"Crear Evento"**
4. Llena el formulario:
   - Título: "Evento de Prueba"
   - Fecha Inicio: Hoy + 1 día
   - Fecha Fin: Hoy + 2 días
   - Horas: 4
   - Ubicación: "Aula 101"
   - Capacidad: 50
5. Haz clic en **"Crear"**

Deberías ver el evento en la lista.

### 2. Desde API (Si lo prefieres)

```bash
curl -X POST https://istpet-eventos-backend-xxx.vercel.app/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TU_TOKEN]" \
  -d '{
    "title": "Evento de Prueba API",
    "description": "Test desde API",
    "startDate": "2026-05-10T09:00:00Z",
    "endDate": "2026-05-10T13:00:00Z",
    "location": "Aula 101",
    "capacity": 50,
    "hours": 4,
    "isTransversal": true
  }'
```

---

## Verificación 4: Registrarse en Evento

### 1. Loguéate como Alumno

Usa la cuenta de prueba creada anteriormente.

### 2. Navega a la página del Evento

En el Dashboard, haz clic en el evento creado.

### 3. Haz clic en "Registrarse"

Deberías recibir una confirmación visual.

### 4. Verificar en Backend (Opcional)

```bash
curl https://istpet-eventos-backend-xxx.vercel.app/api/events \
  -H "Authorization: Bearer [TU_TOKEN_ALUMNO]"
```

El evento debe mostrar `registrations: [...]` con tu usuario.

---

## Verificación 5: Generar Certificado

### 1. Marca Asistencia (Requiere Admin/Docente)

1. Loguéate como DOCENTE o ADMIN
2. Ve al evento
3. Marca al alumno como "PRESENTE"

### 2. Genera Certificado

1. Loguéate como el ALUMNO que asistió
2. Ve a "Mis Certificados"
3. Haz clic en "Descargar" para el evento

### 3. Verifica el PDF

El PDF descargado debe contener:
- ✅ Nombre del alumno
- ✅ Carrera
- ✅ Nombre del evento
- ✅ Número de horas
- ✅ Fecha
- ✅ Logo ISTPET (si está disponible)
- ✅ Código QR
- ✅ Firma digital

### 4. Verifica Archivo en S3

Abre AWS Console → S3 → istpet-eventos-uploads:
- Deberías ver una carpeta `uploads/`
- Contiene el PDF con nombre como `uploads/[timestamp]-[nombre].pdf`
- URL pública: `https://istpet-eventos-uploads.s3.us-east-1.amazonaws.com/uploads/...`

---

## Verificación 6: Prueba Email (Password Reset)

### 1. Solicita Reseteo de Contraseña

```bash
curl -X POST https://istpet-eventos-backend-xxx.vercel.app/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Resultado esperado:
```json
{"message": "Correo enviado. Revisa tu bandeja de entrada."}
```

### 2. Verifica Email

Abre tu email (test@example.com o tu email real):
- Deberías recibir email del remitente configurado
- Contiene un botón "Restablecer Contraseña"
- El enlace apunta a: `https://istpet-eventos-xxx.vercel.app/reset-password/[token]`

---

## Verificación 7: Filtrado por Carrera

### 1. Crea Evento de Carrera Específica

1. Loguéate como ADMIN
2. Crea evento y selecciona carrera: "Sistemas"

### 2. Loguéate como Alumno de otra Carrera

Crea usuario con:
- Carrera: "Administración"

### 3. Verifica que no ve el Evento

El evento de "Sistemas" no debe aparecer en su dashboard.

### 4. Loguéate como Alumno de la Carrera Correcta

Crea usuario con:
- Carrera: "Sistemas"

### 5. Verifica que sí ve el Evento

El evento debe aparecer en su dashboard.

---

## Verificación 8: Validaciones de Evento

### Test 1: Fecha Pasada

```bash
curl -X POST https://istpet-eventos-backend-xxx.vercel.app/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ADMIN_TOKEN]" \
  -d '{
    "title": "Test",
    "startDate": "2026-01-01T09:00:00Z",
    ...
  }'
```

Resultado esperado: **Error 400**
```json
{"message": "El evento no puede programarse en una fecha pasada"}
```

### Test 2: Horas Inválidas

```bash
curl -X POST https://istpet-eventos-backend-xxx.vercel.app/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ADMIN_TOKEN]" \
  -d '{
    "title": "Test",
    "hours": 0,  # Inválido (< 1)
    ...
  }'
```

Resultado esperado: **Error 400**
```json
{"message": "Las horas deben estar entre 1 y 8"}
```

### Test 3: Fecha Inicio >= Fecha Fin

```bash
curl -X POST https://istpet-eventos-backend-xxx.vercel.app/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ADMIN_TOKEN]" \
  -d '{
    "title": "Test",
    "startDate": "2026-05-10T13:00:00Z",
    "endDate": "2026-05-10T09:00:00Z",  # Antes que startDate
    ...
  }'
```

Resultado esperado: **Error 400**
```json
{"message": "Fecha de inicio debe ser anterior a fecha de fin"}
```

---

## Checklist de Verificación Final

- [ ] Frontend carga en https://istpet-eventos-xxx.vercel.app
- [ ] Backend responde en /health
- [ ] Puedo registrarme con email/contraseña
- [ ] Puedo logearme en el sistema
- [ ] Token JWT se guarda en localStorage
- [ ] Puedo crear evento (Admin/Docente)
- [ ] Puedo registrarme en evento (Alumno)
- [ ] Puedo descargar certificado PDF (si asistí)
- [ ] Certificado PDF se guarda en S3
- [ ] Certificado se puede descargar desde S3 (URL pública)
- [ ] Email de password reset se recibe
- [ ] Filtrado por carrera funciona correctamente
- [ ] Validaciones de evento rechaza fechas inválidas
- [ ] Dashboard muestra solo eventos del mes actual
- [ ] No hay errores CORS en consola del navegador

---

## Troubleshooting Común

### Problema: "CORS error: Origin not allowed"

**Causa:** FRONTEND_URL no coincide con URL real de Vercel

**Solución:**
1. Backend → Environment Variables → Verifica FRONTEND_URL
2. Debe ser exactamente: `https://istpet-eventos-xxx.vercel.app`
3. Redeploy del backend

### Problema: "Error al conectar a base de datos"

**Causa:** DATABASE_URL es inválida

**Solución:**
1. Verifica en Neon que la connection string sea correcta
2. Incluye `?sslmode=require`
3. Actualiza en Vercel Environment Variables
4. Redeploy

### Problema: "Cannot read property 'upload' of undefined"

**Causa:** AWS_S3_BUCKET no está configurado o aws-sdk no está instalado

**Solución:**
```bash
# En backend local
npm install aws-sdk
git add package-lock.json
git commit -m "Install aws-sdk"
git push  # Vercel rebuilda automáticamente
```

### Problema: "No such table: User"

**Causa:** Las migraciones no se ejecutaron en Neon

**Solución:**
```bash
# En terminal local (en directorio backend)
DATABASE_URL="..." npx prisma migrate deploy
```

---

## Siguiente Paso

Una vez que toda la verificación sea exitosa:

1. **Comunicar a stakeholders** que el sistema está en producción
2. **Entrenar a usuarios** en cómo usar el sistema
3. **Monitorear logs** en Vercel para errores
4. **Hacer backup** de datos periódicamente en Neon
5. **Actualizar DNS** si usas dominio personalizado (ver guía de custom domains en Vercel)
