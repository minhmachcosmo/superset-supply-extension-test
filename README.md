# 🏭 Supplychain Warehouse Map — Superset Plugin

Plugin Apache Superset affichant **20 warehouses internationaux sur une carte Leaflet interactive** avec drag & drop, géocodage Nominatim et mise à jour SQL en temps réel.

![Superset 4.1.1](https://img.shields.io/badge/Superset-4.1.1-blue) ![React 16](https://img.shields.io/badge/React-16.13.1-61dafb) ![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green)

---

## 🚀 Quick Start (from scratch)

### Prérequis

- **Node.js 18.19.1** (via nvm-windows : `nvm use 18.19.1`)
- **Docker Desktop** (pour Superset backend)
- **Python 3** (pour le générateur de données)

### 1. Cloner et installer

```bash
git clone https://github.com/minhmachcosmo/superset-supply-extension-test.git
cd superset-supply-extension-test
npm install --legacy-peer-deps
```

### 2. Générer la base de données SQLite

```bash
python generate_warehouses.py
# → supplychain_warehouses.db (20 warehouses, 5 continents)
```

### 3. Démarrer Superset (Docker)

```bash
docker compose -f docker-compose.simple.yml up -d
# Attendre ~30s que Superset initialise
# → http://localhost:8088 (admin / admin)
```

### 4. Configurer la base dans Superset

> ⚠️ **Étapes critiques** — sans elles, le plugin ne pourra pas écrire dans la DB.

1. **Database Connection** : Settings → Database Connections → + Database
   - SQLAlchemy URI : `sqlite:////app/superset_home/supplychain_warehouses.db`
   - Onglet **Advanced → Security** → ☑ **Allow DML** (requis pour UPDATE)
   - Test Connection → Connect

2. **Dataset** : Datasets → + Dataset
   - Database : celle créée ci-dessus
   - Schema : `main` — Table : `warehouses`

3. **Chart** : Créer un chart → Type `supplychain_warehouse`
   - Mapper les colonnes : name, address, latitude, longitude, stock_size
   - Chart Options : Database ID = `<ID de votre DB>` (visible dans l'URL), Table Name = `warehouses`

### 5. Builder le plugin

```bash
npm run build
```

### 6. Intégrer dans le frontend Superset

```bash
# Dans superset-frontend/package.json, ajouter :
"supplychain-warehouse": "file:<chemin-absolu-vers-ce-repo>"

# Installer
cd <superset-frontend>
npm install --legacy-peer-deps
```

Dans `superset-frontend/src/visualizations/presets/MainPreset.js` :

```js
import { SupplychainWarehouse } from 'supplychain-warehouse';

// Dans le tableau plugins :
new SupplychainWarehouse().configure({ key: 'supplychain_warehouse' }),
```

Relancer le dev server Superset (`npm run dev-server`).

---

## ⚠️ Pièges connus et solutions

### SQLite — "attempt to write a readonly database"

**Cause** : Le processus Superset tourne en user `superset` (uid=1000). Le répertoire `/app/` appartient à root avec permissions `drwxr-xr-x`. SQLite a besoin de créer des fichiers journal (`-wal`, `-shm`) **dans le même répertoire** que la DB.

**Solution** : Le volume est monté dans `/app/superset_home/` (volume Docker writable par l'user superset), pas `/app/` :

```yaml
# docker-compose.simple.yml
volumes:
  - ./supplychain_warehouses.db:/app/superset_home/supplychain_warehouses.db
```

**URI Superset** : `sqlite:////app/superset_home/supplychain_warehouses.db` (4 slashes)

### SQLite — "does not allow for DDL/DML"

**Cause** : Superset bloque les requêtes UPDATE/INSERT/DELETE par défaut sur chaque connexion database.

**Solution** : Cocher **Allow DML** dans Settings → Database Connections → Edit → Advanced → Security.

Ou via script Docker :

```bash
docker exec superset_brewery python3 -c "
from superset.app import create_app
app = create_app()
with app.app_context():
    from superset.extensions import db
    from superset.models.core import Database
    d = db.session.query(Database).filter_by(database_name='DB_supply').first()
    d.allow_dml = True
    db.session.commit()
    print(f'allow_dml={d.allow_dml}')
"
```

### Leaflet — "L.map is not a function"

**Cause** : Webpack ESM bundling — `import('leaflet')` retourne le module namespace, pas l'objet Leaflet directement.

**Solution** (appliquée dans le code) :

```typescript
import('leaflet').then(mod => {
  const L = ((mod as any).default as typeof import('leaflet')) || mod;
  // ...
});
```

### React 16 — "Cannot read properties of null (reading 'value')"

**Cause** : React 16 recycle les SyntheticEvents (pooling). Un `setEditForm(prev => ({ ...prev, field: e.target.value }))` crash car `e.target` est `null` quand le functional updater s'exécute.

**Solution** (appliquée dans le code) :

```typescript
onChange={e => { const v = e.target.value; setEditForm(prev => ({ ...prev, field: v })); }}
```

### SupersetClient.post — "request failed" (erreur opaque)

**Cause** : L'appel utilise `jsonPayload` + pas de `parseMethod`, alors que Superset interne utilise `body` + `parseMethod: 'json-bigint'`.

**Solution** (appliquée dans le code) — calquer le pattern de `sqlLab.js` :

```typescript
await SupersetClient.post({
  endpoint: '/api/v1/sqllab/execute/',
  body: JSON.stringify(payload),
  headers: { 'Content-Type': 'application/json' },
  parseMethod: 'json-bigint',
});
```

### Build — "@types/leaflet@1.9.x incompatible TypeScript 4"

**Cause** : `@types/leaflet@1.9.x` utilise le mot-clé `using` (TypeScript 5+).

**Solution** : Épingler à `"@types/leaflet": "1.7.11"` (pas de `^`).

### Build — "@superset-ui/core absent en standalone"

**Cause** : Le plugin déclare `@superset-ui/core` en `peerDependencies` mais ne l'installe pas. Le build TypeScript échoue.

**Solution** : Fichier `types/superset-shims.d.ts` avec des stubs `declare module`.

### PowerShell — BOM UTF-8 dans package.json

**Cause** : `Set-Content -Encoding UTF8` ajoute un BOM (Byte Order Mark) → webpack crash `SyntaxError: Unexpected token ﻿`.

**Solution** : Toujours utiliser `[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))`.

---

## 🎯 Features

- ✅ Carte Leaflet interactive (OpenStreetMap tiles)
- ✅ 20 warehouses internationaux (5 continents)
- ✅ Icônes SVG custom (bleu = normal, orange = en édition)
- ✅ Tooltip permanent (nom) + popup détails (adresse, stock, coords)
- ✅ Drag & drop des marqueurs + reverse géocodage automatique
- ✅ Panneau d'édition (adresse + coordonnées + Geocode/Save/Cancel)
- ✅ Géocodage Nominatim (OpenStreetMap)
- ✅ Mise à jour SQL en temps réel via SupersetClient → API sqllab
- ✅ FitBounds automatique sur tous les warehouses
- ✅ Responsive (resize fenêtre)

## 📁 Structure du projet

```
├── generate_warehouses.py          # Générateur SQLite (20 warehouses)
├── docker-compose.simple.yml       # Superset 4.1.1 Docker
├── superset_config.py              # Config Superset
├── supplychain_warehouses.db       # Base SQLite (générée)
├── src/
│   ├── SupplychainWarehouse.tsx    # Composant React principal (Leaflet)
│   ├── types.ts                    # Types TypeScript
│   ├── index.ts                    # Export principal
│   └── plugin/
│       ├── index.ts                # ChartPlugin registration
│       ├── controlPanel.ts         # Panneau de contrôle Superset
│       ├── buildQuery.ts           # Construction de la requête SQL
│       └── transformProps.ts       # Mapping data → props
├── types/
│   └── superset-shims.d.ts         # Stubs TypeScript pour peerDeps
├── test/                           # Tests Jest (4/4)
├── SPEC_SUPPLYCHAIN.md             # Spécifications complètes
├── IMPLEMENTATION_PLAN.md          # Plan d'implémentation (6 phases)
├── IMPLEMENTATION_PROGRESS.md      # Suivi de progression
└── AGENTS.md                       # Guidelines AI/LLM
```

## 🛠️ Stack technique

| Technologie | Version | Notes |
|------------|---------|-------|
| Apache Superset | 4.1.1 | Docker `apache/superset:4.1.1` |
| React | 16.13.1 | peerDependency — impose react-leaflet v3 |
| Leaflet | 1.9.4 | Carte interactive |
| react-leaflet | 3.2.5 | v3 pour compat React 16 (v4 = React 18+) |
| TypeScript | 4.1.2 | skipLibCheck, stubs dans types/ |
| Babel | 7.25.9 | preset-env/react/typescript |
| SQLite | — | Base de données warehouses |
| Node.js | 18.19.1 | via nvm-windows |

## 🔗 Links

- [GitHub Repository](https://github.com/minhmachcosmo/superset-supply-extension-test)
- [Apache Superset](https://superset.apache.org)
