; MicroVision Launcher Installer Script
; Enhanced with language selection and desktop shortcuts

!include "MUI2.nsh"
!include "x64.nsh"
!include "FileFunc.nsh"
!include "nsDialogs.nsh"
!include "LogicLib.nsh"

; Product Info
!define PRODUCT_NAME "MicroVision Launcher"
!define PRODUCT_VERSION "${VERSION}"
!define PRODUCT_PUBLISHER "MicroVision"
!define PRODUCT_WEB_SITE "https://microvision.modpack"
!define REG_KEY "Software\MicroVision\Launcher"

; Installer variables
Var StartMenuFolder
Var InstallFolder
Var DesktopShortcut
Var StartMenuShortcut
Var StartScreenShortcut
Var TaskbarShortcut
Var SelectedLanguage
Var hwnd
Var LanguageCombo

; Basic Settings
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "${INSTALLER_FILENAME}"
InstallDir "$PROGRAMFILES\${PRODUCT_NAME}"
InstallDirRegKey HKCU "${REG_KEY}" "InstallPath"

; UI Settings
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
Page custom LanguageSelectionPage LanguageSelectionLeave
Page custom ShortcutsPage ShortcutsPageLeave
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Default language
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "French"

; Language Strings
LangString LNG_LANGUAGE_SELECT ${LANG_ENGLISH} "Select Installation Language"
LangString LNG_LANGUAGE_SELECT ${LANG_FRENCH} "Sélectionner la langue d'installation"

LangString LNG_SHORTCUTS_PAGE ${LANG_ENGLISH} "Installation Shortcuts"
LangString LNG_SHORTCUTS_PAGE ${LANG_FRENCH} "Raccourcis d'installation"

LangString LNG_DESKTOP ${LANG_ENGLISH} "Add desktop shortcut"
LangString LNG_DESKTOP ${LANG_FRENCH} "Ajouter un raccourci sur le bureau"

LangString LNG_STARTMENU ${LANG_ENGLISH} "Add Start Menu shortcut"
LangString LNG_STARTMENU ${LANG_FRENCH} "Ajouter un raccourci au menu Démarrer"

LangString LNG_STARTSCREEN ${LANG_ENGLISH} "Pin to Start Screen"
LangString LNG_STARTSCREEN ${LANG_FRENCH} "Épingler à l'écran d'accueil"

LangString LNG_TASKBAR ${LANG_ENGLISH} "Pin to Taskbar"
LangString LNG_TASKBAR ${LANG_FRENCH} "Épingler à la barre des tâches"

LangString LNG_SELECT_LANGUAGE ${LANG_ENGLISH} "Please select your installation language:"
LangString LNG_SELECT_LANGUAGE ${LANG_FRENCH} "Veuillez sélectionner votre langue d'installation :"

; Language Selection Page
Function LanguageSelectionPage
    !insertmacro MUI_HEADER_TEXT "$(LNG_LANGUAGE_SELECT)" "$(LNG_SELECT_LANGUAGE)"
    
    nsDialogs::Create 1018
    Pop $hwnd
    
    ${If} $hwnd == error
        Abort
    ${EndIf}
    
    ${NSD_CreateLabel} 0 0 100% 12u "$(LNG_SELECT_LANGUAGE)"
    Pop $0
    
    ${NSD_CreateDropList} 0 15u 100% 150u ""
    Pop $LanguageCombo
    ${NSD_CB_AddString} $LanguageCombo "English (en_US)"
    ${NSD_CB_AddString} $LanguageCombo "Français (fr_FR)"
    ${NSD_CB_AddString} $LanguageCombo "Español (es_ES)"
    ${NSD_CB_AddString} $LanguageCombo "Deutsch (de_DE)"
    ${NSD_CB_AddString} $LanguageCombo "Italiano (it_IT)"
    ${NSD_CB_AddString} $LanguageCombo "Português (pt_BR)"
    ${NSD_CB_AddString} $LanguageCombo "Polski (pl_PL)"
    ${NSD_CB_AddString} $LanguageCombo "Русский (ru_RU)"
    ${NSD_CB_AddString} $LanguageCombo "日本語 (ja_JP)"
    ${NSD_CB_AddString} $LanguageCombo "简体中文 (zh_CN)"
    ${NSD_CB_SelectString} $LanguageCombo "English (en_US)"
    
    nsDialogs::Show
FunctionEnd

Function LanguageSelectionLeave
    ${NSD_GetState} $LanguageCombo $SelectedLanguage
    
    ${If} $SelectedLanguage == "0"
        StrCpy $SelectedLanguage "en_US"
    ${ElseIf} $SelectedLanguage == "1"
        StrCpy $SelectedLanguage "fr_FR"
    ${ElseIf} $SelectedLanguage == "2"
        StrCpy $SelectedLanguage "es_ES"
    ${ElseIf} $SelectedLanguage == "3"
        StrCpy $SelectedLanguage "de_DE"
    ${ElseIf} $SelectedLanguage == "4"
        StrCpy $SelectedLanguage "it_IT"
    ${ElseIf} $SelectedLanguage == "5"
        StrCpy $SelectedLanguage "pt_BR"
    ${ElseIf} $SelectedLanguage == "6"
        StrCpy $SelectedLanguage "pl_PL"
    ${ElseIf} $SelectedLanguage == "7"
        StrCpy $SelectedLanguage "ru_RU"
    ${ElseIf} $SelectedLanguage == "8"
        StrCpy $SelectedLanguage "ja_JP"
    ${ElseIf} $SelectedLanguage == "9"
        StrCpy $SelectedLanguage "zh_CN"
    ${Else}
        StrCpy $SelectedLanguage "en_US"
    ${EndIf}
FunctionEnd

; Shortcuts Selection Page
Function ShortcutsPage
    !insertmacro MUI_HEADER_TEXT "$(LNG_SHORTCUTS_PAGE)" "$(LNG_SHORTCUTS_PAGE)"
    
    nsDialogs::Create 1018
    Pop $hwnd
    
    ${If} $hwnd == error
        Abort
    ${EndIf}
    
    ; Desktop Shortcut Checkbox
    ${NSD_CreateCheckbox} 0 0 100% 12u "$(LNG_DESKTOP)"
    Pop $DesktopShortcut
    ${NSD_SetState} $DesktopShortcut 1
    
    ; Start Menu Shortcut Checkbox
    ${NSD_CreateCheckbox} 0 15u 100% 12u "$(LNG_STARTMENU)"
    Pop $StartMenuShortcut
    ${NSD_SetState} $StartMenuShortcut 1
    
    ; Start Screen Shortcut Checkbox
    ${NSD_CreateCheckbox} 0 30u 100% 12u "$(LNG_STARTSCREEN)"
    Pop $StartScreenShortcut
    ${NSD_SetState} $StartScreenShortcut 0
    
    ; Taskbar Shortcut Checkbox
    ${NSD_CreateCheckbox} 0 45u 100% 12u "$(LNG_TASKBAR)"
    Pop $TaskbarShortcut
    ${NSD_SetState} $TaskbarShortcut 0
    
    nsDialogs::Show
FunctionEnd

Function ShortcutsPageLeave
    ${NSD_GetState} $DesktopShortcut $DesktopShortcut
    ${NSD_GetState} $StartMenuShortcut $StartMenuShortcut
    ${NSD_GetState} $StartScreenShortcut $StartScreenShortcut
    ${NSD_GetState} $TaskbarShortcut $TaskbarShortcut
FunctionEnd

; Installation Section
Section "Install"
    SetOutPath "$INSTDIR"
    File /r "${APP_BUILD_DIR}\*.*"
    
    ; Create Start Menu folder
    StrCpy $StartMenuFolder "$SMPROGRAMS\${PRODUCT_NAME}"
    CreateDirectory "$StartMenuFolder"
    
    ; Create shortcuts based on user selection
    CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
    CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_NAME}" "" "$INSTDIR\${APP_EXECUTABLE_NAME}" 0
    CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
    
    ${If} $DesktopShortcut == 1
        CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_NAME}" "" "$INSTDIR\${APP_EXECUTABLE_NAME}" 0
    ${EndIf}
    
    ${If} $StartScreenShortcut == 1
        ; Create shortcut for Windows Start Screen
        CreateDirectory "$APPDATA\Microsoft\Windows\Start Menu\Programs\${PRODUCT_NAME}"
        CreateShortCut "$APPDATA\Microsoft\Windows\Start Menu\Programs\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_NAME}"
    ${EndIf}
    
    ${If} $TaskbarShortcut == 1
        ; Pin to Taskbar via registry (Windows 10+)
        WriteRegStr HKCU "Software\${PRODUCT_NAME}" "PinToTaskbar" "1"
    ${EndIf}
    
    ; Save installation language to registry
    WriteRegStr HKCU "${REG_KEY}" "InstallLanguage" "$SelectedLanguage"
    
    ; Save install path
    WriteRegStr HKCU "${REG_KEY}" "InstallPath" "$INSTDIR"
    
    ; Write uninstall information
    WriteUninstaller "$INSTDIR\Uninstall.exe"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayName" "${PRODUCT_NAME}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayIcon" "$INSTDIR\${APP_EXECUTABLE_NAME}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "Publisher" "${PRODUCT_PUBLISHER}"
    
    SetAutoClose true
SectionEnd

; Uninstall Section
Section "Uninstall"
    Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
    Delete "$SMPROGRAMS\${PRODUCT_NAME}\*.*"
    Delete "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall.lnk"
    RMDir "$SMPROGRAMS\${PRODUCT_NAME}"
    RMDir /r "$INSTDIR"
    DeleteRegKey HKCU "${REG_KEY}"
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
    SetAutoClose true
SectionEnd
