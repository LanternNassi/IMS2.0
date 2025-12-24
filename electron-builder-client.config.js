// Client mode build configuration
// Excludes backend files and uses client installer script
module.exports = {
  appId: "com.ims.desktop.client",
  productName: "IMS Desktop Client",
  copyright: "Copyright © 2025",
  directories: {
    output: "release",
    buildResources: "build"
  },
  files: [
    "electron/**/*",
    "dist/frontend/**/*",
    "electron/node_modules/**/*",
    "!dist/backend/**/*",  // Exclude backend for client
    "package.json"
  ],
  // No extraResources for client mode (no backend)
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"]
      }
    ],
    icon: "build/icon.ico",
    requestedExecutionLevel: "requireAdministrator"
  },
  nsis: {
    oneClick: false,
    perMachine: true,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "IMS Desktop Client",
    installerIcon: "build/icon.ico",
    uninstallerIcon: "build/icon.ico",
    license: "LICENSE.txt",
    include: "build/installer-client.nsh",  // Use client installer script
    deleteAppDataOnUninstall: false
  },
  publish: {
    provider: "github",
    owner: "LanternNassi",
    repo: "IMS2.0",
    releaseType: "release",
    channel: "client"
  }
}

