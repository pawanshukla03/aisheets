@echo off
title AISheets Server
set "PATH=%ProgramFiles%\nodejs;%LocalAppData%\Programs\node;%APPDATA%\npm;%PATH%"
cd /d "%~dp0"

echo AISheets server - leave this window open.
echo.
call npm run start
echo.
echo Server stopped. You can close this window.
pause
