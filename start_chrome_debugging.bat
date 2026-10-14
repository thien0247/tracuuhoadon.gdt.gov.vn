@echo off
chcp 65001 >nul
title Khởi chạy Chrome Remote Debugging cho MCP

echo ====================================================================
echo   KHỞI CHẠY GOOGLE CHROME VỚI CỔNG REMOTE DEBUGGING (PORT 9222)
echo ====================================================================
echo.
echo Đang mở trình duyệt Chrome với profile riêng biệt trên cổng 9222...

start "" "chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome_mcp_profile" http://localhost:8000

echo.
echo Chrome đã sẵn sàng cho chrome-devtools-mcp kết nối tự động!
echo Bạn có thể sử dụng cờ: --browserUrl http://127.0.0.1:9222 hoặc --auto-connect
echo.
timeout /t 3 >nul
