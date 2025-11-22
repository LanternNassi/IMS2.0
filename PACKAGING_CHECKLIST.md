# IMS Desktop - Packaging Checklist

## Pre-Build Checklist

### 1. Update Version Numbers
- [ ] `package.json` - version field
- [ ] `frontend/package.json` - version field
- [ ] `backend/ImsServer/ImsServer.csproj` - Version tag

### 2. Configuration Files

#### Production Connection String
- [ ] Update `backend/ImsServer/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DBCONNECTION": "Server=(localdb)\\IMS_Instance;Database=IMS;Integrated Security=true;TrustServerCertificate=True;"
  }
}
```

#### Frontend Environment
- [ ] Verify `frontend/.env` has correct API URL
- [ ] Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:5184`

### 3. Build Assets (in `build/` folder)

- [ ] `icon.ico` - 256x256 application icon
- [ ] `installer-header.bmp` - 150x57 NSIS header image
- [ ] `installer-sidebar.bmp` - 164x314 NSIS sidebar image
- [ ] `installer.nsh` - Custom NSIS script
- [ ] `LICENSE.txt` - End-user license agreement

### 4. Code Review

- [ ] Remove console.log statements
- [ ] Remove debug code
- [ ] Update copyright notices
- [ ] Check for hardcoded values
- [ ] Verify all API endpoints

### 5. Testing

- [ ] Test in development mode
- [ ] Test database migrations
- [ ] Test all CRUD operations
- [ ] Test Excel export
- [ ] Test dark/light theme
- [ ] Test on clean Windows 10/11 VM

## Build Process

### Step 1: Clean Previous Builds
```bash
rm -rf dist
rm -rf release
rm -rf frontend/.next
rm -rf backend/ImsServer/bin
rm -rf backend/ImsServer/obj
```

### Step 2: Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### Step 3: Build Application
```bash
# Option 1: Use build script
.\build-installer.bat

# Option 2: Manual steps
npm run build:frontend
npm run build:backend
npm run dist:win
```

### Step 4: Verify Build Output

Check these files exist:
- [ ] `dist/frontend/index.html`
- [ ] `dist/backend/ImsServer.exe`
- [ ] `release/IMS Desktop Setup X.X.X.exe`
- [ ] `release/win-unpacked/` (unpacked app)

## Post-Build Checklist

### 1. Test Installer

#### On Development Machine
- [ ] Run installer as Administrator
- [ ] Verify installation completes
- [ ] Check application launches
- [ ] Verify backend starts automatically
- [ ] Test database creation

#### On Clean VM (Windows 10/11)
- [ ] Fresh Windows installation
- [ ] Run installer as Administrator
- [ ] Verify SQL Server LocalDB installs
- [ ] Check application functionality
- [ ] Test all features
- [ ] Check uninstaller works

### 2. File Size Checks

Expected sizes:
- Installer: ~150-300 MB
- Installed app: ~400-600 MB
- Backend exe: ~100-150 MB

### 3. Performance Checks

- [ ] Application starts < 5 seconds
- [ ] Backend API responds < 1 second
- [ ] UI is responsive
- [ ] No memory leaks
- [ ] Database operations are fast

### 4. Security Checks

- [ ] No sensitive data in binaries
- [ ] Connection strings use trusted connections
- [ ] No hardcoded passwords
- [ ] API validates all inputs
- [ ] SQL injection prevention

## Distribution Checklist

### 1. Documentation

- [ ] README.md is up to date
- [ ] BUILD_INSTRUCTIONS.md is complete
- [ ] License file is included
- [ ] Release notes prepared

### 2. Signing (Optional but Recommended)

For production releases:
- [ ] Obtain code signing certificate
- [ ] Configure signing in package.json
- [ ] Sign installer executable
- [ ] Verify signature

### 3. Upload & Release

- [ ] Create GitHub release
- [ ] Upload installer
- [ ] Add release notes
- [ ] Tag version in Git
- [ ] Update download links

### 4. Communication

- [ ] Notify users of new version
- [ ] Update documentation website
- [ ] Provide upgrade instructions
- [ ] List breaking changes (if any)

## Troubleshooting Build Issues

### Frontend Build Fails
```bash
cd frontend
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Backend Build Fails
```bash
cd backend/ImsServer
dotnet clean
dotnet restore
dotnet publish -c Release
```

### Installer Creation Fails
- Check `electron-builder` is installed
- Verify `build/` folder has all assets
- Check disk space (need ~2GB free)
- Review error logs in `release/`

### Runtime Issues
- Check Windows Event Viewer
- Review Electron logs: `%APPDATA%/IMS Desktop/logs/`
- Test backend separately: `dist/backend/ImsServer.exe`
- Verify .NET runtime installed

## Version History Template

```markdown
## Version X.X.X (YYYY-MM-DD)

### New Features
- Feature 1
- Feature 2

### Bug Fixes
- Fix 1
- Fix 2

### Improvements
- Improvement 1
- Improvement 2

### Breaking Changes
- Change 1 (with migration guide)

### Known Issues
- Issue 1 (workaround)
```

## Support Resources

- Documentation: README.md
- Build Guide: BUILD_INSTRUCTIONS.md
- Issue Tracker: GitHub Issues
- Contact: support@yourcompany.com
