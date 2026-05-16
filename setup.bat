@echo off
chcp 65001 >nul
title DONEFY - Setup
cd /d "%~dp0"

echo.
echo  DONEFY - AI-Powered Productivity
echo  ===================================
echo.

if not exist "backend\main.py" (
    echo ERROR: backend\main.py not found. Re-extract the ZIP.
    pause & exit /b 1
)
if not exist "frontend\package.json" (
    echo ERROR: frontend\package.json not found. Re-extract the ZIP.
    pause & exit /b 1
)

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found!
    echo Download: https://python.org/downloads
    echo CHECK "Add to PATH" during install!
    pause & exit /b 1
)
echo [OK] Python found

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Download: https://nodejs.org  (LTS version)
    pause & exit /b 1
)
echo [OK] Node.js found

echo.
echo [1/3] Installing Python packages...
cd backend
pip install -r requirements.txt -q
if %errorlevel% neq 0 ( echo ERROR: pip install failed. & pause & exit /b 1 )
cd ..
echo [OK] Done

echo.
echo [2/3] Building frontend...
cd frontend
call npm install --silent
if %errorlevel% neq 0 ( echo ERROR: npm install failed. & pause & exit /b 1 )
call npm run build
if %errorlevel% neq 0 ( echo ERROR: npm build failed. & pause & exit /b 1 )
cd ..
echo [OK] Done

echo.
echo [3/3] Launching DONEFY...
echo  (Next time just use run.bat)
echo.
cd backend
python main.py
