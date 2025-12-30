# PowerShell script to find where the IMS database is actually located
# This queries SQL Server to find the physical database file locations

param(
    [string]$ConnectionString = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Finding IMS Database Location" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# If no connection string provided, try to read from appsettings.json
if ([string]::IsNullOrEmpty($ConnectionString)) {
    $serviceExe = (Get-Service -Name "ImsServer" -ErrorAction SilentlyContinue)
    if ($serviceExe) {
        $servicePath = (Get-WmiObject Win32_Service -Filter "Name='ImsServer'").PathName
        $servicePath = $servicePath -replace '"', ''
        $serviceDir = Split-Path $servicePath
        
        $appsettingsPath = Join-Path $serviceDir "appsettings.json"
        if (Test-Path $appsettingsPath) {
            Write-Host "Reading connection string from: $appsettingsPath" -ForegroundColor Yellow
            $appsettings = Get-Content $appsettingsPath | ConvertFrom-Json
            $ConnectionString = $appsettings.ConnectionStrings.DBCONNECTION
        }
    }
}

if ([string]::IsNullOrEmpty($ConnectionString)) {
    Write-Host "ERROR: Could not determine connection string!" -ForegroundColor Red
    Write-Host "Please provide a connection string or ensure the service is installed." -ForegroundColor Yellow
    exit 1
}

Write-Host "Connection String: $ConnectionString" -ForegroundColor Green
Write-Host ""

# Extract server and database from connection string
$server = ""
$database = ""

if ($ConnectionString -match "Data Source=([^;]+)") {
    $server = $matches[1]
}
if ($ConnectionString -match "Initial Catalog=([^;]+)") {
    $database = $matches[1]
}

Write-Host "Server: $server" -ForegroundColor Cyan
Write-Host "Database: $database" -ForegroundColor Cyan
Write-Host ""

# Try to query SQL Server for database file locations
try {
    Write-Host "Attempting to query SQL Server for database file locations..." -ForegroundColor Yellow
    
    $query = @"
SELECT 
    DB_NAME() AS DatabaseName,
    name AS LogicalFileName,
    physical_name AS PhysicalFilePath,
    type_desc AS FileType,
    size * 8 / 1024 AS SizeMB
FROM sys.database_files
ORDER BY type_desc, name
"@

    # For LocalDB, we need to use a different approach
    if ($server -like "*LocalDB*" -or $server -like "*(localdb)*") {
        Write-Host "Detected LocalDB instance" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "LocalDB databases are typically stored in:" -ForegroundColor Cyan
        Write-Host "  $env:USERPROFILE" -ForegroundColor White
        Write-Host "  or" -ForegroundColor White
        Write-Host "  $env:LOCALAPPDATA\Microsoft\Microsoft SQL Server Local DB\Instances\MSSQLLocalDB\" -ForegroundColor White
        Write-Host ""
        Write-Host "Searching for database files..." -ForegroundColor Yellow
        
        # Search for .mdf files
        $mdfFiles = Get-ChildItem -Path $env:USERPROFILE -Filter "*.mdf" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*$database*" }
        if ($mdfFiles) {
            Write-Host "Found database files:" -ForegroundColor Green
            foreach ($file in $mdfFiles) {
                Write-Host "  $($file.FullName)" -ForegroundColor White
            }
        } else {
            Write-Host "No .mdf files found matching '$database'" -ForegroundColor Yellow
        }
    } else {
        # For regular SQL Server, try to connect and query
        Write-Host "Attempting to connect to SQL Server..." -ForegroundColor Yellow
        Write-Host "Note: This requires SQL Server Management Objects (SMO) or sqlcmd" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To find the database location manually:" -ForegroundColor Cyan
        Write-Host "1. Open SQL Server Management Studio" -ForegroundColor White
        Write-Host "2. Connect to: $server" -ForegroundColor White
        Write-Host "3. Run this query:" -ForegroundColor White
        Write-Host ""
        Write-Host "   USE [$database];" -ForegroundColor Gray
        Write-Host "   SELECT physical_name FROM sys.database_files;" -ForegroundColor Gray
        Write-Host ""
    }
    
    # Also check if there's a connection to a file-based database
    if ($ConnectionString -match "AttachDbFilename=([^;]+)") {
        $dbFile = $matches[1]
        Write-Host "WARNING: Connection string uses AttachDbFilename!" -ForegroundColor Red
        Write-Host "Database file: $dbFile" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Diagnostic complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

