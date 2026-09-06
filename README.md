# ORBIT

ORBIT is the On-Demand, Route-Based Intelligent Transit System for a UTM campus bus coordination project. The repo currently contains hardcoded frontend prototypes for the student PWA and fleet manager dashboard, plus a newly scaffolded backend folder for the upcoming MAS/FastAPI work.

## Project Areas

### Student PWA

The student-facing prototype lives at the repo root and uses `src/`.

Key folders:

```txt
src/
  components/
  screens/
  hooks/
  data/
  design/
  utils/
public/
assets/
context_modules/
```

Run from the repo root:

```bash
npm run dev
npm run build
npm run preview
npm test
```

### Fleet Manager Dashboard

The desktop dashboard prototype lives in `dashboard/` as a separate Vite app.

Key folders:

```txt
dashboard/
  src/
    components/
    hooks/
    data/
    design/
    test/
dashboard_context_modules/
```

Run from `dashboard/`:

```bash
npm run dev
npm run build
npm run preview
npm test
```

### Backend

The backend scaffold exists for the next implementation phase. No Python environment, FastAPI app, dependencies, or backend logic have been added yet.

Current structure:

```txt
backend/
  agents/
  simulation/
  api/
  config/
  tests/
```

Backend run commands are not available yet. They should be added when the backend setup guide introduces the FastAPI application and dependency management.

## Documentation

Current frontend build briefs and project references:

```txt
context_modules/
dashboard_context_modules/
docs_modules/
```

Retired documentation is kept under:

```txt
docs_modules/_retired/
```
