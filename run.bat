@echo off
setlocal
cd /d "%~dp0"
if errorlevel 1 goto startup_failed

where node >nul 2>nul
if errorlevel 1 goto missing_node

where npm >nul 2>nul
if errorlevel 1 goto missing_npm

if exist "node_modules\vite\bin\vite.js" goto start_dev
echo Dependencies are missing. Installing them now...
call npm install
if errorlevel 1 goto install_failed

:start_dev
call npm run dev -- --open
if errorlevel 1 goto dev_failed
goto :eof

:missing_node
echo Node.js is required. Install Node.js 20.19+ or 22.12+ and try again.
goto failure

:missing_npm
echo npm is not available. Repair your Node.js installation and try again.
goto failure

:install_failed
echo Dependency installation failed.
goto failure

:dev_failed
echo The development server could not start.
goto failure

:startup_failed
echo Could not switch to the project folder.

:failure
echo.
pause
exit /b 1
