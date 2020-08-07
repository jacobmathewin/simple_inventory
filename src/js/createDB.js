const fs = require('fs');
const appPath = require('electron').remote.app.getAppPath();

const path = require('path');
const ipcRenderer = require('electron').ipcRenderer;
const dialog = require('electron').remote.dialog;
const commonModule = require(path.join(appPath, 'src', 'modules', 'commonModule.js'));

$(document).ready(()=>{

    // Load side menu
    commonModule.loadSideMenu('createDB.html', (err, html)=>{
        $('#menuHolder').html(html);
    });
});

window.onerror = function(error, url, line) {
    console.log(error);
};

function selectDBFolder() {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }).then(result => {
        if(!result.canceled)
            $('#dbFolder').val(result.filePaths[0]);
    }).catch(err => {
        console.log(err)
    })
}

function createDB() {
    let dbFolder = commonModule.getValidValue('dbFolder');
    let dbName = commonModule.getValidValue('dbName');

    // dbFolder/dbName will be created or overwritten by default.
    fs.copyFile(path.join(appPath, 'src', 'db', 'skeleton.db'), path.join(dbFolder, dbName), (err) => {
        if (err) {
            console.log(err);
            alert(err);
        } else {
            console.log('Successfully copied database');
            // Set DB
            require('electron').remote.getGlobal('sharedObject').db = path.join(dbFolder,dbName);
            let userSettings = require('electron').remote.getGlobal('sharedObject');
            fs.writeFileSync(path.join(appPath, 'src', 'misc', 'userSettings'), JSON.stringify(userSettings));

            alert('Successfully created new Database!\nPlease sign in for first time with admin / pass@1234');
            ipcRenderer.send('redirect-window', 'logout.html', []);
        }
    });
}