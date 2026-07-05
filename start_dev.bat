@echo off
rem AnalytIQ dev helper — starts BOTH servers in separate windows so each can
rem be restarted independently (close a window / Ctrl+C just that server).
cd /d %~dp0
echo Flask API  -> http://localhost:3001
echo Vite client-> http://localhost:5173  (open this one)
start "analytiq-api" cmd /k ".venv\Scripts\python.exe server\app.py"
start "analytiq-client" cmd /k "npm run dev:client"
