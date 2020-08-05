const {app, BrowserWindow, ipcMain, dialog, Menu} = require('electron');
const url = require('url');
const path = require('path');
const appPath = app.getAppPath();
const fs = require('fs');

const commonModule = require(__dirname+'/src/modules/commonModule.js');

var win;
var dialogWindow;
var paramsMain;
var version;

// Menu
const menuTemplate = [{
    label: 'File',
    submenu: [{role: 'close',label: 'Exit'}]
    },
    {
       label: 'Edit',
       submenu: [{role: 'copy'},{role: 'paste'}]
    },
    {
       label: 'View',
       submenu: [{role: 'reload'},{type: 'separator'},{role: 'togglefullscreen'},{role: 'toggledevtools'}]
    },
    {
       role: 'window',
       submenu: [{role: 'minimize'}]
    },
    {
       role: 'help',
       submenu: [{label: 'About Simple Inventory',
                click: ()=>{
                    showAboutDialog();
                }}]
    }
];  
 
const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);

app.on('ready', ()=>{
    // Load version
    try {
        version = fs.readFileSync('./src/misc/version');
    } catch(e) {
        console.log('Version file corrupted! Exiting...')
        app.quit();
    }

    // Load userSettings
    let userSettings;
    try {
        userSettings = fs.readFileSync('./src/misc/userSettings');
        userSettings = JSON.parse(userSettings);
    } catch(e) {
        userSettings = {
                            sessionURL: 'http://localhost/',
                            db: '',
                            fontSize: 14
                        };
        // Write this usersettings to file
        fs.writeFileSync('./src/misc/userSettings', JSON.stringify(userSettings));
    }
    userSettings.version = version;
    global.sharedObject = userSettings;

    win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.loadFile(appPath+'/src/html/login.html');

    win.webContents.on('crashed', (e) => {
        console.log(e);
    });

    // win.webContents.openDevTools();
});

// MacOS - app will stay open unless Cmd+Q
app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') {
        app.quit();
    }
});

// MacOS - Dock icon clicked and no windows opened
app.on('activate', ()=>{
    if(BrowserWindow.getAllWinows().length === 0) {
        createWindow();
    }
});

ipcMain.on('redirect-window', (event, fileName, params)=>{
    paramsMain = params;
    win.loadURL(`file://${__dirname}/src/html/${fileName}`);
});

ipcMain.on('variable-request', function (event, arg) {
    event.sender.send('variable-reply', paramsMain);
});

ipcMain.on('open-new-window', (event, fileName, params, width, height) => {
    if(!dialogWindow) {
        dialogWindow = new BrowserWindow({
            width:800, 
            height:600, 
            webPreferences: {
                nodeIntegration:true,
                additionalArguments: params
            }
        });
        dialogWindow.setMenuBarVisibility(false);
    }
    try {
        dialogWindow.loadURL(`file://${__dirname}/src/html/${fileName}`);
    } catch(e) {
        dialogWindow = new BrowserWindow({
            width:800, 
            height:600, 
            webPreferences: {
                nodeIntegration:true,
                additionalArguments: params
            }
        });
        dialogWindow.setMenuBarVisibility(false);
        dialogWindow.loadURL(`file://${__dirname}/src/html/${fileName}`);
    }
    dialogWindow.setAlwaysOnTop(false);

    dialogWindow.on('close', ()=>{
        win.reload();
    })
});

ipcMain.on('error-in-window', function(event, data) {
    console.log(data);
});

function showAboutDialog() {
    const aboutDialog = new BrowserWindow({
        width: 600,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });
    aboutDialog.loadURL(`file://${__dirname}/src/html/aboutDialog.html`);
    aboutDialog.setMenuBarVisibility(false);
}