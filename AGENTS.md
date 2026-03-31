# LLM Context Guide for Apache Superset

Apache Superset is a data visualization platform with Flask/Python backend and
React/TypeScript frontend.

## ⚠️ CRITICAL: Always Run Pre-commit Before Pushing

ALWAYS run `pre-commit run --all-files` before pushing commits. CI will fail if
pre-commit checks don't pass. This is non-negotiable.

```
# Stage your changes first
git add .

# Run pre-commit on all files
pre-commit run --all-files

# If there are auto-fixes, stage them and commit
git add .
git commit --amend  # or new commit
```

Common pre-commit failures:

- Formatting - black, prettier, eslint will auto-fix
- Type errors - mypy failures need manual fixes
- Linting - ruff, pylint issues need manual fixes

## ⚠️ CRITICAL: Ongoing Refactors (What NOT to Do)

These migrations are actively happening - avoid deprecated patterns:

### Frontend Modernization

- NO `any` types - Use proper TypeScript types
- NO JavaScript files - Convert to TypeScript (.ts/.tsx)
- Use @superset-ui/core - Don't import Ant Design directly, prefer Ant Design
  component wrappers from @superset-ui/core/components
- Use antd theming tokens - Prefer antd tokens over legacy theming tokens
- Avoid custom css and styles - Follow antd best practices and avoid styling and
  custom CSS whenever possible

### Testing Strategy Migration

- Prefer unit tests over integration tests
- Prefer integration tests over end-to-end tests
- Use Playwright for E2E tests - Migrating from Cypress
- Cypress is deprecated - Will be removed once migration is completed
- Use Jest + React Testing Library for component testing
- Use `test()` instead of `describe()` - Follow [avoid nesting when testing](https://kentcdodds.com/blog/avoid-nesting-when-youre-testing)
  principles

### Backend Type Safety

- Add type hints - All new Python code needs proper typing
- MyPy compliance - Run `pre-commit run mypy` to validate
- SQLAlchemy typing - Use proper model annotations

### UUID Migration

- Prefer UUIDs over auto-incrementing IDs - New models should use UUID primary
  keys
- External API exposure - Use UUIDs in public APIs instead of internal integer
  IDs
- Existing models - Add UUID fields alongside integer IDs for gradual migration

## Key Directories

```
superset/
├── superset/                    # Python backend (Flask, SQLAlchemy)
│   ├── views/api/              # REST API endpoints
│   ├── models/                 # Database models
│   └── connectors/             # Database connections
├── superset-frontend/src/       # React TypeScript frontend
│   ├── components/             # Reusable components
│   ├── explore/                # Chart builder
│   ├── dashboard/              # Dashboard interface
│   └── SqlLab/                 # SQL editor
├── superset-frontend/packages/
│   └── superset-ui-core/       # UI component library (USE THIS)
├── tests/                      # Python/integration tests
├── docs/                       # Documentation (UPDATE FOR CHANGES)
└── UPDATING.md                 # Breaking changes log
```

## Code Standards

### TypeScript Frontend

- Avoid `any` types - Use proper TypeScript, reuse existing types
- Functional components with hooks
- @superset-ui/core for UI components (not direct antd)
- Jest for testing (NO Enzyme)
- Redux for global state where it exists, hooks for local

### Python Backend

- Type hints required for all new code
- MyPy compliant - run `pre-commit run mypy`
- SQLAlchemy models with proper typing
- pytest for testing

### Apache License Headers

- New files require ASF license headers - When creating new code files, include
  the standard Apache Software Foundation license header
- LLM instruction files are excluded - Files like AGENTS.md, CLAUDE.md, etc. are
  in `.rat-excludes` to avoid header token overhead

### Code Comments

- Avoid time-specific language - Don't use words like "now", "currently",
  "today" in code comments as they become outdated
- Write timeless comments - Comments should remain accurate regardless of when
  they're read

## Documentation Requirements

- docs/: Update for any user-facing changes
- UPDATING.md: Add breaking changes here
- Docstrings: Required for new functions/classes

## Code Standards (Plugin-Specific)

### SelectControl — Format tuples obligatoire

`state.datasource?.columns` retourne des **objets complets**. `SelectControl`
attend des **tuples** `[value, label]` :

```typescript
// ✅ Correct
mapStateToProps: (state: any) => ({
  choices: (state.datasource?.columns || []).map(
    (c: any) => [c.column_name, c.verbose_name || c.column_name]
  ),
}),
```

### buildQuery — Champs custom

Lire les champs custom depuis `formData`, ne pas utiliser `formData.cols` :

```typescript
const { my_column } = formData;
const columns = [my_column].filter(Boolean);
return buildQueryContext(formData, base => [{ ...base, columns, metrics: [], groupby: [] }]);
```

### CSS / Styles

- Tout en style inline ou CSS-in-JS (`styled` de `@superset-ui/core`)
- Exception : CSS de librairies tierces (ex: Leaflet) peut être importé

## Environment

- **Node** : 18.19.1 (via nvm-windows)
- **Superset** : 4.1.1 (Docker `apache/superset:4.1.1`)
- **React** : 16.13.1 (pas de React 18 features)
- **Build plugin** : `npm run build`
- **Dev server** : `start_dev.ps1` → `localhost:9000`
- **Login** : admin / admin

## Test Utilities

### TypeScript Test Helpers

- `superset-frontend/spec/helpers/testing-library.tsx` - Custom render() with
  providers
- `createWrapper()` - Redux/Router/Theme wrapper
- React Testing Library - NO Enzyme (removed)

### Running Tests

```
# Frontend
npm run test                           # All tests
npm run test -- filename.test.tsx     # Single file

# Backend
pytest                                 # All tests
pytest tests/unit_tests/specific_test.py  # Single file
```

## Pull Request Guidelines

When creating pull requests:

1. Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
   - Format: `type(scope): description`
   - Example: `feat(plugin): add warehouse map with drag & drop`
   - Types: `fix`, `feat`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
