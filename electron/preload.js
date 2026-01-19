const { contextBridge, ipcRenderer } = require('electron');

// Expose API methods
contextBridge.exposeInMainWorld('api', {
    send: (channel, data) => ipcRenderer.send(channel, data),
});

// Expose Electron-specific methods (matching your existing 'electron' namespace)
contextBridge.exposeInMainWorld("electron", {
    // Auth methods
    login: (credentials) => ipcRenderer.invoke('login-attempt', credentials),
    getAuthData: () => ipcRenderer.invoke('get-auth-data'),
    saveAuthData: (authData) => ipcRenderer.invoke('save-auth-data', authData),
    logout: () => ipcRenderer.invoke('logout'),
    updateToken: (newToken, expiresAt) => ipcRenderer.invoke('update-token', newToken, expiresAt),

    // Listen for auth data from main process
    onAuthData: (callback) => {
        ipcRenderer.on('auth-data', (event, data) => callback(data));
    },

    // Excel export
    exportExcel: (data, fileName) => ipcRenderer.send("export-excel", data, fileName),
    onExportDone: (callback) => ipcRenderer.on("export-done", (_, message) => callback(message)),
    onExportError: (callback) => ipcRenderer.on("export-error", (_, error) => callback(error)),

    // Auto-update methods
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    onUpdateStatus: (callback) => {
        ipcRenderer.on('update-status', (_, data) => callback(data));
    },
    removeUpdateStatusListener: () => {
        ipcRenderer.removeAllListeners('update-status');
    },

    // Server configuration (for client mode)
    getServerConfig: () => ipcRenderer.invoke('get-server-config'),

    // Folder picker
    showFolderPicker: () => ipcRenderer.invoke('show-folder-picker'),

    // Remove listeners
    removeAuthDataListener: () => {
        ipcRenderer.removeAllListeners('auth-data');
    }
});