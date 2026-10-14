# scripts/kill-port.ps1
# Giai phong nhanh tien trinh dang lang nghe tren cong chi dinh
param (
    [Parameter(Mandatory=$true)]
    [int]$Port
)

Write-Host "Dang tim tien trinh lang nghe tren cong $Port..." -ForegroundColor Cyan

$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }

if (-not $connections) {
    Write-Host "Khong tim thay tien trinh nao dang lang nghe tren cong $Port." -ForegroundColor Green
    exit 0
}

$pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique

foreach ($procId in $pids) {
    try {
        $proc = Get-Process -Id $procId -ErrorAction Stop
        Write-Host "Dang dong tien trinh '$($proc.ProcessName)' (PID: $procId)..." -ForegroundColor Yellow
        Stop-Process -Id $procId -Force
        Write-Host "Da giai phong cong $Port thanh cong!" -ForegroundColor Green
    } catch {
        Write-Warning "Khong the dong PID $procId : $($_.Exception.Message)"
    }
}
