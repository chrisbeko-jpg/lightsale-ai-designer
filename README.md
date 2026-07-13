# Lightsale AI Designer

Monorepo for lighting project design with an interactive floor-plan editor.

## Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Konva.js, Zustand
- **Backend**: FastAPI, PostgreSQL + PostGIS
- **Shared**: Zod schemas and domain logic (`@lightsale/shared`)

## Getting started

### Database

```bash
docker compose up -d
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Set `DATABASE_URL=postgresql+asyncpg://lightsale:lightsale@localhost:5432/lightsale` in `backend/.env`.

### Frontend

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Tests

```bash
npm test
cd backend && pytest
```

## Project structure

```
apps/web          Next.js floor-plan editor
packages/shared   Zod schemas, scale & area calculations
backend           FastAPI API + PostGIS persistence
```
