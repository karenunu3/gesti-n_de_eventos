# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Generar el cliente de Prisma
RUN npx prisma generate

# Compilar TypeScript a JavaScript (App)
RUN npx tsc

# Compilar TypeScript a JavaScript (Seed)
RUN npx tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --target es2022 --module commonjs --skipLibCheck

# Run Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copiar dependencias del package.json
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar el código compilado desde la etapa builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Generar el cliente de Prisma para la etapa de ejecución
RUN npx prisma generate

# Copiar el script de inicio
COPY start.sh ./
RUN chmod +x start.sh

# Crear la carpeta de uploads persistente
RUN mkdir -p uploads

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000
ENV RUN_STANDALONE=true

CMD ["./start.sh"]
