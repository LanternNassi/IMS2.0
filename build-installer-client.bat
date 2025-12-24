@echo off
echo ====================================
echo IMS Desktop Client - Quick Build Script
echo ====================================
echo.

echo [1/4] Installing root dependencies...
call npm install
if %errorlevel% neq 0 goto :error

echo.
echo [2/4] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 goto :error
cd ..

echo.
echo [3/4] Building frontend (Next.js static export)...
cd frontend
call npm run build
if %errorlevel% neq 0 goto :error
cd ..

echo.
echo [4/4] Creating Windows installer (Client Mode)...
call npm run dist:client
if %errorlevel% neq 0 goto :error

echo.
echo ====================================
echo BUILD SUCCESSFUL!
echo ====================================
echo.
echo Installer location: release\IMS Desktop Client Setup.exe
echo.
echo NOTE: This is a CLIENT build that connects to a remote server.
echo       Users will be prompted for server IP during installation.
echo.
pause
goto :end

:error
echo.
echo ====================================
echo BUILD FAILED!
echo ====================================
echo.
echo Please check the error messages above
echo.
pause
exit /b 1

:end

