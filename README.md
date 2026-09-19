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

Build briefs (one per project area):

```txt
AGENTS.md                   # Student PWA build brief
AGENTS_DASHBOARD.md         # Fleet dashboard build brief
AGENTS_BACKEND.md           # MAS backend build brief
BLOCK_0_GUIDE.md            # Block 0 task guide for backend setup
```

Design context modules:

```txt
context_modules/            # Student PWA design context
dashboard_context_modules/  # Dashboard design context
docs_modules/               # Project-wide design docs (00–12 + archive)
docs_modules/_retired/      # Superseded modules
```

Claude Code auto-loads `CLAUDE.md` at the repo root and `backend/CLAUDE.md` when working in
the backend directory.
