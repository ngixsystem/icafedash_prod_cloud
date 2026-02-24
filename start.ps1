# iCafeDash Windows Start Script
Write-Host "=== Starting iCafeDash (Windows Mode) ===" -ForegroundColor Cyan

# 1. Setup Backend
Write-Host "`n>>> Setting up Backend..." -ForegroundColor Yellow
Set-Location backend
if (-not (Test-Path "venv")) {
    python -m venv venv
}
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Set-Location ..

# 2. Build Frontend
Write-Host "`n>>> Building Frontend..." -ForegroundColor Yellow
Set-Location frontend/icafedash-main
# We use build because app.py serves the dist folder in Windows production mode
npm install --legacy-peer-deps
npm run build
Set-Location ../..

# 3. Start Application
Write-Host "`n>>> Starting iCafeDash Platform at http://localhost:5000" -ForegroundColor Green
Write-Host "NOTE: Running in local Windows mode. Falling back to SQLite database." -ForegroundColor Gray

$env:CONFIG_DIR = "$(Get-Location)\backend\data"
$env:JWT_SECRET_KEY = "dev-secret-platform-key-123" # Default for local dev

if (-not (Test-Path "backend\data")) {
    New-Item -ItemType Directory -Force -Path "backend\data"
}

Set-Location backend
.\venv\Scripts\python.exe app.py
