# IMS Desktop - Build & Packaging Instructions

## Prerequisites

1. **Node.js** (v18 or higher)
2. **.NET 7.0 SDK**
3. **SQL Server Express LocalDB** (for development)
4. **Electron Builder** (installed via npm)

## Project Structure

```
IMS2.0/
├── electron/          # Electron main process
├── frontend/          # Next.js frontend
├── backend/           # .NET 7 Web API
├── build/             # Build assets (icons, installer scripts)
├── dist/              # Build output (generated)
└── release/           # Final installers (generated)
```

## Development

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..

# Backend dependencies are managed by .NET
```

### 2. Run in Development Mode

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Electron:**
```bash
npm start
```

## Building for Production

### Step 1: Build Frontend (Static Export)

First, update `frontend/package.json` to add export script:

```json
{
  "scripts": {
    "build": "next build",
    "export": "next export"
  }
}
```

Update `frontend/next.config.ts` for static export:

```typescript
const nextConfig = {
  output: 'export',
  distDir: '../dist/frontend',
  images: {
    unoptimized: true
  }
};

export default nextConfig;
```

### Step 2: Build Backend (Self-Contained)

```bash
npm run build:backend
```

This creates a self-contained .NET application at `dist/backend/ImsServer.exe`

### Step 3: Build Complete Application

```bash
# Build everything and create installer
npm run dist:win
```

Or build step by step:

```bash
# Build all components
npm run build:all

# Create installer
npm run dist
```

## Build Output

After successful build, you'll find:

- **Unpacked application**: `release/win-unpacked/`
- **Installer**: `release/IMS Desktop Setup X.X.X.exe`

## Database Configuration

### Development
- Uses SQL Server on `NESSIM\SQLSERVER2012`
- Connection string in `backend/ImsServer/appsettings.Development.json`

### Production (Installer)
- Automatically installs SQL Server LocalDB
- Creates instance named `IMS_Instance`
- Connection string should be updated to use LocalDB:

```json
{
  "ConnectionStrings": {
    "DBCONNECTION": "Server=(localdb)\\IMS_Instance;Database=IMS;Integrated Security=true;TrustServerCertificate=True;"
  }
}
```

## Customizing the Installer

### 1. Icons & Branding

Create/replace these files in `build/` folder:

- `icon.ico` - 256x256 app icon
- `installer-header.bmp` - 150x57 NSIS header
- `installer-sidebar.bmp` - 164x314 NSIS sidebar

### 2. SQL Server LocalDB Bundle (Optional)

Download SQL Server Express LocalDB installer:
- Visit: https://aka.ms/ssmsfullsetup
- Download SqlLocalDB.msi
- Place in `build/resources/` folder
- Update `package.json` to include it:

```json
{
  "build": {
    "extraResources": [
      {
        "from": "build/resources/SqlLocalDB.msi",
        "to": "resources/SqlLocalDB.msi"
      }
    ]
  }
}
```

### 3. Installer Behavior

Edit `build/installer.nsh` to customize:
- Database initialization
- Service installation
- Registry keys
- Custom dialogs

## Application Settings

### Update Connection String for Production

Edit `backend/ImsServer/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DBCONNECTION": "Server=(localdb)\\IMS_Instance;Database=IMS;Integrated Security=true;TrustServerCertificate=True;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning"
    }
  }
}
```

### Backend Port Configuration

The backend runs on `http://localhost:5184` by default.

Update `backend/ImsServer/Program.cs` if needed:

```csharp
builder.WebHost.UseUrls("http://localhost:5184");
```

Update frontend API URL in `frontend/src/Utils/Request.ts`.

## Testing the Build

1. **Install on clean machine** (or VM)
2. **Run the installer** as Administrator
3. **Verify**:
   - Application starts without errors
   - Backend API is accessible
   - Database is created and accessible
   - All features work correctly

## Troubleshooting

### Backend doesn't start
- Check if port 5184 is available
- Verify .NET 7 Runtime is installed
- Check Windows Event Viewer for errors

### Database connection fails
- Verify SQL Server LocalDB is installed: `SqlLocalDB info`
- Check instance is running: `SqlLocalDB info IMS_Instance`
- Test connection string manually

### Electron app shows blank screen
- Check if frontend build completed: `dist/frontend/index.html` exists
- Open DevTools (Ctrl+Shift+I in dev mode)
- Check console for errors

## Distribution

### Upload installer to:
- GitHub Releases
- Company website
- Internal network share

### Version Updates

1. Update `package.json` version
2. Run `npm run dist:win`
3. NSIS will auto-update version in installer
4. Create release notes

## Advanced Configuration

### Code Signing (Production)

Add to `package.json`:

```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/cert.pfx",
      "certificatePassword": "password",
      "signingHashAlgorithms": ["sha256"]
    }
  }
}
```

### Auto-Updates

Install `electron-updater`:

```bash
npm install electron-updater
```

Configure in `package.json`:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "YourUsername",
      "repo": "IMS2.0"
    }
  }
}
```

## Support

For issues or questions, contact your development team.
