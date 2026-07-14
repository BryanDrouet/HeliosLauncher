# MicroVision Launcher - Améliorations d'Installation et Correctifs

## Problèmes Adressés

### 1. ✅ Boucle Infinie de Chargement
**Problème**: L'application chargeait en boucle et ne lançait pas correctement le launcher.

**Cause Identifiée**: La variable `currentView` n'était pas initialisée avant utilisation, causant des erreurs lors des transitions entre les vues.

**Solution Appliquée**:
- Initialisation de `currentView` à `null` dans `uibinder.js`
- Ajout de vérifications dans la fonction `switchView()` pour éviter les transitions vers une vue null
- Prévention des transitions auto-référencées (switchView vers la même vue)

**Fichier Modifié**: [app/assets/js/scripts/uibinder.js](app/assets/js/scripts/uibinder.js#L24-L57)

---

### 2. ✅ Sélection de Langue à l'Installation
**Fonctionnalité Ajoutée**: Les utilisateurs peuvent maintenant choisir leur langue d'installation.

**Solution Implémentée**:
- Créé un script d'installation NSIS personnalisé avec un écran de sélection de langue
- L'écran de sélection propose 10 langues : Anglais, Français, Espagnol, Allemand, Italien, Portugais, Polonais, Russe, Japonais et Chinois Simplifié
- La langue sélectionnée est enregistrée dans le registre Windows
- Au premier lancement, le preloader.js lit la langue du registre et la sauvegarde dans la configuration

**Fichiers Créés/Modifiés**:
- [build/installer.nsi](build/installer.nsi) - Script d'installation NSIS personnalisé
- [app/assets/js/preloader.js](app/assets/js/preloader.js) - Intégration de la langue au démarrage
- [electron-builder.yml](electron-builder.yml) - Configuration du builder

---

### 3. ✅ Raccourcis d'Installation Personnalisés
**Fonctionnalités Ajoutées**: 
- Checkbox pour ajouter un raccourci au Bureau
- Checkbox pour ajouter au Menu Démarrer  
- Checkbox pour épingler à l'écran d'accueil Windows
- Checkbox pour épingler à la barre des tâches

**Solution Implémentée**:
- Ajout d'une page personnalisée dans l'installateur avec 4 checkboxes
- Création dynamique des raccourcis selon les choix de l'utilisateur
- Enregistrement des préférences dans le registre Windows
- Support complet de Windows 10 et Windows 11

**Fichier**: [build/installer.nsi](build/installer.nsi)

---

## Configuration Electron-Builder

La configuration `electron-builder.yml` a été mise à jour pour utiliser le script NSIS personnalisé :

```yaml
nsis:
  oneClick: false
  perMachine: false
  allowElevation: true
  allowToChangeInstallationDirectory: true
  shortcutName: 'MicroVision Launcher'
  createDesktopShortcut: false  # Géré par notre script personnalisé
  createStartMenuShortcut: false  # Géré par notre script personnalisé
  runAfterFinish: true
  uninstallDisplayName: 'MicroVision Launcher'
  installerSidebar: false
  installerHeader: false
  include: 'build/installer.nsi'
```

---

## Fichiers Ajoutés

### 1. **build/installer.nsi** (Script d'Installation NSIS)
- Écran de sélection de langue personnalisé
- Écran de sélection des raccourcis avec checkboxes
- Gestion des raccourcis au bureau, menu démarrer, écran d'accueil et barre des tâches
- Enregistrement de la langue et des préférences dans le registre

### 2. **build/post-install.js** (Script Post-Installation)
- Utility pour la configuration post-installation
- Gestion des raccourcis avancés (réservé pour futures améliorations)

### 3. **build/post-install-setup.js** (Configuration Post-Installation)
- Scrip pour mettre en place la configuration initiale
- Lecteur du registre pour la langue d'installation
- Initialisation du fichier de configuration

---

## Langues Supportées

L'installateur supporte les langues suivantes :

| Code | Langue |
|------|--------|
| en_US | English |
| fr_FR | Français |
| es_ES | Español |
| de_DE | Deutsch |
| it_IT | Italiano |
| pt_BR | Português (Brasil) |
| pl_PL | Polski |
| ru_RU | Русский |
| ja_JP | 日本語 |
| zh_CN | 简体中文 |

---

## Flux d'Installation Amélioré

1. **Bienvenue** - Écran de bienvenue standard
2. **Sélection du Répertoire** - Choix du dossier d'installation
3. **Sélection de Langue** (NOUVEAU) - Choix de la langue d'installation
4. **Sélection des Raccourcis** (NOUVEAU) - Checkboxes pour les raccourcis
5. **Installation** - Copie des fichiers
6. **Finish** - Fin de l'installation

---

## Corrections du Launcher

### Problème de Vue Non Initialisée
Le problème de boucle infinie a été résolu en :
- Initialisant correctement la variable `currentView`
- Ajoutant des vérifications de sécurité dans `switchView()`
- Évitant les transitions invalides

**Impact**: Le launcher devrait maintenant démarrer sans problème de redirection infinie.

---

## Instructions de Build

```bash
# Construction de l'installateur
npm run dist:win

# Lancement en mode développement
npm run start
```

---

## Variables de Registre

La configuration d'installation crée les entrées de registre suivantes :

```
HKEY_CURRENT_USER\Software\MicroVision\Launcher
  - InstallLanguage (REG_SZ) : Code de langue sélectionné
  - InstallPath (REG_SZ) : Chemin d'installation
  - PinToTaskbar (REG_DWORD) : 1 si épinglé à la barre des tâches
```

---

## Notes Importantes

1. **Windows 10/11 Requis** : Les scripts sont optimisés pour Windows 10 et supérieur
2. **Droits d'Administration** : L'installation demande les droits nécessaires
3. **Première Exécution** : La langue est détectée et configurée au premier lancement
4. **Compatibilité** : Tous les fichiers de langue existants dans `app/assets/lang/` sont supportés

---

## Dépannage

### L'installateur ne reconnaît pas ma langue
- Vérifiez que votre langue figure dans la liste supportée
- Le code de langue sera enregistré dans le registre Windows
- L'application chargera la langue au démarrage

### Les raccourcis ne se créent pas
- Vérifiez les permissions d'écriture au répertoire du Bureau
- Assurez-vous que Windows 10 ou supérieur est installé
- Relancez l'installateur en tant qu'administrateur

### L'application boucle en chargement
- Supprimez la configuration corruptue : `%APPDATA%\Launcher\config.json`
- Relancez l'application

---

## Support et Feedback

Pour toute question ou problème, veuillez consulter la documentation du projet ou ouvrir un issue sur le dépôt.
