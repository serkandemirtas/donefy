@echo off
chcp 65001 >nul
title DONEFY - Build Installer
cd /d "%~dp0"

echo.
echo  DONEFY - Professional Installer Build
echo  =======================================
echo.

:: ── Step 1: Check prerequisites ──────────────────────────────────────────────

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Run setup.bat first.
    pause & exit /b 1
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Run setup.bat first.
    pause & exit /b 1
)

:: Check if Inno Setup is installed (common locations)
set ISCC=""
if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" set ISCC="C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if exist "C:\Program Files\Inno Setup 6\ISCC.exe"       set ISCC="C:\Program Files\Inno Setup 6\ISCC.exe"

if %ISCC%=="" (
    echo.
    echo ERROR: Inno Setup not found!
    echo.
    echo Please install it first:
    echo   1. Open this link: https://jrsoftware.org/isdl.php
    echo   2. Download and install Inno Setup 6
    echo   3. Run this script again
    echo.
    start https://jrsoftware.org/isdl.php
    pause & exit /b 1
)
echo [OK] Inno Setup found

:: ── Step 2: Build React frontend ────────────────────────────────────────────

echo.
echo [1/3] Building React frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed.
    echo Run setup.bat first if you haven't already.
    pause & exit /b 1
)
cd ..
echo [OK] Frontend built

:: ── Step 3: Package with PyInstaller ────────────────────────────────────────

echo.
echo [2/3] Packaging with PyInstaller...
pip install pyinstaller -q
cd backend

pyinstaller --noconfirm --clean ^
  --name "DONEFY" ^
  --windowed ^
  --add-data "../frontend/dist;frontend/dist" ^
  --add-data "uploads;uploads" ^
  --hidden-import uvicorn.logging ^
  --hidden-import uvicorn.loops.auto ^
  --hidden-import uvicorn.protocols.http.auto ^
  --hidden-import uvicorn.lifespan.on ^
  --hidden-import fastapi ^
  --hidden-import fastapi.middleware.cors ^
  --hidden-import fastapi.staticfiles ^
  --hidden-import apscheduler ^
  --hidden-import apscheduler.schedulers.background ^
  --hidden-import apscheduler.triggers.interval ^
  --hidden-import webview ^
  --hidden-import anthropic ^
  --hidden-import openai ^
  --hidden-import google.generativeai ^
  main.py

if %errorlevel% neq 0 (
    echo ERROR: PyInstaller failed.
    pause & exit /b 1
)
cd ..
echo [OK] DONEFY.exe created

:: ── Step 4: Build installer with Inno Setup ──────────────────────────────────

echo.
echo [3/3] Building installer with Inno Setup...

:: Create output folder
if not exist "installer" mkdir installer

%ISCC% "installer.iss"
if %errorlevel% neq 0 (
    echo ERROR: Inno Setup compilation failed.
    pause & exit /b 1
)

echo.
echo  ================================================
echo   BUILD COMPLETE!
echo.
echo   Installer: installer\DONEFYSetup.exe
echo.
echo   Share this single file with anyone.
echo   They double-click it, follow the wizard,
echo   and DONEFY appears on their desktop.
echo  ================================================
echo.

:: Open the installer folder
explorer installer
pause
