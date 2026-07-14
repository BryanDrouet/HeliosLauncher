# Guide d'Ajout de Langues - MicroVision Launcher

## Langues Actuellement Disponibles

| Code | Langue | Statut |
|------|--------|--------|
| en_US | English | ✅ Complet |
| fr_FR | Français | ✅ Complet |
| es_ES | Español | ✅ Complet |
| de_DE | Deutsch | ⏳ À implémenter |
| it_IT | Italiano | ⏳ À implémenter |
| pt_BR | Português (Brasil) | ⏳ À implémenter |
| pl_PL | Polski | ⏳ À implémenter |
| ru_RU | Русский | ⏳ À implémenter |
| ja_JP | 日本語 | ⏳ À implémenter |
| zh_CN | 简体中文 | ⏳ À implémenter |

## Comment Ajouter une Nouvelle Langue

### Étape 1: Créer le fichier de traduction

Créez un nouveau fichier dans `app/assets/lang/` nommé `[CODE].toml` où `[CODE]` est le code de la langue (ex: `de_DE.toml` pour l'Allemand).

### Étape 2: Copier la structure de base

Commencez par copier le contenu du fichier `en_US.toml` comme base :

```toml
[ejs.landing]
updateAvailableTooltip = "Update Available"
usernamePlaceholder = "Username"
# ... etc
```

### Étape 3: Traduire les chaînes

Remplacez les valeurs en anglais par vos traductions :

```toml
[ejs.landing]
updateAvailableTooltip = "Mise à jour disponible"
usernamePlaceholder = "Nom d'utilisateur"
# ... etc
```

### Étape 4: Ajouter le support à LangLoader

Modifiez `app/assets/js/langloader.js` pour inclure votre langue :

```javascript
const SUPPORTED_LANGUAGES = {
    'en_US': 'English',
    'fr_FR': 'Français',
    'es_ES': 'Español',
    'de_DE': 'Deutsch',        // ← Ajoutez votre langue
    'it_IT': 'Italiano',        // ← ici
    // ...
}
```

### Étape 5: Ajouter à l'installateur

Mettez à jour le script NSIS `build/installer.nsi` pour inclure votre langue dans la liste de sélection :

```nsis
${NSD_CreateDropList} 0 15u 100% 150u ""
Pop $LanguageCombo
${NSD_CB_AddString} $LanguageCombo "English (en_US)"
${NSD_CB_AddString} $LanguageCombo "Français (fr_FR)"
${NSD_CB_AddString} $LanguageCombo "Español (es_ES)"
${NSD_CB_AddString} $LanguageCombo "Deutsch (de_DE)"       // ← Ajoutez ici
${NSD_CB_AddString} $LanguageCombo "Italiano (it_IT)"      // ← et ici
```

Et dans la fonction `LanguageSelectionLeave` :

```nsis
${ElseIf} $SelectedLanguage == "3"
    StrCpy $SelectedLanguage "de_DE"
${ElseIf} $SelectedLanguage == "4"
    StrCpy $SelectedLanguage "it_IT"
```

### Étape 6: Tester

Testez votre traduction en :
1. Sélectionnant votre langue lors de l'installation
2. Vérifiant que toutes les chaînes sont correctement traduites
3. Signalant tout manque de traduction

## Structure des Fichiers de Langue

Les fichiers TOML sont organisés par section :

```toml
[ejs.landing]      # Interface de lancement
[ejs.login]        # Page de connexion
[ejs.loginOptions] # Options de connexion
[ejs.settings]     # Paramètres
[ejs.overlay]      # Overlays/Popups
[ejs.welcome]      # Écran de bienvenue
[ejs.waiting]      # Écran d'attente

[js.landing]       # Chaînes JavaScript
[js.settings]      # ... pour les paramètres
[js.login]         # ... pour la connexion
# etc
```

## Points de Traduction Clés

Assurez-vous de traduire :

1. **Éléments d'interface** - Boutons, labels, placeholders
2. **Messages d'erreur** - Messages d'état et d'erreur
3. **Aide contextuelle** - Tooltips et descriptions
4. **Dialogues** - Messages d'alerte et confirmations

## Remarques Importantes

- ✅ Les chaînes non traduites utiliseront l'anglais par défaut
- ✅ Vous pouvez mélanger les langues (certaines sections traduit, autres en anglais)
- ✅ Les caractères spéciaux et accents sont supportés dans TOML
- ⚠️ Assurez-vous que les codes de langue suivent ISO 639-1_ISO 3166-1 (ex: `de_DE`)

## Vérification de la Traduction

Pour vérifier que votre traduction fonctionne :

1. Compilez le launcher avec `npm run dist:win`
2. Installez et sélectionnez votre langue
3. Lancez l'application et vérifiez les textes
4. Cherchez les messages de log en cas d'erreur

## Outils Recommandés

- **TOML Editor**: VS Code avec extension TOML
- **Vérificateur Unicode**: Assurez-vous que les caractères spéciaux s'affichent correctement
- **Correcteur Orthographique**: Vérifiez la grammaire de votre traduction

## Contributions

Les nouvelles traductions sont bienvenues ! Veuillez :
1. Créer les fichiers de traduction
2. Tester complètement
3. Soumettre une pull request avec les fichiers

---

**Besoin d'aide ?** Consultez les exemples existants dans `app/assets/lang/` ou ouvrez une issue sur le dépôt.
