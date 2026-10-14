@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files\Python310;C:\Program Files\Python310\Scripts;%~dp0bin"
set "NO_PROXY=127.0.0.1,localhost"
set "no_proxy=127.0.0.1,localhost"

echo [%date% %time%] [Service] Bat dau khoi dong GDT Tax Crawler Service...

REM 1. Don dep tien trinh cu neu con ket tren port 8123 va 8124
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8123,8124 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

REM 2. Khoi chay Python Crawler Worker Bridge (Port 8124) chay ngam
echo [%date% %time%] [Service] Khoi chay Python Worker Bridge (Port 8124)...
start /b "" python worker_bridge.py

REM Cho 5 giay de Python Worker nap xong cac module
ping 127.0.0.1 -n 6 >nul

REM 3. Khoi chay TypeScript Fastify Backend (Port 8123)
echo [%date% %time%] [Service] Khoi chay TypeScript Fastify Backend (Port 8123)...
call npm start
