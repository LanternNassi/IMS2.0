const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const ExcelJS = require("exceljs");
const path = require("path");
const { spawn } = require("child_process");
const isDev = require("electron-is-dev");
const http = require("http");
const fs = require("fs");
const url = require("url");

// Use dynamic import for electron-store (ESM)
// let store;
// async function initStore() {
//   const Store = (await import('electron-store')).default;
//   store = new Store({
//     encryptionKey: 'your-encryption-key-here', // Use a secure key in production
//   });
// }

const Store = require('electron-store');
const store = new Store({
  encryptionKey: 'your-encryption-key-here',
});

let mainWindow;
let loginWindow;
let backendProcess = null;
let frontendServer = null;
const FRONTEND_PORT = 8080;
const BACKEND_PORT = 5184;

// Configure auto-updater
autoUpdater.autoDownload = false; // Don't auto-download, let user decide
autoUpdater.autoInstallOnAppQuit = true; // Auto-install on app quit after download

// Only check for updates in production
if (!isDev) {
  // Set update check interval (check every 4 hours)
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 4 * 60 * 60 * 1000);
}

// MIME types for serving static files
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

// Health check function to verify server is ready
function checkServerHealth(port, maxRetries = 30, interval = 500) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    
    const check = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        console.log(`Server on port ${port} is ready (status: ${res.statusCode})`);
        resolve(true);
      });
      
      req.on('error', (err) => {
        retries++;
        if (retries >= maxRetries) {
          console.error(`Server on port ${port} failed to start after ${maxRetries} retries`);
          reject(new Error(`Server on port ${port} not responding`));
        } else {
          console.log(`Waiting for server on port ${port}... (attempt ${retries}/${maxRetries})`);
          setTimeout(check, interval);
        }
      });
      
      req.end();
    };
    
    check();
  });
}

// Start local HTTP server for frontend in production
function startFrontendServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      resolve();
      return;
    }
    
    const frontendPath = path.join(__dirname, "..", "dist", "frontend");
    
    if (!fs.existsSync(frontendPath)) {
      console.error("Frontend dist folder not found at:", frontendPath);
      reject(new Error("Frontend files not found"));
      return;
    }
    
    frontendServer = http.createServer((req, res) => {
      let filePath = path.join(frontendPath, req.url === '/' ? 'index.html' : req.url);
      
      // Handle trailing slashes for Next.js static export
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      
      const extname = String(path.extname(filePath)).toLowerCase();
      const contentType = mimeTypes[extname] || 'application/octet-stream';
      
      fs.readFile(filePath, (error, content) => {
        if (error) {
          if (error.code == 'ENOENT') {
            // Page not found, try index.html
            fs.readFile(path.join(frontendPath, 'index.html'), (err, content) => {
              if (err) {
                res.writeHead(404);
                res.end('Not Found');
              } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content, 'utf-8');
              }
            });
          } else {
            res.writeHead(500);
            res.end('Server Error: ' + error.code);
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });
    
    frontendServer.on('error', (err) => {
      console.error('Frontend server error:', err);
      reject(err);
    });
    
    frontendServer.listen(FRONTEND_PORT, () => {
      console.log(`Frontend server running on http://0.0.0.0:${FRONTEND_PORT}`);
      resolve();
    });
  });
}

// Start the .NET backend server
function startBackend() {
  return new Promise((resolve, reject) => {
    const backendPath = isDev
      ? path.join(__dirname, "..", "backend", "ImsServer", "bin", "Debug", "net7.0", "ImsServer.exe")
      : path.join(process.resourcesPath, "backend", "ImsServer.exe");

    console.log("Starting backend from:", backendPath);
    console.log("Backend exists:", fs.existsSync(backendPath));

    if (!fs.existsSync(backendPath)) {
      console.error("Backend executable not found at:", backendPath);
      dialog.showErrorBox(
        "Backend Error", 
        `Could not find backend executable at:\n${backendPath}\n\nPlease rebuild the application.`
      );
      reject(new Error("Backend executable not found"));
      return;
    }

    const backendDir = path.dirname(backendPath);
    console.log("Backend directory:", backendDir);
    
    backendProcess = spawn(backendPath, [], {
      cwd: backendDir,
      env: { 
        ...process.env, 
        ASPNETCORE_ENVIRONMENT: "Production",
        ASPNETCORE_URLS: `http://*:${BACKEND_PORT}`
      }
    });

    backendProcess.stdout.on("data", (data) => {
      console.log(`Backend: ${data}`);
      // Look for startup success message
      if (data.toString().includes("Now listening on") || data.toString().includes("Application started")) {
        resolve();
      }
    });

    backendProcess.stderr.on("data", (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on("close", (code) => {
      console.log(`Backend process exited with code ${code}`);
    });
    
    backendProcess.on("error", (err) => {
      console.error(`Failed to start backend: ${err}`);
      reject(err);
    });
    
    // Fallback: resolve after a short delay even if we don't see the message
    setTimeout(() => resolve(), 2000);
  });
}


function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 400,
    height: 650,
    resizable: false,
    minimizable: false,
    maximizable: false,
    frame: true,
    modal: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "icon.ico"),
  });
  loginWindow.removeMenu && loginWindow.removeMenu();
  loginWindow.loadFile(path.join(__dirname, "login.html"));
  loginWindow.once('ready-to-show', () => loginWindow.show());
  loginWindow.on("closed", () => {
    loginWindow = null;
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "icon.ico"),
  });

  // if(isDev){
  //   mainWindow.removeMenu();
  // }

  mainWindow.removeMenu();


  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    setTimeout(() => {
      console.log('Retrying page load...');
      if (mainWindow && !mainWindow.isDestroyed()) {
        const loadUrl = isDev ? "http://localhost:3000" : `http://localhost:${FRONTEND_PORT}`;
        mainWindow.loadURL(loadUrl);
      }
    }, 1000);
  });

  const loadUrl = isDev ? "http://localhost:3000" : `http://localhost:${FRONTEND_PORT}`;
  console.log('Loading URL:', loadUrl);
  mainWindow.loadURL(loadUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", async () => {
  try {
    // Initialize store first
    // await initStore();
    console.log("App ready, starting servers...");
    
    // Check for updates in production (after a short delay to not block startup)
    if (!isDev) {
      setTimeout(() => {
        console.log("Checking for updates...");
        autoUpdater.checkForUpdates();
      }, 5000); // Wait 5 seconds after app start
    }
    
    // Start servers first (needed for login API)
    if (!isDev) {
      console.log("Starting frontend server...");
      await startFrontendServer();
      console.log("Checking frontend server health...");
      await checkServerHealth(FRONTEND_PORT);
    }
    console.log("Starting backend server...");
    await startBackend();
    console.log("Checking backend server health...");
    await checkServerHealth(BACKEND_PORT);
    
    // Now check if user is already logged in
    const savedAuth = store.get('auth');
    if (savedAuth && savedAuth.token) {
      console.log("Found saved authentication, attempting auto-login...");
      // Verify token is still valid
      const isValid = await verifyToken(savedAuth.token);
      if (isValid) {
        console.log("Token valid, skipping login...");
        createMainWindow();
        return;
      } else {
        console.log("Token expired, showing login...");
        store.delete('auth');
      }
    }
    
    console.log("No valid auth found, creating login window...");
    createLoginWindow();
  } catch (error) {
    console.error("Failed to start application:", error);
    dialog.showErrorBox(
      "Startup Error",
      `Failed to start the application:\n${error.message}\n\nPlease check the logs and try again.`
    );
    app.quit();
  }
});

// Verify token validity
async function verifyToken(token) {
  try {
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/Auth/verify`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.ok;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}

// IPC handler for login
ipcMain.handle('login-attempt', async (event, { username, password, rememberMe }) => {
  console.log('Login attempt received:', { username, rememberMe });
  try {
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      const data = await response.json();
      
      // Extract user data (everything except token)
      const { token, ...user } = data;
      
      // Store auth data securely in electron-store
      const authData = {
        token: token,
        user: user,
        expiresAt: data.expiresAt || Date.now() + (24 * 60 * 60 * 1000), // 24 hours default
        rememberMe: rememberMe || false
      };
      
      if (rememberMe) {
        store.set('auth', authData);
        console.log('Auth data saved to secure store');
      }
      
      // Close login window and create main window
      if (loginWindow) {
        loginWindow.close();
      }
      createMainWindow();
      
      // Send auth data to renderer process after window is ready
      mainWindow.webContents.on('did-finish-load', () => {
        console.log('Sending auth data to renderer:', authData);
        mainWindow.webContents.send('auth-data', authData);
      });
      
      return { success: true, data: authData };
    } else {
      const error = await response.json();
      return { 
        success: false, 
        message: error.message || 'Invalid username or password.' 
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      message: 'Connection error. Please try again.' 
    };
  }
});

// IPC handler to get stored auth data
ipcMain.handle('get-auth-data', async () => {
  const authData = store.get('auth');
  if (authData && authData.token) {
    // Check if token is expired
    if (authData.expiresAt && Date.now() > authData.expiresAt) {
      store.delete('auth');
      return null;
    }
    return authData;
  }
  return null;
});

// IPC handler to save auth data
ipcMain.handle('save-auth-data', async (event, authData) => {
  store.set('auth', authData);
  return { success: true };
});

// IPC handler to clear auth data (logout)
ipcMain.handle('logout', async () => {
  store.delete('auth');
  
  // Close main window and show login window
  if (mainWindow) {
    mainWindow.close();
  }
  createLoginWindow();
  
  return { success: true };
});

// IPC handler to update token (for token refresh)
ipcMain.handle('update-token', async (event, newToken, expiresAt) => {
  const authData = store.get('auth');
  if (authData) {
    authData.token = newToken;
    authData.expiresAt = expiresAt;
    store.set('auth', authData);
    return { success: true };
  }
  return { success: false };
});

app.on("window-all-closed", () => {
  // Kill backend process
  if (backendProcess) {
    console.log("Killing backend process...");
    backendProcess.kill();
  }
  
  // Close frontend server
  if (frontendServer) {
    console.log("Closing frontend server...");
    frontendServer.close();
  }
  
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  // Ensure backend is terminated
  if (backendProcess) {
    backendProcess.kill();
  }
  
  // Ensure frontend server is closed
  if (frontendServer) {
    frontendServer.close();
  }
});

// Auto-updater event handlers
autoUpdater.on("checking-for-update", () => {
  console.log("Checking for update...");
  if (mainWindow) {
    mainWindow.webContents.send("update-status", {
      status: "checking",
      message: "Checking for updates..."
    });
  }
});

autoUpdater.on("update-available", (info) => {
  console.log("Update available:", info.version);
  if (mainWindow) {
    mainWindow.webContents.send("update-status", {
      status: "available",
      message: `Update available: v${info.version}`,
      version: info.version,
      releaseNotes: info.releaseNotes || "A new version is available."
    });
  }
  
  // Show notification dialog
  dialog.showMessageBox(mainWindow || loginWindow, {
    type: "info",
    title: "Update Available",
    message: `A new version (v${info.version}) is available.`,
    detail: "Would you like to download it now?",
    buttons: ["Download", "Later"],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on("update-not-available", (info) => {
  console.log("Update not available. Current version is latest.");
  if (mainWindow) {
    mainWindow.webContents.send("update-status", {
      status: "not-available",
      message: "You are using the latest version."
    });
  }
});

autoUpdater.on("error", (err) => {
  console.error("Error in auto-updater:", err);
  if (mainWindow) {
    mainWindow.webContents.send("update-status", {
      status: "error",
      message: `Update error: ${err.message}`
    });
  }
});

autoUpdater.on("download-progress", (progressObj) => {
  let log_message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
  console.log(log_message);
  
  if (mainWindow) {
    mainWindow.webContents.send("update-status", {
      status: "downloading",
      message: `Downloading update... ${Math.round(progressObj.percent)}%`,
      percent: progressObj.percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  }
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("Update downloaded:", info.version);
  
  if (mainWindow) {
    mainWindow.webContents.send("update-status", {
      status: "downloaded",
      message: "Update downloaded. Restart to install.",
      version: info.version
    });
  }
  
  // Show dialog to restart
  dialog.showMessageBox(mainWindow || loginWindow, {
    type: "info",
    title: "Update Ready",
    message: "Update downloaded successfully!",
    detail: "The application will restart to install the update.",
    buttons: ["Restart Now", "Later"],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall(false, true); // isSilent, isForceRunAfter
    }
  });
});

// IPC handlers for update management
ipcMain.handle("check-for-updates", async () => {
  try {
    if (isDev) {
      return { success: false, message: "Updates are disabled in development mode." };
    }
    const result = await autoUpdater.checkForUpdates();
    return { 
      success: true, 
      message: "Checking for updates...",
      currentVersion: app.getVersion()
    };
  } catch (error) {
    console.error("Error checking for updates:", error);
    return { 
      success: false, 
      message: `Error checking for updates: ${error.message}` 
    };
  }
});

ipcMain.handle("download-update", async () => {
  try {
    if (isDev) {
      return { success: false, message: "Updates are disabled in development mode." };
    }
    autoUpdater.downloadUpdate();
    return { success: true, message: "Download started..." };
  } catch (error) {
    console.error("Error downloading update:", error);
    return { 
      success: false, 
      message: `Error downloading update: ${error.message}` 
    };
  }
});

ipcMain.handle("install-update", async () => {
  try {
    if (isDev) {
      return { success: false, message: "Updates are disabled in development mode." };
    }
    autoUpdater.quitAndInstall(false, true);
    return { success: true, message: "Installing update..." };
  } catch (error) {
    console.error("Error installing update:", error);
    return { 
      success: false, 
      message: `Error installing update: ${error.message}` 
    };
  }
});

ipcMain.handle("get-app-version", async () => {
  return {
    version: app.getVersion(),
    name: app.getName()
  };
});

// Excel export handler
ipcMain.on("export-excel", async (event, jsonData, fileName) => {
  const { filePath } = await dialog.showSaveDialog({
    title: `Save ${fileName}`,
    defaultPath: path.join(app.getPath("documents"), `${fileName}.xlsx`),
    filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
  });

  if (!filePath) return;

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("data");

    // Add headers dynamically
    if (jsonData && jsonData.length > 0) {
      worksheet.columns = Object.keys(jsonData[0]).map((key) => ({
        header: key.toUpperCase(),
        key: key,
        width: 20,
      }));

      // Add data rows
      jsonData.forEach((item) => worksheet.addRow(item));
    }

    await workbook.xlsx.writeFile(filePath);
    event.reply("export-done", "Excel file saved successfully!");
  } catch (error) {
    console.error("Excel export error:", error);
    event.reply("export-error", error.message);
  }
});