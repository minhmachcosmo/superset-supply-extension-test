# SPEC — Supplychain Warehouse Map Plugin

## Objectif

Créer un plugin Apache Superset permettant d'**afficher des warehouses sur une carte interactive** et de les **déplacer** (drag & drop ou saisie de coordonnées/adresse). Chaque déplacement met à jour le dataset SQLite en conséquence.

---

## Vue UI cible

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🏭 Supplychain Warehouse Map                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                             │ │
│ │        ┌──────────┐                                                        │ │
│ │        │ 🏭       │                                                        │ │
│ │        │ Paris DC  │        ┌──────────┐                                   │ │
│ │        └──────────┘        │ 🏭       │                                   │ │
│ │                             │ Lyon Hub  │                                   │ │
│ │                             └──────────┘                                   │ │
│ │                                              ┌──────────┐                  │ │
│ │     ┌──────────┐                             │ 🏭       │                  │ │
│ │     │ 🏭       │                             │ Marseille │                  │ │
│ │     │ Bordeaux  │                             └──────────┘                  │ │
│ │     └──────────┘                                                           │ │
│ │                                                                             │ │
│ │   [OpenStreetMap / Leaflet tiles]                        🔍 + / -          │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Panneau d'édition (affiché au clic sur un warehouse) ──────────────────────┐│
│ │  Warehouse: Paris DC                                                         ││
│ │  Adresse:   [12 rue de Rivoli, Paris___________] [📍 Géocoder]              ││
│ │  Latitude:  [48.8566___]  Longitude: [2.3522___]                            ││
│ │  Stock:     15000                                                            ││
│ │  [💾 Enregistrer]  [❌ Annuler]                                              ││
│ └──────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Données

### Schéma de la table `warehouses`

| Colonne       | Type    | Description                              | Exemple                          |
|---------------|---------|------------------------------------------|----------------------------------|
| `id`          | INTEGER | Identifiant unique (PK, auto-increment)  | 1                                |
| `name`        | TEXT    | Nom du warehouse                         | "Paris Distribution Center"      |
| `address`     | TEXT    | Adresse postale complète                 | "12 rue de Rivoli, 75001 Paris"  |
| `latitude`    | REAL    | Latitude GPS (WGS84)                     | 48.8566                          |
| `longitude`   | REAL    | Longitude GPS (WGS84)                    | 2.3522                           |
| `stock_size`  | INTEGER | Capacité / stock actuel en unités        | 15000                            |

### Dataset à générer

**Fichier : `generate_warehouses.py`** (racine du projet)

Générer **20 warehouses** répartis sur tous les continents de manière réaliste (hubs logistiques internationaux) :

#### Europe (5)

| # | Nom                              | Ville        | Pays        | Latitude | Longitude | Stock  |
|---|----------------------------------|--------------|-------------|----------|-----------|--------|
| 1 | Rotterdam Euro Hub               | Rotterdam    | Pays-Bas    | 51.9244  | 4.4777    | 45000  |
| 2 | Frankfurt Central Depot          | Francfort    | Allemagne   | 50.1109  | 8.6821    | 38000  |
| 3 | Paris Distribution Center        | Paris        | France      | 48.8566  | 2.3522    | 22000  |
| 4 | Barcelona Mediterranean Hub      | Barcelone    | Espagne     | 41.3874  | 2.1686    | 19000  |
| 5 | Warsaw Eastern Gateway           | Varsovie     | Pologne     | 52.2297  | 21.0122   | 16000  |

#### Amérique du Nord (4)

| # | Nom                              | Ville        | Pays        | Latitude | Longitude | Stock  |
|---|----------------------------------|--------------|-------------|----------|-----------|--------|
| 6 | Los Angeles West Coast Hub       | Los Angeles  | USA         | 33.9425  | -118.2551 | 52000  |
| 7 | Chicago Midwest Distribution     | Chicago      | USA         | 41.8781  | -87.6298  | 41000  |
| 8 | Houston Gulf Logistics           | Houston      | USA         | 29.7604  | -95.3698  | 35000  |
| 9 | Toronto Canada Hub               | Toronto      | Canada      | 43.6532  | -79.3832  | 28000  |

#### Asie-Pacifique (5)

| # | Nom                              | Ville        | Pays        | Latitude | Longitude | Stock  |
|---|----------------------------------|--------------|-------------|----------|-----------|--------|
| 10| Shanghai Pacific Gateway         | Shanghai     | Chine       | 31.2304  | 121.4737  | 68000  |
| 11| Singapore ASEAN Hub              | Singapour    | Singapour   | 1.3521   | 103.8198  | 42000  |
| 12| Tokyo Kanto Depot                | Tokyo        | Japon       | 35.6762  | 139.6503  | 31000  |
| 13| Mumbai West India Center         | Mumbai       | Inde        | 19.0760  | 72.8777   | 37000  |
| 14| Sydney Oceania Warehouse         | Sydney       | Australie   | -33.8688 | 151.2093  | 24000  |

#### Moyen-Orient & Afrique (4)

| # | Nom                              | Ville        | Pays        | Latitude | Longitude | Stock  |
|---|----------------------------------|--------------|-------------|----------|-----------|--------|
| 15| Dubai Global Logistics Hub       | Dubaï        | EAU         | 25.2048  | 55.2708   | 55000  |
| 16| Johannesburg Africa Gateway      | Johannesburg | Afrique S.  | -26.2041 | 28.0473   | 18000  |
| 17| Cairo North Africa Depot         | Le Caire     | Égypte      | 30.0444  | 31.2357   | 14000  |
| 18| Istanbul Crossroads Hub          | Istanbul     | Turquie     | 41.0082  | 28.9784   | 26000  |

#### Amérique du Sud (2)

| # | Nom                              | Ville        | Pays        | Latitude | Longitude | Stock  |
|---|----------------------------------|--------------|-------------|----------|-----------|--------|
| 19| São Paulo LATAM Center           | São Paulo    | Brésil      | -23.5505 | -46.6333  | 33000  |
| 20| Panama Canal Logistics           | Panama City  | Panama      | 9.1050   | -79.4023  | 21000  |

**Exigences du script :**
1. Créer la base `supplychain_warehouses.db` (table `warehouses`, même schéma ci-dessus)
2. Idempotent : `DROP TABLE IF EXISTS` + `CREATE TABLE`
3. Insérer les 20 warehouses avec leurs adresses réalistes (ex: "Maasvlakte, 3199 Rotterdam, Netherlands")
4. Afficher un résumé en console (nb lignes, répartition par continent)
5. Ne dépend que de la lib standard Python (`sqlite3`) — pas de pandas requis

### Intégration Docker

Le fichier `docker-compose.simple.yml` doit monter la base dans un répertoire **writable par l'user superset** :

> ⚠️ `/app/` appartient à root (`drwxr-xr-x`). SQLite a besoin de créer des fichiers journal (`-wal`, `-shm`) dans le même répertoire → utiliser `/app/superset_home/` qui est un volume Docker writable.

```yaml
volumes:
  - ./supplychain_warehouses.db:/app/superset_home/supplychain_warehouses.db
```

**URI Superset** : `sqlite:////app/superset_home/supplychain_warehouses.db`

**Allow DML** : Doit être activé sur la connexion database (Settings → Database Connections → Edit → Advanced → Security → ☑ Allow DML).

---

## Features

### Feature 1 — Affichage carte interactive

**Librairie carte :** [Leaflet](https://leafletjs.com/) via `react-leaflet` (léger, open source, pas de clé API).

**Tiles :** OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)

**Marqueurs :**
- Chaque warehouse est affiché comme un marqueur sur la carte
- Le marqueur utilise une **icône warehouse personnalisée** (icône SVG inline ou image `🏭`)
- Le **nom du warehouse** est affiché en label permanent sous/à côté du marqueur
- Au **hover** : tooltip avec nom + adresse + stock

**Carte interactive :**
- Zoom molette / boutons +/-
- Déplacement par drag sur la carte (pan)
- La carte se centre automatiquement pour afficher tous les warehouses (`fitBounds`)

### Feature 2 — Déplacement des warehouses

#### Option A : Drag & Drop sur la carte

1. L'utilisateur **clique** sur un marqueur warehouse → le marqueur devient **draggable**
2. L'utilisateur **drag** le marqueur vers une nouvelle position
3. Au **drop** :
   - Les nouvelles coordonnées GPS (lat/lng) sont capturées
   - Un **panneau d'édition** s'ouvre en bas du chart avec les nouvelles coordonnées pré-remplies
   - L'utilisateur peut ajuster et **confirmer** (`💾 Enregistrer`) ou **annuler** (`❌`)
4. À la confirmation :
   - Un appel API REST est envoyé au backend Superset pour exécuter un `UPDATE` SQL
   - Le dataset est rechargé et la carte se met à jour

#### Option B : Saisie d'adresse ou coordonnées GPS

1. L'utilisateur **clique** sur un marqueur → le **panneau d'édition** s'ouvre
2. Deux modes de saisie :
   - **Par adresse** : champ texte + bouton `📍 Géocoder` qui utilise l'API Nominatim (OpenStreetMap) pour convertir l'adresse en lat/lng
   - **Par coordonnées** : champs latitude et longitude éditables directement
3. Le marqueur se **déplace en temps réel** sur la carte pendant l'édition
4. À la confirmation : même flux que l'option A (UPDATE SQL + reload)

### Mise à jour du dataset

**Mécanisme :** Le plugin envoie une requête à l'API Superset pour exécuter un SQL `UPDATE` sur le dataset SQLite.

**Endpoint à utiliser :** API Superset `POST /api/v1/sqllab/execute/` ou appel direct via `SupersetClient` :

```typescript
import { SupersetClient, getClientErrorObject } from '@superset-ui/core';

// Exemple : mettre à jour les coordonnées d'un warehouse
// Pattern identique à sqlLab.js (body + headers + parseMethod)
await SupersetClient.post({
  endpoint: '/api/v1/sqllab/execute/',
  body: JSON.stringify({
    database_id: databaseId,
    sql: `UPDATE warehouses SET latitude = ${lat}, longitude = ${lng}, address = '${address}' WHERE id = ${warehouseId}`,
    json: true,
    runAsync: false,
    schema: null,
    expand_data: true,
  }),
  headers: { 'Content-Type': 'application/json' },
  parseMethod: 'json-bigint',
});
```

> **⚠️ Important** : Ne PAS utiliser `jsonPayload`. Utiliser `body: JSON.stringify(...)` + `headers` + `parseMethod: 'json-bigint'` — c'est le pattern utilisé par Superset en interne (`sqlLab.js` ligne 352).

> **Sécurité** : En environnement de développement/démo uniquement. En production, un endpoint dédié serait nécessaire.

> **Important** : Le fichier SQLite doit être monté en **lecture-écriture** dans Docker (pas `:ro`).

---

## Architecture des fichiers

### Fichiers à créer

```
generate_warehouses.py                    # Script Python de génération du dataset
src/SupplychainWarehouse.tsx              # Composant React principal (carte Leaflet)
```

### Fichiers à modifier

```
src/index.ts                              # Re-exporter le nouveau composant
src/types.ts                              # Nouveaux types (WarehouseRecord, MapProps, etc.)
src/plugin/
    ├── index.ts                          # loadChart pointe vers SupplychainWarehouse
    ├── buildQuery.ts                     # SELECT id, name, address, latitude, longitude, stock_size
    ├── controlPanel.ts                   # Colonnes carte (lat, lng, name, etc.)
    └── transformProps.ts                 # Transformer les données pour le composant carte
package.json                              # Ajouter dépendances leaflet + react-leaflet
docker-compose.simple.yml                 # Monter la nouvelle DB en lecture-écriture
```

---

## Spécification détaillée par fichier

### 1. `generate_warehouses.py`

```python
# Entrée : rien (données hard-codées)
# Sortie : supplychain_warehouses.db avec table warehouses
# Schema : id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, address TEXT,
#          latitude REAL, longitude REAL, stock_size INTEGER
# 20 warehouses internationaux répartis sur 5 continents
# Adresses réalistes (zones industrielles/portuaires connues)
# Idempotent : DROP TABLE IF EXISTS + CREATE TABLE
```

### 2. `src/types.ts`

```typescript
export interface WarehouseRecord {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  stock_size: number;
}

export interface SupplychainWarehouseStylesProps {
  height: number;
  width: number;
}

export interface SupplychainWarehouseCustomizeProps {
  nameColumn: string;
  addressColumn: string;
  latitudeColumn: string;
  longitudeColumn: string;
  stockColumn: string;
  databaseId: number;
  tableName: string;
}

export type SupplychainWarehouseQueryFormData = QueryFormData &
  SupplychainWarehouseStylesProps &
  SupplychainWarehouseCustomizeProps;

export type SupplychainWarehouseProps = SupplychainWarehouseStylesProps &
  SupplychainWarehouseCustomizeProps & {
    data: WarehouseRecord[];
  };
```

### 3. `src/plugin/controlPanel.ts`

**Section Query :**

| Contrôle           | Type           | Description                                |
|--------------------|----------------|--------------------------------------------|
| Name Column        | SelectControl  | Colonne contenant le nom du warehouse      |
| Address Column     | SelectControl  | Colonne contenant l'adresse                |
| Latitude Column    | SelectControl  | Colonne latitude GPS                       |
| Longitude Column   | SelectControl  | Colonne longitude GPS                      |
| Stock Column       | SelectControl  | Colonne stock / capacité                   |
| Row Limit          | sharedControls | Limite de lignes (défaut: 10000)           |

**Section Chart Options :**

| Contrôle           | Type           | Description                                |
|--------------------|----------------|--------------------------------------------|
| Database ID        | TextControl    | ID de la base de données Superset (pour UPDATE) |
| Table Name         | TextControl    | Nom de la table SQL (défaut: "warehouses") |

> Chaque `SelectControl` doit utiliser `mapStateToProps` avec `.map(c => [c.column_name, c.verbose_name || c.column_name])` — format tuples obligatoire.

### 4. `src/plugin/buildQuery.ts`

```typescript
// Lire les 5 champs + id depuis formData
// SELECT id, name, address, latitude, longitude, stock_size FROM warehouses
// metrics: [], groupby: [] (pas d'agrégation)
```

### 5. `src/plugin/transformProps.ts`

```typescript
// Entrée : chartProps.queriesData[0].data = tableau plat de WarehouseRecord[]
// Sortie : SupplychainWarehouseProps
// Passer les données telles quelles + formData
```

### 6. `src/SupplychainWarehouse.tsx` — Composant principal

#### Structure du composant

```
<div style={{ width, height, position: 'relative' }}>

  {/* Carte Leaflet */}
  <MapContainer center={center} zoom={6} style={{ height: editingId ? '70%' : '100%', width: '100%' }}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

    {warehouses.map(wh => (
      <Marker
        key={wh.id}
        position={[wh.latitude, wh.longitude]}
        icon={warehouseIcon}
        draggable={editingId === wh.id}
        eventHandlers={{ click: () => startEdit(wh), dragend: (e) => onDragEnd(e, wh) }}
      >
        <Tooltip permanent>{wh.name}</Tooltip>
        <Popup>{wh.name}<br/>{wh.address}<br/>Stock: {wh.stock_size}</Popup>
      </Marker>
    ))}

    <FitBoundsToMarkers warehouses={warehouses} />
  </MapContainer>

  {/* Panneau d'édition — affiché quand un warehouse est sélectionné */}
  {editingWarehouse && (
    <EditPanel
      warehouse={editingWarehouse}
      onSave={handleSave}
      onCancel={handleCancel}
      onGeocode={handleGeocode}
    />
  )}

</div>
```

#### State React

```typescript
const [warehouses, setWarehouses] = useState<WarehouseRecord[]>(data);
const [editingId, setEditingId] = useState<number | null>(null);
const [editForm, setEditForm] = useState<Partial<WarehouseRecord>>({});
const [isLoading, setIsLoading] = useState(false);
```

#### Géocodage (Nominatim)

```typescript
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
  );
  const results = await response.json();
  if (results.length === 0) throw new Error('Adresse non trouvée');
  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
}
```

#### Mise à jour du dataset

```typescript
async function updateWarehouse(wh: WarehouseRecord): Promise<void> {
  await SupersetClient.post({
    endpoint: '/api/v1/sqllab/execute/',
    jsonPayload: {
      database_id: databaseId,
      sql: `UPDATE ${tableName} SET
        latitude = ${wh.latitude},
        longitude = ${wh.longitude},
        address = '${wh.address.replace(/'/g, "''")}'
        WHERE id = ${wh.id}`,
      runAsync: false,
      schema: null,
    },
  });
}
```

### 7. `src/plugin/index.ts`

```typescript
loadChart: () => import('../SupplychainWarehouse'),
// metadata.name = 'Supplychain Warehouse'
// metadata.description = 'Interactive warehouse map with drag & drop'
```

---

## Dépendances à ajouter

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^3.2.5"
  },
  "devDependencies": {
    "@types/leaflet": "1.7.11"
  }
}
```

> **Important** :
> - `react-leaflet` v4 requiert React 18 → utiliser **v3** pour Superset 4.1.1 (React 16.13.1)
> - `@types/leaflet` épinglé à `1.7.11` (sans `^`) — la v1.9.x utilise `using` (TypeScript 5+)
> - Les dépendances `echarts` et `echarts-for-react` de la V1 peuvent être retirées.

---

## Contraintes techniques

1. **Compatible React 16.13.1** — Superset 4.1.1. Pas de React 18 features (`useId`, `startTransition`, etc.)
2. **`react-leaflet` v4** est compatible React 16+ (vérifier la compatibilité exacte, sinon utiliser `react-leaflet` v3)
3. **Format tuples SelectControl** — `mapStateToProps` doit mapper en `[value, label]`
4. **buildQuery : champs custom** — Lire les colonnes depuis `formData`, ne pas utiliser `formData.cols`
5. **Pas de CSS externe** — Sauf le CSS Leaflet (`leaflet/dist/leaflet.css`) qui doit être importé ou injecté inline
6. **SQLite en écriture** — Le volume Docker doit être monté dans `/app/superset_home/` (pas `/app/`) car SQLite a besoin de créer des fichiers journal et `/app/` n'est pas writable par l'user `superset`. Allow DML doit être activé dans Superset.
7. **Nominatim rate limit** — Max 1 requête/seconde. Ajouter un délai si nécessaire
8. **Sécurité SQL** — Échapper les apostrophes dans les adresses (`replace(/'/g, "''")`)
9. **`npm run build` doit passer** — TypeScript strict, pas de `any` sauf convention existante
10. **Node** : 18.19.1 via nvm-windows

---

## Plan de test

| # | Test                                              | Résultat attendu                                         |
|---|---------------------------------------------------|----------------------------------------------------------|
| 1 | Ouvrir le chart → les 20 warehouses s'affichent   | Marqueurs avec icônes + noms visibles sur le monde       |
| 2 | Zoom molette + pan carte                          | Carte interactive, fluide                                |
| 3 | Hover marqueur                                    | Tooltip : nom + adresse + stock                          |
| 4 | Clic marqueur → panneau d'édition                 | Panneau s'ouvre avec données pré-remplies                |
| 5 | Drag & drop marqueur                              | Marqueur se déplace, coordonnées mises à jour            |
| 6 | Saisie adresse + Géocoder                         | Coordonnées calculées, marqueur repositionné             |
| 7 | Enregistrer → vérifier DB                         | `SELECT * FROM warehouses WHERE id=X` → nouvelles coords |
| 8 | Recharger le chart                                | Les nouvelles positions sont persistées                  |
| 9 | Annuler l'édition                                 | Marqueur revient à sa position originale                 |
| 10| Resize fenêtre                                    | Carte responsive                                         |
