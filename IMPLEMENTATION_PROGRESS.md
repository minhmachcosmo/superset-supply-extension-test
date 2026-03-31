# Progression d'implémentation — Supplychain Warehouse Map Plugin

> Dernière mise à jour : 31/03/2026
> Branche : `main`

---

## Statut global

| Phase | Description                    | Statut      | Date       |
|-------|--------------------------------|-------------|------------|
| 0     | Préparation des données        | ✅ Terminé  | 31/03/2026 |
| 1     | Installation dépendances       | ✅ Terminé  | 31/03/2026 |
| 2     | Types et configuration plugin  | ✅ Terminé  | 31/03/2026 |
| 3     | Composant carte principal      | ✅ Terminé  | 31/03/2026 |
| 4     | Tests                          | ✅ Terminé  | 31/03/2026 |
| 5     | Intégration et polish          | 🔄 En cours | 31/03/2026 |

**Légende :** ⬜ À faire | 🔄 En cours | ✅ Terminé | ❌ Bloqué

---

## Phase 0 — Préparation des données

| Tâche | Fichier | Statut | Notes |
|-------|---------|--------|-------|
| 0.1 — Créer le générateur de données | `generate_warehouses.py` | ✅ | 20 warehouses internationaux (5 continents), sqlite3 |
| 0.2 — Mettre à jour Docker compose | `docker-compose.simple.yml` | ✅ | Volume en lecture-écriture |
| 0.3 — Vérifier DB dans Docker | — | ⬜ | À faire au démarrage Docker |

---

## Phase 1 — Installation dépendances

| Tâche | Fichier | Statut | Notes |
|-------|---------|--------|-------|
| 1.1 — Ajouter leaflet + react-leaflet | `package.json` | ✅ | react-leaflet@3.2.5 (compat React 16) |
| 1.2 — Retirer echarts | `package.json` | ✅ | echarts + echarts-for-react supprimés |
| 1.3 — npm install | — | ✅ | --legacy-peer-deps requis |

---

## Phase 2 — Types et configuration plugin

| Tâche | Fichier | Statut | Notes |
|-------|---------|--------|-------|
| 2.1 — Définir types Warehouse | `src/types.ts` | ✅ | WarehouseRecord, SupplychainWarehouseProps, etc. |
| 2.2 — Configurer panneau de contrôle | `src/plugin/controlPanel.ts` | ✅ | 5 SelectControl + 2 TextControl |
| 2.3 — Construire la requête | `src/plugin/buildQuery.ts` | ✅ | SELECT id, name, address, lat, lng, stock |
| 2.4 — Transformer les props | `src/plugin/transformProps.ts` | ✅ | Mapper en WarehouseRecord[] |
| 2.5 — Vérification TypeScript | — | ✅ | `npm run build` sans erreur |

---

## Phase 3 — Composant carte principal

| Tâche | Fichier | Statut | Notes |
|-------|---------|--------|-------|
| 3.1 — Carte Leaflet avec marqueurs | `src/SupplychainWarehouse.tsx` | ✅ | Import dynamique Leaflet |
| 3.2 — Icône warehouse custom | `src/SupplychainWarehouse.tsx` | ✅ | L.divIcon SVG inline (bleu / orange si édition) |
| 3.3 — Tooltip + Popup | `src/SupplychainWarehouse.tsx` | ✅ | Nom permanent, détails + stock au clic |
| 3.4 — FitBounds auto | `src/SupplychainWarehouse.tsx` | ✅ | Centrer sur tous les warehouses au chargement |
| 3.5 — Drag & drop marqueurs | `src/SupplychainWarehouse.tsx` | ✅ | dragend → capture coords + reverse geocode |
| 3.6 — Panneau d'édition | `src/SupplychainWarehouse.tsx` | ✅ | Adresse + coords + Save / Cancel |
| 3.7 — Géocodage Nominatim | `src/SupplychainWarehouse.tsx` | ✅ | Adresse → lat/lng via Nominatim OSM |
| 3.8 — Mise à jour SQL via SupersetClient | `src/SupplychainWarehouse.tsx` | ✅ | UPDATE warehouses SET ... WHERE id=X |
| 3.9 — Mettre à jour plugin/index.ts | `src/plugin/index.ts` | ✅ | loadChart → SupplychainWarehouse |
| 3.10 — Mettre à jour index.ts | `src/index.ts` | ✅ | Export principal |

---

## Phase 4 — Tests

| Tâche | Fichier | Statut | Notes |
|-------|---------|--------|-------|
| 4.1 — Test existence plugin | `test/index.test.ts` | ✅ | |
| 4.2 — Test buildQuery | `test/plugin/buildQuery.test.ts` | ✅ | Colonnes warehouse + metrics/groupby vides |
| 4.3 — Test transformProps | `test/plugin/transformProps.test.ts` | ✅ | Mapping WarehouseRecord correct |
| 4.4 — npm test passe | — | ✅ | 4/4 tests verts |

---

## Phase 5 — Intégration et polish

| Tâche | Fichier | Statut | Notes |
|-------|---------|--------|-------|
| 5.1 — Supprimer ancien composant | `src/SupplychainWharehouse.tsx` | ✅ | Supprimé |
| 5.2 — Nettoyage références | — | ✅ | Aucun "Brewery" / "Whareouse" dans le code |
| 5.3 — Build TypeScript | — | ✅ | `npm run build` : 0 erreur |
| 5.4 — Build complet | — | ✅ | CJS + ESM + ts-types : OK |
| 5.5 — Test intégration Superset | — | ⬜ | À faire (voir checklist ci-dessous) |
| 5.6 — Commit et push | — | ✅ | feat(plugin): supplychain warehouse map |

---

## Checklist de test intégration

| # | Test | Résultat |
|---|------|----------|
| 1 | Les 20 warehouses s'affichent sur la carte du monde | ⬜ |
| 2 | Zoom molette + pan carte fonctionnent | ⬜ |
| 3 | Hover marqueur → tooltip nom + adresse + stock | ⬜ |
| 4 | Clic marqueur → panneau d'édition s'ouvre | ⬜ |
| 5 | Drag & drop → marqueur se déplace | ⬜ |
| 6 | Saisie adresse + Géocoder → coordonnées calculées | ⬜ |
| 7 | Enregistrer → DB mise à jour (vérifier SQL) | ⬜ |
| 8 | Recharger le chart → positions persistées | ⬜ |
| 9 | Annuler → marqueur revient à sa position | ⬜ |
| 10 | Resize fenêtre → carte responsive | ⬜ |

---

## Problèmes rencontrés

| # | Date | Description | Résolution | Statut |
|---|------|-------------|------------|--------|
| 1 | 31/03/2026 | `@airbnb/config-babel` introuvable | Remplacé par `@babel/preset-env/react/typescript` standard | ✅ |
| 2 | 31/03/2026 | `@types/leaflet@1.9.x` incompatible TypeScript 4 | Épinglé à `1.7.11` | ✅ |
| 3 | 31/03/2026 | Conflit versions `@babel/cli` et `@babel/core` | Aligné toutes les versions Babel sur `^7.25.9` | ✅ |
| 4 | 31/03/2026 | `@superset-ui/core` absent du dossier standalone | Ajout de `types/superset-shims.d.ts` avec stubs | ✅ |

---

## Notes

- Le plugin remplace l'ancien line chart ECharts (V1 brewery) par une carte interactive warehouse
- La V1 brewery est conservée dans l'historique git (commit `438f5c3`)
- L'ancien spec `SPEC_V2_BREWERY_PROCESS.md` est abandonné au profit de `SPEC_SUPPLYCHAIN.md`
