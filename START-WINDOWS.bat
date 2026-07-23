@echo off
setlocal
cd /d "%~dp0"
echo Installing root dependencies...
call npm install
if errorlevel 1 goto :fail
echo Installing server dependencies...
call npm install --prefix server
if errorlevel 1 goto :fail
echo Installing client dependencies...
call npm install --prefix client
if errorlevel 1 goto :fail
copy /Y server\.env.example server\.env >nul
if not exist client\.env copy client\.env.example client\.env >nul
echo.
echo Starting the dashboard with a clean application database...
call npm run dev
goto :eof
:fail
echo.
echo Installation failed. Check your internet connection and run this file again.
pause
exit /b 1
