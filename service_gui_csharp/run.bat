@echo off
cd /d "%~dp0"
if not exist "bin\Release\net10.0-windows\GDTTaxCrawlerManager.exe" (
    call build.bat nopause
)
start "" "bin\Release\net10.0-windows\GDTTaxCrawlerManager.exe"
