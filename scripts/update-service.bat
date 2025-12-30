@echo off
REM Update IMS Backend Service
REM This script downloads the latest release, stops the service, updates files, and restarts the service
REM Must be run as Administrator

setlocal enabledelayedexpansion

set SERVICE_NAME=ImsServer
set GITHUB_OWNER=LanternNassi
set GITHUB_REPO=IMS2.0
set SERVICE_DIR=%~dp0
set TEMP_DIR=%TEMP%\IMS-Service-Update
set ZIP_NAME=IMS-Backend-Service.zip

echo ========================================
echo IMS Backend Service Update Script
echo ========================================
echo.

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
    echo ERROR: Service %SERVICE_NAME% is not installed!
    echo Please install the service first using install-service.bat
    pause
    exit /b 1
)

REM Get current version (if version.txt exists)
set CURRENT_VERSION=unknown
if exist "%SERVICE_DIR%version.txt" (
    set /p CURRENT_VERSION=<"%SERVICE_DIR%version.txt"
    echo Current version: !CURRENT_VERSION!
) else (
    echo Current version: unknown (no version.txt found)
)
echo.

REM Get latest release from GitHub
echo Checking for latest release...
echo.

REM Create temp directory if it doesn't exist
if not exist "%TEMP_DIR%" (
    mkdir "%TEMP_DIR%"
)

REM Initialize variables
set "LATEST_VERSION="
set "DOWNLOAD_URL="

REM Try to get latest release using PowerShell and save to temp file
set "RELEASE_INFO_FILE=%TEMP_DIR%\release_info.txt"
powershell -Command "$ErrorActionPreference='Stop'; try { $response = Invoke-RestMethod -Uri 'https://api.github.com/repos/%GITHUB_OWNER%/%GITHUB_REPO%/releases/latest' -Headers @{'Accept'='application/vnd.github.v3+json'}; $latestVersion = $response.tag_name; $zipAsset = $response.assets | Where-Object { $_.name -like '*Backend-Service*.zip' } | Select-Object -First 1; if ($zipAsset) { @('VERSION=' + $latestVersion, 'URL=' + $zipAsset.browser_download_url) | Out-File -FilePath '%RELEASE_INFO_FILE%' -Encoding ASCII } else { Write-Error 'Backend service zip not found in latest release'; exit 1 } } catch { Write-Error ('Failed to get latest release: ' + $_.Exception.Message); exit 1 }"

if %errorLevel% neq 0 (
    echo ERROR: Failed to get latest release information!
    echo Please check your internet connection and GitHub access.
    pause
    exit /b 1
)

REM Read values from temp file
for /f "tokens=1,* delims==" %%a in ('type "%RELEASE_INFO_FILE%"') do (
    if "%%a"=="VERSION" (
        set "LATEST_VERSION=%%b"
    )
    if "%%a"=="URL" (
        set "DOWNLOAD_URL=%%b"
    )
)

REM Clean up temp file
del "%RELEASE_INFO_FILE%" 2>nul

if "!DOWNLOAD_URL!"=="" (
    echo ERROR: Could not determine download URL!
    echo Please ensure the release contains a file matching '*Backend-Service*.zip'
    pause
    exit /b 1
)

if "!LATEST_VERSION!"=="" (
    echo ERROR: Could not determine latest version!
    pause
    exit /b 1
)

REM Remove 'v' prefix from version if present (v1.0.9 -> 1.0.9)
if not "!LATEST_VERSION!"=="" (
    if "!LATEST_VERSION:~0,1!"=="v" (
        set "LATEST_VERSION=!LATEST_VERSION:~1!"
    )
)

echo Latest version available: !LATEST_VERSION!
echo.

REM Check if update is needed
if "!CURRENT_VERSION!"=="!LATEST_VERSION!" (
    echo You are already running the latest version: !LATEST_VERSION!
    echo No update needed.
    pause
    exit /b 0
)

echo New version available: !LATEST_VERSION!
echo Current version: !CURRENT_VERSION!
echo.
set /p CONFIRM="Do you want to update? (Y/N): "
if /i not "!CONFIRM!"=="Y" (
    echo Update cancelled.
    pause
    exit /b 0
)

echo.
echo ========================================
echo Starting update process...
echo ========================================
echo.

REM Create temp directory
if exist "%TEMP_DIR%" (
    rmdir /s /q "%TEMP_DIR%"
)
mkdir "%TEMP_DIR%"

REM Download the zip file
echo [1/5] Downloading update package...
echo URL: !DOWNLOAD_URL!
echo.

REM Set environment variable for PowerShell to use
set "PS_DOWNLOAD_URL=!DOWNLOAD_URL!"

REM Download using PowerShell with environment variable
powershell -Command "$ErrorActionPreference='Stop'; $url = $env:PS_DOWNLOAD_URL; try { Invoke-WebRequest -Uri $url -OutFile '%TEMP_DIR%\%ZIP_NAME%' -UseBasicParsing; Write-Host 'Download completed successfully' } catch { Write-Host 'ERROR: Download failed:' $_.Exception.Message; exit 1 }"

if %errorLevel% neq 0 (
    echo ERROR: Failed to download update package!
    pause
    exit /b 1
)

echo Download completed!
echo.

REM Stop the service
echo [2/5] Stopping service...
sc stop %SERVICE_NAME%
if %errorLevel% neq 0 (
    echo WARNING: Failed to stop service. It may not be running.
) else (
    echo Waiting for service to stop...
    timeout /t 3 /nobreak >nul
    
    REM Wait up to 30 seconds for service to stop
    set /a COUNTER=0
    :WAIT_STOP
    sc query %SERVICE_NAME% | findstr /C:"STOPPED" >nul
    if %errorLevel% equ 0 goto SERVICE_STOPPED
    timeout /t 1 /nobreak >nul
    set /a COUNTER+=1
    if !COUNTER! geq 30 (
        echo ERROR: Service did not stop within 30 seconds!
        pause
        exit /b 1
    )
    goto WAIT_STOP
    :SERVICE_STOPPED
    echo Service stopped successfully.
)
echo.

REM Backup current installation
echo [3/5] Creating backup...
set BACKUP_DIR=%SERVICE_DIR%backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=!BACKUP_DIR: =0!
if not exist "!BACKUP_DIR!" (
    mkdir "!BACKUP_DIR!"
)
xcopy "%SERVICE_DIR%*.*" "!BACKUP_DIR!\" /E /I /Y /Q >nul 2>&1
echo Backup created: !BACKUP_DIR!
echo.

REM Extract new files
echo [4/5] Extracting update...
powershell -Command "$ErrorActionPreference='Stop'; try { Expand-Archive -Path '%TEMP_DIR%\%ZIP_NAME%' -DestinationPath '%TEMP_DIR%\extracted' -Force; Write-Host 'Extraction completed' } catch { Write-Host 'ERROR: Extraction failed:' $_.Exception.Message; exit 1 }"

if %errorLevel% neq 0 (
    echo ERROR: Failed to extract update package!
    pause
    exit /b 1
)

REM Copy new files (preserve appsettings.json if it exists)
echo Copying new files...
if exist "%SERVICE_DIR%appsettings.json" (
    copy "%SERVICE_DIR%appsettings.json" "%TEMP_DIR%\extracted\appsettings.json.backup" >nul 2>&1
)

xcopy "%TEMP_DIR%\extracted\*.*" "%SERVICE_DIR%" /E /I /Y /Q >nul 2>&1

REM Restore appsettings.json if it was backed up
if exist "%TEMP_DIR%\extracted\appsettings.json.backup" (
    move /Y "%TEMP_DIR%\extracted\appsettings.json.backup" "%SERVICE_DIR%appsettings.json" >nul 2>&1
)

REM Save version
echo !LATEST_VERSION! > "%SERVICE_DIR%version.txt"

echo Files updated successfully!
echo.

REM Start the service
echo [5/5] Starting service...
sc start %SERVICE_NAME%
if %errorLevel% neq 0 (
    echo ERROR: Failed to start service!
    echo Please check the service manually using services.msc
    pause
    exit /b 1
)

echo Waiting for service to start...
timeout /t 3 /nobreak >nul

REM Verify service is running
sc query %SERVICE_NAME% | findstr /C:"RUNNING" >nul
if %errorLevel% equ 0 (
    echo Service started successfully!
) else (
    echo WARNING: Service may not have started properly. Please check manually.
)

echo.

REM Cleanup
echo Cleaning up temporary files...
rmdir /s /q "%TEMP_DIR%" 2>nul

echo.
echo ========================================
echo Update completed successfully!
echo ========================================
echo.
echo Previous version: !CURRENT_VERSION!
echo New version: !LATEST_VERSION!
echo Service: %SERVICE_NAME%
echo.
echo The service has been updated and restarted.
echo.

pause

