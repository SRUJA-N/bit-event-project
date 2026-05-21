Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force 2>$null

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  BIT Event Portal  -  Starting...        " -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Opening two terminal windows:" -ForegroundColor White
Write-Host "    Window 1 - API server  (FastAPI on port 8080)" -ForegroundColor Gray
Write-Host "    Window 2 - Frontend    (React on port 3000)" -ForegroundColor Gray
Write-Host ""

# Start FastAPI backend
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$PSScriptRoot\artifacts\api-server'; Write-Host 'BIT API Server - http://localhost:8080' -ForegroundColor Cyan; python -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload"
)

Start-Sleep -Seconds 3

# Start React frontend
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$PSScriptRoot'; `$env:PORT='3000'; `$env:BASE_PATH='/'; Write-Host 'BIT Frontend - http://localhost:3000' -ForegroundColor Cyan; pnpm --filter '@workspace/bit-events' run dev"
)

Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"

Write-Host "  App running at   http://localhost:3000" -ForegroundColor Green
Write-Host "  API running at   http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "  Demo logins (password: password123)" -ForegroundColor Yellow
Write-Host "    Admin:   admin@bit.edu"
Write-Host "    Faculty: faculty@bit.edu"
Write-Host "    Student: arjun@student.bit.edu"
Write-Host ""
Write-Host "  Close the two terminal windows to stop the servers." -ForegroundColor Gray
