@echo off
echo =============================================
echo    Iniciando ISTPET Eventos con Docker
echo =============================================

docker compose up --build -d

echo =============================================
echo ¡Entorno levantado correctamente!
echo Accede a la aplicación en: http://localhost
echo Para ver los logs de inicio, ejecuta:
echo   docker compose logs -f backend
echo =============================================
pause
