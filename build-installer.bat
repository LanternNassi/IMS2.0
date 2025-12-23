@echo off
echo ====================================
echo IMS Desktop - Quick Build Script
echo ====================================
echo.

echo [1/6] Installing root dependencies...
call npm install
if %errorlevel% neq 0 goto :error


echo.
echo [3/6] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 goto :error
cd ..

echo.
echo [4/6] Building frontend (Next.js static export)...
cd frontend
call npm run build
if %errorlevel% neq 0 goto :error
cd ..

echo.
echo [5/6] Building backend (.NET self-contained)...
cd backend\ImsServer
call dotnet publish -c Release -o ..\..\dist\backend --self-contained true -r win-x64
if %errorlevel% neq 0 goto :error
cd ..\..

echo.
echo [6/6] Creating Windows installer...
call npm run dist:win
if %errorlevel% neq 0 goto :error

echo.
echo ====================================
echo BUILD SUCCESSFUL!
echo ====================================
echo.
echo Installer location: release\IMS Desktop Setup.exe
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
