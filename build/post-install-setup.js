#!/usr/bin/env node

/**
 * Post-installation hook for MicroVision Launcher
 * Sets up the launcher with the selected language and shortcuts
 */

const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')

const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library', 'Application Support') : process.env.HOME)
const launcherUserDataPath = path.join(appDataPath, 'MicroVision', 'Launcher')
const configPath = path.join(launcherUserDataPath, 'config.json')

// Get language from registry or environment
function getInstalledLanguage() {
    try {
        // Try to read from registry
        const regPath = 'HKCU\\Software\\MicroVision\\Launcher'
        const result = execSync(`reg query "${regPath}" /v InstallLanguage`, { encoding: 'utf8' })
        const match = result.match(/InstallLanguage\s+REG_SZ\s+(\S+)/)
        if (match && match[1]) {
            return match[1]
        }
    } catch (e) {
        // Registry key might not exist yet
    }
    return 'en_US'
}

// Set up the configuration file with the selected language
function setupConfiguration() {
    const language = getInstalledLanguage()
    
    // Ensure the directory exists
    fs.ensureDirSync(launcherUserDataPath)
    
    // Create or update the config file
    let config = {}
    
    if (fs.existsSync(configPath)) {
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        } catch (e) {
            console.error('Failed to parse existing config:', e)
        }
    }
    
    // Update language setting
    if (!config.settings) {
        config.settings = {}
    }
    if (!config.settings.launcher) {
        config.settings.launcher = {}
    }
    config.settings.launcher.language = language
    
    // Write updated config
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')
        console.log(`Configuration file updated with language: ${language}`)
    } catch (e) {
        console.error('Failed to write configuration file:', e)
    }
}

// Main execution
try {
    setupConfiguration()
    console.log('Post-installation setup completed successfully')
} catch (e) {
    console.error('Post-installation setup failed:', e)
    process.exit(1)
}
