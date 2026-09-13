@echo off
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

echo [OK] Node.js is installed.
echo.

if not exist .env.local (
    echo Creating .env.local from .env.example...
    copy .env.example .env.local
) else (
    echo [OK] .env.local already exists.
)
echo.

echo Installing NPM dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)
echo.

echo ========================================================
echo        Setup Complete! You can now start the frontend:
echo        npm run dev
echo ========================================================
pause
