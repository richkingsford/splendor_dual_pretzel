@echo off
setlocal
cd /d "%~dp0"

netstat -ano | findstr /r /c:":4317 .*LISTENING" >nul
if errorlevel 1 (
  echo Starting Splendor Dual Pretzel at http://127.0.0.1:4317
  start "Splendor Dual Server" "C:\Program Files\nodejs\node.exe" server.js
  timeout /t 1 /nobreak >nul
) else (
  echo Splendor Dual Pretzel is already running at http://127.0.0.1:4317
)

start "" http://127.0.0.1:4317
