const {ipcRenderer}  = require('electron')
const fs             = require('fs-extra')
const os             = require('os')
const path           = require('path')

console.log('[PRELOADER] Module loading started...')

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

console.log('[PRELOADER] Setting up IPC listeners...')

// Simple IPC listeners that don't require ConfigManager
ipcRenderer.on('setLanguage', (event, language) => {
    writeLog(`Received language change event: ${language}`)
    console.log('[PRELOADER] Language change event:', language)
    // Store language preference in renderer-accessible way
    window.launchanguage = language
})

writeLog('IPC listeners initialized')

console.log('[PRELOADER] Requesting distribution from main process...')
writeLog('Requesting distribution from main process...')

// Request the distribution from the main process
try {
    ipcRenderer.invoke('get-distribution-data').then((data) => {
        writeLog('Received distribution data: ' + JSON.stringify(data).substring(0, 100))
        writeLog('About to send distributionIndexDone to main process...')
        console.log('[PRELOADER] About to send distributionIndexDone, data:', data)
        // Store for later use in uibinder or other scripts
        window.distributionData = data
        // Send signal that distribution is ready - this will trigger uibinder.js to load the UI
        ipcRenderer.send('distributionIndexDone', true)
        writeLog('distributionIndexDone signal sent to main')
        console.log('[PRELOADER] distributionIndexDone signal sent')
    }).catch((err) => {
        writeLog('Error getting distribution: ' + err.toString())
        console.log('[PRELOADER] Error:', err)
        ipcRenderer.send('distributionIndexDone', false)
    })
} catch (err) {
    console.error('[PRELOADER] Exception in IPC invoke:', err)
    writeLog('Exception in IPC invoke: ' + err.toString())
}

writeLog('=== PRELOADER COMPLETE ===')
console.log('[PRELOADER] Preload script complete')