# Auto-Update Setup Guide

This guide explains how to set up automatic updates for the IMS Desktop application using GitHub Releases.

## Prerequisites

1. A GitHub repository for your application
2. GitHub Personal Access Token (PAT) with `repo` scope
3. `electron-updater` package (already added to dependencies)

## Configuration Steps

### 1. Update package.json

Update the `publish` section in `package.json` with your GitHub repository details:

```json
"publish": {
  "provider": "github",
  "owner": "YOUR_GITHUB_USERNAME",
  "repo": "YOUR_REPOSITORY_NAME",
  "releaseType": "release"
}
```

**Example:**
```json
"publish": {
  "provider": "github",
  "owner": "ntambi-nassim",
  "repo": "ims-desktop",
  "releaseType": "release"
}
```

### 2. Set GitHub Token

You need to set the `GH_TOKEN` environment variable with your GitHub Personal Access Token:

**Windows (PowerShell):**
```powershell
$env:GH_TOKEN="your_github_token_here"
```

**Windows (Command Prompt):**
```cmd
set GH_TOKEN=your_github_token_here
```

**Linux/Mac:**
```bash
export GH_TOKEN="your_github_token_here"
```

### 3. Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "IMS Desktop Auto-Update")
4. Select the `repo` scope
5. Generate and copy the token
6. Use this token as your `GH_TOKEN`

## Building and Publishing

### Build for Production

```bash
npm run build:all
npm run dist:win
```

### Publish to GitHub Releases

To automatically create a GitHub release and upload the installer:

```bash
npm run dist:win -- --publish always
```

Or to publish only if the version changed:

```bash
npm run dist:win -- --publish onTagOrDraft
```

## How It Works

1. **Automatic Check**: The app checks for updates 5 seconds after startup and then every 4 hours
2. **Update Detection**: When a new version is found, a dialog appears asking if you want to download
3. **Download Progress**: Progress is shown in the app and sent to the renderer process
4. **Installation**: After download, the app prompts to restart and install the update

## Version Management

- Update the `version` field in `package.json` before building a new release
- Use semantic versioning (e.g., 1.0.0, 1.0.1, 1.1.0)
- The version must be higher than the previous release for updates to be detected

## Testing Updates

### In Development

Auto-updates are disabled in development mode. To test:

1. Build a production version: `npm run dist:win`
2. Install the built version
3. Create a new release on GitHub with a higher version
4. Run the installed app - it should detect the update

### Local Testing (Without GitHub)

You can test locally by:

1. Building the app: `npm run dist:win`
2. Setting up a local update server (using `electron-updater` with `file://` provider)
3. Or using a staging GitHub repository

## Frontend Integration

The renderer process can listen for update events:

```typescript
// Check for updates manually
const result = await window.electron.checkForUpdates();

// Listen for update status
window.electron.onUpdateStatus((status) => {
  console.log('Update status:', status);
  // status.status can be: 'checking', 'available', 'not-available', 
  // 'downloading', 'downloaded', 'error'
  // status.message contains the status message
  // status.percent contains download progress (0-100)
});

// Get current app version
const version = await window.electron.getAppVersion();
```

## Troubleshooting

### Updates Not Detected

1. **Check GitHub Token**: Ensure `GH_TOKEN` is set correctly
2. **Check Repository**: Verify the `owner` and `repo` in `package.json` are correct
3. **Check Version**: Ensure the new version is higher than the current version
4. **Check Release**: Ensure the GitHub release is published (not draft)
5. **Check Network**: Ensure the app can reach GitHub API

### Update Download Fails

1. Check internet connection
2. Verify GitHub token has proper permissions
3. Check if the release file exists on GitHub
4. Check console logs for specific error messages

### Update Installation Fails

1. Ensure the app has proper permissions
2. Check if antivirus is blocking the update
3. Verify the installer file is not corrupted
4. Check Windows Event Viewer for detailed errors

## Security Notes

- Never commit your `GH_TOKEN` to version control
- Use environment variables or secure credential storage
- Consider using GitHub App tokens instead of personal access tokens for better security
- Regularly rotate your tokens

## Additional Resources

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [GitHub Releases API](https://docs.github.com/en/rest/releases/releases)
- [Semantic Versioning](https://semver.org/)

