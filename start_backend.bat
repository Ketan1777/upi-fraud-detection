@echo off
title UPI FraudGuard AI - Backend API (FastAPI)
echo =================================================================
echo Starting UPI FraudGuard AI Backend (FastAPI + ML Model on port 8000)
echo =================================================================
cd /d "%~dp0"
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause
