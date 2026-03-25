@echo off
title InventoryIQ - Starting...
cd /d "%~dp0"

echo.
echo  InventoryIQ - Starting application...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo  Docker is not running. Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

REM Start containers (build only first time or when needed)
docker compose up -d
if errorlevel 1 (
    echo  Failed to start containers. Check Docker and try again.
    pause
    exit /b 1
)

echo  Waiting for the application to be ready...
timeout /t 25 /nobreak >nul

start "" "http://localhost:3000"
echo.
echo  Browser opened. If the page is not ready, wait a few seconds and refresh.
echo  Link: http://localhost:3000
echo  Login: test@test.com / Test1234!
echo.
timeout /t 5 /nobreak >nul
