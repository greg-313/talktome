const { app, BrowserWindow, ipcMain, globalShortcut, clipboard } = require('electron');
const { join } = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
      webSecurity: true, // Enable web security for speech recognition
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1f2937',
    show: true,
    autoHideMenuBar: true,
    alwaysOnTop: true, // Keep window on top for easy access
    skipTaskbar: false,
    frame: true,
    resizable: true,
    minimizable: true,
  });

  // Load the app - always try dev server first, fallback to production
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    // Wait a bit for dev server to be ready, then load
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:5173').catch((err) => {
        console.log('Dev server not ready, trying production build...', err);
        mainWindow.loadFile(join(__dirname, '../dist/index.html'));
      });
    }, 1000);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus(); // Bring to front
    mainWindow.moveTop(); // Move to top of z-order
  });
  
  // Show window immediately when it loads
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.moveTop();
  });
  
  // Show window if it fails to load
  mainWindow.webContents.on('did-fail-load', () => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.moveTop();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Register global shortcut to toggle window (Cmd/Ctrl + Shift + T)
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC handlers
ipcMain.handle('type-text', async (event, text) => {
  try {
    // Copy text to clipboard first
    clipboard.writeText(text);
    
    // Small delay to ensure clipboard is ready
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const { exec } = require('child_process');
    
    // Platform-specific paste commands
    if (process.platform === 'darwin') {
      // macOS: Use AppleScript to simulate Cmd+V
      return new Promise((resolve) => {
        exec('osascript -e \'tell application "System Events" to keystroke "v" using command down\'', (error) => {
          if (error) {
            console.error('Error pasting:', error);
            resolve({ success: false, error: error.message });
          } else {
            resolve({ success: true });
          }
        });
      });
    } else if (process.platform === 'win32') {
      // Windows: Use PowerShell to simulate Ctrl+V
      return new Promise((resolve) => {
        exec('powershell -command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys(\'^v\')"', (error) => {
          if (error) {
            console.error('Error pasting:', error);
            resolve({ success: false, error: error.message });
          } else {
            resolve({ success: true });
          }
        });
      });
    } else {
      // Linux: Use xdotool if available, otherwise xclip + xvkbd
      return new Promise((resolve) => {
        // Try xdotool first (most common)
        exec('which xdotool', (whichError) => {
          if (!whichError) {
            exec('xdotool key ctrl+v', (error) => {
              if (error) {
                console.error('Error pasting with xdotool:', error);
                resolve({ success: false, error: error.message });
              } else {
                resolve({ success: true });
              }
            });
          } else {
            // Fallback: just copy to clipboard
            resolve({ success: true, note: 'Text copied to clipboard. Please paste manually (Ctrl+V). Install xdotool for automatic pasting.' });
          }
        });
      });
    }
  } catch (error) {
    console.error('Error typing text:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('copy-to-clipboard', async (event, text) => {
  try {
    clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-clipboard', async () => {
  try {
    const text = clipboard.readText();
    return { success: true, text };
  } catch (error) {
    console.error('Error getting clipboard:', error);
    return { success: false, error: error.message };
  }
});

