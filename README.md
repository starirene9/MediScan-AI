# MediScan AI

AI-assisted chest X-ray screening worklist for radiology workflows. The app runs a React frontend against a FastAPI backend with NIH-14 multi-label inference and Grad-CAM overlays.

## Stack

- **Frontend:** React 19, TypeScript, Vite, MUI, Redux Toolkit, Tailwind CSS
- **Backend:** FastAPI, SQLAlchemy, SQLite, TorchXRayVision (DenseNet)

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
