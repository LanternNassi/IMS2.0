# Auto-Update Version Management

This document explains how the auto-update system distinguishes between server and client versions when both are published to the same GitHub release.

## How It Works

### File Identification

`electron-updater` identifies which installer to download based on the **`productName`** in the build configuration:

- **Server Version**: `productName: "IMS Desktop"`
  - Looks for: `IMS Desktop Setup {version}.exe`
  - Downloads only server installers

- **Client Version**: `productName: "IMS Desktop Client"`
  - Looks for: `IMS Desktop Client Setup {version}.exe`
  - Downloads only client installers

### Configuration Details

#### Server Version (`package.json`)
```json
{
  "appId": "com.ims.desktop.server",
  "productName": "IMS Desktop",
  "publish": {
    "channel": "server"
  }
}
```

#### Client Version (`electron-builder-client.config.js`)
```json
{
  "appId": "com.ims.desktop.client",
  "productName": "IMS Desktop Client",
  "publish": {
    "channel": "client"
  }
}
```

### Update Process

1. **App Starts**: Each app knows its own `productName` from build config
2. **Check for Updates**: `electron-updater` queries GitHub Releases
3. **File Matching**: Only downloads files matching its `productName`
4. **Installation**: Installs the correct version

### GitHub Release Structure

When both versions are published to the same release:

```
Release: v1.0.3
├── IMS Desktop Setup 1.0.3.exe (Server installer)
├── IMS Desktop Client Setup 1.0.3.exe (Client installer)
├── latest.yml (Server update metadata)
└── latest-client.yml (Client update metadata)
```

**Note**: `electron-builder` creates separate metadata files for each channel/productName.

### Runtime Configuration

The app also sets the update channel at runtime:

```javascript
// In electron/main.js
if (IS_CLIENT_MODE) {
  autoUpdater.channel = 'client';
} else {
  autoUpdater.channel = 'server';
}
```

This ensures the auto-updater uses the correct channel when checking for updates.

## Verification

### Testing Server Updates

1. Install server version (v1.0.2)
2. Publish new server version (v1.0.3) to GitHub
3. Server app should detect update for "IMS Desktop Setup"
4. Client app should **NOT** detect this update

### Testing Client Updates

1. Install client version (v1.0.2)
2. Publish new client version (v1.0.3) to GitHub
3. Client app should detect update for "IMS Desktop Client Setup"
4. Server app should **NOT** detect this update

### Testing Both Updates

1. Install both versions (v1.0.2)
2. Publish both new versions (v1.0.3) to GitHub
3. Each app should detect only its own update
4. No cross-contamination between versions

## Troubleshooting

### Server Gets Client Update (or vice versa)

**Problem**: Wrong installer is being downloaded

**Solution**:
1. Verify `productName` in build config matches installed app
2. Check `appId` is different: `com.ims.desktop.server` vs `com.ims.desktop.client`
3. Verify `channel` is set correctly in publish config
4. Check runtime channel setting in `main.js`

### Updates Not Detected

**Problem**: App doesn't find updates

**Solution**:
1. Check GitHub release contains both installers
2. Verify version number is higher than current
3. Check `GH_TOKEN` is set correctly
4. Verify repository owner/repo in publish config
5. Check release is published (not draft)

### Wrong File Downloaded

**Problem**: Downloads correct file but wrong version

**Solution**:
1. Check `latest.yml` files in release
2. Verify metadata points to correct installer
3. Clear app cache and retry
4. Check file names match `productName` pattern

## Technical Details

### electron-updater Matching Logic

`electron-updater` uses this logic to find updates:

1. **Query GitHub API** for releases
2. **Filter by channel** (if specified)
3. **Match productName** in release assets
4. **Compare versions** (must be higher)
5. **Download matching file**

### File Naming Convention

NSIS installers follow this pattern:
```
{productName} Setup {version}.exe
```

Examples:
- Server: `IMS Desktop Setup 1.0.3.exe`
- Client: `IMS Desktop Client Setup 1.0.3.exe`

### Metadata Files

`electron-builder` creates metadata files:
- `latest.yml` - Default (server in our case)
- `latest-{channel}.yml` - Channel-specific (client)

These files contain:
- Version number
- File URL
- SHA512 checksum
- File size
- Release date

## Best Practices

1. **Always use different `productName`** for server and client
2. **Use different `appId`** to prevent conflicts
3. **Set channels explicitly** in publish config
4. **Test updates** for both versions before release
5. **Verify file names** match `productName` pattern
6. **Keep version numbers** synchronized between builds

## Summary

The auto-update system works correctly because:

✅ **Different `productName`**: Each version looks for its own files  
✅ **Different `appId`**: Prevents system-level conflicts  
✅ **Channel separation**: Additional layer of distinction  
✅ **Runtime configuration**: Ensures correct channel is used  

Each version will **only** download and install updates matching its own `productName`, ensuring server and client updates remain completely separate even when published to the same GitHub release.

