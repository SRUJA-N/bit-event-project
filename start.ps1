# ============================================================
#  BIT Event Portal  —  Start the app
#  Run this every time:  .\start.ps1
# ============================================================

if (-not (Test-Path ".env")) {
    Write-Host "[ERROR] .env file not found. Run .\setup.ps1 first." -ForegroundColor Red
    exit 1
}

# Read .env into current session
Get-Content ".env" | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]*)\s*=\s*(.*)\s*$") {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
    }
}

$dbUrl    = $env:DATABASE_URL
$jwtSec   = $env:JWT_SECRET

Write-Host ""
Write-Host "============================================" -ForegroundColor DarkYellow
Write-Host "  BIT Event Portal  —  Starting..." -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor DarkYellow
Write-Host ""
Write-Host "  Opening two terminal windows:" -ForegroundColor White
Write-Host "    Window 1 — API server  (port 8080)" -ForegroundColor Gray
Write-Host "    Window 2 — Frontend    (port 3000)" -ForegroundColor Gray
Write-Host ""

# Launch API server in a new PowerShell window
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$env:PORT='8080'; `$env:NODE_ENV='development'; `$env:DATABASE_URL='$dbUrl'; `$env:JWT_SECRET='$jwtSec'; Write-Host 'BIT API Server — port 8080' -ForegroundColor Cyan; pnpm --filter @workspace/api-server run dev"
)

# Give the API server a few seconds head start
Start-Sleep -Seconds 3

# Launch frontend in a new PowerShell window
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$env:PORT='3000'; `$env:BASE_PATH='/'; Write-Host 'BIT Frontend — port 3000' -ForegroundColor Cyan; pnpm --filter @workspace/bit-events run dev"
)

# Wait then open browser
Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"

Write-Host "  App is running at  http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "  Demo logins (password: password123)" -ForegroundColor Yellow
Write-Host "    Admin:   admin@bit.edu"
Write-Host "    Faculty: faculty@bit.edu"
Write-Host "    Student: arjun@student.bit.edu"
Write-Host ""
Write-Host "  Close the two PowerShell windows to stop the servers." -ForegroundColor Gray
Write-Host ""
