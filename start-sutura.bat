@echo off
:: Opens SUTURA on Windows with one double-click: MySQL (XAMPP), the backend
:: (port 8000) and the frontend (port 3000), each in its own window.
:: Needs sutura-server and sutura-client side by side in the same folder.
:: To stop, close the "SUTURA Backend" and "SUTURA Frontend" windows.

setlocal
for %%I in ("%~dp0..") do set "ROOT=%%~fI"
set "SERVER=%ROOT%\sutura-server"
set "CLIENT=%ROOT%\sutura-client"

if not exist "%SERVER%\artisan" goto :missing
if not exist "%CLIENT%\package.json" goto :missing
if not exist "%SERVER%\vendor" (
    echo The backend isn't set up yet. Run setup-windows.bat in sutura-server first.
    pause
    exit /b 1
)
if not exist "%CLIENT%\node_modules" (
    echo The frontend isn't set up yet. Run setup-windows.bat in sutura-client first.
    pause
    exit /b 1
)

:: 1. PHP: use the one in PATH, or XAMPP's.
set "PHP=php"
where php >nul 2>&1
if errorlevel 1 set "PHP=C:\xampp\php\php.exe"
if not "%PHP%"=="php" if not exist "%PHP%" (
    echo Can't find PHP. Install XAMPP, or add PHP to PATH.
    pause
    exit /b 1
)

:: 2. MySQL: start XAMPP's MySQL if nothing is listening on port 3306.
netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
if errorlevel 1 (
    if exist "C:\xampp\mysql_start.bat" (
        echo Starting MySQL...
        start "SUTURA MySQL" /min "C:\xampp\mysql_start.bat"
        timeout /t 5 /nobreak >nul
    ) else (
        echo MySQL is not running. Start MySQL in the XAMPP Control Panel, then run this again.
        pause
        exit /b 1
    )
)

:: 3. Backend and frontend, each in its own window.
start "SUTURA Backend" /D "%SERVER%" cmd /k ""%PHP%" artisan serve --host=127.0.0.1 --port=8000"
start "SUTURA Frontend" /D "%CLIENT%" cmd /k "npm run dev"

:: 4. Open the browser once the frontend has had time to start.
echo SUTURA is starting. The browser will open in a few seconds...
timeout /t 10 /nobreak >nul
start "" "http://localhost:3000"
exit /b 0

:missing
echo Can't find sutura-server and sutura-client inside: %ROOT%
echo Put both folders side by side, then run this again.
pause
exit /b 1
