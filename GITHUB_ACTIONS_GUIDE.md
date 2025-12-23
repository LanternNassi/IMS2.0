# GitHub Actions Build and Release Guide

This guide explains how to use the automated build and release workflow for the IMS Desktop application.

## Overview

The GitHub Actions workflow automatically:
- Builds the frontend (Next.js)
- Builds the backend (.NET)
- Creates the Electron installer
- Publishes to GitHub Releases (on tags)

## Setup

### 1. Add GitHub Token Secret

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `GH_TOKEN`
5. Value: Your GitHub Personal Access Token (with `repo` scope)
6. Click **Add secret**

### 2. Workflow File Location

The workflow file is located at:
```
.github/workflows/build-and-release.yml
```

## How It Works

### On Push to Main Branch

When you push to the `main` branch:
- ✅ Builds the application
- ✅ Creates the installer
- ✅ Uploads artifacts
- ❌ Does NOT publish to GitHub Releases

This is useful for testing builds without creating releases.

### On Tag Push (e.g., v1.0.0)

When you push a tag starting with `v` (e.g., `v1.0.0`, `v1.0.1`):
- ✅ Builds the application
- ✅ Creates the installer
- ✅ Publishes to GitHub Releases
- ✅ Uploads artifacts

## Creating a Release

### Step 1: Update Version

Update the version in `package.json`:

```json
{
  "version": "1.0.1"
}
```

### Step 2: Commit and Push

```bash
git add package.json
git commit -m "Bump version to 1.0.1"
git push origin main
```

### Step 3: Create and Push Tag

```bash
# Create a tag
git tag v1.0.1

# Push the tag
git push origin v1.0.1
```

**Or create tag via GitHub:**
1. Go to **Releases** → **Draft a new release**
2. Choose **Choose a tag** → **Create new tag**
3. Enter tag name (e.g., `v1.0.1`)
4. Select **main** branch
5. Click **Create release** (or save as draft)

### Step 4: Workflow Runs Automatically

Once the tag is pushed, the workflow will:
1. Build the application
2. Create the installer
3. Automatically create/update the GitHub Release
4. Upload the installer to the release

## Workflow Steps

The workflow performs these steps:

1. **Checkout code** - Gets the latest code
2. **Setup Node.js** - Installs Node.js 18
3. **Setup .NET SDK** - Installs .NET 7.0 SDK
4. **Get version** - Reads version from package.json
5. **Install dependencies** - Root and frontend npm packages
6. **Build frontend** - Next.js static export
7. **Build backend** - .NET self-contained executable
8. **Build Electron app** - Creates Windows installer
9. **Publish to GitHub** - Only on tags
10. **Upload artifacts** - Saves installer as artifact

## Viewing Workflow Runs

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select **Build and Release** workflow
4. View the latest run and its logs

## Troubleshooting

### Workflow Fails to Publish

**Issue:** Release not created on GitHub

**Solutions:**
- ✅ Verify `GH_TOKEN` secret is set correctly
- ✅ Ensure token has `repo` scope
- ✅ Check that tag starts with `v` (e.g., `v1.0.0`)
- ✅ Verify `publish` config in `package.json` has correct owner/repo

### Build Fails

**Issue:** Build step fails

**Solutions:**
- ✅ Check workflow logs for specific error
- ✅ Verify all dependencies are in package.json
- ✅ Ensure .NET SDK version matches project requirements
- ✅ Check that build assets (icon.ico, etc.) exist

### Installer Not Created

**Issue:** Build succeeds but no installer

**Solutions:**
- ✅ Check `release/` folder in artifacts
- ✅ Verify electron-builder configuration
- ✅ Ensure all required files are included in build config

## Manual Release (Alternative)

If you prefer to create releases manually:

1. Build locally: `npm run dist:win`
2. Go to GitHub → **Releases** → **Draft a new release**
3. Create tag and release
4. Upload the installer from `release/` folder

## Version Tagging Best Practices

- Use semantic versioning: `v1.0.0`, `v1.0.1`, `v1.1.0`, `v2.0.0`
- Always update `package.json` version before tagging
- Tag format: `v` + version number (e.g., `v1.0.0`)
- Write release notes when creating the release

## Example Workflow

```bash
# 1. Update version in package.json to 1.0.1
# 2. Commit changes
git add package.json
git commit -m "Bump version to 1.0.1"
git push origin main

# 3. Create and push tag
git tag v1.0.1
git push origin v1.0.1

# 4. GitHub Actions automatically:
#    - Builds the app
#    - Creates installer
#    - Publishes to GitHub Releases
#    - Users can download and auto-update
```

## Notes

- The workflow runs on `windows-latest` runner
- Build artifacts are kept for 30 days
- Only tagged versions are published to releases
- Branch pushes create builds but don't publish (useful for testing)

