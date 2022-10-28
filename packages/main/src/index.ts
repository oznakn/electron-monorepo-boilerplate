import { app, BrowserWindow, nativeTheme } from 'electron';
import path from 'path';

import 'keytar';
import 'sharp';

let isAppReady = false;
let mainWindow: BrowserWindow | null = null;

function createWindow () {
    if (isAppReady) {
        if (!mainWindow) {
            mainWindow = new BrowserWindow({
                width: 800,
                height: 600,
                webPreferences: {
                    preload: path.join(__dirname, 'preload.js'),
                    webSecurity: true,
                    contextIsolation: true,
                    nodeIntegration: false,
                    nodeIntegrationInWorker: false,
                },
            });

            mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
        } else {
            mainWindow.show();

            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }

            mainWindow.focus();
        }
    }
}

nativeTheme.themeSource = 'light';

app.on('activate', () => {
    createWindow();
});

app.on('second-instance', async () => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', async () => {
    console.log('Closing...');
});

app.whenReady().then(() => {
    isAppReady = true;

    createWindow();
});
