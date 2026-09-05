# MediScan AI

AI-assisted chest X-ray screening worklist for radiology workflows. The app runs a React frontend against a FastAPI backend with NIH-14 multi-label inference and Grad-CAM overlays.

## Live demo

Public demo (Railway, single Docker container):

**https://mediscan-ai-production-d681.up.railway.app**

| | |
|--|--|
| Login | `admin` / `admin123` (or `user` / `user123`) |
| Health | https://mediscan-ai-production-d681.up.railway.app/api/health |
| API docs | https://mediscan-ai-production-d681.up.railway.app/docs |

**Notes**
- Demo only — SQLite, demo credentials, CPU inference. Not production-hardened.
- Free-tier cold start + first model load can take 1–3 minutes; later analyses are faster.
- Uploaded data may reset on redeploy unless a persistent volume is attached.

More detail: [DEPLOY.md](DEPLOY.md)

## Stack

- **Frontend:** React 19, TypeScript, Vite, MUI, Redux Toolkit, Tailwind CSS
- **Backend:** FastAPI, SQLAlchemy, SQLite, TorchXRayVision (DenseNet)
- **Deploy:** Docker (multi-stage) → Railway (or local `docker compose` / Render)

## Features

- Studies worklist (CRUD, search, detail view)
- X-ray upload with NIH-14 inference and Grad-CAM overlay
- Dashboard KPIs, finding distribution, and study trends
- Dark mode (header toggle, persisted in localStorage)
- i18n: English, Korean, Spanish

## Local development

### Prerequisites

- Node.js 20+
- Python 3.11+

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

### 2. Frontend

```bash
npm install
npm run dev
```

- App: http://localhost:5173

Vite proxies `/api` and `/uploads` to `http://127.0.0.1:8000`.

### 3. Login

Copy `.env.example` to `.env` in the project root and set demo credentials:

```
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=admin123
```

## Deployment

Single container: FastAPI serves the API, `/uploads`, and the built React SPA on one origin.

### Local Docker

```bash
docker compose up --build
```

Open http://localhost:8000 — same demo login as above.

### Railway (current public demo)

The live URL above is deployed on Railway from this repo’s root `Dockerfile`.

To redeploy or recreate:

1. Connect the GitHub repo in [Railway](https://railway.app)
2. Use the root `Dockerfile` (see `railway.toml`)
3. Health check: `/api/health`

See [DEPLOY.md](DEPLOY.md) for Render, build-time login args, volumes, and troubleshooting.

## Branch strategy

| Branch | Purpose |
|--------|---------|
| `main` | Default full-stack branch (develop here) |
| `feature/*` | Short-lived feature branches merged into `main` |

Legacy feature branches (`feature/backend`, `feature/gradcam-viewer`, etc.) are kept for history but superseded by `main`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |

Backend API tests:

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
pytest
```

See [backend/README.md](backend/README.md) for API details and ML configuration.
