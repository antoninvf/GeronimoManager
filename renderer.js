const dialogConfig = {
    title: `Select your Prism Launcher directory (usually ${electron.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher)`,
    buttonLabel: 'Yep this is the one, choose this one',
    properties: ['openDirectory']
};

let chooseFolder = document.getElementById('chooseFolder');
let folderChosen = document.getElementById('folderChosen');
let info = document.getElementById('info');

chooseFolder.addEventListener('click', function () {
    electron.openDialog('showOpenDialog', dialogConfig)
        .then(result => {
            console.log(result);
            folderChosen.innerHTML = result.filePaths[0];
        });
});

electron.prismLauncherExists.then(exists => {
    if (exists) {
        folderChosen.innerHTML = `${electron.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher`;
        chooseFolder.disabled = true;
        info.innerHTML = 'Prism Launcher automatically detected!'
        info.style.color = 'green';
    }
});

electron.prismLauncherRunning.then(running => {
    if (running) {
        console.log('Prism Launcher is running!');
        electron.prismRunningWarning();
    } else {
        console.log('Prism Launcher is not running :)');
    }
});