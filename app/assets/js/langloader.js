const fs = require('fs-extra')
const path = require('path')
const toml = require('toml')
const merge = require('lodash.merge')
const os = require('os')

let lang
let currentLangId = 'en_US'

// Supported languages
const SUPPORTED_LANGUAGES = {
    'en_US': 'English',
    'fr_FR': 'Français',
    'es_ES': 'Español',
    'de_DE': 'Deutsch',
    'it_IT': 'Italiano',
    'pt_BR': 'Português',
    'pl_PL': 'Polski',
    'ru_RU': 'Русский',
    'ja_JP': '日本語',
    'zh_CN': '简体中文'
}

// Detect system locale
function detectSystemLocale() {
    const locale = os.locale && os.locale() || process.env.LANG || 'en_US'
    const langCode = locale.substring(0, 5)
    
    // Map common locale codes to our supported languages
    if (langCode === 'fr_FR' || locale.startsWith('fr')) return 'fr_FR'
    if (langCode === 'es_ES' || locale.startsWith('es')) return 'es_ES'
    return 'en_US'
}

exports.loadLanguage = function(id){
    currentLangId = id
    try {
        const langPath = path.join(__dirname, '..', 'lang', `${id}.toml`)
        if(fs.existsSync(langPath)) {
            lang = merge(lang || {}, toml.parse(fs.readFileSync(langPath, 'utf8')) || {})
        }
    } catch(e) {
        console.error(`Failed to load language ${id}:`, e)
    }
}

exports.query = function(id, placeHolders){
    if(!lang) return ''
    let query = id.split('.')
    let res = lang
    for(let q of query){
        if(res && typeof res === 'object') {
            res = res[q]
        } else {
            return ''
        }
    }
    let text = res === lang ? '' : res || ''
    if (placeHolders) {
        Object.entries(placeHolders).forEach(([key, value]) => {
            text = text.replace(`{${key}}`, value)
        })
    }
    return text
}

exports.queryJS = function(id, placeHolders){
    return exports.query(`js.${id}`, placeHolders)
}

exports.queryEJS = function(id, placeHolders){
    return exports.query(`ejs.${id}`, placeHolders)
}

// Get current language ID
exports.getCurrentLanguage = function(){
    return currentLangId
}

// Get available languages
exports.getAvailableLanguages = function(){
    return SUPPORTED_LANGUAGES
}

exports.setupLanguage = function(configuredLanguage){
    // Use configured language if provided, otherwise detect system language
    let languageToLoad = configuredLanguage || detectSystemLocale()
    
    // Ensure the language is supported, fallback to English
    if (!SUPPORTED_LANGUAGES[languageToLoad]) {
        languageToLoad = 'en_US'
    }
    
    // Load Language Files - start with configured or system language
    exports.loadLanguage(languageToLoad)
    
    // Load Custom Language File for Launcher Customizer
    exports.loadLanguage('_custom')
}

/**
 * Change the current language at runtime
 * @param {string} languageId The language code to switch to
 */
exports.changeLanguage = function(languageId){
    if (SUPPORTED_LANGUAGES[languageId]) {
        exports.loadLanguage(languageId)
    }
}