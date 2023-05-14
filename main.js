const path = require('path')

const {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    contextBridge
} = require('electron')

const fs = require('fs-extra');
const find = require('find-process');

const createWindow = () => {
    const win = new BrowserWindow({
        width: 940,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        resizable: false
    })

    win.removeMenu()
    win.loadFile('pages/index.html')

    // Open the DevTools.
    win.webContents.openDevTools()
}

app.whenReady().then(() => {
    createWindow()

    const prismLauncherExists = fs.existsSync(`${process.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher`);

    ipcMain.handle('prismLauncherExists', (event) => {
        return prismLauncherExists;
    });

    ipcMain.handle('prismLauncherRunning', (event) => {
        return find('name', 'prismlauncher.exe', true).then(list => {
            return list.length > 0;
        });
    });

    // warning message box popup
    ipcMain.handle('prismRunningWarning', (event, message) => {
        dialog.showMessageBoxSync({
            type: 'warning',
            title: 'Warning',
            message: 'Prism Launcher is running! Please close it before continuing.',
            buttons: ['Exit']
        });
    });

    // close the app
    ipcMain.handle('close', (event) => {
        app.quit();
    });

    ipcMain.handle('dialog', (event, method, params) => {
        return dialog[method](params);
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})