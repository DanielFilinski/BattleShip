const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { createServer } = require('http');
const { createRequire } = require('module');

const PORT = 3100;
let mainWindow;
let server;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Battleship Quiz',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    // Убрать стандартное меню
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  // Внешние ссылки открывать в браузере, не в Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startExpressServer() {
  // Динамический импорт ESM server.js
  const serverPath = path.join(__dirname, '..', 'server.js');
  const serverUrl = 'file://' + serverPath.replace(/\\/g, '/');

  try {
    const { startServer } = await import(serverUrl);
    server = await startServer(PORT);
    console.log(`Express server started on port ${PORT}`);
  } catch (err) {
    console.error('Failed to start Express server:', err);
    app.quit();
  }
}

app.whenReady().then(async () => {
  await startExpressServer();

  // Небольшая задержка чтобы сервер успел подняться
  setTimeout(() => {
    createWindow();
  }, 500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (server) {
    server.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
