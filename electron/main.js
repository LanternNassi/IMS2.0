const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const ExcelJS = require("exceljs");
const path = require("path");

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, // Enable Node.js integration
    },
  });

  mainWindow.loadURL('http://localhost:3000'); // URL of the Next.js app
});

ipcMain.on("export-excel", async (event, jsonData , fileName) => {
  const { filePath } = await dialog.showSaveDialog({
      title: `Save ${fileName}`,
      defaultPath: path.join(__dirname, `${fileName}.xlsx`),
      filters: [{ name: "Excel Files", extensions: ["xlsx"] }]
  });

  if (!filePath) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("data");

  // Add headers dynamically
  worksheet.columns = Object.keys(jsonData[0]).map(key => ({
      header: key.toUpperCase(),
      key: key,
      width: 20
  }));

  // Add data rows
  jsonData.forEach(item => worksheet.addRow(item));

  await workbook.xlsx.writeFile(filePath);

  // Notify frontend
  event.reply("export-done", "Excel file saved successfully!");
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
