@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

REM Kiem tra quyen Administrator
net session >nul 2>&1
if %errorlevel% equ 0 goto :is_admin

echo [THONG BAO] Dang yeu cau quyen Quan tri vien (Administrator)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd.exe -ArgumentList '/c `\"%~f0`\"' -Verb RunAs"
exit /b

:is_admin
title GDT Tax Crawler - Windows Service Manager GUI
python service_gui.py
