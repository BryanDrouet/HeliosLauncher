const fs = require('fs-extra')
const path = require('path')
const toml = require('toml')
const merge = require('lodash.merge')
const os = require('os')

let lang
let currentLangId = 'en_US'

// Supported languages
const SUPPORTED_LANGUAGES = {
    'fr_FR': 'Français',
    'es_ES': 'Español',
    'en_US': 'English'
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
    lang = merge(lang || {}, toml.parse(fs.readFileSync(path.join(__dirname, '..', 'lang', `${id}.toml`))) || {})
}

exports.query = function(id, placeHolders){
    let query = id.split('.')
    let res = lang
    for(let q of query){
        res = res[q]
    }
    let text = res === lang ? '' : res
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

exports.setupLanguage = function(){
    // Detect system language or use default
    const systemLang = detectSystemLocale()
    
    // Load Language Files - start with system language
    exports.loadLanguage(systemLang)
    
    // Load Custom Language File for Launcher Customizer
    exports.loadLanguage('_custom')
}