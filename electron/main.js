const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const ExcelJS = require("exceljs");
const path = require("path");
const { spawn } = require("child_process");
const isDev = require("electron-is-dev");
const http = require("http");
const fs = require("fs");
const url = require("url");

let mainWindow;
let loginWindow;
let backendProcess = null;
let frontendServer = null;
const FRONTEND_PORT = 8080;
const BACKEND_PORT = 5184;

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
      console.log(`Frontend server running on http://localhost:${FRONTEND_PORT}`);
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
        ASPNETCORE_URLS: `http://localhost:${BACKEND_PORT}`
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

  if(isDev){
    mainWindow.removeMenu();
  }

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
    console.log("App ready, starting servers...");
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
    console.log("All servers ready, creating login window...");
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
// IPC handler for login
ipcMain.handle('login-attempt', async (event, { username, password }) => {
  const response = await fetch(`http://localhost:${BACKEND_PORT}/api/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (username && password && response.ok) {

    if (loginWindow) {
      loginWindow.close();
    }
    createMainWindow();
    return { success: true };
  } else {
    return { success: false, message: 'Username and password are required.' };
  }
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