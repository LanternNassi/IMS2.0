# Package Backend Service for Windows Service Installation
# This script creates a zip file with the published backend and service installation scripts

param(
    [string]$Version = "1.0.0",
    [string]$OutputDir = "release",
    [string]$BackendDir = "dist/backend"
)

Write-Host "Packaging Backend Service for Windows Service Installation..." -ForegroundColor Green
Write-Host "Version: $Version" -ForegroundColor Cyan
Write-Host "Backend Directory: $BackendDir" -ForegroundColor Cyan
Write-Host "Output Directory: $OutputDir" -ForegroundColor Cyan

# Check if backend directory exists
if (-not (Test-Path $BackendDir)) {
    Write-Host "ERROR: Backend directory not found: $BackendDir" -ForegroundColor Red
    Write-Host "Please build the backend first: dotnet publish -c Release -o dist/backend --self-contained true -r win-x64" -ForegroundColor Yellow
    exit 1
}

# Create output directory if it doesn't exist
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Create temporary directory for packaging
$TempDir = Join-Path $env:TEMP "ims-backend-service-$Version"
if (Test-Path $TempDir) {
    Remove-Item -Path $TempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

Write-Host "Copying backend files..." -ForegroundColor Yellow
# Copy all backend files
Copy-Item -Path "$BackendDir\*" -Destination $TempDir -Recurse -Force

# Create service installation script
$InstallScript = @"
@echo off
REM Install IMS Backend as Windows Service
REM This script must be run as Administrator

echo Installing IMS Backend Service...

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set SERVICE_NAME=ImsServer
set SERVICE_DISPLAY_NAME=IMS Backend API Service
set SERVICE_DESCRIPTION=Inventory Management System Backend API Service

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Find the executable
set EXE_PATH=%SCRIPT_DIR%ImsServer.exe
if not exist "%EXE_PATH%" (
    echo ERROR: ImsServer.exe not found in %SCRIPT_DIR%!
    pause
    exit /b 1
)

echo Found executable: %EXE_PATH%

REM Check if service already exists
sc query %SERVICE_NAME% >nul 2>&1
if %errorLevel% equ 0 (
    echo Service already exists. Stopping and removing...
    sc stop %SERVICE_NAME%
    timeout /t 2 /nobreak >nul
    sc delete %SERVICE_NAME%
    timeout /t 2 /nobreak >nul
)

REM Install the service
echo Installing service...
sc create %SERVICE_NAME% binPath= "\"%EXE_PATH%\"" DisplayName= "%SERVICE_DISPLAY_NAME%" start= auto
if %errorLevel% neq 0 (
    echo ERROR: Failed to create service!
    pause
    exit /b 1
)

REM Set service description
sc description %SERVICE_NAME% "%SERVICE_DESCRIPTION%"

REM Start the service
echo Starting service...
sc start %SERVICE_NAME%
if %errorLevel% neq 0 (
    echo WARNING: Service created but failed to start. Check logs for details.
) else (
    echo Service installed and started successfully!
)

echo.
echo Service Name: %SERVICE_NAME%
echo Display Name: %SERVICE_DISPLAY_NAME%
echo Executable: %EXE_PATH%
echo.
echo You can manage the service using:
echo   - Services.msc (Windows Services Manager)
echo   - sc start %SERVICE_NAME%
echo   - sc stop %SERVICE_NAME%
echo   - sc query %SERVICE_NAME%
echo.

pause
"@

$InstallScriptPath = Join-Path $TempDir "install-service.bat"
$InstallScript | Out-File -FilePath $InstallScriptPath -Encoding ASCII

# Create service uninstallation script
$UninstallScript = @"
@echo off
REM Uninstall IMS Backend Windows Service
REM This script must be run as Administrator

set SERVICE_NAME=ImsServer

echo Uninstalling IMS Backend Service...

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Check if service exists
sc query %SERVICE_NAME% >nul 2>&1
if %errorLevel% neq 0 (
    echo Service %SERVICE_NAME% does not exist.
    pause
    exit /b 0
)

echo Stopping service...
sc stop %SERVICE_NAME%
timeout /t 3 /nobreak >nul

echo Deleting service...
sc delete %SERVICE_NAME%
if %errorLevel% neq 0 (
    echo ERROR: Failed to delete service!
    pause
    exit /b 1
)

echo Service uninstalled successfully!
pause
"@

$UninstallScriptPath = Join-Path $TempDir "uninstall-service.bat"
$UninstallScript | Out-File -FilePath $UninstallScriptPath -Encoding ASCII

# Create README
$Readme = @"
# IMS Backend Service Package v$Version

This package contains the IMS Backend API server files and installation scripts for running as a Windows Service.

## Contents

- ImsServer.exe - The backend API server executable
- All required DLLs and dependencies
- appsettings.json - Configuration file
- install-service.bat - Service installation script
- uninstall-service.bat - Service uninstallation script

## Installation

1. Extract this zip file to your desired location (e.g., C:\Program Files\IMS\Backend)
2. Right-click on `install-service.bat` and select "Run as administrator"
3. The service will be installed and started automatically

## Service Management

The service will be named "ImsServer" and can be managed via:
- Windows Services Manager (services.msc)
- Command line: sc start/stop/query ImsServer

## Configuration

Edit `appsettings.json` to configure:
- Database connection string
- API port (default: 5184)
- Other settings

## Uninstallation

Right-click on `uninstall-service.bat` and select "Run as administrator" to remove the service.

## Update Process

Use the `update-service.bat` script to automatically download and install updates from GitHub Releases.
"@

$ReadmePath = Join-Path $TempDir "README.txt"
$Readme | Out-File -FilePath $ReadmePath -Encoding UTF8

# Create zip file
$ZipFileName = "IMS-Backend-Service-v$Version.zip"
$ZipPath = Join-Path $OutputDir $ZipFileName

Write-Host "Creating zip file: $ZipPath" -ForegroundColor Yellow

# Remove existing zip if it exists
if (Test-Path $ZipPath) {
    Remove-Item -Path $ZipPath -Force
}

# Create zip using .NET compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($TempDir, $ZipPath)

Write-Host "Package created successfully: $ZipPath" -ForegroundColor Green
Write-Host "File size: $([math]::Round((Get-Item $ZipPath).Length / 1MB, 2)) MB" -ForegroundColor Cyan

# Cleanup
Remove-Item -Path $TempDir -Recurse -Force

Write-Host "Done!" -ForegroundColor Green

