console.log('[DISTRO] Initializing distribution manager...')

const path = require('path')
const fs = require('fs-extra')
console.log('[DISTRO] Basic requires done')

// Lazy load all dependencies to avoid blocking preloader
let cachedDistributionAPI
const getDistributionAPI = () => {
    if (!cachedDistributionAPI) {
        cachedDistributionAPI = require('helios-core/common').DistributionAPI
    }
    return cachedDistributionAPI
}

let cachedIsDev
const getIsDev = () => {
    if (cachedIsDev === undefined) {
        cachedIsDev = require('./isdev')
    }
    return cachedIsDev
}

let cachedConfigManager
const getConfigManager = () => {
    if (!cachedConfigManager) {
        cachedConfigManager = require('./configmanager')
    }
    return cachedConfigManager
}

console.log('[DISTRO] Lazy loaders defined')

// Lazy load distribution URL
let cachedDistroUrl
const getDistroUrl = () => {
    if (!cachedDistroUrl) {
        const isDev = getIsDev()
        cachedDistroUrl = isDev 
            ? 'file://' + path.join(__dirname, '../../../..', 'distribution.json').replace(/\\/g, '/')
            : 'https://microvision-modpack.bryan.ovh/distribution.json'
        console.log('[DISTRO] Distro URL:', cachedDistroUrl)
    }
    return cachedDistroUrl
}

console.log('[DISTRO] About to define REMOTE_DISTRO_URL property')

// Only call getDistroUrl() when actually needed
Object.defineProperty(exports, 'REMOTE_DISTRO_URL', {
    get: getDistroUrl,
    enumerable: true
})

console.log('[DISTRO] REMOTE_DISTRO_URL property defined')

let cachedAPI
const getDistroAPI = () => {
    if (!cachedAPI) {
        console.log('[DISTRO] Creating DistributionAPI instance...')
        const DistributionAPI = getDistributionAPI()
        const ConfigManager = getConfigManager()
        // Ensure config is loaded before reading directory paths (needed to
        // resolve module file paths in the distribution).
        if (typeof ConfigManager.isLoaded === 'function' && !ConfigManager.isLoaded()) {
            ConfigManager.load()
        }
        const isDev = getIsDev()
        const distroUrl = getDistroUrl()
        cachedAPI = new DistributionAPI(
            ConfigManager.getLauncherDirectory(),
            ConfigManager.getCommonDirectory(),
            ConfigManager.getInstanceDirectory(),
            distroUrl,
            isDev // devMode: load the distribution from a local file when developing.
        )
        if (isDev) {
            // In dev mode the DistributionAPI reads the raw distribution from
            // `distroDevPath`. Point it directly at the local distribution file
            // bundled with the launcher so no remote fetch is attempted.
            const localDistroPath = path.join(__dirname, '../../../..', 'distribution.json')
            cachedAPI.distroDevPath = localDistroPath
            console.log('[DISTRO] Dev distribution path:', cachedAPI.distroDevPath)

            // The launch process spawns a separate child process (FullRepair
            // receiver) which builds its own DistributionAPI using the DEFAULT
            // dev path (launcherDir/distribution_dev.json). Copy the local
            // distribution there so that child process can find it too.
            try {
                const launcherDevPath = path.join(ConfigManager.getLauncherDirectory(), 'distribution_dev.json')
                fs.ensureDirSync(ConfigManager.getLauncherDirectory())
                fs.copyFileSync(localDistroPath, launcherDevPath)
                console.log('[DISTRO] Copied local distribution to:', launcherDevPath)
            } catch (copyErr) {
                console.error('[DISTRO] Failed to copy local distribution for child process:', copyErr.message)
            }
        }
        console.log('[DISTRO] DistributionAPI created')
    }
    return cachedAPI
}

console.log('[DISTRO] About to define DistroAPI property')

// Export lazy getter for the API
Object.defineProperty(exports, 'DistroAPI', {
    get: getDistroAPI,
    enumerable: true
})

console.log('[DISTRO] Module initialization complete')