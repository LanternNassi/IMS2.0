@echo off
REM Diagnostic script to check which database the IMS service is using
REM This script must be run as Administrator

setlocal enabledelayedexpansion

set SERVICE_NAME=ImsServer

echo ========================================
echo IMS Service Database Diagnostic Tool
echo ========================================
echo.

REM Check if service exists
sc query %SERVICE_NAME% >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Service %SERVICE_NAME% is not installed!
    pause
    exit /b 1
)

REM Get service executable path
echo [1] Getting service executable path...
for /f "tokens=2*" %%a in ('sc qc %SERVICE_NAME% ^| findstr /C:"BINARY_PATH_NAME"') do (
    set "SERVICE_EXE=%%b"
    set "SERVICE_EXE=!SERVICE_EXE:"=!"
)

echo Service executable: !SERVICE_EXE!
echo.

REM Get service directory
for %%F in ("!SERVICE_EXE!") do set "SERVICE_DIR=%%~dpF"
echo Service directory: !SERVICE_DIR!
echo.

REM Check appsettings.json in service directory
echo [2] Checking appsettings.json in service directory...
if exist "!SERVICE_DIR!appsettings.json" (
    echo Found appsettings.json in service directory:
    echo.
    type "!SERVICE_DIR!appsettings.json"
    echo.
) else (
    echo WARNING: appsettings.json not found in service directory!
    echo The service might be using a different configuration file.
    echo.
)

REM Check appsettings.Development.json
if exist "!SERVICE_DIR!appsettings.Development.json" (
    echo Found appsettings.Development.json:
    echo.
    type "!SERVICE_DIR!appsettings.Development.json"
    echo.
)

REM Check environment variables
echo [3] Checking environment variables...
echo ASPNETCORE_ENVIRONMENT: %ASPNETCORE_ENVIRONMENT%
echo DBCONNECTION: %DBCONNECTION%
echo.
if defined DBCONNECTION (
    echo WARNING: DBCONNECTION environment variable is set!
    echo This will override the connection string in appsettings.json
    echo Value: %DBCONNECTION%
    echo.
)

REM Check for database files in service directory
echo [4] Checking for database files in service directory...
dir /b "!SERVICE_DIR!*.mdf" 2>nul
dir /b "!SERVICE_DIR!*.ldf" 2>nul
dir /b "!SERVICE_DIR!*.db" 2>nul
echo.

REM Check service status
echo [5] Service status:
sc query %SERVICE_NAME%
echo.

REM Try to query the actual connection string from the running service
echo [6] To find the actual database being used:
echo.
echo Option 1: Check Windows Event Viewer for database connection logs
echo   - Open eventvwr.msc
echo   - Go to Windows Logs ^> Application
echo   - Look for entries from "ImsServer" or "ImsServer.exe"
echo.
echo Option 2: Check the service's working directory
for /f "tokens=2*" %%a in ('sc qc %SERVICE_NAME% ^| findstr /C:"WORKING_DIRECTORY"') do (
    set "WORK_DIR=%%b"
    set "WORK_DIR=!WORK_DIR:"=!"
    echo Working directory: !WORK_DIR!
)
echo.

REM Check for database files in common locations
echo [7] Checking common database file locations...
echo.
echo Checking user profile for LocalDB files...
if exist "%USERPROFILE%\IMS.mdf" (
    echo Found: %USERPROFILE%\IMS.mdf
)
if exist "%USERPROFILE%\IMS5.0.mdf" (
    echo Found: %USERPROFILE%\IMS5.0.mdf
)
echo.

echo Checking AppData for LocalDB...
if exist "%LOCALAPPDATA%\Microsoft\Microsoft SQL Server Local DB\Instances\MSSQLLocalDB\" (
    echo LocalDB instance directory exists
    dir "%LOCALAPPDATA%\Microsoft\Microsoft SQL Server Local DB\Instances\MSSQLLocalDB\" /s /b | findstr /i "\.mdf"
)
echo.

echo ========================================
echo Diagnostic complete!
echo ========================================
echo.
echo TIP: To see what database the service is actually using, check:
echo   1. The appsettings.json file in the service directory
echo   2. Windows Event Viewer for connection logs
echo   3. SQL Server Management Studio to see active connections
echo.

pause

