@echo off
title InventoryIQ - First-time database setup
cd /d "%~dp0"

echo.
echo  InventoryIQ - One-time database setup
echo  Run this only once per PC (or after a full reset).
echo.

docker info >nul 2>&1
if errorlevel 1 (
    echo  Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo  Starting containers...
docker compose up -d
timeout /t 20 /nobreak >nul

echo  Setting up database and Passport...
docker compose exec -T inventoryiq-backend php artisan migrate:fresh --seed
docker compose exec -T inventoryiq-backend php artisan passport:install --force

echo.
echo  Setup complete. You can now use "Start InventoryIQ.bat" to open the app.
echo  Login: test@test.com / Test1234!
echo.
pause
