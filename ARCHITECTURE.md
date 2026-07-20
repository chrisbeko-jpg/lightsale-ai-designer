# Lightsale AI Designer — Architecture

This document describes the current architecture of the **Lightsale AI Designer** monorepo as of the initial vertical slice (`603bec8`). It covers system boundaries, folder responsibilities, data flow, known debt, and recommended evolution paths.

---

## 1. System overview

Lightsale AI Designer is an npm-workspace monorepo for creating lighting projects from uploaded floor plans. Users calibrate scale, draw room polygons on a Konva canvas, and persist project state to a FastAPI backend backed by PostgreSQL.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Browser (Next.js 15)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │ App Router   │  │ Zustand      │  │ Konva / react-konva canvas   │ │
│  │ pages + UI   │──│ editor store │──│ (world coords + viewport)    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────────────┘ │
│         │                 │                                             │
│         │    lib/api        │    @lightsale/shared (Zod + domain)       │
└─────────┼─────────────────┼─────────────────────────────────────────────┘
          │ fetch (REST)      │
          ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    FastAPI backend (:8000)                              │
│  routes/projects.py ──► SQLAlchemy async ──► PostgreSQL + PostGIS ext   │
│  floor_plan_upload.py ──► local filesystem (uploads/)                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Architectural style

| Layer | Pattern |
|-------|---------|
| Frontend | **Feature-oriented components** + **Zustand** client state + thin **API client** |
| Shared | **Domain-driven pure functions** + **Zod** as contract source of truth (TypeScript) |
| Backend | **Layered**: routes → services/helpers → ORM models; **Pydantic** mirrors shared schemas |
| Persistence | **Document model** — project editor state stored as JSONB blob; floor plans as files + metadata rows |

The system intentionally separates **canvas/world coordinates** (rooms, scale points) from **viewport state** (zoom, pan). World coordinates are persisted; viewport is optionally persisted for UX continuity.

---

## 2. Repository layout

```
lightsale-ai-designer/
├── apps/web/                 Next.js frontend
├── packages/shared/          Cross-cutting TypeScript domain + schemas
├── backend/                  Python FastAPI API
├── docker-compose.yml        PostGIS database for local dev
├── package.json              npm workspaces root
└── README.md                 Setup instructions
```

### 2.1 Root (`/`)

| File / folder | Responsibility |
|---------------|----------------|
| `package.json` | npm workspaces orchestration; scripts for `dev`, `build`, `test`, `lint` |
| `package-lock.json` | Locked dependency tree for all workspaces |
| `docker-compose.yml` | Single PostGIS 16 service for local PostgreSQL |
| `.gitignore` | Excludes `node_modules`, `.next`, `.venv`, env files, uploads, build artifacts |
| `README.md` | Developer onboarding (DB, backend, frontend, tests) |

The root does **not** contain application logic. It coordinates workspaces only.

---

### 2.2 `packages/shared/` — Shared domain & contracts

Pure TypeScript package consumed by the frontend. Built to `dist/` via `tsc`; tested with Vitest.

| Path | Responsibility |
|------|----------------|
| `src/schemas.ts` | **Zod schemas** and inferred types: `Point`, `Room`, `ScaleCalibration`, `Project`, `ProjectDocument`, API input types |
| `src/scale.ts` | Pixel distance, metres-per-pixel, coordinate conversion |
| `src/area.ts` | Shoelace polygon area (pixels² and m²), display formatting |
| `src/viewport.ts` | Canvas ↔ screen transforms, zoom-at-point, pan |
| `src/index.ts` | Public API barrel export |
| `src/scale.test.ts` | Unit tests for scale and area calculations |
| `package.json` | Package `@lightsale/shared` |
| `tsconfig.json` | Strict TS compile to ESM `dist/` |
| `vitest.config.ts` | Test runner configuration |

**Design intent:** All geometry math and API shape validation live here so UI components stay thin. The backend maintains a **manual mirror** in Pydantic (`backend/app/schemas.py`).

---

### 2.3 `apps/web/` — Next.js frontend

Next.js 15 App Router application (`@lightsale/web`). Tailwind CSS v4 for styling. Konva for canvas rendering.

#### `app/` — Routes & layouts

| Path | Responsibility |
|------|----------------|
| `layout.tsx` | Root HTML shell, global CSS import, metadata |
| `page.tsx` | **Home**: server-fetches project list, renders create form + project list |
| `globals.css` | Tailwind import, CSS custom properties (dark theme tokens) |
| `projects/[projectId]/page.tsx` | **Editor route**: passes `projectId` to client `ProjectEditor` |

#### `components/` — UI

| Path | Responsibility |
|------|----------------|
| `CreateProjectForm.tsx` | Client form → `POST /api/projects` → navigates to editor |
| `ProjectList.tsx` | Server-rendered list of projects with links |
| `editor/ProjectEditor.tsx` | **Editor shell**: load/save orchestration, layout, keyboard shortcuts |
| `editor/FloorPlanCanvasClient.tsx` | Dynamic import wrapper (`ssr: false`) for Konva |
| `editor/FloorPlanCanvas.tsx` | Konva Stage: pointer tools, zoom/pan, layer composition |
| `editor/FloorPlanLayer.tsx` | Background image via `useKonvaImage` |
| `editor/RoomPolygon.tsx` | Room fill, label, area text, draggable vertex handles |
| `editor/ScaleOverlay.tsx` | Scale calibration point/line markers |
| `editor/EditorToolbar.tsx` | Tool selection, undo/redo, finish-room action |
| `editor/FloorPlanUpload.tsx` | File input → multipart upload → reload project in store |
| `editor/ScaleCalibrationPanel.tsx` | Sidebar UI for scale distance input |
| `editor/RoomListPanel.tsx` | Sidebar room list, rename, delete, area display |

#### `lib/` — Non-UI logic

| Path | Responsibility |
|------|----------------|
| `lib/api/config.ts` | `NEXT_PUBLIC_API_URL` resolution (default `http://localhost:8000`) |
| `lib/api/projects.ts` | REST client: list, create, get, save document, upload floor plan; Zod parse on responses |
| `lib/editor/types.ts` | Editor-specific types: tools, ephemeral draft state, document projection helpers |
| `lib/editor/store.ts` | **Zustand store**: all editor mutations, viewport, undo/redo integration |
| `lib/editor/history.ts` | Pure undo/redo stack (max 50 snapshots) over `EditorDocumentState` |
| `lib/editor/index.ts` | Barrel re-exports |

#### `hooks/`

| Path | Responsibility |
|------|----------------|
| `useKonvaImage.ts` | Loads PNG/JPG directly; renders PDF page 1 via `pdfjs-dist` + CDN worker |

#### Config files

| File | Responsibility |
|------|----------------|
| `next.config.mjs` | Transpile `@lightsale/shared`; webpack alias `canvas: false` for Konva SSR |
| `tsconfig.json` | Strict TS, `@/*` path alias |
| `postcss.config.mjs` | Tailwind v4 PostCSS plugin |
| `.eslintrc.json` | `next/core-web-vitals` |
| `.env.local.example` | Documents `NEXT_PUBLIC_API_URL` |

---

### 2.4 `backend/` — FastAPI API

Python 3.11+ async API. SQLAlchemy 2 async ORM. Local disk for floor plan binaries.

#### `app/` — Application code

| Path | Responsibility |
|------|----------------|
| `main.py` | FastAPI app, CORS, lifespan (`init_db`), health check, router mount |
| `config.py` | `pydantic-settings`: `DATABASE_URL`, `UPLOAD_DIR`, `CORS_ORIGINS` |
| `database.py` | Async engine, session factory, `init_db` (PostGIS extension + `create_all`) |
| `models.py` | SQLAlchemy ORM: `ProjectRow`, `FloorPlanRow` |
| `schemas.py` | Pydantic models mirroring `@lightsale/shared` Zod schemas |
| `floor_plan_upload.py` | Validate MIME, save file, extract dimensions (Pillow / pypdf) |
| `routes/projects.py` | All project REST endpoints |
| `domain/geometry.py` | Python duplicate of shared geometry (tested, **unused by routes**) |

#### `tests/`

| Path | Responsibility |
|------|----------------|
| `conftest.py` | Adds backend root to `sys.path` |
| `test_geometry.py` | Unit tests for `domain/geometry.py` |

#### Config / deps

| File | Responsibility |
|------|----------------|
| `requirements.txt` | Pinned Python dependencies |
| `.env.example` | Example `DATABASE_URL`, `UPLOAD_DIR`, `CORS_ORIGINS` |
| `pytest.ini` | pytest + asyncio mode |

---

## 3. Data model

### 3.1 PostgreSQL tables

**`projects`**
- `id` (UUID PK)
- `name` (string)
- `document` (JSONB) — `{ scale, rooms, viewport? }`
- `floor_plan_id` (UUID, nullable, **no FK constraint**)
- `created_at`, `updated_at`

**`floor_plans`**
- `id` (UUID PK)
- `project_id` (UUID)
- `file_name`, `mime_type`, `width_px`, `height_px`
- `storage_path` (absolute/local path string)
- `created_at`

PostGIS extension is enabled at startup but **no geometry columns** are defined. Room polygons live only inside JSONB.

### 3.2 Document JSON shape (canonical: `@lightsale/shared`)

```typescript
ProjectDocument {
  scale: ScaleCalibration | null   // two canvas points + realDistanceMetres
  rooms: Room[]                      // id, name, vertices[]
  viewport?: { zoom, offsetX, offsetY }  // optional UX state
}
```

### 3.3 Coordinate systems

| Space | Used for | Persisted? |
|-------|----------|------------|
| **Canvas / world** | Room vertices, scale points, floor plan origin | Yes (`document.rooms`, `document.scale`) |
| **Screen / stage** | Pointer events, Stage pixel dimensions | No |
| **Viewport-transformed** | Konva Layer `x`, `y`, `scaleX`, `scaleY` | Optionally (`document.viewport`) |

Transform pipeline:

```
screen point ──screenToCanvas()──► world point
world point  ──canvasToScreen()──► screen point (for rendering)

Konva Layer applies: screen = world * zoom + offset
```

---

## 4. API surface

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Liveness probe |
| `GET` | `/api/projects` | List projects (summary) |
| `POST` | `/api/projects` | Create project with empty document |
| `GET` | `/api/projects/{id}` | Load full project + floor plan metadata |
| `PUT` | `/api/projects/{id}/document` | Replace editor document (scale, rooms, viewport) |
| `POST` | `/api/projects/{id}/floor-plan` | Upload/replace floor plan file |
| `GET` | `/api/projects/{id}/floor-plan/file` | Stream floor plan binary |

No authentication, pagination, versioning, or delete endpoints exist.

---

## 5. Data flow

### 5.1 Create project

```
User (home page)
  → CreateProjectForm (client)
  → POST /api/projects { name }
  → ProjectRow inserted (default JSONB document)
  → Zod-validated Project returned
  → router.push(/projects/:id)
  → ProjectEditor mounts
  → GET /api/projects/:id
  → useEditorStore.loadProject()
```

### 5.2 Upload floor plan

```
User selects file (sidebar)
  → POST /api/projects/:id/floor-plan (multipart)
  → save_floor_plan_upload(): validate MIME, write to uploads/, measure dimensions
  → Replace FloorPlanRow; delete old file from disk
  → Project returned
  → loadProject() refreshes store; floorPlanUrl = /api/projects/:id/floor-plan/file
  → useKonvaImage fetches binary; Konva Image rendered on canvas layer
```

### 5.3 Draw & edit rooms

```
Canvas pointer down (draw-room tool)
  → screenToCanvas(pointer, viewport)
  → addDrawVertex(world point)
  → finishDrawingRoom() → mutateDocument() → new Room in store + history push

Vertex drag (selected room)
  → updateRoomVertex on drag move/end
  → mutateDocument() each event (history push each time)

Area display
  → polygonAreaSquareMetres(vertices, scale) from @lightsale/shared
  → formatAreaSquareMetres() in RoomPolygon / RoomListPanel
```

### 5.4 Save & reload

```
Save (button or Ctrl+S)
  → getPersistedDocument() = { scale, rooms, viewport }
  → PUT /api/projects/:id/document
  → JSONB replaced in PostgreSQL
  → markSaved() clears isDirty

Reload (open project)
  → GET /api/projects/:id
  → document + floor plan metadata hydrated into Zustand
  → history stack reset
```

### 5.5 Undo / redo

Only **`EditorDocumentState`** (`scale` + `rooms`) participates in history. Viewport changes, tool switches, and selection are not undoable.

```
mutateDocument(updater)
  → pushHistory(snapshot of { scale, rooms })
  → apply updater

undo() / redo()
  → history.ts stack manipulation
  → restore cloned document into store
```

---

## 6. Key design decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| JSONB document blob | Fast vertical slice; atomic save of editor state | No relational queries on rooms; no server-side area validation |
| Zustand singleton | Simple global editor state | No per-tab isolation; lost on refresh unless saved |
| Konva Layer for viewport | Clean separation of world vs screen coords | Must manually compensate stroke/handle sizes (`/ viewport.zoom`) |
| Manual Pydantic mirror | Python backend can't import Zod | Drift risk between TS and Python schemas |
| Local filesystem uploads | Simple dev experience | Not cloud-ready; `storagePath` leaked in API |
| Dynamic import for canvas | Konva requires DOM; avoids SSR `canvas` module error | Loading flash; split bundle |

---

## 7. Technical debt

| ID | Area | Issue | Severity |
|----|------|-------|----------|
| TD-01 | Schemas | Pydantic models manually duplicate Zod; no codegen or CI drift check | Medium |
| TD-02 | Geometry | `backend/app/domain/geometry.py` duplicates `@lightsale/shared`; unused in routes | Medium |
| TD-03 | PostGIS | Extension enabled; `geoalchemy2` in deps but no spatial columns or queries | Medium |
| TD-04 | ORM | `ProjectRow.floor_plan_id` has no FK; orphaned references possible | Low |
| TD-05 | API | `storagePath` (server filesystem path) exposed in `FloorPlanAsset` responses | Medium |
| TD-06 | Upload | `save_floor_plan_upload` return type annotation wrong (4-tuple vs 5 values) | Low |
| TD-07 | Queries | `list_projects` N+1: one floor plan query per project | Low |
| TD-08 | History | Vertex drag calls `mutateDocument` on every `dragMove` — floods undo stack | High |
| TD-09 | History | Room rename fires history entry per keystroke | Medium |
| TD-10 | History | Viewport changes not undoable; inconsistent UX | Low |
| TD-11 | PDF | Backend dimensions use PDF points; frontend renders at 2× scale — coordinate mismatch risk | High |
| TD-12 | PDF | Worker loaded from CDN (`cdnjs.cloudflare.com`); offline/air-gapped failure | Medium |
| TD-13 | API client | `listProjects` doesn't Zod-validate list items (uses `as` cast) | Medium |
| TD-14 | Testing | No API integration tests, no frontend tests, no E2E | High |
| TD-15 | Ops | No CI pipeline, no migrations (raw `create_all`), no health check on DB | Medium |
| TD-16 | Security | No auth, open CORS, no upload size limits, no virus scanning | High (for production) |
| TD-17 | UX | No unsaved-changes navigation guard | Medium |
| TD-18 | Store | `setTool` clears draft points when switching away from scale/draw | Low |

---

## 8. Architectural weaknesses

1. **Split-brain domain logic** — Geometry exists in TypeScript (used) and Python (test-only). Backend does not validate room areas or scale on save.

2. **Document blob anti-pattern at scale** — Entire editor state is read/written as one JSONB document. Concurrent edits, partial updates, and AI pipeline staging will become painful.

3. **No service layer on backend** — Route handlers contain orchestration, mapping, file I/O, and DB access inline. Hard to test and reuse for future AI/lighting services.

4. **Client-authoritative persistence** — Server trusts client-sent rooms/scale without recomputation or constraint checks.

5. **Filesystem coupling** — Floor plans tied to local paths; no S3/blob abstraction; complicates horizontal scaling.

6. **Missing product boundaries** — Editor, API, and future AI/lighting modules are not yet separated by bounded contexts or modules.

7. **Single global editor store** — Will not support multi-user, collaboration, or background jobs without refactor.

---

## 9. Recommended improvements (no code changes yet)

### Phase 1 — Stabilize the vertical slice

1. **Fix PDF coordinate alignment** — Derive canvas dimensions from the same render pipeline (or store render scale metadata on upload).
2. **Debounce history** — Push undo snapshots on drag end / rename blur, not every pointer move or keypress.
3. **Hide `storagePath`** — Return public URL only; keep path internal to backend.
4. **Add schema drift CI** — Generate JSON Schema from Zod; validate Pydantic models or snapshot-test API examples.
5. **API integration tests** — httpx + testcontainers PostGIS; cover create → upload → save → reload.
6. **Alembic migrations** — Replace `create_all` with versioned migrations; add FK `projects.floor_plan_id → floor_plans.id`.

### Phase 2 — Use PostGIS properly

1. Store room footprints as `geometry(Polygon, 4326)` or project-local SRID alongside JSONB.
2. Enable server-side area via `ST_Area` for validation against client calculations.
3. Index spatial columns for future lighting placement queries.

### Phase 3 — Prepare for AI & lighting

1. Extract backend **service layer**: `ProjectService`, `FloorPlanService`, future `RecognitionService`, `LightingService`.
2. Introduce **job queue** (e.g. Redis + worker) for async AI recognition.
3. Add **event log** or document versioning for audit and undo across sessions.
4. Split `@lightsale/shared` into `@lightsale/contracts` (schemas) and `@lightsale/geometry` (pure math).

### Phase 4 — Production readiness

1. Authentication (OAuth2 / JWT) and project ownership.
2. Object storage (S3/Azure Blob) for floor plans.
3. CI: lint, test, build on PR; Docker images for API and web.
4. Observability: structured logging, request IDs, error tracking.

---

## 10. Testing map (current)

| Suite | Location | Coverage |
|-------|----------|----------|
| Scale & area (TS) | `packages/shared/src/scale.test.ts` | Pixel distance, calibration, polygon area, m² conversion |
| Geometry (Python) | `backend/tests/test_geometry.py` | Same formulas, Python implementation |
| Frontend | — | None |
| API integration | — | None |
| E2E | — | None |

---

## 11. Local development topology

```
localhost:3000   apps/web (Next.js dev)
localhost:8000   backend (uvicorn)
localhost:5432   PostGIS (docker compose)
./backend/uploads   floor plan files (gitignored)
```

Required env files (not committed):

- `backend/.env` — from `.env.example`
- `apps/web/.env.local` — from `.env.local.example`

---

## 12. Intentionally out of scope (current slice)

- AI floor plan recognition
- Lighting calculations and fixture placement
- User authentication / multi-tenancy
- Project delete / rename API
- Real-time collaboration
- Mobile-optimized editor UX

---

## 13. Glossary

| Term | Meaning |
|------|---------|
| **World / canvas coordinates** | Floor plan pixel space; invariant to zoom and pan |
| **Viewport** | `{ zoom, offsetX, offsetY }` transform applied at Konva Layer |
| **Document** | Persisted `{ scale, rooms, viewport? }` JSON blob |
| **Vertical slice** | End-to-end path: create project → upload plan → draw rooms → save → reload |

---

*Generated from codebase review. Update this document when adding AI recognition, lighting modules, or changing persistence strategy.*
