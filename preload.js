const {
    contextBridge,
    ipcRenderer
} = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Expose openDialog with a returning promise
    openDialog: (method, params) => {
        return ipcRenderer.invoke('dialog', method, params);
    },
    env: process.env,
    checkPathForInstances: (path) => ipcRenderer.invoke('checkPathForInstances', path),
    checkInstancesForModpack: (param) => ipcRenderer.invoke('checkInstancesForModpack', param),
    checkForUpdates: () => ipcRenderer.invoke('checkForUpdates'),
    prismLauncherExists: ipcRenderer.invoke('prismLauncherExists'),
    downloadModpack: (modpack, version, exists) => ipcRenderer.invoke('downloadModpack', modpack, version, exists),
    messageBox: (options) => ipcRenderer.invoke('messageBox', options),
    close: () => ipcRenderer.invoke('close'),
});

// Send versions over
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})