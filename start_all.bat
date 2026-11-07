@echo off
title UPI FraudGuard AI - Full Stack Launcher
echo =================================================================
echo Launching UPI FraudGuard AI (Backend on :8000 and Frontend on :5173)
echo =================================================================
cd /d "%~dp0"
start "UPI Backend (FastAPI)" cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "UPI Frontend" cmd /k "node server.js"
echo.
echo Both servers launched!
echo - Frontend: http://localhost:5173
echo - Backend API Docs: http://127.0.0.1:8000/docs
echo =================================================================
pause
