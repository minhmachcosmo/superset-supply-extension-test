# Guide : Créer et tester un plugin Apache Superset

Basé sur l'expérience de développement du plugin `superset-brewery-extension-test-1`.  
Version Superset cible : **4.1.1**

> **Règle fondamentale :** la version du Docker backend et la version du frontend cloné doivent être **identiques**.  
> Utiliser `latest` est une erreur — Docker peut passer de 4.x à 6.x sans que tu le remarques, ce qui casse tous les templates HTML.

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
│       ├── buildQuery.ts      # Construction de la requête SQL
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
import buildQuery from './buildQuery';
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
      buildQuery,
      loadChart: () => import('../MonPlugin'),
      transformProps,
      controlPanel,
    });
  }
}
```

### `src/plugin/controlPanel.ts` — Panneau de config

> ⚠️ **Piège critique — format des `choices`**  
> `state.datasource?.columns` retourne des **objets complets** `{column_name, description, ...}`.  
> `SelectControl` attend des **tuples** `[value, label]`. Passer des objets bruts provoque un crash React :  
> `Objects are not valid as a React child (found: object with keys {column_name, ...})`

```typescript
import { t, validateNonEmpty } from '@superset-ui/core';
import { ControlPanelConfig, sharedControls } from '@superset-ui/chart-controls';

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'x_axis_column',
            config: {
              type: 'SelectControl',
              label: t('X-Axis Column'),
              default: null,
              // ✅ Mapper en tuples [valeur, label] — NE PAS passer les objets directement
              mapStateToProps: (state: any) => ({
                choices: (state.datasource?.columns || []).map(
                  (c: any) => [c.column_name, c.verbose_name || c.column_name]
                ),
              }),
              validators: [validateNonEmpty],
            },
          },
        ],
        ['adhoc_filters'],
        [{ name: 'row_limit', config: { ...sharedControls.row_limit, default: 10000 } }],
      ],
    },
  ],
};

export default config;
```

### `src/plugin/buildQuery.ts` — Construction de la requête

> ⚠️ **Piège critique — boilerplate invalide**  
> Le template par défaut utilise `formData.cols` (champ de la table standard) qui est `undefined` dans un plugin custom.  
> Résultat : `Error: Empty query?` car la requête n'a ni colonnes, ni métriques, ni groupby.

```typescript
import { buildQueryContext, QueryFormData } from '@superset-ui/core';

export default function buildQuery(formData: QueryFormData) {
  // ✅ Lire les champs custom définis dans controlPanel.ts
  const { x_axis_column, y_axis_column, series_column } = formData;

  // Construire la liste des colonnes à sélectionner (SELECT brut, sans agrégation)
  const columns = [x_axis_column, y_axis_column, series_column].filter(
    (col): col is string => Boolean(col),
  );

  return buildQueryContext(formData, baseQueryObject => [
    {
      ...baseQueryObject,
      columns,   // → SELECT x, y, series FROM table
      metrics: [],
      groupby: [],
    },
  ]);
}
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
services:
  superset:
    image: apache/superset:4.1.1   # ⚠️ Toujours épingler — jamais "latest"
    container_name: superset_dev
    ports:
      - "8088:8088"
    environment:
      - SUPERSET_SECRET_KEY=change-this-in-production
      - SUPERSET_ENV=production
      - PYTHONPATH=/app/pythonpath
    volumes:
      - ./superset_config.py:/app/pythonpath/superset_config.py:ro
      - ./ma-base.db:/app/ma-base.db:ro   # optionnel : base SQLite locale
      - superset_home:/app/superset_home
    command: >
      bash -c "
      superset db upgrade &&
      superset fab create-admin --username admin --firstname Admin --lastname User --email admin@admin.com --password admin 2>/dev/null || true &&
      superset init &&
      superset run -h 0.0.0.0 -p 8088 --with-threads --reload --debugger
      "
    restart: unless-stopped

volumes:
  superset_home:
```

> ⚠️ **Ne jamais écrire `version: "3.8"`** — cet attribut est obsolète dans Docker Compose v2 et génère un warning.

Créer `superset_config.py` :

```python
PREVENT_UNSAFE_DB_CONNECTIONS = False

# Désactiver la compression HTTP côté backend.
# Le proxy webpack (processHTML) n'a pas à décompresser les réponses
# → évite le contenu binaire illisible sur Windows.
COMPRESS_REGISTER = False
COMPRESS_ENABLED = False

# Cookies de session accessibles depuis le dev server (localhost:9000)
SESSION_COOKIE_SAMESITE = None
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = False

WTF_CSRF_ENABLED = False

# Désactiver CSP pour le développement local
TALISMAN_ENABLED = False
TALISMAN_CONFIG = {
    "content_security_policy": False,
    "force_https": False,
    "force_https_permanent": False,
}
```

> ⚠️ **Ne pas ajouter `ENABLE_CORS = True`** — ce paramètre essaie d'importer `flask_cors`
> qui n'est pas disponible dans l'image `apache/superset:4.1.1` et fait crasher le container.
> CORS n'est pas nécessaire : tout passe par le proxy webpack
> (`browser → localhost:9000 → proxy → Flask`), Flask ne reçoit jamais de requêtes cross-origin.

Lancer le backend :

```powershell
cd C:\Users\...\mon-projet
docker compose -f docker-compose.simple.yml up -d
docker logs -f superset_dev   # attendre "Running on http://0.0.0.0:8088"
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

### 6.5 — Fix contenu binaire illisible (garbled content) sur Windows

Le proxy webpack utilise `selfHandleResponse: true` et retraite les réponses HTML du backend.
Sur Windows, la décompression en streaming (`createGunzip`) peut échouer silencieusement
et envoyer des octets binaires bruts au navigateur.

**Deux protections à mettre en place dans `webpack.proxy-config.js` :**

**a) Demander au backend de ne pas compresser (dans `module.exports`) :**

```javascript
onProxyReq(proxyReq) {
  // Demander une réponse non compressée pour éviter les problèmes de décompression Windows
  proxyReq.setHeader('accept-encoding', 'identity');
},
```

**b) Réécrire `processHTML` avec une stratégie collect-puis-décompresse :**

```javascript
function processHTML(proxyResponse, response) {
  const chunks = [];
  proxyResponse.on('data', chunk => chunks.push(chunk));
  proxyResponse.on('error', err => {
    console.error('[proxy] stream error:', err);
    response.end(`Error fetching proxied request: ${err.message}`);
  });
  proxyResponse.on('end', () => {
    const raw = Buffer.concat(chunks);
    const encoding = proxyResponse.headers['content-encoding'];
    function finish(buf) {
      response.end(toDevHTML(buf.toString('utf8')));
    }
    if (encoding === 'gzip') {
      zlib.gunzip(raw, (err, decoded) => {
        if (err) { response.end(`[proxy] gunzip failed: ${err.message}`); }
        else { finish(decoded); }
      });
    } else if (encoding === 'br') {
      zlib.brotliDecompress(raw, (err, decoded) => {
        if (err) { response.end(`[proxy] brotli failed: ${err.message}`); }
        else { finish(decoded); }
      });
    } else if (encoding === 'deflate') {
      zlib.inflate(raw, (err, decoded) => {
        if (err) { response.end(`[proxy] inflate failed: ${err.message}`); }
        else { finish(decoded); }
      });
    } else {
      finish(raw);
    }
  });
}
```

> Pourquoi : la version streaming (`createGunzip().pipe()`) peut échouer silencieusement sur Windows
> et livrer des octets corrompus sans déclencher le handler d'erreur.
> La version callback (`zlib.gunzip()`) garantit que les erreurs sont toujours catchées.

### 6.6 — Désactiver la compression webpack devServer

Dans `webpack.config.js`, section `devServer` :

```javascript
compress: false, // Désactiver gzip — évite le contenu illisible via le proxy sur Windows
```

### 6.7 — Filtrer les erreurs overlay deck.gl / luma.gl

Dans `webpack.config.js`, section `devServer.client` :

```javascript
client: {
  overlay: {
    errors: error =>
      typeof error === 'string'
        ? !/@luma\.gl|@deck\.gl/.test(error)
        : true,
    warnings: false,
    runtimeErrors: error => !/ResizeObserver/.test(error.message),
  },
  logging: 'error',
},
```

---

## 7. Workflow de développement quotidien

### Script de démarrage : `start_dev.ps1`

Crée ce script à la racine du projet (ou copie celui du dépôt) :

```powershell
# Rafraichir le PATH système
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Activer Node 18 automatiquement depuis nvm-windows
$nvmDir = "$env:LOCALAPPDATA\nvm"
if (Test-Path $nvmDir) {
    $node18 = Get-ChildItem $nvmDir -Directory |
        Where-Object { $_.Name -match '^v18\.' } |
        Sort-Object Name -Descending |
        Select-Object -First 1
    if ($node18) {
        $env:Path = "$($node18.FullName);$env:Path"
        Write-Host "Node actif : $(node --version)" -ForegroundColor Green
    }
}

# Vérifier les prérequis
if (-not (Get-Command zstd -ErrorAction SilentlyContinue)) {
    Write-Host "ERREUR: zstd manquant. Lance: winget install Meta.Zstandard" -ForegroundColor Red
    exit 1
}

# Libérer le port 9000
$pids = netstat -ano | Select-String ":9000 " | ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique
foreach ($pid in $pids) {
    if ($pid -match '^\d+$' -and $pid -ne '0') { taskkill /PID $pid /F 2>$null | Out-Null }
}

Set-Location "C:\superset\superset-frontend"
npm run dev-server
```

> Le script détecte automatiquement la version Node 18 installée par nvm-windows,
> vérifie que `zstd` est présent (requis pour le cache webpack), et libère le port 9000.

### Démarrage complet

**Terminal 1 — Backend Docker** (si pas déjà lancé) :

```powershell
cd C:\Users\...\mon-projet
docker compose -f docker-compose.simple.yml up -d
```

**Terminal 2 — Plugin en watch mode** :

```powershell
cd C:\Users\...\mon-plugin
npm run build:dev   # ou npm run build -- --watch
```

**Terminal 3 — Dev server Superset** :

```powershell
.\start_dev.ps1
# Attendre "webpack compiled successfully"
```

### Cycle de développement

```
Édite ton plugin → Sauvegarde
  → build:watch recompile le plugin
  → dev-server détecte le changement → hot-reload
  → Page se rafraîchit dans le navigateur
```

### Accès

- Frontend dev : http://localhost:9000
- Login : `admin` / `admin`
- Backend direct : http://127.0.0.1:8088

### Créer un dataset de test

1. **Settings → Database Connections → +** → SQLite → URI : `sqlite:////app/ma-base.db`
2. **Datasets → + DATASET** → choisir la table
3. **Charts → + CHART** → chercher le nom de ton plugin → configurer → Run

---

## 8. Troubleshooting

### 🔴 Contenu binaire illisible dans le navigateur (garbled content)

**Symptôme :** la page affiche des caractères bizarres comme `(¤/¤\`¤'eo꟔.¤¤¤¤0¤2KC...`

**Causes possibles et solutions :**

1. **Le backend compresse les réponses HTML** → Appliquer le fix 6.5 (`COMPRESS_REGISTER = False` + `onProxyReq` + réécriture `processHTML`)
2. **Le dev server n'a pas été redémarré** après modification de `webpack.proxy-config.js` → Ctrl+C puis relancer `start_dev.ps1`
3. **Cache webpack corrompu** → Supprimer `C:\superset\superset-frontend\.temp_cache` puis relancer

### 🔴 `ModuleNotFoundError: No module named 'flask_cors'`

**Symptôme :** le container Docker crashe en boucle (`Restarting`).

**Cause :** `ENABLE_CORS = True` dans `superset_config.py` tente d'importer `flask_cors` qui n'est pas disponible dans `apache/superset:4.1.1`.

**Solution :** supprimer complètement `ENABLE_CORS` et `CORS_OPTIONS` de `superset_config.py` (voir section 4.1). Ce n'est pas nécessaire avec le proxy webpack.

### 🔴 Page de login vide / sans formulaire

**Symptôme :** la page s'ouvre mais aucun formulaire username/password n'apparaît.

**Cause :** mismatch de version entre Docker backend et frontend cloné.
- Docker `latest` peut être Superset 6.x — ses templates HTML n'incluent pas les mêmes bundles que la v4.1.1
- Sans le bon bundle JS, React ne rend pas le formulaire

**Solution :**
```powershell
# Arrêter et supprimer le container ET son volume (schéma DB incompatible)
docker compose -f docker-compose.simple.yml down -v

# Relancer avec la bonne version (4.1.1 dans docker-compose.simple.yml)
docker compose -f docker-compose.simple.yml up -d
docker logs -f superset_dev   # attendre "Running on http://0.0.0.0:8088"
```

### 🔴 `[ETIMEDOUT] proxying to http://localhost:8088`

→ Appliquer le fix 6.4 : remplacer `localhost` par `127.0.0.1` dans `webpack.proxy-config.js`.

### 🔴 `cross-env is not recognized`

```powershell
# npm install a été fait avec Node 24 au lieu de Node 18
$env:PATH = "$env:LOCALAPPDATA\nvm\v18.19.1;$env:PATH"
npm install cross-env
```

### 🔴 `nvm` non reconnu dans le terminal

→ `nvm` doit être dans un terminal ouvert **après** son installation.  
→ Activer manuellement : `$env:PATH = "$env:LOCALAPPDATA\nvm\v18.19.1;$env:PATH"`  
→ Ou utiliser `start_dev.ps1` qui active Node 18 automatiquement.

### 🔴 Le plugin n'apparaît pas dans Charts

→ Vérifier que l'import ET le `configure()` sont bien dans `MainPreset.js`  
→ Vérifier que la `key` correspond au `vizType` dans le plugin  
→ Hard refresh : Ctrl+Shift+R

### 🔴 `Objects are not valid as a React child` (crash Y-axis dropdown)

Erreur au moment de choisir une colonne dans un `SelectControl` (X-axis, Y-axis, Series).

**Cause :** `mapStateToProps` retourne `state.datasource?.columns` directement, qui contient des **objets** au lieu de tuples `[value, label]`.

**Fix dans `controlPanel.ts` — pour chaque `SelectControl` :**
```typescript
// ❌ Cassé
mapStateToProps: (state: any) => ({
  choices: state.datasource?.columns || [],
}),

// ✅ Correct
mapStateToProps: (state: any) => ({
  choices: (state.datasource?.columns || []).map(
    (c: any) => [c.column_name, c.verbose_name || c.column_name]
  ),
}),
```

### 🔴 `Error: Empty query?` (le chart ne charge pas)

Erreur backend au moment du rendu du chart après avoir configuré les axes.

**Cause :** Le template `buildQuery.ts` lit `formData.cols` (champ standard de la table), qui est `undefined` dans un plugin custom avec des champs `SelectControl` personnalisés. La requête générée est vide (pas de colonnes, pas de métriques).

**Fix dans `buildQuery.ts` :**
```typescript
// ❌ Boilerplate cassé
export default function buildQuery(formData: QueryFormData) {
  const { cols: groupby } = formData; // cols = undefined !
  return buildQueryContext(formData, base => [{ ...base, groupby }]);
}

// ✅ Correct : lire les champs définis dans controlPanel.ts
export default function buildQuery(formData: QueryFormData) {
  const { x_axis_column, y_axis_column, series_column } = formData;
  const columns = [x_axis_column, y_axis_column, series_column].filter(Boolean);
  return buildQueryContext(formData, base => [
    { ...base, columns, metrics: [], groupby: [] },
  ]);
}
```

### ⚠️ Warnings `caniuse-lite is outdated`

Ces warnings sont cosmétiques et n'affectent pas le build :

```powershell
cd C:\superset\superset-frontend
npx update-browserslist-db@latest
```

### ⚠️ Warnings console React au démarrage

Ces deux warnings apparaissent toujours en mode développement — ils sont **inoffensifs** :

```
TranslatorSingleton.ts: You should call configure(...) before calling other methods
React-Hot-Loader: react-🔥-dom patch is not detected. React 16.6+ features may not work.
```

Ils n'empêchent pas l'application de fonctionner.

### ⚠️ Les 6 erreurs `@luma.gl` / deck.gl persistent

→ Vérifier que les fichiers `luma-shims/` existent bien  
→ Vérifier que les aliases `@luma.gl/shadertools$` et `@luma.gl/core$` sont dans `webpack.config.js`  
→ Redémarrer le dev server après toute modification de `webpack.config.js`

---

## Résumé des fichiers modifiés dans Superset 4.1.1

| Fichier | Modification |
|---|---|
| `webpack.config.js` | `javascript/auto` rule, alias `deck.gl/typed`, alias luma-shims, `compress:false`, filtre overlay |
| `webpack.proxy-config.js` | `localhost` → `127.0.0.1`, `onProxyReq` accept-encoding identity, réécriture `processHTML` |
| `src/visualizations/presets/MainPreset.js` | Import + `.configure()` du plugin |
| `luma-shims/shadertools.js` | Nouveau fichier : shim @luma.gl/shadertools |
| `luma-shims/core.js` | Nouveau fichier : shim @luma.gl/core |
| `package.json` | Référence `file:` vers le plugin |

## Résumé des fichiers de ton projet plugin

| Fichier | Rôle |
|---|---|
| `docker-compose.simple.yml` | Backend Superset 4.1.1 — version épinglée, sans `version:` |
| `superset_config.py` | Config Flask : CSRF off, TALISMAN off, compression off, cookies session |
| `start_dev.ps1` | Lance le dev server avec Node 18 auto-détecté et port 9000 libéré |
| `simulation_stock.db` | Base SQLite de test (exclue de git via `.gitignore`) |
| `src/plugin/buildQuery.ts` | Requête SQL : colonnes issues des champs custom (pas `formData.cols`) |
| `src/plugin/controlPanel.ts` | Panneau de config : `choices` en tuples `[value, label]` (pas d'objets bruts) |
