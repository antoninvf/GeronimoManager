# Geronimo Manager

Updater and Manager for modpacks made by Flowyan or Chutoy, for Family Man members.

### Flow of the app:
First the app makes sure that Prism Launcher isn't running. If it is, it will show a warning and close the app.

1. Choose directory of Prism Launcher / Auto picks the default one if it exists
2. Choose a modpack from a list (gotten from GeronimoUpdater API) what to update
3. Choose a version from a list for that specific modpack
4. Check if the pack is in the instances directory
5. User clicks the Download or "Geronimo!" button and the app starts doing stuff
6. Download the version and place it into instances
7. Take files from old version (options.txt, servers.dat etc.) and copy them to the new one
8. Done!

### Disclaimer: I am not responsible if this deletes your files or damages your pc!
![silly](https://raw.githubusercontent.com/antoninvf/GeronimoManager/master/resources/img/silly.gif)

Also this is my first time using Electron.
