const { contextBridge, ipcRenderer } = require("electron");

// Minimal, explicitly allow-listed bridge. The renderer never gets Node access.
contextBridge.exposeInMainWorld("auditDesktop", {
  isElectron: true,
  openCsv: () => ipcRenderer.invoke("audit:open-csv"),
  saveReport: (fileName, content) => ipcRenderer.invoke("audit:save-report", fileName, content),
});
