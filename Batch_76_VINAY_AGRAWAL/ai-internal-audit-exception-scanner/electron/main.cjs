const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

const APP_URL = process.env.AUDIT_APP_URL || "";
const isDev = !app.isPackaged;

function resolveIndexHtml() {
  return path.join(__dirname, "..", "dist", "client", "index.html");
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: "AI Internal Audit Exception Scanner",
    backgroundColor: "#F5F7FA",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (APP_URL) {
    await win.loadURL(APP_URL);
  } else if (isDev) {
    await win.loadURL("http://localhost:8080");
  } else {
    await win.loadFile(resolveIndexHtml());
  }
}

ipcMain.handle("audit:open-csv", async () => {
  const result = await dialog.showOpenDialog({
    title: "Select ledger CSV",
    filters: [{ name: "CSV", extensions: ["csv"] }],
    properties: ["openFile"],
  });
  if (result.canceled || result.filePaths.length === 0) return { canceled: true };
  const filePath = result.filePaths[0];
  const content = await fs.readFile(filePath, "utf8");
  return { canceled: false, name: path.basename(filePath), content };
});

ipcMain.handle("audit:save-report", async (_event, fileName, content) => {
  const result = await dialog.showSaveDialog({
    title: "Save exception report",
    defaultPath: fileName,
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  await fs.writeFile(result.filePath, content, "utf8");
  return { canceled: false, path: result.filePath };
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
