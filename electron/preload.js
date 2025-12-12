const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    send: (channel, data) => ipcRenderer.send(channel, data),
});


contextBridge.exposeInMainWorld("electron", {
    exportExcel: (data , fileName) => ipcRenderer.send("export-excel", data , fileName),
    onExportDone: (callback) => ipcRenderer.on("export-done", (_, message) => callback(message))
});