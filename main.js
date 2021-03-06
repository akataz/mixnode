const electron = require('electron');
const {ipcMain} = require('electron');
const path = require('path');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow = null;
let urlToLoad = '';

switch (process.env.NODE_ENV) {
    case 'prod':
        urlToLoad = path.join('file://', __dirname, '/build/index.html');
        break;
    default:
        urlToLoad = 'http://localhost:9090';
}

function createWindow () {
    mainWindow = new BrowserWindow(
        {
            width: 1280, height: 720
        }
    );

    mainWindow.loadURL(urlToLoad);

    mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.on('user-auth', () => {
    const clientId = require('./.config.json').client_id || '';
    let userAuth = new BrowserWindow({
        width: 500,
        height: 720,
        webPreferences: {
            webSecurity: false,
            nodeIntegration: false
        }
    });

    const redirectUrl = 'file://' + path.resolve(__dirname, 'callback.html');

    userAuth.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
        if (newUrl.split('code=')[1]) {
            mainWindow.webContents.send('user-log-in', newUrl.split('code=')[1]);
            userAuth.close();
        }
    });

    userAuth.loadURL('https://www.mixcloud.com/oauth/authorize?client_id=' + clientId + '&redirect_uri=' + redirectUrl);

    userAuth.on('closed', function () {
        userAuth = null;
    });
});
