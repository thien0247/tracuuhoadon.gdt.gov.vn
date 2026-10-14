@echo off
chcp 65001 >nul
title MST Crawler Web Dashboard Server

echo ========================================================
echo   KHỞI CHẠY HỆ THỐNG VÉT CẠN MÃ SỐ THUẾ (WEB DASHBOARD)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Đang kiểm tra cấu hình...
if not exist "config.json" (
    echo {"host": "0.0.0.0", "port": 8123} > config.json
)

echo [2/2] Đang khởi chạy FastAPI Web Server trên cổng 8123...
echo.
echo  - Web Dashboard: http://localhost:8123
echo  - Nhấn CTRL+C để dừng server bất kỳ lúc nào.
echo.

start /b "" cmd /c "timeout /t 5 >nul & start http://localhost:8123"

python server.py

pause
