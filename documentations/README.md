# IMS Backend Service Scripts

This directory contains scripts for managing the IMS Backend as a Windows Service.

## Scripts

### `package-backend-service.ps1`

PowerShell script that packages the published backend into a zip file for Windows Service installation.

**Usage:**
```powershell
.\scripts\package-backend-service.ps1 -Version "1.0.0" -OutputDir "release" -BackendDir "dist/backend"
```

**Parameters:**
- `Version`: Version number for the package (default: "1.0.0")
- `OutputDir`: Directory where the zip will be created (default: "release")
- `BackendDir`: Directory containing the published backend (default: "dist/backend")

**Output:**
Creates `IMS-Backend-Service-v{version}.zip` in the output directory containing:
- All backend DLLs and executables
- `appsettings.json`
- `install-service.bat` - Service installation script
- `uninstall-service.bat` - Service uninstallation script
- `README.txt` - Installation instructions

### `update-service.bat`

Batch script that automatically updates the IMS Backend service by:
1. Checking for the latest release on GitHub
2. Downloading the backend service zip
3. Stopping the ImsServer service
4. Backing up the current installation
5. Extracting and installing the update
6. Restarting the service

**Usage:**
1. Place this script in the same directory as `ImsServer.exe`
2. Right-click and select "Run as administrator"
3. Follow the prompts

**Requirements:**
- Administrator privileges
- ImsServer service must be installed
- Internet connection to access GitHub Releases
- PowerShell (for downloading and extracting)

**Configuration:**
The script uses these default values (can be modified in the script):
- Service Name: `ImsServer`
- GitHub Owner: `LanternNassi`
- GitHub Repo: `IMS2.0`

## Integration with GitHub Actions

The `package-backend-service.ps1` script is automatically called during the GitHub Actions build process when a release tag is pushed. The resulting zip file is uploaded to the GitHub Release as an asset.

## Service Installation

After extracting the zip file:

1. **Install the service:**
   - Right-click `install-service.bat`
   - Select "Run as administrator"
   - The service will be installed and started automatically

2. **Verify installation:**
   ```cmd
   sc query ImsServer
   ```

3. **Manage the service:**
   - Use `services.msc` (Windows Services Manager)
   - Or use `sc start/stop/query ImsServer` commands

## Service Update Process

1. **Automatic Update:**
   - Run `update-service.bat` as administrator
   - The script will handle everything automatically

2. **Manual Update:**
   - Download the latest `IMS-Backend-Service-v{version}.zip` from GitHub Releases
   - Stop the service: `sc stop ImsServer`
   - Extract the zip to the service directory (overwrite existing files)
   - Start the service: `sc start ImsServer`

## Notes

- The service preserves `appsettings.json` during updates
- Backups are created in `backup_{timestamp}` directories
- The current version is stored in `version.txt`
- Service logs are available in Windows Event Viewer

