# Brewery Stock Simulation Dashboard

Extension Apache Superset pour visualiser les simulations de stock de bar.

## 📊 Fonctionnalités

### Graphique en Ligne Interactif
- Visualisation de l'évolution du stock au fil du temps
- Comparaison de plusieurs scénarios de simulation
- Zoom et navigation dans les données
- Export d'images
- Légende interactive

### Options de Configuration

#### Section "Query"
- **X-Axis Column** : Colonne pour l'axe X (ex: `Probe_run` pour le temps/étapes)
- **Y-Axis Column** : Colonne pour l'axe Y (ex: `StockMeasure` pour le niveau de stock)
- **Series Column** : Colonne pour grouper par série (ex: `run_name` pour comparer les scénarios)
- **Filters** : Filtres adhoc pour limiter les données
- **Row Limit** : Nombre maximum de lignes (défaut: 10000)

#### Section "Chart Options"
- **Chart Title** : Titre du graphique
- **Show Legend** : Afficher/masquer la légende
- **Show Grid** : Afficher/masquer la grille
- **Smooth Lines** : Appliquer un lissage aux courbes

## 🚀 Utilisation dans Superset

### 1. Installation dans Superset

```bash
# Dans le répertoire superset-frontend
npm i -S ../../superset-brewery-extension-test-1
```

### 2. Enregistrer le Plugin

Éditez `superset-frontend/src/visualizations/presets/MainPreset.js` :

```javascript
import SupersetBreweryExtensionTest1 from 'superset-brewery-extension-test-1';

// Dans la classe MainPreset
new SupersetBreweryExtensionTest1().configure({ key: 'superset-brewery-extension-test-1' }),
```

### 3. Créer une Visualisation

1. Connectez votre source de données avec les colonnes :
   - `Simulation_run` : ID de simulation
   - `Probe_instance` : Instance de probe
   - `Probe_run` : Numéro d'étape/temps
   - `StockMeasure` : Mesure du stock
   - `csm_run_id` : ID de run CSM
   - `run_name` : Nom du scénario

2. Créez un nouveau chart avec "Brewery Stock Simulation Dashboard"

3. Configurez :
   - **X-Axis** : `Probe_run` (temps)
   - **Y-Axis** : `StockMeasure` (niveau de stock)
   - **Series** : `run_name` (scénarios)

4. Personnalisez les options visuelles selon vos besoins

## 📁 Structure du Dataset Exemple

```
Simulation_run | Probe_instance | Probe_run | StockMeasure | csm_run_id | run_name
---------------|----------------|-----------|--------------|------------|-------------------
run-mr5l0...   | StockProbe     | 0         | 50           | run-mr5... | ReferenceScenario
run-mr5l0...   | StockProbe     | 1         | 47           | run-mr5... | ReferenceScenario
run-o6kgp...   | StockProbe     | 0         | 50           | run-o6k... | PROD-15427-UpdatedDataset
```

## 🎨 Exemple de Visualisation

Le graphique affichera :
- Une courbe pour chaque scénario (`run_name`)
- L'évolution du stock (`StockMeasure`) sur l'axe Y
- Les étapes de temps (`Probe_run`) sur l'axe X
- Une légende permettant de filtrer les scénarios
- Des outils de zoom et d'export

## 🔧 Développement

### Build du Plugin

```bash
npm run build        # Build complet
npm run dev          # Mode développement avec watch
npm run test         # Lancer les tests
```

### Fichiers Principaux

- `src/SupersetBreweryExtensionTest1.tsx` : Composant principal du graphique
- `src/plugin/controlPanel.ts` : Configuration des contrôles
- `src/plugin/transformProps.ts` : Transformation des données
- `src/types.ts` : Types TypeScript

## 📚 Documentation

- [LLM_GUIDE.md](LLM_GUIDE.md) : Guide pour les LLMs avec les standards du projet
- [README.md](README.md) : Instructions de build et d'installation

## 🐛 Dépannage

### Le graphique n'affiche pas de données
- Vérifiez que les colonnes X-Axis, Y-Axis et Series sont correctement configurées
- Vérifiez que `Row Limit` est suffisamment élevé (défaut: 10000)
- Consultez la console du navigateur pour les erreurs

### Les courbes ne sont pas lisses
- Activez l'option "Smooth Lines" dans la section Chart Options

### Trop de séries dans la légende
- Utilisez les filtres adhoc pour limiter les scénarios affichés
- La légende est scrollable automatiquement

## 📝 License

Apache License 2.0
