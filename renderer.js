const dialogConfig = {
	title: `Select your Prism Launcher directory (usually ${electron.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher)`,
	buttonLabel: 'Yep this is the one, choose this one',
	properties: ['openDirectory'],
};

let chooseFolder = document.getElementById('chooseFolder');
let folderChosen = document.getElementById('folderChosen');
let info = document.getElementById('info');

let modpackSelector = document.getElementById('modpackSelector');
let modpackVersionSelector = document.getElementById('modpackVersionSelector');
let downloadBtn = document.getElementById('downloadBtn');

let overlayModal = document.querySelector('[data-modal]');

window.onload = function () {
	modpackSelector.disabled = true;
	modpackVersionSelector.disabled = true;
	downloadBtn.classList.add('disabled');

	// make overlayModal unclosable
	overlayModal.addEventListener('cancel', function (event) {
		event.preventDefault();
	});

	main();
};

function main() {
	chooseFolder.addEventListener('click', function () {
		electron.openDialog('showOpenDialog', dialogConfig).then((result) => {
			console.log(result);
			if (result.canceled) return;
			electron.checkPathForInstances(result.filePaths[0]).then((valid) => {
				if (valid) {
					info.innerHTML = 'Valid Prism Launcher directory selected!';
					info.style.color = 'green';
					modpackSelector.disabled = false;
				} else {
					info.innerHTML =
						'Invalid Prism Launcher directory selected! (Does not contain a "instances" folder)';
					info.style.color = 'red';
					modpackSelector.disabled = true;
					modpackVersionSelector.disabled = true;
					downloadBtn.classList.add('disabled');
				}
			});
			folderChosen.innerHTML = result.filePaths[0];
		});
	});

	document.getElementById('checkForUpdatesBtn').addEventListener('click', function () {
		electron.checkForUpdates();
	});

	electron.prismLauncherExists.then((exists) => {
		if (exists) {
			folderChosen.innerHTML = `${electron.env.USERPROFILE}\\AppData\\Roaming\\PrismLauncher`;
			chooseFolder.disabled = true;
			info.innerHTML = 'Prism Launcher automatically detected!';
			info.style.color = 'green';
			modpackSelector.disabled = false;
		}
	});

	// fill modpackSelector select with options
	fetch('https://api.gangnamstyle.dev/geronimo/downloads/modpacks').then(
		(response) => {
			response.json().then((data) => {
				data.forEach((modpack) => {
					let option = document.createElement('option');
					option.value = modpack;
					option.innerHTML = modpack;
					modpackSelector.appendChild(option);
				});
			});
		},
	);

	//! MODPACK SELECTOR
	modpackSelector.addEventListener('change', function () {
		document.getElementById('infoButton').classList.add('disabled');
		downloadBtn.classList.add('disabled');
		instanceInfo.innerHTML = '>';

		modpackVersionSelector.innerHTML =
			'<option hidden disabled selected value> -- select a version -- </option>';
		fetch(
			`https://api.gangnamstyle.dev/geronimo/downloads/modpacks/${modpackSelector.value}`,
		).then((response) => {
			response.json().then((data) => {
				data
					.sort((a, b) =>
						b.version.localeCompare(a.version, undefined, {
							numeric: true,
							sensitivity: 'base',
						}),
					)
					.forEach((modpack) => {
						let option = document.createElement('option');
						option.value = modpack.version;
						option.innerHTML = modpack.version;
						modpackVersionSelector.appendChild(option);
					});
			});
		});
		modpackVersionSelector.disabled = false;
	});

	//! VERSION SELECTOR
	modpackVersionSelector.addEventListener('change', function () {
		let instanceInfo = document.getElementById('instanceInfo');

		fetch(
			`https://api.gangnamstyle.dev/geronimo/downloads/modpacks/${modpackSelector.value}/${modpackVersionSelector.value}`,
		).then((response) => {
			response.json().then((data) => {
				electron.checkInstancesForModpack(data.modpack).then((exists) => {
					if (exists) {
						instanceInfo.innerHTML = `"${data.modpack}" found! Ready to update?`;
						instanceInfo.style.color = 'green';
					} else {
						instanceInfo.innerHTML = `"${data.modpack}" not found! Ready to download?`;
						instanceInfo.style.color = 'red';
					}
					downloadBtn.classList.remove('disabled');

					downloadBtn.addEventListener('click', function () {
						overlayModal.showModal();
						electron.downloadModpack(
							modpackSelector.value,
							modpackVersionSelector.value,
							exists,
						);
					});
				});
			});
		});
	});
}
