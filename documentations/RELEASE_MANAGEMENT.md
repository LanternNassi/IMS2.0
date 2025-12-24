# Release Management Guide

This document explains how server and client releases are managed in GitHub Actions.

## Overview

The build workflow automatically creates **two separate installers** for each release:

1. **Server Version** (`IMS Desktop Setup.exe`)
   - Full application with backend and frontend
   - Standalone installation
   - ~100-200MB

2. **Client Version** (`IMS Desktop Client Setup.exe`)
   - Frontend only, connects to remote server
   - Smaller size (~50-100MB)
   - Prompts for server IP during installation

## Release Process

### Automatic Release (Tagged Versions)

When you push a version tag (e.g., `v1.0.3`):

1. **Workflow triggers** on tag push
2. **Both versions are built**:
   - Server version (includes backend build)
   - Client version (frontend only)
3. **Both are published** to the same GitHub Release
4. **Artifacts are uploaded** for download

**Example:**
```bash
git tag v1.0.3
git push origin v1.0.3
```

This creates a GitHub Release with:
- `IMS Desktop Setup v1.0.3.exe` (Server)
- `IMS Desktop Client Setup v1.0.3.exe` (Client)

### Draft Builds (Branch Pushes)

When you push to `main` branch:

1. **Both versions are built**
2. **Artifacts are uploaded** (not published to releases)
3. **No GitHub Release is created**

Useful for:
- Testing builds
- CI/CD validation
- Pre-release verification

## GitHub Releases

### Release Structure

Each tagged release contains:

```
Release: v1.0.3
├── IMS Desktop Setup v1.0.3.exe (Server)
└── IMS Desktop Client Setup v1.0.3.exe (Client)
```

### Auto-Update

Both versions support auto-updates via `electron-updater`:
- **Server version** checks for updates from GitHub Releases
- **Client version** checks for updates from GitHub Releases
- Updates are downloaded and installed automatically

### Release Notes

You can add release notes when creating a tag:

```bash
git tag -a v1.0.3 -m "Release v1.0.3

## Changes
- Added connection dialog for client mode
- Improved error logging
- Bug fixes

## Downloads
- **Server**: For standalone installations
- **Client**: For connecting to remote servers"
```

## Version Management

### Version Number

Version is read from `package.json`:
```json
{
  "version": "1.0.3"
}
```

### Versioning Strategy

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, small improvements

### Updating Version

1. Update `package.json`:
   ```json
   {
     "version": "1.0.4"
   }
   ```

2. Commit and push:
   ```bash
   git add package.json
   git commit -m "Bump version to 1.0.4"
   git push
   ```

3. Create and push tag:
   ```bash
   git tag v1.0.4
   git push origin v1.0.4
   ```

## Build Artifacts

### Artifact Names

- **Server**: `server-installer-{version}`
- **Client**: `client-installer-{version}`

### Artifact Retention

- Artifacts are retained for **30 days**
- Available for download from GitHub Actions
- Published releases are permanent

## Troubleshooting

### Build Failures

If one build fails, the other will still complete:
- Check build logs for specific errors
- Server build requires backend compilation
- Client build only requires frontend

### Publishing Issues

If publishing fails:
1. Check `GH_TOKEN` secret is set correctly
2. Verify repository permissions
3. Check release already exists (electron-builder will update it)

### Version Conflicts

If a version tag already exists:
- electron-builder will **update** the existing release
- Both installers will be added/updated
- No duplicate releases created

## Best Practices

1. **Always test both versions** before tagging
2. **Use semantic versioning** consistently
3. **Add release notes** for important changes
4. **Test auto-updates** after publishing
5. **Keep artifacts** for at least one major version back

## Workflow Configuration

The workflow is configured in:
- `.github/workflows/build-and-release.yml`

Key settings:
- **Triggers**: Push to `main` or tags `v*`
- **Platform**: Windows (windows-latest)
- **Node**: 18
- **.NET**: 7.0.x

## Manual Release Process

If you need to create a release manually:

1. **Build locally**:
   ```bash
   npm run dist:server
   npm run dist:client
   ```

2. **Create GitHub Release**:
   - Go to GitHub Releases
   - Click "Draft a new release"
   - Tag: `v1.0.3`
   - Upload both `.exe` files
   - Add release notes
   - Publish

## Release Checklist

Before creating a release:

- [ ] Update version in `package.json`
- [ ] Test server version locally
- [ ] Test client version locally
- [ ] Update CHANGELOG.md (if exists)
- [ ] Create and push version tag
- [ ] Verify both installers in GitHub Release
- [ ] Test auto-update from previous version
- [ ] Announce release (if needed)

