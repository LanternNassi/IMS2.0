const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const ExcelJS = require("exceljs");
const path = require("path");
const { spawn } = require("child_process");
const isDev = require("electron-is-dev");
const http = require("http");
const fs = require("fs");
const url = require("url");
const os = require("os");

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

// Logging utility for writing errors to file
let logFileStream = null;
let LOG_DIR = null;
let LOG_FILE = null;

// Get log file path (can only be called after app is ready)
function getLogFilePath() {
  if (!LOG_DIR) {
    try {
      if (app.isReady()) {
        LOG_DIR = path.join(app.getPath('appData'), 'IMS Desktop', 'logs');
      } else {
        // Fallback before app is ready - use temp directory
        LOG_DIR = path.join(os.tmpdir(), 'IMS Desktop', 'logs');
      }
      const today = new Date().toISOString().split('T')[0];
      LOG_FILE = path.join(LOG_DIR, `error-${today}.log`);
    } catch (error) {
      // Final fallback
      LOG_DIR = path.join(os.tmpdir(), 'IMS Desktop', 'logs');
      const today = new Date().toISOString().split('T')[0];
      LOG_FILE = path.join(LOG_DIR, `error-${today}.log`);
    }
  }
  return LOG_FILE;
}

// Ensure log directory exists
function ensureLogDirectory() {
  try {
    const logPath = getLogFilePath();
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to create log directory:', error);
  }
}

// Initialize log file stream
function initLogFile() {
  try {
    ensureLogDirectory();
    const logPath = getLogFilePath();
    logFileStream = fs.createWriteStream(logPath, { flags: 'a' });
    
    // Write startup marker
    const mode = typeof APP_MODE !== 'undefined' ? APP_MODE.toUpperCase() : 'UNKNOWN';
    const startupMsg = `\n${'='.repeat(80)}\n[${new Date().toISOString()}] Application Started (Mode: ${mode})\n${'='.repeat(80)}\n`;
    logFileStream.write(startupMsg);
    
    console.log(`Log file: ${logPath}`);
  } catch (error) {
    console.error('Failed to initialize log file:', error);
  }
}

// Write error to log file
function writeToLog(level, message, error = null) {
  const timestamp = new Date().toISOString();
  let logEntry = `[${timestamp}] [${level}] ${message}\n`;
  
  if (error) {
    if (error instanceof Error) {
      logEntry += `  Error: ${error.message}\n`;
      if (error.stack) {
        logEntry += `  Stack: ${error.stack}\n`;
      }
    } else {
      logEntry += `  Error: ${JSON.stringify(error)}\n`;
    }
  }
  
  // Write to file (initialize if needed)
  if (!logFileStream && app.isReady()) {
    initLogFile();
  }
  
  if (logFileStream) {
    try {
      logFileStream.write(logEntry);
      logFileStream.write('\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }
  
  // Also log to console
  if (level === 'ERROR') {
    console.error(`[${level}] ${message}`, error || '');
  } else if (level === 'WARN') {
    console.warn(`[${level}] ${message}`, error || '');
  } else {
    console.log(`[${level}] ${message}`);
  }
}

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  writeToLog('ERROR', 'Uncaught Exception', error);
});

process.on('unhandledRejection', (reason, promise) => {
  writeToLog('ERROR', 'Unhandled Rejection', reason);
});

let mainWindow;
let loginWindow;
let connectionWindow = null;
let backendProcess = null;
let frontendServer = null;
const FRONTEND_PORT = 8080;
const BACKEND_PORT = 5184;

// Detect app mode: 'server' (default) or 'client'
// Can be set via environment variable APP_MODE or detected from config file
const APP_MODE = process.env.APP_MODE || (() => {
  // Check if server_config.ini exists (indicates client mode)
  const configPath = path.join(app.getPath('appData'), 'IMS Desktop', 'server_config.ini');
  return fs.existsSync(configPath) ? 'client' : 'server';
})();
const IS_CLIENT_MODE = APP_MODE === 'client';

// Server configuration (for client mode)
let SERVER_IP = 'localhost';
let CLIENT_BACKEND_PORT = BACKEND_PORT;

// Get network IP address (fallback for client mode)
function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Read server configuration from file (for client mode)
function getServerConfig() {
  try {
    const configPath = path.join(app.getPath('appData'), 'IMS Desktop', 'server_config.ini');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const lines = configContent.split('\n');
      let serverIP = 'localhost';
      let backendPort = BACKEND_PORT;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('IP=')) {
          serverIP = trimmed.substring(3).trim();
        } else if (trimmed.startsWith('BackendPort=')) {
          backendPort = parseInt(trimmed.substring(12).trim()) || BACKEND_PORT;
        }
        // FrontendPort is ignored - client always uses local frontend server
      }

      return { serverIP, backendPort };
    }
  } catch (error) {
    console.error('Error reading server config:', error);
  }

  // Fallback to network IP if no config
  return { serverIP: getNetworkIP(), backendPort: BACKEND_PORT };
}

// Initialize server config for client mode
if (IS_CLIENT_MODE) {
  const config = getServerConfig();
  SERVER_IP = config.serverIP;
  CLIENT_BACKEND_PORT = config.backendPort;
  console.log(`[CLIENT MODE] Using remote backend: ${SERVER_IP}:${CLIENT_BACKEND_PORT}`);
  console.log(`[CLIENT MODE] Frontend will be served locally on port ${FRONTEND_PORT}`);
} else {
  console.log(`[SERVER MODE] Starting local servers`);
}

// Configure auto-updater
autoUpdater.autoDownload = false; // Don't auto-download, let user decide
autoUpdater.autoInstallOnAppQuit = true; // Auto-install on app quit after download

// Set update channel based on app mode
// This ensures server gets server updates and client gets client updates
if (IS_CLIENT_MODE) {
  autoUpdater.channel = 'client';
  console.log('[AUTO-UPDATE] Client mode: Will check for client updates');
} else {
  autoUpdater.channel = 'server';
  console.log('[AUTO-UPDATE] Server mode: Will check for server updates');
}

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

// Create connection status dialog
function createConnectionDialog(serverHost, port) {
  if (connectionWindow) {
    return; // Already showing
  }
  
  connectionWindow = new BrowserWindow({
    width: 250,
    height: 400,
    resizable: false,
    minimizable: false,
    maximizable: false,
    frame: true,
    modal: true,
    show: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "icon.ico"),
  });
  
  connectionWindow.removeMenu && connectionWindow.removeMenu();
  
  // Create HTML content for the connection dialog
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Connecting to Server</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .container {
      text-align: center;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h2 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 18px;
    }
    .message {
      color: #666;
      margin: 10px 0;
      font-size: 14px;
    }
    .server-info {
      color: #888;
      font-size: 12px;
      margin-top: 15px;
    }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin: 15px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Connecting to Server</h2>
    <div class="spinner"></div>
    <div class="message" id="statusMessage">Establishing connection...</div>
    <div class="server-info" id="serverInfo">Server: ${serverHost}:${port}</div>
  </div>
  <script>
    // Update status message
    window.updateStatus = function(message) {
      const statusEl = document.getElementById('statusMessage');
      if (statusEl) {
        statusEl.textContent = message;
      }
    };
  </script>
</body>
</html>`;
  
  connectionWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  connectionWindow.once('ready-to-show', () => {
    if (connectionWindow) {
      connectionWindow.show();
    }
  });
  
  connectionWindow.on("closed", () => {
    connectionWindow = null;
  });
}

// Update connection dialog message
function updateConnectionDialog(message) {
  if (connectionWindow && !connectionWindow.isDestroyed()) {
    connectionWindow.webContents.executeJavaScript(`
      if (window.updateStatus) {
        window.updateStatus(${JSON.stringify(message)});
      }
    `).catch(() => {
      // Ignore errors if window is closing
    });
  }
}

// Close connection dialog
function closeConnectionDialog() {
  if (connectionWindow && !connectionWindow.isDestroyed()) {
    connectionWindow.close();
  }
  connectionWindow = null;
}

// Health check function to verify server is ready
function checkServerHealth(port, maxRetries = 30, interval = 500, host = null) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    // Use 127.0.0.1 instead of localhost to force IPv4 (avoid IPv6 ::1 issues)
    const serverHost = host || (IS_CLIENT_MODE ? SERVER_IP : '127.0.0.1');
    let dialogShown = false;
    
    const check = () => {
      const url = `http://${serverHost}:${port}`;
      const req = http.get(url, (res) => {
        console.log(`Server on ${serverHost}:${port} is ready (status: ${res.statusCode})`);
        closeConnectionDialog();
        resolve(true);
      });
      
      req.on('error', (err) => {
        retries++;
        
        // Show dialog on first failure (retry 1)
        if (retries === 1 && IS_CLIENT_MODE && !dialogShown) {
          dialogShown = true;
          createConnectionDialog(serverHost, port);
          writeToLog('INFO', `Connection attempt failed, showing connection dialog for ${serverHost}:${port}`);
        }
        
        if (retries >= maxRetries) {
          const errorMsg = `Server on ${serverHost}:${port} failed to respond after ${maxRetries} retries`;
          console.error(errorMsg);
          writeToLog('ERROR', errorMsg, err);
          closeConnectionDialog();
          reject(new Error(errorMsg));
        } else {
          const statusMsg = `Attempting to connect... (${retries}/${maxRetries})`;
          console.log(`Waiting for server on ${serverHost}:${port}... (attempt ${retries}/${maxRetries})`);
          if (dialogShown) {
            updateConnectionDialog(statusMsg);
          }
          setTimeout(check, interval);
        }
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        retries++;
        
        // Show dialog on first failure
        if (retries === 1 && IS_CLIENT_MODE && !dialogShown) {
          dialogShown = true;
          createConnectionDialog(serverHost, port);
          writeToLog('INFO', `Connection timeout, showing connection dialog for ${serverHost}:${port}`);
        }
        
        if (retries >= maxRetries) {
          const errorMsg = `Server on ${serverHost}:${port} connection timeout`;
          writeToLog('ERROR', errorMsg);
          closeConnectionDialog();
          reject(new Error(errorMsg));
        } else {
          const statusMsg = `Connection timeout, retrying... (${retries}/${maxRetries})`;
          if (dialogShown) {
            updateConnectionDialog(statusMsg);
          }
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
      const errorMsg = `Frontend dist folder not found at: ${frontendPath}`;
      console.error(errorMsg);
      writeToLog('ERROR', errorMsg);
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
      writeToLog('ERROR', 'Frontend server error', err);
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
      const errorMsg = `Backend executable not found at: ${backendPath}`;
      console.error(errorMsg);
      writeToLog('ERROR', errorMsg);
      const logPath = getLogFilePath();
      dialog.showErrorBox(
        "Backend Error", 
        `Could not find backend executable at:\n${backendPath}\n\nPlease rebuild the application.\n\nCheck log file: ${logPath}`
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
        ASPNETCORE_URLS: `http://0.0.0.0:${BACKEND_PORT}`
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
      const errorMsg = data.toString();
      console.error(`Backend Error: ${errorMsg}`);
      writeToLog('ERROR', 'Backend Process Error', new Error(errorMsg));
    });

    backendProcess.on("close", (code) => {
      console.log(`Backend process exited with code ${code}`);
    });
    
    backendProcess.on("error", (err) => {
      console.error(`Failed to start backend: ${err}`);
      writeToLog('ERROR', 'Failed to start backend process', err);
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
    const errorMsg = `Failed to load page: ${errorCode} - ${errorDescription}`;
    console.error(errorMsg);
    writeToLog('ERROR', errorMsg);
    setTimeout(() => {
      console.log('Retrying page load...');
      if (mainWindow && !mainWindow.isDestroyed()) {
        let loadUrl;
        if (isDev) {
          loadUrl = "http://localhost:3000";
        } else {
          // Both server and client modes use local frontend server
          loadUrl = `http://127.0.0.1:${FRONTEND_PORT}`;
        }
        mainWindow.loadURL(loadUrl);
      }
    }, 1000);
  });

  // Determine URL based on mode
  let loadUrl;
  if (isDev) {
    loadUrl = "http://localhost:3000";
  } else {
    // Both server and client modes use local frontend server
    // Client mode serves bundled frontend locally, connects to remote backend
    loadUrl = `http://127.0.0.1:${FRONTEND_PORT}`;
  }
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
    // Initialize logging after app is ready
    initLogFile();
    writeToLog('INFO', `Application starting in ${APP_MODE.toUpperCase()} mode`);
    
    console.log(`App ready, mode: ${APP_MODE.toUpperCase()}...`);
    
    // Check for updates in production (after a short delay to not block startup)
    if (!isDev) {
      setTimeout(() => {
        console.log("Checking for updates...");
        // Wrap in try-catch to prevent unhandled rejections
        autoUpdater.checkForUpdates().catch((error) => {
          console.error("Error checking for updates (non-critical):", error);
          writeToLog('WARN', 'Update check failed (non-critical)', error);
          // Don't throw - this is non-critical and shouldn't block app startup
        });
      }, 5000); // Wait 5 seconds after app start
    }
    
    if (IS_CLIENT_MODE) {
      // Client mode: Start local frontend server, connect to remote backend
      console.log(`[CLIENT MODE] Starting local frontend, connecting to remote backend at ${SERVER_IP}...`);
      try {
        // Start local frontend server (serves bundled frontend files)
        if (!isDev) {
          console.log("Starting local frontend server...");
          await startFrontendServer();
          console.log("Checking local frontend server health...");
          await checkServerHealth(FRONTEND_PORT, 30, 500, '127.0.0.1');
          console.log("Local frontend server is ready");
        }
        
        // Check remote backend server health
        console.log("Checking remote backend server health...");
        await checkServerHealth(CLIENT_BACKEND_PORT, 30, 500, SERVER_IP);
        console.log("Remote backend server is ready");
        
        // Close dialog if connection succeeds
        closeConnectionDialog();
        writeToLog('INFO', `Successfully connected to remote backend at ${SERVER_IP}`);
      } catch (error) {
        // Dialog will be closed by checkServerHealth on failure
        writeToLog('ERROR', `Failed to connect to remote backend at ${SERVER_IP}`, error);
        throw error;
      }
    } else {
      // Server mode: Start local servers
      console.log("[SERVER MODE] Starting local servers...");
      if (!isDev) {
        console.log("Starting frontend server...");
        await startFrontendServer();
        console.log("Checking frontend server health...");
        await checkServerHealth(FRONTEND_PORT, 30, 500, '127.0.0.1');
      }
      console.log("Starting backend server...");
      await startBackend();
        console.log("Checking backend server health...");
        await checkServerHealth(BACKEND_PORT, 30, 500, '127.0.0.1');
    }
    
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
    writeToLog('ERROR', 'Application startup failed', error);
    const logPath = getLogFilePath();
    dialog.showErrorBox(
      "Startup Error",
      `Failed to start the application:\n${error.message}\n\nPlease check the log file for details:\n${logPath}`
    );
    app.quit();
  }
});

// Verify token validity
async function verifyToken(token) {
  try {
    const backendUrl = IS_CLIENT_MODE 
      ? `http://${SERVER_IP}:${CLIENT_BACKEND_PORT}/api/Auth/verify`
      : `http://127.0.0.1:${BACKEND_PORT}/api/Auth/verify`;
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.ok;
  } catch (error) {
    console.error('Token verification failed:', error);
    writeToLog('ERROR', 'Token verification failed', error);
    return false;
  }
}

// IPC handler for login
ipcMain.handle('login-attempt', async (event, { username, password, rememberMe }) => {
  console.log('Login attempt received:', { username, rememberMe });
  try {
    const backendUrl = IS_CLIENT_MODE 
      ? `http://${SERVER_IP}:${CLIENT_BACKEND_PORT}/api/Auth/login`
      : `http://127.0.0.1:${BACKEND_PORT}/api/Auth/login`;
    const response = await fetch(backendUrl, {
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
    writeToLog('ERROR', 'Login attempt failed', error);
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
  // Kill backend process (only in server mode)
  if (backendProcess && !IS_CLIENT_MODE) {
    console.log("Killing backend process...");
    backendProcess.kill();
  }
  
  // Close frontend server (both server and client modes use local frontend)
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
  // Ensure backend is terminated (only in server mode)
  if (backendProcess && !IS_CLIENT_MODE) {
    backendProcess.kill();
  }
  
  // Ensure frontend server is closed (both server and client modes use local frontend)
  if (frontendServer) {
    frontendServer.close();
  }
  
  // Close connection dialog if open
  closeConnectionDialog();
  
  // Close log file stream
  if (logFileStream) {
    const shutdownMsg = `[${new Date().toISOString()}] Application Shutting Down\n${'='.repeat(80)}\n\n`;
    logFileStream.write(shutdownMsg);
    logFileStream.end();
    logFileStream = null;
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
  writeToLog('WARN', 'Auto-updater error (non-critical)', err);
  // Don't show error to user for network issues - updates are optional
  // Only log it for debugging purposes
  if (mainWindow && err.code !== 'ERR_NAME_NOT_RESOLVED' && err.code !== 'ENOTFOUND') {
    // Only show non-network errors to user
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
    writeToLog('ERROR', 'Error checking for updates', error);
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
    writeToLog('ERROR', 'Error downloading update', error);
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
    writeToLog('ERROR', 'Error installing update', error);
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

// IPC handler to get server configuration
ipcMain.handle("get-server-config", async () => {
  if (IS_CLIENT_MODE) {
    return {
      serverIP: SERVER_IP,
      frontendPort: FRONTEND_PORT, // Client always uses local frontend
      backendPort: CLIENT_BACKEND_PORT,
      mode: 'client'
    };
  } else {
    return {
      serverIP: '127.0.0.1',
      frontendPort: FRONTEND_PORT,
      backendPort: BACKEND_PORT,
      mode: 'server'
    };
  }
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
    writeToLog('ERROR', 'Excel export error', error);
    event.reply("export-error", error.message);
  }
});