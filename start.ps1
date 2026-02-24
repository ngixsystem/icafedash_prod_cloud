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
npm install --legacy-peer-deps
npm run build
Set-Location ../..

# 3. Start Application
Write-Host "`n>>> Starting Server at http://localhost:5000" -ForegroundColor Green
$env:CONFIG_DIR = "$(Get-Location)\backend\data"
if (-not (Test-Path "backend\data")) {
    New-Item -ItemType Directory -Force -Path "backend\data"
}
Set-Location backend
.\venv\Scripts\python.exe app.py
