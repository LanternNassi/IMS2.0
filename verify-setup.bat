@echo off
echo ====================================
echo IMS Desktop - Setup Verification
echo ====================================
echo.

echo Checking prerequisites...
echo.

:: Check Node.js
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    node --version
    echo ✓ Node.js is installed
) else (
    echo ✗ Node.js is NOT installed
    echo   Download from: https://nodejs.org/
)
echo.

:: Check .NET
echo [2/5] Checking .NET SDK...
dotnet --version >nul 2>&1
if %errorlevel% equ 0 (
    dotnet --version
    echo ✓ .NET SDK is installed
) else (
    echo ✗ .NET SDK is NOT installed
    echo   Download from: https://dotnet.microsoft.com/download/dotnet/7.0
)
echo.

:: Check SQL Server LocalDB
echo [3/5] Checking SQL Server LocalDB...
SqlLocalDB.exe info >nul 2>&1
if %errorlevel% equ 0 (
    SqlLocalDB.exe info
    echo ✓ SQL Server LocalDB is installed
) else (
    echo ✗ SQL Server LocalDB is NOT installed
    echo   Download from: https://aka.ms/ssmsfullsetup
)
echo.

:: Check npm packages
echo [4/5] Checking npm dependencies...
if exist node_modules\ (
    echo ✓ Root dependencies installed
) else (
    echo ✗ Root dependencies NOT installed
    echo   Run: npm install
)

if exist frontend\node_modules\ (
    echo ✓ Frontend dependencies installed
) else (
    echo ✗ Frontend dependencies NOT installed
    echo   Run: cd frontend ^&^& npm install
)
echo.

:: Check build assets
echo [5/5] Checking build assets...
if exist build\icon.ico (
    echo ✓ App icon found
) else (
    echo ✗ App icon NOT found (build\icon.ico)
    echo   Create a 256x256 .ico file
)

if exist build\installer-header.bmp (
    echo ✓ Installer header found
) else (
    echo ○ Installer header optional (build\installer-header.bmp)
    echo   Recommended size: 150x57
)

if exist build\installer-sidebar.bmp (
    echo ✓ Installer sidebar found
) else (
    echo ○ Installer sidebar optional (build\installer-sidebar.bmp)
    echo   Recommended size: 164x314
)

if exist build\installer.nsh (
    echo ✓ Installer script found
) else (
    echo ✗ Installer script NOT found (build\installer.nsh)
)
echo.

:: Check configuration
echo Checking configuration files...
if exist backend\ImsServer\appsettings.json (
    echo ✓ Backend settings found
) else (
    echo ✗ Backend settings NOT found
)

if exist frontend\.env (
    echo ✓ Frontend environment file found
) else (
    echo ○ Frontend .env file optional
)
echo.

echo ====================================
echo Verification Complete
echo ====================================
echo.
echo Ready to build? Run: build-installer.bat
echo.
pause
