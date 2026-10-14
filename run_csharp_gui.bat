@echo off
setlocal
cd /d "%~dp0"
set "NO_PROXY=127.0.0.1,localhost,app.local"
set "no_proxy=127.0.0.1,localhost,app.local"
if not exist "service_gui_csharp\bin\Release\net10.0-windows\GDTTaxCrawlerManager.exe" (
    call service_gui_csharp\build.bat nopause
)
start "" "service_gui_csharp\bin\Release\net10.0-windows\GDTTaxCrawlerManager.exe"
