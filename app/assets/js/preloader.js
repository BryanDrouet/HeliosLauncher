const {ipcRenderer}  = require('electron')
const fs             = require('fs-extra')
const os             = require('os')
const path           = require('path')

// Setup debug logging to file
const logFile = path.join(os.homedir(), 'MicroVision_preloader.log')
const writeLog = (msg) => {
    try {
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`)
    } catch (e) {
        // Silently ignore log errors
    }
}

writeLog('=== PRELOADER STARTING ===')
writeLog('__dirname: ' + __dirname)

writeLog('Initializing IPC listeners...')

// Simple IPC listeners that don't require ConfigManager
ipcRenderer.on('setLanguage', (event, language) => {
    writeLog(`Received language change event: ${language}`)
    // Store language preference in renderer-accessible way
    window.launchanguage = language
})

writeLog('IPC listeners initialized')
writeLog('Requesting distribution from main process...')

// Request the distribution from the main process
ipcRenderer.invoke('get-distribution-data').then((data) => {
    writeLog('Received distribution data')
    writeLog('About to send distributionIndexDone...')
    // Store for later use in uibinder or other scripts
    window.distributionData = data
    // Send signal that distribution is ready - this will trigger uibinder.js to load the UI
    ipcRenderer.send('distributionIndexDone', true)
    writeLog('distributionIndexDone signal sent')
}).catch((err) => {
    writeLog('Error getting distribution: ' + err)
    ipcRenderer.send('distributionIndexDone', false)
})

writeLog('=== PRELOADER COMPLETE ===')