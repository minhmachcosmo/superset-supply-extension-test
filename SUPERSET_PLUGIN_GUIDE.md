# Guide : Créer et tester un plugin Apache Superset

Basé sur l'expérience de développement du plugin `superset-brewery-extension-test-1`.  
Version Superset cible : **4.1.1**

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Créer le plugin](#2-créer-le-plugin)
3. [Structure du plugin](#3-structure-du-plugin)
4. [Configurer l'environnement local](#4-configurer-lenvironnement-local)
5. [Enregistrer le plugin dans Superset](#5-enregistrer-le-plugin-dans-superset)
6. [Corriger les erreurs webpack connues](#6-corriger-les-erreurs-webpack-connues)
7. [Workflow de développement quotidien](#7-workflow-de-développement-quotidien)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prérequis

### Node.js — version 18 obligatoire

Superset 4.1.1 requiert Node **18.19.1** et npm **10.2.4**.  
Utilise `nvm-windows` pour gérer les versions Node sans conflits.

```powershell
# Installer nvm-windows (une seule fois)
winget install CoreyButler.NVMforWindows

# Ouvrir un NOUVEAU terminal PowerShell, puis :
nvm install 18.19.1

# Activer Node 18 dans le terminal courant
$env:PATH = "$env:LOCALAPPDATA\nvm\v18.19.1;$env:PATH"
node --version   # doit afficher v18.19.1
npm --version    # doit afficher 10.2.4
```

> ⚠️ **Le PATH nvm doit être activé dans chaque nouveau terminal.**  
> Ajoute `$env:PATH = "$env:LOCALAPPDATA\nvm\v18.19.1;$env:PATH"` au début de tes sessions PowerShell.

### Docker Desktop

Requis pour le backend Superset.  
Vérifie : `docker --version` et `docker compose version`

### Cloner Superset 4.1.1 (une seule fois)

```powershell
git clone --branch 4.1.1 --depth 1 https://github.com/apache/superset.git C:\superset
```

> ⚠️ **Ne jamais cloner `main`** — la branche principale est instable et accumule des dépendances incompatibles.

---

## 2. Créer le plugin

### Utiliser le générateur officiel

```powershell
cd C:\superset\superset-frontend
npx @superset-ui/generator-superset
```

Choisir : `Create superset-ui plugin`  
Le générateur crée la structure dans `plugins/` ou dans un dossier externe.

### Ou créer manuellement

Structure minimale dans un dossier dédié (ex: `C:\Users\...\mon-plugin\`) :

```
mon-plugin/
├── src/
│   ├── MonPlugin.tsx          # Composant React principal
│   ├── index.ts               # Point d'entrée
│   ├── types.ts               # Types TypeScript
│   └── plugin/
│       ├── index.ts           # Classe ChartPlugin
│       ├── controlPanel.ts    # Panneau de configuration
│       └── transformProps.ts  # Transformation des données
├── package.json
└── tsconfig.json
```

---

## 3. Structure du plugin

### `src/plugin/index.ts` — Classe principale

```typescript
import { ChartPlugin } from '@superset-ui/core';
import transformProps from './transformProps';
import controlPanel from './controlPanel';
import thumbnail from '../images/thumbnail.png';

export default class MonPlugin extends ChartPlugin {
  constructor() {
    super({
      metadata: {
        name: 'Mon Plugin',
        description: 'Description du plugin',
        thumbnail,
        category: 'Evolution',
      },
      loadChart: () => import('../MonPlugin'),
      transformProps,
      controlPanel,
    });
  }
}
```

### `src/plugin/controlPanel.ts` — Panneau de config

```typescript
import { ControlPanelConfig, sections } from '@superset-ui/chart-controls';

const config: ControlPanelConfig = {
  controlPanelSections: [
    sections.legacyTimeseriesTime,
    {
      label: 'Configuration',
      expanded: true,
      controlSetRows: [
        ['x_axis'],
        ['metric'],
      ],
    },
  ],
};

export default config;
```

### `src/plugin/transformProps.ts` — Transformation

```typescript
import { ChartProps } from '@superset-ui/core';

export default function transformProps(chartProps: ChartProps) {
  const { width, height, formData, queriesData } = chartProps;
  const data = queriesData[0]?.data || [];
  return { width, height, data, ...formData };
}
```

### `package.json` — Dépendances minimales

```json
{
  "name": "mon-plugin",
  "version": "0.1.0",
  "main": "lib/index.js",
  "module": "esm/index.js",
  "files": ["esm", "lib"],
  "scripts": {
    "build": "node -e \"require('@superset-ui/npm-scripts').build()\"",
    "build:dev": "cross-env NODE_ENV=development npm run build"
  },
  "dependencies": {
    "@superset-ui/chart-controls": "*",
    "@superset-ui/core": "*"
  },
  "devDependencies": {
    "@superset-ui/npm-scripts": "*",
    "cross-env": "^7.0.3",
    "typescript": "^4.x"
  }
}
```

---

## 4. Configurer l'environnement local

### 4.1 — Backend Superset (Docker)

Créer `docker-compose.simple.yml` à la racine du projet :

```yaml
version: "3.8"
services:
  superset:
    image: apache/superset:4.1.1
    container_name: superset_dev
    ports:
      - "8088:8088"
    environment:
      SUPERSET_SECRET_KEY: "dev-secret-key-change-in-prod"
      PYTHONPATH: "/app/pythonpath"
    volumes:
      - ./superset_config.py:/app/pythonpath/superset_config.py
      - ./ma-base.db:/app/ma-base.db   # optionnel : base SQLite locale
    command: >
      bash -c "
        superset db upgrade &&
        superset fab create-admin
          --username admin
          --firstname Admin
          --lastname User
          --email admin@admin.com
          --password admin &&
        superset init &&
        superset run -h 0.0.0.0 -p 8088 --with-threads --reload
      "
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8088/health"]
      interval: 30s
      timeout: 10s
      retries: 5
```

Créer `superset_config.py` :

```python
PREVENT_UNSAFE_DB_CONNECTIONS = False

CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": ["*"],
    "resources": {"/*": {"origins": ["http://localhost:9000", "http://localhost:8088"]}},
}
ENABLE_CORS = True

SESSION_COOKIE_SAMESITE = None
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = False

WTF_CSRF_ENABLED = False

TALISMAN_ENABLED = False
TALISMAN_CONFIG = {
    "content_security_policy": False,
    "force_https": False,
    "force_https_permanent": False,
}
```

Lancer le backend :

```powershell
docker compose -f docker-compose.simple.yml up -d
docker ps   # vérifier que le container est healthy
```

### 4.2 — Installer le plugin dans Superset frontend

Dans `C:\superset\superset-frontend\package.json`, ajouter dans `dependencies` :

```json
"mon-plugin": "file:C:/Users/.../mon-plugin"
```

Puis installer :

```powershell
cd C:\superset\superset-frontend
$env:PATH = "$env:LOCALAPPDATA\nvm\v18.19.1;$env:PATH"
npm install
```

### 4.3 — Enregistrer le plugin dans MainPreset.js

Fichier : `C:\superset\superset-frontend\src\visualizations\presets\MainPreset.js`

Ajouter l'import avec les autres imports (ligne ~85) :

```javascript
import MonPlugin from 'mon-plugin';
```

Ajouter dans le tableau `configure` (ligne ~181) :

```javascript
new MonPlugin().configure({ key: 'mon-plugin' }),
```

---

## 5. Enregistrer le plugin dans Superset

Voir section 4.3 ci-dessus — le plugin doit être dans `MainPreset.js` pour apparaître dans l'interface.

---

## 6. Corriger les erreurs webpack connues

Ces corrections sont **permanentes** — à faire une seule fois sur le clone Superset 4.1.1.

### 6.1 — Fix `module is not defined` (micromark/escape-string-regexp)

Dans `C:\superset\superset-frontend\webpack.config.js`, ajouter au début du tableau `module.rules` :

```javascript
{
  // packages/superset-ui-core a ses propres node_modules avec des packages CJS
  // (micromark-*, escape-string-regexp, mdast-util-*, remark-gfm) que webpack 5
  // traite comme ESM à cause de "type":"module" dans les packages parents.
  test: /[\\/]packages[\\/]superset-ui-core[\\/]node_modules[\\/]/,
  type: 'javascript/auto',
},
```

### 6.2 — Fix `deck.gl/typed not exported`

Dans `webpack.config.js`, section `resolve.alias` :

```javascript
// deck.gl 9.x a supprimé le sous-chemin ./typed
'deck.gl/typed': path.resolve(path.join(APP_DIR, './node_modules/deck.gl')),
```

### 6.3 — Fix exports manquants dans `@luma.gl`

Créer `C:\superset\superset-frontend\luma-shims\shadertools.js` :

```javascript
'use strict';
const real = require('../node_modules/@luma.gl/shadertools/dist/index.cjs');
module.exports = Object.assign({}, real, {
  normalizeShaderModule: real.initializeShaderModule || (mod => mod),
  gouraudLighting: real.gouraudMaterial || {},
  phongLighting: real.phongMaterial || {},
  pbr: real.pbrMaterial || {},
});
```

Créer `C:\superset\superset-frontend\luma-shims\core.js` :

```javascript
'use strict';
const real = require('../node_modules/@luma.gl/core/dist/index.cjs');
module.exports = Object.assign({}, real, {
  getTypedArrayFromDataType: real.getTypedArrayConstructor || (() => undefined),
  getDataTypeFromTypedArray: real.getDataType || (() => undefined),
});
```

Dans `webpack.config.js`, section `resolve.alias` :

```javascript
'@luma.gl/shadertools$': path.resolve(path.join(APP_DIR, './luma-shims/shadertools.js')),
'@luma.gl/core$': path.resolve(path.join(APP_DIR, './luma-shims/core.js')),
```

### 6.4 — Fix proxy `localhost` → `127.0.0.1`

Dans `C:\superset\superset-frontend\webpack.proxy-config.js` :

```javascript
// Avant :
const backend = (supersetUrl || `http://localhost:${supersetPort}`).replace(
// Après :
const backend = (supersetUrl || `http://127.0.0.1:${supersetPort}`).replace(
```

> Raison : sur Windows, `localhost` peut résoudre vers IPv6 (`::1`) ce qui provoque un timeout.

---

## 7. Workflow de développement quotidien

### Démarrage (2 terminaux PowerShell)

**Terminal 1 — Backend Docker** (si pas déjà lancé) :

```powershell
cd C:\Users\...\mon-projet
docker compose -f docker-compose.simple.yml up -d
```

**Terminal 2 — Plugin (watch mode)** :

```powershell
cd C:\Users\...\mon-plugin
npm run build -- --watch
# ou si le script build:dev est défini :
npm run build:dev
```

**Terminal 3 — Superset frontend** :

```powershell
$env:PATH = "$env:LOCALAPPDATA\nvm\v18.19.1;$env:PATH"
cd C:\superset\superset-frontend
npm run dev-server
```

### Cycle de développement

```
Édite ton plugin → Sauvegarde → build:watch recompile → dev-server hot-reload → Page se rafraîchit
```

### Accès

- Frontend dev : http://localhost:9000
- Login : admin / admin
- Backend direct : http://127.0.0.1:8088

### Créer un dataset de test

1. **Databases** → + → choisir SQLite → URI : `sqlite:////app/ma-base.db`
2. **Datasets** → + → choisir la table
3. **Charts** → + Chart → chercher le nom de ton plugin

---

## 8. Troubleshooting

### `cross-env is not recognized`

```powershell
# npm install a été fait avec Node 24 au lieu de Node 18
$env:PATH = "$env:LOCALAPPDATA\nvm\v18.19.1;$env:PATH"
npm install cross-env
```

### `[ETIMEDOUT] proxying to http://localhost:8088`

→ Vérifier que le fix 6.4 (`127.0.0.1` au lieu de `localhost`) est appliqué.

### `nvm` non reconnu dans le terminal

→ `nvm` doit être dans un terminal ouvert **après** son installation.  
→ Activer manuellement : `$env:PATH = "$env:LOCALAPPDATA\nvm\v18.19.1;$env:PATH"`

### Le plugin n'apparaît pas dans Charts

→ Vérifier que l'import ET le `configure()` sont bien dans `MainPreset.js`  
→ Vérifier que le nom de la `key` correspond au `vizType` dans le plugin  
→ Hard refresh : Ctrl+Shift+R

### Warnings `caniuse-lite is outdated`

Ces warnings sont cosmétiques, ils n'affectent pas le build :

```powershell
cd C:\superset\superset-frontend
npx update-browserslist-db@latest
```

### Les 6 erreurs `@luma.gl` / deck.gl persistent

→ Vérifier que les fichiers `luma-shims/` existent bien  
→ Vérifier que les aliases `@luma.gl/shadertools$` et `@luma.gl/core$` sont dans `webpack.config.js`  
→ Redémarrer le dev server après toute modification de `webpack.config.js`

---

## Résumé des fichiers modifiés dans Superset 4.1.1

| Fichier | Modification |
|---|---|
| `webpack.config.js` | 4 correctifs : `javascript/auto`, alias `deck.gl/typed`, alias luma-shims, filtre overlay |
| `webpack.proxy-config.js` | `localhost` → `127.0.0.1` |
| `src/visualizations/presets/MainPreset.js` | Import + `.configure()` du plugin |
| `luma-shims/shadertools.js` | Nouveau fichier : shim @luma.gl/shadertools |
| `luma-shims/core.js` | Nouveau fichier : shim @luma.gl/core |
| `package.json` | Référence `file:` vers le plugin |
