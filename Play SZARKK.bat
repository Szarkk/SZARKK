@echo off
setlocal
cd /d "%~dp0"

set "PORT=8000"
set "URL=http://127.0.0.1:%PORT%/"

:: Check if the SZARKK local server is already listening on port 8000
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
  start "" "%URL%"
  exit /b 0
)

:: Start local Python HTTP server minimized in the background
where python >nul 2>&1
if %errorlevel%==0 (
  start "SZARKK Local Server" /min python -m http.server %PORT% --bind 127.0.0.1
) else (
  where py >nul 2>&1
  if %errorlevel%==0 (
    start "SZARKK Local Server" /min py -m http.server %PORT% --bind 127.0.0.1
  ) else (
    echo Python was not found on PATH. Please install Python 3 to run SZARKK locally.
    pause
    exit /b 1
  )
)

timeout /t 1 /nobreak >nul
start "" "%URL%"
exit /b 0
