@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title Bien dich GDTTaxCrawlerManager (.NET 10 + WebView2)
echo ========================================================
echo   BIEN DICH GDT TAX CRAWLER MANAGER (.NET 10 + WEBVIEW2)
echo ========================================================
echo.

cd /d "%~dp0"

dotnet build GDTTaxCrawlerManager.csproj -c Release

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   [THANH CONG] Da tao ra file: bin\Release\net10.0-windows\GDTTaxCrawlerManager.exe
    echo ========================================================
) else (
    echo.
    echo [THAT BAI] Qua trinh bien dich .NET 10 gap loi.
)

echo.
if "%~1"=="" pause
