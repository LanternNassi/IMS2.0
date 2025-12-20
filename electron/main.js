const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const ExcelJS = require("exceljs");
const path = require("path");
const { spawn } = require("child_process");
const isDev = require("electron-is-dev");
const http = require("http");
const fs = require("fs");
const url = require("url");

let mainWindow;
let backendProcess = null;
let frontendServer = null;
const FRONTEND_PORT = 8080;

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

// Start local HTTP server for frontend in production
function startFrontendServer() {
  if (isDev) return; // Not needed in development
  
  const frontendPath = path.join(__dirname, "..", "dist", "frontend");
  
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
  
  frontendServer.listen(FRONTEND_PORT, () => {
    console.log(`Frontend server running on http://localhost:${FRONTEND_PORT}`);
  });
}

// Start the .NET backend server
function startBackend() {
  const backendPath = isDev
    ? path.join(__dirname, "..", "backend", "ImsServer", "bin", "Debug", "net7.0", "ImsServer.exe")
    : path.join(process.resourcesPath, "backend", "ImsServer.exe");

  console.log("Starting backend from:", backendPath);
  console.log("Backend exists:", fs.existsSync(backendPath));

  if (fs.existsSync(backendPath)) {
    const backendDir = path.dirname(backendPath);
    console.log("Backend directory:", backendDir);
    
    backendProcess = spawn(backendPath, [], {
      cwd: backendDir,
      env: { 
        ...process.env, 
        ASPNETCORE_ENVIRONMENT: "Production",
        ASPNETCORE_URLS: "http://localhost:5184"
      }
    });

    backendProcess.stdout.on("data", (data) => {
      console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on("data", (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on("close", (code) => {
      console.log(`Backend process exited with code ${code}`);
    });
    
    backendProcess.on("error", (err) => {
      console.error(`Failed to start backend: ${err}`);
    });
  } else {
    console.error("Backend executable not found at:", backendPath);
    dialog.showErrorBox(
      "Backend Error", 
      `Could not find backend executable at:\n${backendPath}\n\nPlease rebuild the application.`
    );
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "icon.ico"),
  });

  mainWindow.removeMenu();

  // Load the app
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    // Use local HTTP server for proper routing
    mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
  }

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  startFrontendServer(); // Start frontend server first in production
  startBackend();
  
  // Wait for servers to start
  setTimeout(() => {
    createWindow();
  }, isDev ? 2000 : 3000);
});

app.on("window-all-closed", () => {
  // Kill backend process
  if (backendProcess) {
    backendProcess.kill();
  }
  
  // Close frontend server
  if (frontendServer) {
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
