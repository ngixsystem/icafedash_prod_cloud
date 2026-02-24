#!/bin/bash

# iCafeDash Local Start Script (Non-Docker)
echo "=== Starting iCafeDash (Non-Docker Mode) ==="

# 1. Install Backend Dependencies
echo ">>> Setting up Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# 2. Build Frontend
echo ">>> Building Frontend..."
cd frontend/icafedash-main
npm install --legacy-peer-deps
npm run build
cd ../..

# 3. Start Application
echo ">>> Starting Server at http://localhost:5000"
cd backend
source venv/bin/activate
export CONFIG_DIR=$(pwd)/data
mkdir -p data
python3 app.py
