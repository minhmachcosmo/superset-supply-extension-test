# Plan d'implémentation — Supplychain Warehouse Map Plugin

> Ce document est destiné à Claude Sonnet comme guide d'implémentation pas à pas.
> Chaque phase doit être complétée et validée avant de passer à la suivante.
> Consulter les fichiers de référence avant chaque phase.

---

## Fichiers de référence

| Fichier                      | Rôle                                                        |
|------------------------------|-------------------------------------------------------------|
| `SPEC_SUPPLYCHAIN.md`        | Spécifications fonctionnelles et techniques complètes       |
| `AGENTS.md`                  | Guidelines Apache Superset (code standards, patterns)       |
| `SUPERSET_PLUGIN_GUIDE.md`   | Guide technique : structure plugin, pièges connus, webpack  |

---

## Phase 0 — Préparation des données

### 0.1 — Créer `generate_warehouses.py`

**Objectif :** Générer le dataset SQLite avec 20 warehouses internationaux.

**Instructions :**
1. Lire la section "Données" de `SPEC_SUPPLYCHAIN.md` pour le schéma exact et la liste des 20 warehouses
2. Créer le script `generate_warehouses.py` à la racine du projet
3. Le script doit :
   - Utiliser uniquement `sqlite3` (lib standard Python, pas de pandas)
   - Créer `supplychain_warehouses.db` avec la table `warehouses`
   - Être idempotent (`DROP TABLE IF EXISTS` + `CREATE TABLE`)
   - Insérer les 20 warehouses définis dans la spec (5 continents, adresses réalistes)
   - Afficher un résumé en console (nb lignes, répartition par continent)
4. Exécuter le script et vérifier que la base est créée

**Validation :**
```bash
python generate_warehouses.py
# Doit afficher : 20 warehouses insérés (Europe: 5, NA: 4, APAC: 5, MEA: 4, LATAM: 2)
sqlite3 supplychain_warehouses.db "SELECT id, name, latitude, longitude FROM warehouses"
# Doit afficher 20 lignes
```

### 0.2 — Mettre à jour `docker-compose.simple.yml`

**Objectif :** Monter la nouvelle base SQLite en lecture-écriture dans Docker.

**Instructions :**
1. Lire le fichier `docker-compose.simple.yml` existant
2. Ajouter le volume `./supplychain_warehouses.db:/app/superset_home/supplychain_warehouses.db` (dans `/app/superset_home/` car `/app/` n'est pas writable par l'user superset → SQLite ne peut pas créer ses fichiers journal)
3. Conserver le volume existant `simulation_stock.db` si présent
4. Renommer le `container_name` en `superset_supplychain` (optionnel)

**Validation :**
```bash
docker compose -f docker-compose.simple.yml up -d
docker exec superset_supplychain python3 -c "import sqlite3; print(sqlite3.connect('/app/superset_home/supplychain_warehouses.db').execute('SELECT COUNT(*) FROM warehouses').fetchone()[0])"
# Doit afficher : 20
```

---

## Phase 1 — Installation des dépendances

### 1.1 — Mettre à jour `package.json`

**Objectif :** Ajouter les dépendances Leaflet pour la carte interactive.

**Instructions :**
1. Lire `package.json` existant
2. Ajouter dans `dependencies` :
   - `"leaflet": "^1.9.4"`
   - `"react-leaflet": "^3.2.5"`
3. Ajouter dans `devDependencies` :
   - `"@types/leaflet": "1.7.11"` (épinglé sans `^` — la v1.9.x utilise `using` qui requiert TypeScript 5+)
4. Retirer `echarts` et `echarts-for-react` de `dependencies` (plus nécessaires)
5. Exécuter `npm install`

**⚠️ Compatibilité React :**
- `react-leaflet` v4 requiert React ≥ 18. Si React 16.13.1 est utilisé (Superset 4.1.1), utiliser `react-leaflet` v3 (`"react-leaflet": "^3.2.5"`)
- Vérifier dans `node_modules/react/package.json` la version de React disponible
- Si React 16 : utiliser `react-leaflet@3.x` + `@react-leaflet/core@1.x`

**Validation :**
```bash
npm install
npm ls leaflet
npm ls react-leaflet
# Les packages doivent être résolus sans erreur
```

---

## Phase 2 — Types et configuration plugin

### 2.1 — Modifier `src/types.ts`

**Objectif :** Définir les types TypeScript pour le domaine warehouse.

**Instructions :**
1. Lire `src/types.ts` existant et `SPEC_SUPPLYCHAIN.md` section "types.ts"
2. Supprimer les types V1 (`SupplychainWhareouseStylesProps`, etc.)
3. Créer les interfaces :
   - `WarehouseRecord` (id, name, address, latitude, longitude, stock_size)
   - `SupplychainWarehouseStylesProps` (height, width)
   - `SupplychainWarehouseCustomizeProps` (nameColumn, addressColumn, latitudeColumn, longitudeColumn, stockColumn, databaseId, tableName)
   - `SupplychainWarehouseQueryFormData`
   - `SupplychainWarehouseProps`
4. Conserver l'import `QueryFormData` de `@superset-ui/core`

**⚠️ Convention de nommage :** Corriger le typo "Whareouse" → "Warehouse" dans tous les nouveaux types.

### 2.2 — Modifier `src/plugin/controlPanel.ts`

**Objectif :** Configurer le panneau de contrôle avec les colonnes de la carte.

**Instructions :**
1. Lire `src/plugin/controlPanel.ts` existant
2. Lire la section "controlPanel.ts" de `SPEC_SUPPLYCHAIN.md`
3. Consulter `SUPERSET_PLUGIN_GUIDE.md` section "controlPanel.ts" pour le pattern `mapStateToProps` en tuples
4. Créer la section Query avec 5 `SelectControl` :
   - `name_column` (Name Column)
   - `address_column` (Address Column)
   - `latitude_column` (Latitude Column)
   - `longitude_column` (Longitude Column)
   - `stock_column` (Stock Column)
5. Ajouter `adhoc_filters` et `row_limit`
6. Créer la section Chart Options avec :
   - `database_id` (TextControl, numérique)
   - `table_name` (TextControl, défaut: "warehouses")
7. **Chaque SelectControl** doit utiliser `mapStateToProps` avec `.map(c => [c.column_name, c.verbose_name || c.column_name])`

### 2.3 — Modifier `src/plugin/buildQuery.ts`

**Objectif :** Construire la requête SELECT pour récupérer les warehouses.

**Instructions :**
1. Lire `src/plugin/buildQuery.ts` existant
2. Lire `SUPERSET_PLUGIN_GUIDE.md` section "buildQuery.ts" pour le pattern
3. Lire les colonnes depuis `formData` : `name_column`, `address_column`, `latitude_column`, `longitude_column`, `stock_column`
4. Ajouter la colonne `id` en dur (toujours nécessaire pour les UPDATE)
5. Construire : `columns = ['id', name_column, address_column, latitude_column, longitude_column, stock_column].filter(Boolean)`
6. Retourner `buildQueryContext` avec `metrics: []` et `groupby: []`

### 2.4 — Modifier `src/plugin/transformProps.ts`

**Objectif :** Transformer les données brutes en props pour le composant carte.

**Instructions :**
1. Lire `src/plugin/transformProps.ts` existant
2. Extraire `width`, `height`, `formData`, `queriesData` de `chartProps`
3. Mapper les données en `WarehouseRecord[]` en utilisant les noms de colonnes de `formData`
4. Retourner : `{ width, height, data, nameColumn, addressColumn, latitudeColumn, longitudeColumn, stockColumn, databaseId, tableName }`

**Validation Phase 2 :**
```bash
npx tsc --noEmit
# Doit compiler sans erreur (sauf le composant principal pas encore créé)
```

---

## Phase 3 — Composant carte principal

### 3.1 — Créer `src/SupplychainWarehouse.tsx`

**Objectif :** Composant React avec carte Leaflet interactive.

**Instructions :**
1. Lire `SPEC_SUPPLYCHAIN.md` section "SupplychainWarehouse.tsx" pour la structure complète
2. Supprimer le contenu de l'ancien `src/SupplychainWharehouse.tsx` (line chart ECharts) ou le renommer
3. Créer le nouveau composant `src/SupplychainWarehouse.tsx` avec :

**Structure en 3 parties :**

#### A. Import et setup Leaflet
- Importer `leaflet` et `react-leaflet` (`MapContainer`, `TileLayer`, `Marker`, `Tooltip`, `Popup`, `useMap`)
- Importer le CSS Leaflet (⚠️ peut nécessiter une injection inline si les imports CSS ne fonctionnent pas avec le build)
- Créer l'icône warehouse custom (icône SVG inline via `L.divIcon` ou `L.icon`)

#### B. Composant carte
- `MapContainer` avec tiles OpenStreetMap
- Un `Marker` par warehouse avec :
  - Icône warehouse personnalisée
  - `Tooltip permanent` avec le nom
  - `Popup` avec détails (nom, adresse, stock)
  - `draggable` conditionnel (seulement si en mode édition)
  - `eventHandlers` : `click` → ouvrir panneau, `dragend` → capturer nouvelles coords
- Sous-composant `FitBounds` utilisant `useMap()` + `map.fitBounds()` pour centrer sur tous les marqueurs

#### C. Panneau d'édition
- Affiché en bas du composant quand un warehouse est sélectionné
- Champs : adresse (texte), latitude (nombre), longitude (nombre)
- Bouton `📍 Géocoder` → appel API Nominatim
- Bouton `💾 Enregistrer` → appel `SupersetClient.post()` pour UPDATE SQL
- Bouton `❌ Annuler` → fermer le panneau, restaurer la position

#### D. Fonctions utilitaires
- `geocodeAddress(address)` → fetch Nominatim → `{ lat, lng }`
- `updateWarehouse(warehouse)` → `SupersetClient.post()` → UPDATE SQL
- Gestion d'état : `useState` pour `warehouses`, `editingId`, `editForm`, `isLoading`

**⚠️ Points d'attention :**
- **CSS Leaflet** : Le composant ne fonctionnera pas sans le CSS Leaflet. Tenter d'abord `import 'leaflet/dist/leaflet.css'`. Si le build échoue, injecter le CSS via un `<style>` tag dans le composant.
- **Icônes Leaflet** : Les icônes par défaut de Leaflet ont un bug connu avec les bundlers. Utiliser `L.divIcon` avec du HTML/SVG inline pour éviter ce problème.
- **React 16 compat** : Pas de `useId()`, pas de `startTransition()`, pas de `React.lazy()` avec Suspense boundaries.

### 3.2 — Modifier `src/plugin/index.ts`

**Instructions :**
1. Mettre à jour `loadChart` pour pointer vers `'../SupplychainWarehouse'`
2. Mettre à jour les métadonnées :
   - `name: t('Supplychain Warehouse')`
   - `description: 'Interactive warehouse map with drag & drop'`

### 3.3 — Modifier `src/index.ts`

**Instructions :**
1. Mettre à jour l'export pour pointer vers le bon composant
2. Mettre à jour le commentaire descriptif

**Validation Phase 3 :**
```bash
npx tsc --noEmit
# Doit compiler sans erreur

npm run build
# Doit passer sans erreur
```

---

## Phase 4 — Tests

### 4.1 — Mettre à jour `test/index.test.ts`

**Instructions :**
1. Mettre à jour l'import pour `SupplychainWarehouse`
2. Vérifier que le plugin existe et est défini
3. Mettre à jour le `describe` pour `'supplychain-warehouse'`

### 4.2 — Mettre à jour `test/plugin/buildQuery.test.ts`

**Instructions :**
1. Mettre à jour le `describe`
2. Tester avec les nouveaux champs : `name_column`, `latitude_column`, etc.
3. Vérifier que `columns` contient les bonnes colonnes et que `metrics` et `groupby` sont vides

### 4.3 — Mettre à jour `test/plugin/transformProps.test.ts`

**Instructions :**
1. Mettre à jour avec les nouveaux types de données warehouse
2. Tester que les données sont correctement mappées en `WarehouseRecord[]`

**Validation Phase 4 :**
```bash
npm test
# Tous les tests doivent passer
```

---

## Phase 5 — Intégration et polish

### 5.1 — Nettoyage

**Instructions :**
1. Supprimer l'ancien fichier `src/SupplychainWharehouse.tsx` (V1 ECharts) si un nouveau fichier a été créé
2. Supprimer les imports `echarts` / `echarts-for-react` inutilisés
3. Vérifier qu'aucune référence à l'ancien nom "Brewery" ou "Whareouse" (typo) ne subsiste
4. Vérifier les headers Apache License sur tous les nouveaux fichiers

### 5.2 — Build final

```bash
npx tsc --noEmit   # TypeScript strict
npm run build       # Build complet (CJS + ESM)
npm test            # Tests unitaires
```

### 5.3 — Test d'intégration avec Superset

1. Démarrer Docker : `docker compose -f docker-compose.simple.yml up -d`
2. Créer la connexion DB dans Superset : `sqlite:////app/superset_home/supplychain_warehouses.db`
   - ⚠️ Onglet Advanced → Security → **cocher Allow DML** (sinon UPDATE bloqué)
3. Créer le dataset sur la table `warehouses`
4. Créer un nouveau chart → choisir "Supplychain Warehouse"
5. Configurer les colonnes (name, address, latitude, longitude, stock_size)
6. Configurer le Database ID et Table Name dans Chart Options
7. Vérifier que les 20 warehouses s'affichent sur la carte du monde
8. Vérifier les 10 points de la checklist du plan de test dans `SPEC_SUPPLYCHAIN.md`

### 5.4 — Commit et push

```bash
git add -A
git commit -m "feat(plugin): supplychain warehouse map with drag & drop"
git push origin main
```

---

## Résumé des fichiers à toucher

| Fichier | Action | Phase |
|---------|--------|-------|
| `generate_warehouses.py` | CRÉER | 0 |
| `docker-compose.simple.yml` | MODIFIER | 0 |
| `package.json` | MODIFIER | 1 |
| `src/types.ts` | MODIFIER | 2 |
| `src/plugin/controlPanel.ts` | MODIFIER | 2 |
| `src/plugin/buildQuery.ts` | MODIFIER | 2 |
| `src/plugin/transformProps.ts` | MODIFIER | 2 |
| `src/SupplychainWarehouse.tsx` | CRÉER | 3 |
| `src/SupplychainWharehouse.tsx` | SUPPRIMER | 5 |
| `src/plugin/index.ts` | MODIFIER | 3 |
| `src/index.ts` | MODIFIER | 3 |
| `test/index.test.ts` | MODIFIER | 4 |
| `test/plugin/buildQuery.test.ts` | MODIFIER | 4 |
| `test/plugin/transformProps.test.ts` | MODIFIER | 4 |

---

## Ordre strict d'exécution

```
Phase 0 ─── generate_warehouses.py + docker-compose
    │
Phase 1 ─── package.json + npm install
    │
Phase 2 ─── types.ts → controlPanel.ts → buildQuery.ts → transformProps.ts
    │
Phase 3 ─── SupplychainWarehouse.tsx → plugin/index.ts → index.ts
    │
Phase 4 ─── Tests unitaires
    │
Phase 5 ─── Nettoyage → Build → Test intégration → Commit
```
