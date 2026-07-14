const remoteMain = require('@electron/remote/main')
remoteMain.initialize()

// Requirements
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron')
const autoUpdater                       = require('electron-updater').autoUpdater
const ejs                               = require('ejs')
const fs                                = require('fs')
const isDev                             = require('./app/assets/js/isdev')
const path                              = require('path')
const semver                            = require('semver')
const { pathToFileURL }                 = require('url')
const { AZURE_CLIENT_ID, MSFT_OPCODE, MSFT_REPLY_TYPE, MSFT_ERROR, SHELL_OPCODE } = require('./app/assets/js/ipcconstants')
const LangLoader                        = require('./app/assets/js/langloader')
const ConfigManager                     = require('./app/assets/js/configmanager')

// Load configuration FIRST before accessing any settings
ConfigManager.load()

// Setup Lang - load configured language
const configuredLang = ConfigManager.getLanguage() || 'en_US'
LangLoader.setupLanguage(configuredLang)

// Setup auto updater.
function initAutoUpdater(event, data) {

    if(data){
        autoUpdater.allowPrerelease = true
    } else {
        // Defaults to true if application version contains prerelease components (e.g. 0.12.1-alpha.1)
        // autoUpdater.allowPrerelease = true
    }
    
    if(isDev){
        autoUpdater.autoInstallOnAppQuit = false
        autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml')
    }
    if(process.platform === 'darwin'){
        autoUpdater.autoDownload = false
    }
    autoUpdater.on('update-available', (info) => {
        event.sender.send('autoUpdateNotification', 'update-available', info)
    })
    autoUpdater.on('update-downloaded', (info) => {
        event.sender.send('autoUpdateNotification', 'update-downloaded', info)
    })
    autoUpdater.on('update-not-available', (info) => {
        event.sender.send('autoUpdateNotification', 'update-not-available', info)
    })
    autoUpdater.on('checking-for-update', () => {
        event.sender.send('autoUpdateNotification', 'checking-for-update')
    })
    autoUpdater.on('error', (err) => {
        event.sender.send('autoUpdateNotification', 'realerror', err)
    }) 
}

// Open channel to listen for update actions.
ipcMain.on('autoUpdateAction', (event, arg, data) => {
    switch(arg){
        case 'initAutoUpdater':
            console.log('Initializing auto updater.')
            initAutoUpdater(event, data)
            event.sender.send('autoUpdateNotification', 'ready')
            break
        case 'checkForUpdate':
            autoUpdater.checkForUpdates()
                .catch(err => {
                    event.sender.send('autoUpdateNotification', 'realerror', err)
                })
            break
        case 'allowPrereleaseChange':
            if(!data){
                const preRelComp = semver.prerelease(app.getVersion())
                if(preRelComp != null && preRelComp.length > 0){
                    autoUpdater.allowPrerelease = true
                } else {
                    autoUpdater.allowPrerelease = data
                }
            } else {
                autoUpdater.allowPrerelease = data
            }
            break
        case 'installUpdateNow':
            autoUpdater.quitAndInstall()
            break
        default:
            console.log('Unknown argument', arg)
            break
    }
})

// Handle launcher actions (language change, etc.)
ipcMain.on('launcherAction', (event, action, data) => {
    switch(action){
        case 'languageChange':
            console.log('Changing language to:', data)
            LangLoader.changeLanguage(data)
            event.sender.send('languageChanged', data)
            break
        default:
            console.log('Unknown launcher action', action)
            break
    }
})

// Handle renderer logs
ipcMain.on('renderer-log', (event, message) => {
    console.log('[RENDERER]', message)
})

// Redirect distribution index event from preloader to renderer.
ipcMain.on('distributionIndexDone', (event, res) => {
    console.log('[INDEX] Received distributionIndexDone from preloader:', res)
    event.sender.send('distributionIndexDone', res)
    console.log('[INDEX] Forwarded distributionIndexDone to renderer')
})

// Handle get-distribution-data request from preloader
ipcMain.handle('get-distribution-data', async (event) => {
    try {
        console.log('[IPC] Received get-distribution-data request')
        // Load distribution from distromanager
        const { DistroAPI } = require('./app/assets/js/distromanager')
        
        // Set up the API with ConfigManager paths
        DistroAPI.commonDir = ConfigManager.getCommonDirectory()
        DistroAPI.instanceDir = ConfigManager.getInstanceDirectory()
        
        console.log('[IPC] DistroAPI loaded successfully')
        
        // Return success - DistroAPI is loaded and ready
        return { success: true, data: 'distribution-loaded' }
    } catch (error) {
        console.error('[IPC] Error loading distribution:', error)
        return { success: false, error: error.message }
    }
})

// Handle get-distro-data request from renderer (alternative to get-distribution-data)
ipcMain.handle('get-distro-data', async (event) => {
    try {
        console.log('[IPC] Received get-distro-data request from renderer')
        // Load distribution from distromanager
        const { DistroAPI } = require('./app/assets/js/distromanager')
        
        // Set up the API with ConfigManager paths
        DistroAPI.commonDir = ConfigManager.getCommonDirectory()
        DistroAPI.instanceDir = ConfigManager.getInstanceDirectory()
        
        // Load and return the distribution
        const distroData = await DistroAPI.getDistribution()
        console.log('[IPC] Distribution loaded from main process')
        
        return distroData
    } catch (error) {
        console.error('[IPC] Error loading distro data:', error)
        throw error
    }
})

// Handle trash item.
ipcMain.handle(SHELL_OPCODE.TRASH_ITEM, async (event, ...args) => {
    try {
        await shell.trashItem(args[0])
        return {
            result: true
        }
    } catch(error) {
        return {
            result: false,
            error: error
        }
    }
})

// Disable hardware acceleration.
// https://electronjs.org/docs/tutorial/offscreen-rendering
app.disableHardwareAcceleration()


const REDIRECT_URI_PREFIX = 'https://login.microsoftonline.com/common/oauth2/nativeclient?'

// Microsoft Auth Login
let msftAuthWindow
let msftAuthSuccess
let msftAuthViewSuccess
let msftAuthViewOnClose
ipcMain.on(MSFT_OPCODE.OPEN_LOGIN, (ipcEvent, ...arguments_) => {
    if (msftAuthWindow) {
        ipcEvent.reply(MSFT_OPCODE.REPLY_LOGIN, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.ALREADY_OPEN, msftAuthViewOnClose)
        return
    }
    msftAuthSuccess = false
    msftAuthViewSuccess = arguments_[0]
    msftAuthViewOnClose = arguments_[1]
    msftAuthWindow = new BrowserWindow({
        title: LangLoader.queryJS('index.microsoftLoginTitle'),
        backgroundColor: '#222222',
        width: 520,
        height: 600,
        frame: true,
        icon: getPlatformIcon('SealCircle')
    })

    msftAuthWindow.on('closed', () => {
        msftAuthWindow = undefined
    })

    msftAuthWindow.on('close', () => {
        if(!msftAuthSuccess) {
            ipcEvent.reply(MSFT_OPCODE.REPLY_LOGIN, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.NOT_FINISHED, msftAuthViewOnClose)
        }
    })

    msftAuthWindow.webContents.on('did-navigate', (_, uri) => {
        if (uri.startsWith(REDIRECT_URI_PREFIX)) {
            let queryMap = {}
            
            new URL(uri).searchParams.forEach((v, k) => {
                queryMap[k] = v;
            });

            ipcEvent.reply(MSFT_OPCODE.REPLY_LOGIN, MSFT_REPLY_TYPE.SUCCESS, queryMap, msftAuthViewSuccess)

            msftAuthSuccess = true
            msftAuthWindow.close()
            msftAuthWindow = null
        }
    })

    msftAuthWindow.removeMenu()
    msftAuthWindow.loadURL(`https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?prompt=select_account&client_id=${AZURE_CLIENT_ID}&response_type=code&scope=XboxLive.signin%20offline_access&redirect_uri=https://login.microsoftonline.com/common/oauth2/nativeclient`)
})

// Microsoft Auth Logout
let msftLogoutWindow
let msftLogoutSuccess
let msftLogoutSuccessSent
ipcMain.on(MSFT_OPCODE.OPEN_LOGOUT, (ipcEvent, uuid, isLastAccount) => {
    if (msftLogoutWindow) {
        ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.ALREADY_OPEN)
        return
    }

    msftLogoutSuccess = false
    msftLogoutSuccessSent = false
    msftLogoutWindow = new BrowserWindow({
        title: LangLoader.queryJS('index.microsoftLogoutTitle'),
        backgroundColor: '#222222',
        width: 520,
        height: 600,
        frame: true,
        icon: getPlatformIcon('SealCircle')
    })

    msftLogoutWindow.on('closed', () => {
        msftLogoutWindow = undefined
    })

    msftLogoutWindow.on('close', () => {
        if(!msftLogoutSuccess) {
            ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.NOT_FINISHED)
        } else if(!msftLogoutSuccessSent) {
            msftLogoutSuccessSent = true
            ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.SUCCESS, uuid, isLastAccount)
        }
    })
    
    msftLogoutWindow.webContents.on('did-navigate', (_, uri) => {
        if(uri.startsWith('https://login.microsoftonline.com/common/oauth2/v2.0/logoutsession')) {
            msftLogoutSuccess = true
            setTimeout(() => {
                if(!msftLogoutSuccessSent) {
                    msftLogoutSuccessSent = true
                    ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.SUCCESS, uuid, isLastAccount)
                }

                if(msftLogoutWindow) {
                    msftLogoutWindow.close()
                    msftLogoutWindow = null
                }
            }, 5000)
        }
    })
    
    msftLogoutWindow.removeMenu()
    msftLogoutWindow.loadURL('https://login.microsoftonline.com/common/oauth2/v2.0/logout')
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow() {

    win = new BrowserWindow({
        width: 980,
        height: 552,
        icon: getPlatformIcon('SealCircle'),
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'app', 'assets', 'js', 'preloader.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
        backgroundColor: '#171614'
    })
    remoteMain.enable(win.webContents)

    try {
        const data = {
            bkid: Math.floor((Math.random() * fs.readdirSync(path.join(__dirname, 'app', 'assets', 'images', 'backgrounds')).length)),
            lang: (str, placeHolders) => LangLoader.queryEJS(str, placeHolders)
        }
        
        console.log('[INDEX] Rendering app.ejs template...')
        const templatePath = path.join(__dirname, 'app', 'app.ejs')
        ejs.renderFile(templatePath, data, {async: false}, (err, str) => {
            if(err) {
                console.error('[INDEX] EJS render error:', err)
                if(win && !win.isDestroyed()) {
                    win.loadURL('data:text/html,<h1>Render Error</h1><pre>' + err.message + '</pre>')
                }
            } else {
                console.log('[INDEX] EJS render successful, loading HTML...')
                if(win && !win.isDestroyed()) {
                    // Save rendered HTML to file and load it
                    const tempHtmlPath = path.join(__dirname, 'app', 'app-rendered.html')
                    fs.writeFileSync(tempHtmlPath, str)
                    // Verify the file was written
                    if(fs.existsSync(tempHtmlPath)) {
                        console.log('[INDEX] HTML file written successfully:', tempHtmlPath)
                        const fileSize = fs.statSync(tempHtmlPath).size
                        console.log('[INDEX] HTML file size:', fileSize, 'bytes')
                    }
                    const fileUrl = pathToFileURL(tempHtmlPath).toString()
                    console.log('[INDEX] Loading from file:', fileUrl)
                    win.loadURL(fileUrl)
                    console.log('[INDEX] loadURL called successfully')
                }
            }
        })
    } catch(err) {
        console.error('[INDEX] Failed to render template:', err)
        if(win && !win.isDestroyed()) {
            win.loadURL('data:text/html,<h1>Error Loading App</h1><pre>' + err.message + '</pre>')
        }
    }

    // Open DevTools in development mode
    if(isDev) {
        console.log('[INDEX] Opening DevTools in dev mode')
        setTimeout(() => {
            if(win && !win.isDestroyed()) {
                win.webContents.openDevTools()
            }
        }, 1000)
    }

    // Listen for did-finish-load event to confirm page loaded
    win.webContents.once('did-finish-load', () => {
        console.log('[INDEX] did-finish-load event fired - page HTML loaded')
    })

    // Listen for page content errors
    win.webContents.on('console-message', (event) => {
        // Deprecated API but still works
        console.log('[CONSOLE]', event)
    })
    
    // Use new API for getting detailed console messages
    win.webContents.on('crashed', () => {
        console.log('[RENDERER CRASH] Renderer process crashed')
    })

    /*win.once('ready-to-show', () => {
        win.show()
    })*/

    win.removeMenu()

    win.resizable = true

    win.on('closed', () => {
        win = null
    })
}

function createMenu() {
    
    if(process.platform === 'darwin') {

        // Extend default included application menu to continue support for quit keyboard shortcut
        let applicationSubMenu = {
            label: 'Application',
            submenu: [{
                label: 'About Application',
                selector: 'orderFrontStandardAboutPanel:'
            }, {
                type: 'separator'
            }, {
                label: 'Quit',
                accelerator: 'Command+Q',
                click: () => {
                    app.quit()
                }
            }]
        }

        // New edit menu adds support for text-editing keyboard shortcuts
        let editSubMenu = {
            label: 'Edit',
            submenu: [{
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                selector: 'undo:'
            }, {
                label: 'Redo',
                accelerator: 'Shift+CmdOrCtrl+Z',
                selector: 'redo:'
            }, {
                type: 'separator'
            }, {
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                selector: 'cut:'
            }, {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                selector: 'copy:'
            }, {
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                selector: 'paste:'
            }, {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                selector: 'selectAll:'
            }]
        }

        // Bundle submenus into a single template and build a menu object with it
        let menuTemplate = [applicationSubMenu, editSubMenu]
        let menuObject = Menu.buildFromTemplate(menuTemplate)

        // Assign it to the application
        Menu.setApplicationMenu(menuObject)

    }

}

function getPlatformIcon(filename){
    let ext
    switch(process.platform) {
        case 'win32':
            ext = 'ico'
            break
        case 'darwin':
        case 'linux':
        default:
            ext = 'png'
            break
    }

    return path.join(__dirname, 'app', 'assets', 'images', `${filename}.${ext}`)
}

app.on('ready', createWindow)
app.on('ready', createMenu)

app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})
