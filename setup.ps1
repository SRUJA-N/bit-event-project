Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force 2>$null

$ErrorActionPreference = "Stop"

function Write-Step { param($msg); Write-Host "" ; Write-Host ">>> $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg); Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Fail { param($msg); Write-Host ""; Write-Host "[ERROR] $msg" -ForegroundColor Red; Read-Host "Press Enter to exit"; exit 1 }

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  BIT Event Portal  -  Windows Setup       " -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

# ── 1. Node.js ──────────────────────────────────────────────
Write-Step "Checking Node.js..."
$nodeCheck = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Node.js not found. Download and install the LTS version from https://nodejs.org then re-run this script."
}
Write-OK "Node.js $nodeCheck"

# ── 2. pnpm ─────────────────────────────────────────────────
Write-Step "Checking pnpm..."
$pnpmCheck = pnpm --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "    pnpm not found - installing now..." -ForegroundColor Yellow
    npm install -g pnpm
    if ($LASTEXITCODE -ne 0) { Write-Fail "Could not install pnpm. Try running: npm install -g pnpm" }
    Write-OK "pnpm installed"
} else {
    Write-OK "pnpm $pnpmCheck"
}

# ── 3. PostgreSQL ────────────────────────────────────────────
Write-Step "Checking PostgreSQL..."
$psqlOk = $false
$psqlTest = psql --version 2>&1
if ($LASTEXITCODE -eq 0) {
    $psqlOk = $true
    Write-OK "psql found in PATH"
} else {
    $pgSearchPaths = @(
        "C:\Program Files\PostgreSQL\17\bin",
        "C:\Program Files\PostgreSQL\16\bin",
        "C:\Program Files\PostgreSQL\15\bin",
        "C:\Program Files\PostgreSQL\14\bin"
    )
    foreach ($pgPath in $pgSearchPaths) {
        if (Test-Path (Join-Path $pgPath "psql.exe")) {
            $env:PATH = $pgPath + ";" + $env:PATH
            $psqlOk = $true
            Write-OK "PostgreSQL found at $pgPath"
            break
        }
    }
    if (-not $psqlOk) {
        Write-Fail "PostgreSQL not found. Install it from https://www.postgresql.org/download/windows then re-run this script."
    }
}

# ── 4. DB credentials ────────────────────────────────────────
Write-Step "Database Configuration"
Write-Host "    Press Enter to accept the default shown in brackets." -ForegroundColor White
Write-Host ""

$dbHost = Read-Host "    Host     [localhost]"
if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }

$dbPort = Read-Host "    Port     [5432]"
if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "5432" }

$dbUser = Read-Host "    User     [postgres]"
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }

$dbPassRaw = Read-Host "    Password"

$dbName = Read-Host "    Database [bit_events]"
if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "bit_events" }

$dbUrl = "postgresql://" + $dbUser + ":" + $dbPassRaw + "@" + $dbHost + ":" + $dbPort + "/" + $dbName

# ── 5. Create database ───────────────────────────────────────
Write-Step "Connecting to PostgreSQL..."
$env:PGPASSWORD = $dbPassRaw

$checkDb = psql -h $dbHost -p $dbPort -U $dbUser -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='$dbName'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Could not connect to PostgreSQL. Make sure the server is running and your password is correct."
}

if ($checkDb -match "1") {
    Write-OK "Database '$dbName' already exists"
} else {
    psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE $dbName" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Fail "Failed to create database '$dbName'." }
    Write-OK "Database '$dbName' created"
}

# ── 6. Write .env ────────────────────────────────────────────
Write-Step "Writing .env file..."
$chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
$jwtSecret = -join (1..32 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })

$envLine1 = "DATABASE_URL=" + $dbUrl
$envLine2 = "JWT_SECRET=" + $jwtSecret
$envLines = @($envLine1, $envLine2)
Set-Content -Path ".env" -Value $envLines -Encoding UTF8
Write-OK ".env written"

# ── 7. Install dependencies ──────────────────────────────────
Write-Step "Installing dependencies (may take a minute)..."
pnpm install
if ($LASTEXITCODE -ne 0) { Write-Fail "pnpm install failed." }
Write-OK "Dependencies installed"

# ── 8. Push DB schema ────────────────────────────────────────
Write-Step "Creating database tables..."
$env:DATABASE_URL = $dbUrl
pnpm --filter "@workspace/db" run push --accept-data-loss
if ($LASTEXITCODE -ne 0) { Write-Fail "Database schema push failed." }
Write-OK "Tables created"

# ── 9. Seed demo data ────────────────────────────────────────
Write-Step "Loading demo data..."
node scripts/seed.mjs
if ($LASTEXITCODE -ne 0) { Write-Fail "Seeding failed." }
Write-OK "Demo data loaded"

# ── Done ─────────────────────────────────────────────────────
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
