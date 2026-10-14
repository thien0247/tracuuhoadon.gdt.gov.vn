# scripts/check-ports.ps1
# Kiem tra trang thai cong mang cua du an GDT Tax Crawler
param (
    [int[]]$Ports = @(8123, 8124, 5432, 5433)
)

Write-Host "`n=== KIEM TRA TRANG THAI CONG MANG (GDT TAX CRAWLER) ===" -ForegroundColor Cyan

foreach ($port in $Ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
    
    if ($connections) {
        foreach ($conn in $connections) {
            $procId = $conn.OwningProcess
            $procName = "Unknown"
            try {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) { $procName = $proc.ProcessName }
            } catch {}
            
            Write-Host "  [ONLINE]  Port $port -> Listening (PID: $procId, Process: $procName)" -ForegroundColor Green
        }
    } else {
        Write-Host "  [OFFLINE] Port $port -> Closed / Not listening" -ForegroundColor Yellow
    }
}
Write-Host ""
