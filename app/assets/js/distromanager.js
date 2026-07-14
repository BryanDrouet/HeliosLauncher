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
            ? 'file://' + path.join(__dirname, '../../..', 'HeliosLauncher', 'distribution-local.json').replace(/\\/g, '/')
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
        const distroUrl = getDistroUrl()
        cachedAPI = new DistributionAPI(
            ConfigManager.getLauncherDirectory(),
            null, // Injected forcefully by the preloader.
            null, // Injected forcefully by the preloader.
            distroUrl,
            false
        )
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