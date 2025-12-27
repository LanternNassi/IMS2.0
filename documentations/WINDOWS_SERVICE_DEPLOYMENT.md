# Windows Service Deployment Guide

This guide explains how the IMS Backend is packaged and deployed as a Windows Service.

## Overview

The IMS Backend can be deployed as a Windows Service, allowing it to run continuously in the background without user interaction. The deployment process includes:

1. **Packaging**: Creating a zip file with all backend files and installation scripts
2. **Release**: Publishing the zip as a GitHub Release asset
3. **Update**: Automated update script that downloads and installs new versions

## Components

### 1. Package Script (`package-backend-service.ps1`)

Creates a zip file containing:
- `ImsServer.exe` and all DLLs
- `appsettings.json` (configuration file)
- `install-service.bat` (service installation script)
- `uninstall-service.bat` (service removal script)
- `README.txt` (installation instructions)

**Usage:**
```powershell
npm run package:backend-service
```

Or manually:
```powershell
.\scripts\package-backend-service.ps1 -Version "1.0.0" -OutputDir "release" -BackendDir "dist/backend"
```

### 2. Update Script (`update-service.bat`)

Automated update script that:
- Checks GitHub Releases for the latest version
- Downloads the backend service zip
- Stops the ImsServer service
- Backs up current installation
- Extracts and installs the update
- Restarts the service

**Usage:**
1. Place `update-service.bat` in the service installation directory
2. Right-click → "Run as administrator"
3. Follow the prompts

### 3. GitHub Actions Integration

The build workflow automatically:
- Packages the backend service when a release tag is pushed
- Uploads the zip file to GitHub Releases
- Makes it available for download

## Service Installation

### Initial Installation

1. **Download the zip file** from GitHub Releases:
   - Go to: https://github.com/LanternNassi/IMS2.0/releases
   - Download `IMS-Backend-Service-v{version}.zip`

2. **Extract the zip** to your desired location:
   ```
   C:\Program Files\IMS\Backend
   ```

3. **Install the service**:
   - Right-click `install-service.bat`
   - Select "Run as administrator"
   - The service will be installed and started

4. **Verify installation**:
   ```cmd
   sc query ImsServer
   ```

### Service Configuration

The service uses `appsettings.json` for configuration. Edit this file to:
- Set database connection string
- Configure API port (default: 5184)
- Adjust other settings

**Note**: The service preserves `appsettings.json` during updates.

## Service Updates

### Automatic Update (Recommended)

1. Run `update-service.bat` as administrator
2. The script will:
   - Check for updates
   - Download if available
   - Install automatically
   - Restart the service

### Manual Update

1. Download the latest zip from GitHub Releases
2. Stop the service:
   ```cmd
   sc stop ImsServer
   ```
3. Extract the zip (overwrite existing files)
4. Start the service:
   ```cmd
   sc start ImsServer
   ```

## Service Management

### Using Windows Services Manager

1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find "IMS Backend API Service"
4. Right-click for options (Start, Stop, Restart, Properties)

### Using Command Line

```cmd
# Start service
sc start ImsServer

# Stop service
sc stop ImsServer

# Check status
sc query ImsServer

# View configuration
sc qc ImsServer
```

## Service Details

- **Service Name**: `ImsServer`
- **Display Name**: `IMS Backend API Service`
- **Start Type**: Automatic (starts on system boot)
- **Default Port**: 5184
- **Logs**: Windows Event Viewer (Application log)

## Troubleshooting

### Service Won't Start

1. Check Event Viewer for errors:
   - Open `eventvwr.msc`
   - Navigate to Windows Logs > Application
   - Look for entries from "ImsServer"

2. Verify database connection:
   - Check `appsettings.json`
   - Ensure SQL Server is accessible

3. Check port availability:
   ```cmd
   netstat -ano | findstr :5184
   ```

### Update Fails

1. Ensure you have administrator privileges
2. Check internet connection
3. Verify service is installed:
   ```cmd
   sc query ImsServer
   ```
4. Check GitHub Releases are accessible

### Service Stops Unexpectedly

1. Check Event Viewer for crash logs
2. Verify database connectivity
3. Check system resources (memory, disk space)
4. Review `appsettings.json` for configuration errors

## Backup and Recovery

The update script automatically creates backups in:
```
{ServiceDirectory}\backup_{timestamp}\
```

To restore from backup:
1. Stop the service
2. Copy files from backup directory
3. Start the service

## Release Process

When creating a new release:

1. **Update version** in `package.json`
2. **Build and publish**:
   ```bash
   git tag v1.0.9
   git push origin v1.0.9
   ```
3. **GitHub Actions** will automatically:
   - Build the backend
   - Package it as a zip
   - Upload to GitHub Releases
4. **Users** can update using `update-service.bat`

## File Structure

After installation:
```
C:\Program Files\IMS\Backend\
├── ImsServer.exe
├── *.dll (all dependencies)
├── appsettings.json
├── install-service.bat
├── uninstall-service.bat
├── update-service.bat
├── version.txt
└── backup_YYYYMMDD_HHMMSS\
```

## Security Considerations

- The service runs under the "Local System" account by default
- For database access, ensure the service account has proper SQL Server permissions
- Consider running under a dedicated service account for production
- Keep `appsettings.json` secure (contains connection strings)

## Notes

- The service automatically applies database migrations on startup
- Service logs are available in Windows Event Viewer
- The update script preserves `appsettings.json` during updates
- Backups are created automatically before updates
- Version information is stored in `version.txt`

