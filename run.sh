#!/bin/bash

# Asegurar que estamos en el directorio correcto
cd "$(dirname "$0")"

echo "============================================="
echo "   Iniciando ISTPET Eventos con Docker       "
echo "============================================="

# Levantar contenedores
docker compose up --build -d

echo "============================================="
echo "¡Entorno levantado correctamente!"
echo "Accede a la aplicación en: http://localhost"
echo "Para ver los logs de inicio, ejecuta:"
echo "  docker compose logs -f backend"
echo "============================================="
