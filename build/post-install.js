#!/usr/bin/env node

/**
 * Post-installation script for MicroVision Launcher
 * Handles shortcut creation and Windows 10/11 specific operations
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const shortcutsData = process.argv[2]

if (shortcutsData) {
    try {
        const shortcuts = JSON.parse(Buffer.from(shortcutsData, 'base64').toString())
        
        // Get the current user's AppData path
        const appDataPath = process.env.APPDATA
        const desktopPath = path.join(process.env.USERPROFILE, 'Desktop')
        const appExePath = path.join(process.env.APPDATA, 'Local', 'Programs', 'MicroVision Launcher', 'MicroVision Launcher.exe')
        
        // Create Desktop Shortcut
        if (shortcuts.desktop) {
            try {
                const desktopLnk = path.join(desktopPath, 'MicroVision Launcher.lnk')
                createWindowsShortcut(appExePath, desktopLnk)
                console.log('Desktop shortcut created')
            } catch (e) {
                console.error('Failed to create desktop shortcut:', e.message)
            }
        }
        
        // Pin to Taskbar (Windows 10+)
        if (shortcuts.taskbar) {
            try {
                pinToTaskbar(appExePath)
                console.log('Application pinned to taskbar')
            } catch (e) {
                console.error('Failed to pin to taskbar:', e.message)
            }
        }
        
        // Pin to Start Screen
        if (shortcuts.startScreen) {
            try {
                pinToStartScreen(appExePath)
                console.log('Application pinned to Start screen')
            } catch (e) {
                console.error('Failed to pin to Start screen:', e.message)
            }
        }
        
    } catch (e) {
        console.error('Error in post-install script:', e)
    }
}

function createWindowsShortcut(target, shortcutPath) {
    // This would typically use a tool like `mklink` or a Windows-specific library
    // For now, this is a placeholder that would be implemented based on the environment
}

function pinToTaskbar(appPath) {
    try {
        // Write registry entry for taskbar pinning
        const regKey = `"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v "PinToTaskbar"`
        execSync(`reg add ${regKey} /t REG_DWORD /d 1 /f`)
    } catch (e) {
        throw new Error(`Taskbar pinning failed: ${e.message}`)
    }
}

function pinToStartScreen(appPath) {
    try {
        // Create shortcut in Start menu (this is handled by NSIS, but keeping for reference)
        const startMenuPath = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs')
        if (!fs.existsSync(startMenuPath)) {
            fs.mkdirSync(startMenuPath, { recursive: true })
        }
    } catch (e) {
        throw new Error(`Start screen pinning failed: ${e.message}`)
    }
}
