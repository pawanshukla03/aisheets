@echo off
title AISheets Launcher
set "APP_DIR=%~dp0"
set "LOGFILE=%APP_DIR%launcher.log"

echo AISheets launcher running. Log: %LOGFILE%
echo.

REM Run main logic and capture everything to log
call :run >> "%LOGFILE%" 2>&1
set "EXIT_CODE=%errorlevel%"

echo. >> "%LOGFILE%"
echo ========== Launcher ended: %date% %time%  Exit code: %EXIT_CODE% ========== >> "%LOGFILE%"

if not %EXIT_CODE%==0 (
  echo Something went wrong. Opening log file.
  start notepad "%LOGFILE%"
  pause
) else (
  echo Browser should open shortly. Keep "AISheets Server" window open.
  echo Full log: %LOGFILE%
  echo Closing in 5 seconds...
  timeout /t 5
)
exit /b %EXIT_CODE%

:run
echo ==========================================
echo AISheets launcher started: %date% %time%
echo Working directory: %APP_DIR%
echo ==========================================

set "PATH=%ProgramFiles%\nodejs;%LocalAppData%\Programs\node;%APPDATA%\npm;%PATH%"
cd /d "%APP_DIR%"
echo STEP 1: PATH set, cd to APP_DIR done.

where npm
if errorlevel 1 (
  echo ERROR: npm not found. Install Node.js from https://nodejs.org
  exit /b 1
)
echo STEP 2: npm found.

if not exist "%APP_DIR%node_modules\package.json" (
  echo STEP 3: node_modules missing, running npm install...
  call npm install
  if errorlevel 1 (
    echo ERROR: npm install failed.
    exit /b 1
  )
  echo STEP 3 done: npm install finished.
) else (
  echo STEP 3: node_modules present, skipping npm install.
)

echo STEP 4: Starting server in new window...
start "AISheets Server" cmd /k "%APP_DIR%server-launcher.bat"

echo STEP 5: Waiting 20 seconds for build and server...
timeout /t 20 /nobreak >nul

echo STEP 6: Opening browser at http://127.0.0.1:3847
start http://127.0.0.1:3847

echo STEP 7: Launcher finished successfully.
exit /b 0
