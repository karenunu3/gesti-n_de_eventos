#!/bin/sh

echo "==== INICIANDO BACKEND EN PRODUCCIÓN ===="

# Esperar y aplicar esquema con Prisma
echo "Conectando a la base de datos y aplicando esquema..."
until npx prisma db push; do
  echo "La base de datos no está disponible aún. Reintentando en 3 segundos..."
  sleep 3
done
echo "¡Base de datos lista con el esquema de Prisma!"

# Semilla de base de datos
if [ "$RUN_SEED" = "true" ]; then
  echo "Ejecutando semilla (seed)..."
  node dist/prisma/seed.js
else
  echo "Saltando la ejecución de la semilla (RUN_SEED no está en true)."
fi

# Iniciar servidor
echo "Iniciando servidor de producción..."
node dist/server.js
