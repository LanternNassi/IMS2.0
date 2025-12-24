# Client and Server Modes Guide

This application supports two modes of operation:

## Modes Overview

### Server Mode (Default)
- **What it does**: Runs both backend and frontend servers locally
- **Use case**: Standalone installation where everything runs on one machine
- **Includes**: Backend executable, frontend files, Electron wrapper
- **Size**: Larger (~100-200MB with backend)

### Client Mode
- **What it does**: Connects to a remote server running the backend and frontend
- **Use case**: Multiple client machines connecting to a central server
- **Includes**: Frontend files only, Electron wrapper
- **Size**: Smaller (~50-100MB without backend)

## How Mode Detection Works

The app automatically detects its mode:

1. **Server Mode**: Default if no `server_config.ini` file exists
2. **Client Mode**: Detected if `server_config.ini` exists in `%APPDATA%\IMS Desktop\`

The mode can also be forced via environment variable:
- `APP_MODE=server` - Force server mode
- `APP_MODE=client` - Force client mode

## Building

### Server Mode Build (Default)
```bash
npm run dist:server
# or
npm run dist:win  # Default is server mode
```

This creates:
- Full application with backend
- Installer: `IMS Desktop Setup.exe`
- Includes backend executable in `extraResources`

### Client Mode Build
```bash
npm run dist:client
```

This creates:
- Client-only application
- Installer: `IMS Desktop Client Setup.exe`
- Prompts for server IP during installation
- No backend files included

## Installation

### Server Mode Installation
1. Run `IMS Desktop Setup.exe`
2. Follow the installer
3. App starts backend and frontend automatically
4. Ready to use immediately

### Client Mode Installation
1. Run `IMS Desktop Client Setup.exe`
2. Installer prompts for server IP/hostname
3. Tests connection to server
4. Creates `server_config.ini` with server details
5. App connects to remote server on startup

## Server Configuration File

Client mode uses `%APPDATA%\IMS Desktop\server_config.ini`:

```ini
[Server]
IP=192.168.1.100
FrontendPort=8080
BackendPort=5184
```

### Manual Configuration
You can edit this file manually to change the server:
1. Close the application
2. Edit `%APPDATA%\IMS Desktop\server_config.ini`
3. Update IP, FrontendPort, or BackendPort
4. Restart the application

## Development

### Running in Server Mode
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend + Electron
npm run dev:app
```

### Running in Client Mode
1. Start the server application on another machine
2. Set environment variable: `APP_MODE=client`
3. Run: `npm start`
4. App will try to connect to `localhost` (or configure manually)

## API Configuration

The frontend automatically detects the correct API endpoint:

- **Server Mode**: `http://localhost:5184/api`
- **Client Mode**: `http://<SERVER_IP>:<BACKEND_PORT>/api`

The API base URL is configured dynamically based on the mode and server config.

## Troubleshooting

### Client Can't Connect to Server

1. **Check server is running**: Verify backend and frontend are running on the server
2. **Check firewall**: Ensure ports 8080 and 5184 are open
3. **Check IP address**: Verify the server IP in `server_config.ini`
4. **Test connection**: Try accessing `http://<SERVER_IP>:5184/api/Auth/verify` in a browser

### Server Mode Backend Won't Start

1. **Check backend executable**: Ensure `dist/backend/ImsServer.exe` exists
2. **Check ports**: Ensure ports 8080 and 5184 are not in use
3. **Check logs**: Check console output for error messages
4. **Rebuild**: Run `npm run build:backend` to rebuild backend

### Mode Detection Issues

1. **Force mode**: Set `APP_MODE` environment variable
2. **Check config file**: Verify `server_config.ini` exists for client mode
3. **Clear config**: Delete `server_config.ini` to switch to server mode

## Build Configuration

### Server Mode Build Config
- Uses: `package.json` → `build` section
- Includes: Backend in `extraResources`
- Installer: `build/installer.nsh`

### Client Mode Build Config
- Uses: `electron-builder-client.config.js`
- Excludes: Backend files
- Installer: `build/installer-client.nsh`
- Product Name: "IMS Desktop Client"

## Deployment Scenarios

### Scenario 1: Single User
- **Use**: Server Mode
- **Install**: One machine with full application
- **Benefit**: Simple, self-contained

### Scenario 2: Small Office (2-5 users)
- **Use**: One Server Mode + Multiple Client Modes
- **Setup**: 
  - Install server mode on main machine
  - Install client mode on other machines
  - Configure clients to point to server IP
- **Benefit**: Centralized data, easier management

### Scenario 3: Large Office (5+ users)
- **Use**: Dedicated server + Client Modes
- **Setup**:
  - Run server application on dedicated server
  - Install client mode on all workstations
  - Configure all clients to point to server
- **Benefit**: Better performance, centralized backups

## Notes

- Both modes use the same frontend codebase
- Both modes share the same Electron wrapper
- Client mode is ~50% smaller (no backend)
- Server mode requires .NET runtime (included)
- Client mode only requires Electron runtime

