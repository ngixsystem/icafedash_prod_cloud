# iCafeDash Windows Start Script
Write-Host "=== Starting iCafeDash (Windows Mode) ===" -ForegroundColor Cyan

# 1. Setup Backend
Write-Host "`n>>> Setting up Backend..." -ForegroundColor Yellow
cd backend
if (-not (Test-Path "venv")) {
    python -m venv venv
}
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..

# 2. Build Frontend
Write-Host "`n>>> Building Frontend..." -ForegroundColor Yellow
cd frontend/icafedash-main
npm install --legacy-peer-deps
npm run build
cd ../..

# 3. Start Application
Write-Host "`n>>> Starting Server at http://localhost:5000" -ForegroundColor Green
$env:CONFIG_DIR = "$(Get-Location)\backend\data"
if (-not (Test-Path "backend\data")) {
    New-Item -ItemType Directory -Force -Path "backend\data"
}
cd backend
.\venv\Scripts\python.exe app.py
