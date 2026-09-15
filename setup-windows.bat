@echo off
setlocal enabledelayedexpansion
echo ========================================================
echo        SUTURA Frontend Setup for Windows
echo ========================================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not recognized in your terminal.
    echo Please install Node.js 20+ from https://nodejs.org/
    pause
    exit /b 1
)

:: Check the ACTUAL Node version, not just that "node" runs. This project
:: uses Next.js 16 / React 19, which require Node 20+ -- an older Node that
:: XAMPP/an old install left on PATH will pass "node -v" but then fail deep
:: inside `npm install` or `npm run dev` with a confusing engine/syntax error.
for /f %%v in ('node -v') do set NODE_RAW=%%v
set NODE_RAW=%NODE_RAW:v=%
for /f "tokens=1 delims=." %%a in ("%NODE_RAW%") do set NODE_MAJOR=%%a

if !NODE_MAJOR! LSS 20 (
    echo [ERROR] Detected Node.js v!NODE_RAW! -- this project requires Node 20 or higher.
    echo Please install the current LTS from https://nodejs.org/ and re-run this script.
    pause
    exit /b 1
)

echo [OK] Node.js v!NODE_RAW! detected.
echo.

if not exist .env.local (
    echo Creating .env.local from .env.example...
    copy .env.example .env.local >nul
) else (
    echo [OK] .env.local already exists.
)
echo.

echo Installing NPM dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed. See the error above.
    pause
    exit /b 1
)
echo.

echo ========================================================
echo        Setup Complete! You can now start the frontend:
echo        npm run dev
echo ========================================================
pause
