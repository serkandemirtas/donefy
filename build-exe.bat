@echo off
chcp 65001 >nul
title DONEFY - Build EXE
cd /d "%~dp0"

echo.
echo  DONEFY - Building EXE
echo  ======================
echo.

echo [1/3] Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 ( echo ERROR: Frontend build failed. & pause & exit /b 1 )
cd ..
echo [OK] Frontend built

echo.
echo [2/3] Installing PyInstaller...
pip install pyinstaller -q
echo [OK] PyInstaller ready

echo.
echo [3/3] Packaging DONEFY.exe...
cd backend
pyinstaller --noconfirm --clean ^
  --name "DONEFY" ^
  --windowed ^
  --icon "../frontend/public/logo.png" ^
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

if %errorlevel% neq 0 ( echo ERROR: PyInstaller failed. & pause & exit /b 1 )

echo.
echo  ============================================
echo   BUILD COMPLETE!
echo   Location: backend\dist\DONEFY\DONEFY.exe
echo.
echo   Share the entire DONEFY folder - not just the .exe!
echo   Zip backend\dist\DONEFY\ and share it.
echo  ============================================
echo.
explorer "dist\DONEFY"
pause
