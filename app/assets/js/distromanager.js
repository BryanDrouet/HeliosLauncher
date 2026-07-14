const { DistributionAPI } = require('helios-core/common')

const ConfigManager = require('./configmanager')

// Distribution URL - GitHub Pages (reliable, no rate limits)
exports.REMOTE_DISTRO_URL = 'https://microvision-modpack.bryan.ovh/distribution.json'

const api = new DistributionAPI(
    ConfigManager.getLauncherDirectory(),
    null, // Injected forcefully by the preloader.
    null, // Injected forcefully by the preloader.
    exports.REMOTE_DISTRO_URL,
    false
)

exports.DistroAPI = api