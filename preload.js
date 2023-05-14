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
    prismLauncherExists: ipcRenderer.invoke('prismLauncherExists'),
    prismLauncherRunning: ipcRenderer.invoke('prismLauncherRunning'),
    prismRunningWarning: () => {
        ipcRenderer.invoke('prismRunningWarning');
        // close the app
        ipcRenderer.invoke('close');
    }
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