const { DistributionAPI } = require('helios-core/common')
const isDev = require('./isdev')
const ConfigManager = require('./configmanager')

// Distribution URL - GitHub Pages (reliable, no rate limits)
// Use local dev server in dev mode, or remote in production
exports.REMOTE_DISTRO_URL = isDev 
    ? 'http://localhost:8080/distribution.json'
    : 'https://microvision-modpack.bryan.ovh/distribution.json'

const api = new DistributionAPI(
    ConfigManager.getLauncherDirectory(),
    null, // Injected forcefully by the preloader.
    null, // Injected forcefully by the preloader.
    exports.REMOTE_DISTRO_URL,
    false
)

exports.DistroAPI = api