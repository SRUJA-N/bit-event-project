# ============================================================
#  BIT Event Portal  —  One-Command Setup for Windows
#  Run this ONCE from the VS Code terminal:
#       .\setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host "`n>>> $msg" -ForegroundColor Cyan }
function Write-OK($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "    [ERROR] $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "============================================" -ForegroundColor DarkYellow
Write-Host "  BIT Event Portal  —  Windows Setup" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor DarkYellow

# ── 1. Check Node.js ────────────────────────────────────────
Write-Step "Checking Node.js..."
try {
    $nodeVer = node --version 2>&1
    Write-OK "Node.js $nodeVer found"
} catch {
    Write-Fail "Node.js not found. Install it from https://nodejs.org (LTS version) and re-run this script."
}

# ── 2. Check / install pnpm ─────────────────────────────────
Write-Step "Checking pnpm..."
try {
    $pnpmVer = pnpm --version 2>&1
    Write-OK "pnpm $pnpmVer found"
} catch {
    Write-Host "    pnpm not found. Installing..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-OK "pnpm installed"
}

# ── 3. Check PostgreSQL ─────────────────────────────────────
Write-Step "Checking PostgreSQL..."
$psqlFound = $false
try {
    psql --version | Out-Null
    $psqlFound = $true
    Write-OK "psql found in PATH"
} catch {
    # Try common install locations
    $pgPaths = @(
        "C:\Program Files\PostgreSQL\17\bin",
        "C:\Program Files\PostgreSQL\16\bin",
        "C:\Program Files\PostgreSQL\15\bin",
        "C:\Program Files\PostgreSQL\14\bin"
    )
    foreach ($p in $pgPaths) {
        if (Test-Path "$p\psql.exe") {
            $env:PATH = "$p;$env:PATH"
            $psqlFound = $true
            Write-OK "PostgreSQL found at $p"
            break
        }
    }
    if (-not $psqlFound) {
        Write-Fail "PostgreSQL not found. Install it from https://www.postgresql.org/download/windows/ then re-run this script."
    }
}

# ── 4. Collect DB credentials ───────────────────────────────
Write-Step "Database Configuration"
Write-Host "    Enter your PostgreSQL credentials (press Enter to accept defaults):" -ForegroundColor White

$dbHost = Read-Host "    Host       [localhost]"
if (-not $dbHost) { $dbHost = "localhost" }

$dbPort = Read-Host "    Port       [5432]"
if (-not $dbPort) { $dbPort = "5432" }

$dbUser = Read-Host "    Username   [postgres]"
if (-not $dbUser) { $dbUser = "postgres" }

$dbPassSecure = Read-Host "    Password" -AsSecureString
$dbPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassSecure)
)

$dbName = Read-Host "    Database   [bit_events]"
if (-not $dbName) { $dbName = "bit_events" }

$dbUrl = "postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}"

# ── 5. Create database ──────────────────────────────────────
Write-Step "Creating database '$dbName'..."
$env:PGPASSWORD = $dbPass
try {
    $result = psql -h $dbHost -p $dbPort -U $dbUser -tc "SELECT 1 FROM pg_database WHERE datname='$dbName'" postgres 2>&1
    if ($result -match "1") {
        Write-OK "Database '$dbName' already exists — skipping creation"
    } else {
        psql -h $dbHost -p $dbPort -U $dbUser -c "CREATE DATABASE $dbName" postgres 2>&1 | Out-Null
        Write-OK "Database '$dbName' created"
    }
} catch {
    Write-Fail "Could not connect to PostgreSQL. Check your credentials and make sure PostgreSQL is running."
}

# ── 6. Write .env file ──────────────────────────────────────
Write-Step "Writing .env file..."
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
$envContent = @"
DATABASE_URL=$dbUrl
JWT_SECRET=$jwtSecret
"@
Set-Content -Path ".env" -Value $envContent
Write-OK ".env file written"

# ── 7. Install dependencies ─────────────────────────────────
Write-Step "Installing dependencies (this may take a minute)..."
pnpm install
Write-OK "Dependencies installed"

# ── 8. Push database schema ─────────────────────────────────
Write-Step "Creating database tables..."
$env:DATABASE_URL = $dbUrl
pnpm --filter @workspace/db run push --accept-data-loss
Write-OK "Tables created"

# ── 9. Seed demo data ───────────────────────────────────────
Write-Step "Seeding demo data..."
node scripts/seed.mjs
Write-OK "Demo data loaded"

# ── Done ────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor DarkGreen
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor DarkGreen
Write-Host ""
Write-Host "  To start the app any time, run:" -ForegroundColor White
Write-Host "      .\start.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Demo logins (password: password123):" -ForegroundColor White
Write-Host "    Admin:   admin@bit.edu"
Write-Host "    Faculty: faculty@bit.edu"
Write-Host "    Student: arjun@student.bit.edu"
Write-Host ""

$launch = Read-Host "Launch the app now? (Y/n)"
if ($launch -ne "n" -and $launch -ne "N") {
    & .\start.ps1
}
