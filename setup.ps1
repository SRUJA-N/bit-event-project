Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force 2>$null

$ErrorActionPreference = "Stop"

function Write-Step { param($msg); Write-Host ""; Write-Host ">>> $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg); Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Fail { param($msg); Write-Host ""; Write-Host "[ERROR] $msg" -ForegroundColor Red; Read-Host "Press Enter to exit"; exit 1 }

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  BIT Event Portal  -  Windows Setup       " -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Requirements: Python 3.10+ and Node.js 18+" -ForegroundColor White
Write-Host "  No PostgreSQL needed - uses SQLite (built into Python)" -ForegroundColor Gray
Write-Host ""

# ── 1. Python ───────────────────────────────────────────────
Write-Step "Checking Python..."
$pyCheck = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    $pyCheck = python3 --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Python not found. Download Python 3.10+ from https://www.python.org/downloads/ - tick 'Add to PATH' during install, then re-run this script."
    }
    Set-Alias -Name python -Value python3 -Scope Script
}
Write-OK "$pyCheck"

# ── 2. pip ──────────────────────────────────────────────────
Write-Step "Checking pip..."
python -m pip --version 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Fail "pip not found. Reinstall Python and make sure pip is included." }
Write-OK "pip ready"

# ── 3. Node.js ──────────────────────────────────────────────
Write-Step "Checking Node.js..."
$nodeCheck = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Node.js not found. Download the LTS version from https://nodejs.org then re-run this script."
}
Write-OK "Node.js $nodeCheck"

# ── 4. pnpm ─────────────────────────────────────────────────
Write-Step "Checking pnpm..."
$pnpmCheck = pnpm --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "    Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    if ($LASTEXITCODE -ne 0) { Write-Fail "Could not install pnpm. Try: npm install -g pnpm" }
    Write-OK "pnpm installed"
} else {
    Write-OK "pnpm $pnpmCheck"
}

# ── 5. Python packages ───────────────────────────────────────
Write-Step "Installing Python packages (fastapi, uvicorn, sqlalchemy, etc.)..."
python -m pip install -r artifacts\api-server\requirements.txt --quiet
if ($LASTEXITCODE -ne 0) { Write-Fail "Python package install failed. Check your internet connection." }
Write-OK "Python packages installed"

# ── 6. Node packages ─────────────────────────────────────────
Write-Step "Installing Node packages (this may take a minute)..."
pnpm install
if ($LASTEXITCODE -ne 0) { Write-Fail "pnpm install failed." }
Write-OK "Node packages installed"

# ── 7. Seed demo data ─────────────────────────────────────────
Write-Step "Creating database and loading demo data..."
python artifacts\api-server\seed.py
if ($LASTEXITCODE -ne 0) { Write-Fail "Database seeding failed." }
Write-OK "Database ready with demo data"

# ── Done ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Setup complete!                          " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Run this any time to start the app:" -ForegroundColor White
Write-Host "      .\start.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Demo logins (password: password123)" -ForegroundColor White
Write-Host "    Admin:   admin@bit.edu"
Write-Host "    Faculty: faculty@bit.edu"
Write-Host "    Student: arjun@student.bit.edu"
Write-Host ""

$launch = Read-Host "Launch the app now? (Y/n)"
if ($launch -ne "n" -and $launch -ne "N") {
    & ".\start.ps1"
}
