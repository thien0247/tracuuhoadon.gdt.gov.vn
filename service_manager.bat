@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul

REM ==============================================================================
REM GDT TAX CRAWLER - WINDOWS SERVICE CONTROLLER
REM Quan ly Windows Service: Dang ky, Go, Start, Stop, Reset, Status
REM ==============================================================================

set "SERVICE_NAME=GDTTaxCrawler"
set "SERVICE_DISPLAY=GDT Tax Crawler - Search Engine Service"
set "SERVICE_DESC=Dich vu tu dong vet can ma so thue va API tra cuu du lieu thue GDT (Fastify 8123 + Python AI Worker 8124)"
set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"

REM Kiem tra NSSM trong thu muc bin\nssm.exe hoac PATH
if exist "%APP_DIR%\bin\nssm.exe" (
    set "NSSM=%APP_DIR%\bin\nssm.exe"
    goto :check_admin
)

where nssm >nul 2>&1
if %errorlevel% equ 0 (
    set "NSSM=nssm"
    goto :check_admin
)

echo [LOI] Khong tim thay nssm.exe trong bin\ hoac PATH he thong!
echo Vui long dat nssm.exe vao thu muc bin\
pause
exit /b 1

:check_admin
net session >nul 2>&1
if %errorlevel% equ 0 goto :is_admin

echo [THONG BAO] Dang yeu cau quyen Quan tri vien (Administrator)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd.exe -ArgumentList '/c `"%~f0 %*`"' -Verb RunAs"
exit /b

:is_admin
cd /d "%APP_DIR%"

REM Xu ly tham so dong lenh
if /i "%~1"=="install"   goto :do_install
if /i "%~1"=="register"  goto :do_install
if /i "%~1"=="uninstall" goto :do_uninstall
if /i "%~1"=="remove"    goto :do_uninstall
if /i "%~1"=="start"     goto :do_start
if /i "%~1"=="stop"      goto :do_stop
if /i "%~1"=="restart"   goto :do_restart
if /i "%~1"=="reset"     goto :do_restart
if /i "%~1"=="status"    goto :do_status
if /i "%~1"=="logs"      goto :do_logs

:menu_loop
cls
call :get_status_text CURRENT_STATUS

echo ======================================================================
echo             HE THONG VET CAN MA SO THUE - GDT TAX CRAWLER
echo                   QUAN LY DICH VU WINDOWS SERVICE
echo ======================================================================
echo   Ten dich vu : %SERVICE_NAME%
echo   Trang thai  : [ !CURRENT_STATUS! ]
echo   Thu muc goc : %APP_DIR%
echo   Cong ket noi: Web Dashboard (8123) - AI Worker Bridge (8124)
echo ----------------------------------------------------------------------
echo   [1] Dang ky dich vu          (Install / Register Service)
echo   [2] Go dang ky dich vu       (Uninstall / Remove Service)
echo   [3] Khoi dong dich vu        (Start Service)
echo   [4] Dung dich vu             (Stop Service)
echo   [5] Khoi dong lai / Reset    (Restart Service)
echo   [6] Xem trang thai chi tiet  (Status and Port Info)
echo   [7] Xem nhat ky dich vu      (View Logs)
echo   [0] Thoat
echo ======================================================================
set /p "CHOICE=Nhap lua chon cua ban [0-7]: "

if "%CHOICE%"=="1" ( call :do_install & pause & goto :menu_loop )
if "%CHOICE%"=="2" ( call :do_uninstall & pause & goto :menu_loop )
if "%CHOICE%"=="3" ( call :do_start & pause & goto :menu_loop )
if "%CHOICE%"=="4" ( call :do_stop & pause & goto :menu_loop )
if "%CHOICE%"=="5" ( call :do_restart & pause & goto :menu_loop )
if "%CHOICE%"=="6" ( call :do_status & pause & goto :menu_loop )
if "%CHOICE%"=="7" ( call :do_logs & pause & goto :menu_loop )
if "%CHOICE%"=="0" ( exit /b 0 )
goto :menu_loop

REM ==============================================================================
REM CAC HAM XU LY
REM ==============================================================================

:get_status_text
set "%~1=CHUA DANG KY"
set "RAW_STATUS="
for /f "usebackq tokens=*" %%a in (`powershell -NoProfile -Command "(Get-Service %SERVICE_NAME% -ErrorAction SilentlyContinue).Status"`) do (
    set "RAW_STATUS=%%a"
)
if /i "!RAW_STATUS!"=="Running" set "%~1=DANG CHAY (RUNNING)"
if /i "!RAW_STATUS!"=="Stopped" set "%~1=DA DUNG (STOPPED)"
if /i "!RAW_STATUS!"=="Paused"  set "%~1=TAM DUNG (PAUSED)"
if /i "!RAW_STATUS!"=="StartPending" set "%~1=DANG KHOI DONG"
if /i "!RAW_STATUS!"=="StopPending"  set "%~1=DANG DUNG"
exit /b

:do_install
echo.
echo [1/4] Kiem tra dich vu hien hanh...
powershell -NoProfile -Command "if (Get-Service %SERVICE_NAME% -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if %errorlevel% equ 0 (
    echo [CANH BAO] Dich vu "%SERVICE_NAME%" da ton tai tren he thong!
    echo Neu muon cai dat lai, vui long chon [2] de go dang ky truoc.
    exit /b 0
)

if not exist "%APP_DIR%\logs" mkdir "%APP_DIR%\logs"

echo [2/4] Dang dang ky dich vu "%SERVICE_NAME%" vao Windows Service Control Manager...
"%NSSM%" install "%SERVICE_NAME%" "cmd.exe" "/c ""%APP_DIR%\service_runner.bat"""
if %errorlevel% neq 0 (
    echo [LOI] Khong the dang ky dich vu voi NSSM!
    exit /b 1
)

echo [3/4] Cau hinh tham so tu dong va nhat ky...
"%NSSM%" set "%SERVICE_NAME%" AppDirectory "%APP_DIR%"
"%NSSM%" set "%SERVICE_NAME%" DisplayName "%SERVICE_DISPLAY%"
"%NSSM%" set "%SERVICE_NAME%" Description "%SERVICE_DESC%"
"%NSSM%" set "%SERVICE_NAME%" Start SERVICE_AUTO_START
"%NSSM%" set "%SERVICE_NAME%" AppStdout "%APP_DIR%\logs\service_out.log"
"%NSSM%" set "%SERVICE_NAME%" AppStderr "%APP_DIR%\logs\service_err.log"
"%NSSM%" set "%SERVICE_NAME%" AppRotateFiles 1
"%NSSM%" set "%SERVICE_NAME%" AppRotateOnline 1
"%NSSM%" set "%SERVICE_NAME%" AppRotateBytes 10485760

echo [4/4] DANG KY DICH VU THANH CONG!
echo Dich vu "%SERVICE_NAME%" da duoc cau hinh tu khoi dong cung Windows (SERVICE_AUTO_START).
echo.
set /p "START_NOW=Ban co muon khoi dong dich vu ngay bay gio khong? (Y/N, mac dinh Y): "
if /i "%START_NOW%"=="" set "START_NOW=Y"
if /i "%START_NOW%"=="Y" call :do_start
exit /b 0

:do_uninstall
echo.
echo [1/3] Dang kiem tra dich vu "%SERVICE_NAME%"...
powershell -NoProfile -Command "if (Get-Service %SERVICE_NAME% -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if %errorlevel% neq 0 (
    echo [CANH BAO] Dich vu "%SERVICE_NAME%" chua duoc cai dat.
    exit /b 0
)

echo [2/3] Dung dich vu neu dang chay...
"%NSSM%" stop "%SERVICE_NAME%" >nul 2>&1
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8123,8124 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo [3/3] Go bo dich vu "%SERVICE_NAME%" khoi he thong...
"%NSSM%" remove "%SERVICE_NAME%" confirm
if %errorlevel% equ 0 (
    echo [THANH CONG] Da go dang ky dich vu "%SERVICE_NAME%".
) else (
    echo [LOI] Khong the go bo dich vu!
)
exit /b 0

:do_start
echo.
echo Dang gui lenh khoi dong dich vu "%SERVICE_NAME%"...
powershell -NoProfile -Command "if (Get-Service %SERVICE_NAME% -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if %errorlevel% neq 0 (
    echo [LOI] Dich vu "%SERVICE_NAME%" chua duoc dang ky! Hay chon [1] de dang ky truoc.
    exit /b 1
)

"%NSSM%" start "%SERVICE_NAME%"
echo Dang doi dich vu khoi dong (khoang 7 giay)...
ping 127.0.0.1 -n 8 >nul
call :do_status
exit /b 0

:do_stop
echo.
echo Dang gui lenh dung dich vu "%SERVICE_NAME%"...
powershell -NoProfile -Command "if (Get-Service %SERVICE_NAME% -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if %errorlevel% neq 0 (
    echo [CANH BAO] Dich vu "%SERVICE_NAME%" chua duoc dang ky!
    exit /b 0
)

"%NSSM%" stop "%SERVICE_NAME%"
echo Dang giai phong cac cong 8123 va 8124...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8123,8124 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo [THANH CONG] Dich vu da duoc dung an toan.
exit /b 0

:do_restart
echo.
echo ========================================================
echo   DANG TIEN HANH RESET / KHOI DONG LAI DICH VU
echo ========================================================
echo [1/2] Dung dich vu hien hanh...
call :do_stop
ping 127.0.0.1 -n 3 >nul
echo [2/2] Khoi dong lai dich vu...
call :do_start
echo [THANH CONG] Da hoan tat Reset dich vu!
exit /b 0

:do_status
echo.
echo =================== TRANG THAI DICH VU ===================
call :get_status_text DETAILED_STATUS
echo  - Trang thai Windows Service: !DETAILED_STATUS!
echo.
echo  - Kiem tra cong ket noi:
powershell -NoProfile -Command "$p8123 = Get-NetTCPConnection -LocalPort 8123 -ErrorAction SilentlyContinue; $p8124 = Get-NetTCPConnection -LocalPort 8124 -ErrorAction SilentlyContinue; if ($p8123) { Write-Host '   + Cong 8123 (Fastify Web Dashboard): [DANG LANG NGHE - PID ' $p8123[0].OwningProcess ']' -ForegroundColor Green } else { Write-Host '   + Cong 8123 (Fastify Web Dashboard): [CHUA KET NOI]' -ForegroundColor Red }; if ($p8124) { Write-Host '   + Cong 8124 (Python AI Worker)     : [DANG LANG NGHE - PID ' $p8124[0].OwningProcess ']' -ForegroundColor Green } else { Write-Host '   + Cong 8124 (Python AI Worker)     : [CHUA KET NOI]' -ForegroundColor Red }"
echo ==========================================================
exit /b 0

:do_logs
echo.
echo =================== NHAT KY DICH VU (LOGS) ===================
if exist "%APP_DIR%\logs\service_out.log" (
    echo --- [10 DONG CUOI FILE logs\service_out.log] ---
    powershell -NoProfile -Command "Get-Content '%APP_DIR%\logs\service_out.log' -Tail 10 -ErrorAction SilentlyContinue"
) else (
    echo Chua co tep logs\service_out.log
)
echo.
if exist "%APP_DIR%\logs\service_err.log" (
    echo --- [10 DONG CUOI FILE logs\service_err.log] ---
    powershell -NoProfile -Command "Get-Content '%APP_DIR%\logs\service_err.log' -Tail 10 -ErrorAction SilentlyContinue"
) else (
    echo Chua co tep logs\service_err.log
)
echo ==========================================================
exit /b 0
