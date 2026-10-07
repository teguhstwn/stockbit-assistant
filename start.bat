@echo off
title Stockbit Trading Assistant - Realtime Server
echo ===================================================
echo   Memulai Stockbit Trading Assistant (Realtime IHSG)
echo ===================================================
echo.
cd /d "%~dp0"
echo Membuka browser di http://localhost:3000 ...
start "" "http://localhost:3000"
echo Menjalankan backend server...
node server.js
pause
