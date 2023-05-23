const path = require('path');

const { app, BrowserWindow, ipcMain, dialog } = require('electron');

const decompress = require('decompress');
const https = require('https');

// list of folders/files to move over
const keepList = [
	'journeymap',
	'options.txt',
	'optionsof.txt',
	'servers.dat',
	'screenshots',
	'saves',
	'resourcepacks',
	'shaderpacks',
];

const fs = require('fs-extra');
const find = require('find-process');

const createWindow = () => {
	const win = new BrowserWindow({
		width: 940,
		height: 720,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
		},
		resizable: false,
	});

	win.removeMenu();
	win.loadFile('pages/index.html');

	// Open the DevTools.
	//win.webContents.openDevTools();
};

app.whenReady().then(async () => {
	createWindow();

	//? See if prism launcher is running
	find('name', 'prismlauncher.exe', true)
		.then((list) => list.length > 0)
		.then((exists) => {
			if (exists) {
				var d = dialog.showMessageBoxSync({
					type: 'warning',
					title: 'Prism Launcher detected!',
					message:
						'Prism Launcher is running! Please close it and run Geronimo again.',
					buttons: ['Exit'],
				});
				app.quit();
			}
		});

	//? See if minecraft is running (but not force close it, could be something else)
	find('name', 'javaw.exe', true)
		.then((list) => list.length > 0)
		.then((exists) => {
			if (exists) {
				var d = dialog.showMessageBoxSync({
					type: 'warning',
					title: 'Minecraft (javaw.exe) detected!',
					message:
						'Minecraft is possibly running! Please consider closing it before continuing.',
					buttons: ['Continue'],
				});
			}
		});

	// Check if API is online
	fetch('https://api.gangnamstyle.dev/geronimo/downloads/modpacks').then(
		(response) => {
			if (response.status !== 200) {
				var d = dialog.showMessageBoxSync({
					type: 'warning',
					title: 'api.gangnamstyle.dev is offline!',
					message: `The API is currently offline. Please try again later.`,
					buttons: ['Exit'],
				});
				app.quit();
			}
		},
	);

	const prismLauncherExists = fs.existsSync(
		`${process.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher`,
	);

	ipcMain.handle('prismLauncherExists', (event) => {
		return prismLauncherExists;
	});

	// check if the path contains folder "instances"
	ipcMain.handle('checkPathForInstances', (event, path) => {
		return fs.existsSync(`${path}\\instances`);
	});

	// check "instances" folder for param
	ipcMain.handle('checkInstancesForModpack', (event, param) => {
		return fs.existsSync(
			`${process.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher\\instances\\geronimo_${param}`,
		);
	});

	function instgroupsJsonAddModpack(param) {
		let instGroupsJson = fs.readJsonSync(
			`${process.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher\\instances\\instgroups.json`,
		);

		// Check if Geronimo group is already in the instgroups.json, if not create it
		if (!instGroupsJson.groups.hasOwnProperty('Geronimo')) {
			instGroupsJson.groups.Geronimo = {
				hidden: false,
				instances: [],
			};
		}

		// Check if modpack is already in the Geronimo group, if so don't add it

		if (
			!instGroupsJson.groups.Geronimo.instances.includes(`geronimo_${param}`)
		) {
			instGroupsJson.groups.Geronimo.instances =
				instGroupsJson.groups.Geronimo.instances.concat(`geronimo_${param}`);
		}

		// Set hidden to false
		instGroupsJson.groups.Geronimo.hidden = false;

		// Write the new instgroups.json
		fs.writeJsonSync(
			`${process.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher\\instances\\instgroups.json`,
			instGroupsJson,
		);
	}

	ipcMain.handle('downloadModpack', (event, modpack, version, exists) => {
		// Download modpack
		fetch(
			`https://api.gangnamstyle.dev/geronimo/downloads/modpacks/${modpack}/${version}`,
		)
			.then((response) => response.json())
			.then((data) => {
				const win = BrowserWindow.getFocusedWindow();

				win.webContents.executeJavaScript(
					`document.getElementById('progressMessages').innerHTML += '> GeronimoManager v${app.getVersion()}<br>';`,
				);

				win.setClosable(false);
				win.setProgressBar(0.1);
				// Rename current instance folder
				if (exists) {
					fs.renameSync(
						`${process.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher\\instances\\geronimo_${modpack}`,
						`${process.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher\\instances\\geronimo_${modpack}_old`,
					);
					win.webContents.executeJavaScript(
						`document.getElementById('progressMessages').innerHTML += '> Renamed folder<br>';`,
					);
				}

				// Create folder for instance
				fs.mkdirSync(
					`${process.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher\\instances\\geronimo_${modpack}`,
				);
				win.webContents.executeJavaScript(
					`document.getElementById('progressMessages').innerHTML += '> Created folder fow new version<br>';`,
				);

				// Download modpack zip
				const filename = `${process.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher\\instances\\geronimo_${modpack}\\geronimo_${modpack}.zip`;

				win.webContents.executeJavaScript(
					`document.getElementById('progressMessages').innerHTML += '> Started downloading ${modpack} ${version}<br>';`,
				);
				https.get(data.downloadLink, (res) => {
					win.setProgressBar(0.3);
					const fileStream = fs.createWriteStream(filename);
					res.pipe(fileStream);

					fileStream.on('finish', () => {
						fileStream.close();

						win.webContents.executeJavaScript(
							`document.getElementById('progressMessages').innerHTML += '> Downloading finished<br>';`,
						);
						win.setProgressBar(0.5);

						// Extract modpack zip
						win.webContents.executeJavaScript(
							`document.getElementById('progressMessages').innerHTML += '> Started extracting zip file<br>';`,
						);
						decompress(
							filename,
							`${process.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher\\instances\\geronimo_${modpack}`,
						)
							.then((files) => {
								win.setProgressBar(0.8);
								win.webContents.executeJavaScript(
									`document.getElementById('progressMessages').innerHTML += '> Extraction finished<br>';`,
								);

								// Delete zip
								fs.removeSync(filename);
								win.webContents.executeJavaScript(
									`document.getElementById('progressMessages').innerHTML += '> Zip deleted<br>';`,
								);

								// Move files over
								if (exists) {
									keepList.forEach((file) => {
										if (
											fs.existsSync(
												`${process.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher\\instances\\geronimo_${modpack}_old\\.minecraft\\${file}`,
											)
										) {
											fs.copySync(
												`${process.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher\\instances\\geronimo_${modpack}_old\\.minecraft\\${file}`,
												`${process.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher\\instances\\geronimo_${modpack}\\.minecraft\\${file}`,
											);
										}
									});
									win.webContents.executeJavaScript(
										`document.getElementById('progressMessages').innerHTML += '> Moved files over from the old version<br>';`,
									);
								}

								// Delete old instance folder
								if (exists) {
									fs.removeSync(
										`${process.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher\\instances\\geronimo_${modpack}_old`,
									);
									win.webContents.executeJavaScript(
										`document.getElementById('progressMessages').innerHTML += '> Deleted old instance folder<br>';`,
									);
								}

								// Add modpack to instgroups.json
								instgroupsJsonAddModpack(modpack);
								win.webContents.executeJavaScript(
									`document.getElementById('progressMessages').innerHTML += '> Added modpack to Geronimo group<br>';`,
								);

								win.webContents.executeJavaScript(
									`document.getElementById('progressMessages').innerHTML += '> And we are live<br>';`,
								);
								win.setClosable(true);
								win.setFocusable(false);
								win.setProgressBar(1);
							})
							.then(() => {
								// Show message box
								dialog.showMessageBoxSync({
									type: 'info',
									title: 'Modpack installed!',
									message: `The modpack ${modpack} ${version} has been installed successfully!`,
									buttons: ['Close'],
								});
								app.quit();
							});
					});
				});
			});
	});

	ipcMain.handle('checkForUpdates', (event) => {
		//? Check for updates (so cool) ((god damn it i got rate limited))
		fetch(
			'https://api.github.com/repos/antoninvf/GeronimoManager/releases/latest',
			(headers = {
				'User-Agent': 'GeronimoManager',
			}),
		)
			.then((response) => {
				return response.json();
			})
			.then((data) => {
				if (data.tag_name !== app.getVersion()) {
					var d = dialog.showMessageBoxSync({
						type: 'warning',
						title: 'New update available!',
						message: `You are currently running an outdated build of GeronimoUpdater.\n\nYour version: ${app.getVersion()}\nLatest version: ${
							data.tag_name
						}\n\nPlease download the latest version!`,
						buttons: ['Latest Version'],
					});
					if (d === 0) {
						require('electron').shell.openExternal(
							'https://github.com/antoninvf/GeronimoUpdater/releases/latest',
						);
						app.quit();
					}
				} else if (data.tag_name === 'undefined') {
					dialog.showMessageBoxSync({
						type: 'info',
						title: 'You are ratelimited!',
						message: `You are most likely ratelimited from the GitHub API, please try again\n\n${data.message}`,
						buttons: ['Close'],
					});
				} else {
					dialog.showMessageBoxSync({
						type: 'info',
						title: 'No updates available!',
						message: `You are running the latest version of GeronimoUpdater.\n\nYour version: ${app.getVersion()}\nLatest version: ${
							data.tag_name
						}`,
						buttons: ['Close'],
					});
				}
			});
	});

	// show message box
	ipcMain.handle('messageBox', (event, options) => {
		return dialog.showMessageBoxSync(options);
	});

	// close the app
	ipcMain.handle('close', (event) => {
		app.quit();
	});

	ipcMain.handle('dialog', (event, method, params) => {
		return dialog[method](params);
	});

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
