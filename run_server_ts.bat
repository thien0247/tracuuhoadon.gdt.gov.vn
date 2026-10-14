@echo off
chcp 65001 >nul
title GDT Tax Crawler - Hybrid TypeScript Dashboard

echo ========================================================
echo   KHỞI CHẠY HYBRID TYPESCRIPT BACKEND & PYTHON WORKER
echo   Hệ Thống Vét Cạn Mã Số Thuế - GDT Tax Crawler v3.1
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Đang khởi chạy Python Crawler Worker Bridge trên cổng 8124...
echo       (Đang nạp mô hình AI CAPTCHA & TensorFlow, mất ~15-20s...)
start /b "" python worker_bridge.py

timeout /t 3 >nul

echo [2/3] Đang khởi chạy TypeScript Fastify Server trên cổng 8123...
echo.
echo  - Web Dashboard: http://localhost:8123
echo  - Worker Bridge: http://127.0.0.1:8124
echo  - Hệ thống sẽ tự động kết nối và đồng bộ ngay khi AI Worker sẵn sàng!
echo  - Nhấn CTRL+C để dừng hệ thống bất kỳ lúc nào.
echo.

start /b "" cmd /c "timeout /t 3 >nul & start http://localhost:8123"

npm start

pause
